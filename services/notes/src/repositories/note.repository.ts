import { getDbPool } from "../configs/postgres";
import { CreateNoteEntity, NoteDTO, NoteEntity } from "../models/note";
import UserNotesCacheModel from "../models/user-notes-cache";

const createNote = async (ownerId: string, input: CreateNoteEntity): Promise<NoteEntity> => {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO notes (title, body, owner_id)
       VALUES ($1, $2, $3)
       RETURNING id, title, body, owner_id as "ownerId", created_at as "createdAt", updated_at as "updatedAt"`,
      [input.title, input.body, ownerId]
    );
    const created = result.rows[0] as NoteEntity;
    const noteId = created.id;
    const sharedWith = Array.isArray(input.sharedWith) ? input.sharedWith : [];
    if (sharedWith.length > 0) {
      const values = sharedWith.map((_, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO notes_shared (note_id, user_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        [noteId, ...sharedWith]
      );
    }
    await client.query('COMMIT');
    await UserNotesCacheModel.updateOne(
      { userId: ownerId },
      { $push: { notes: created }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
    if (sharedWith.length > 0) {
      await UserNotesCacheModel.updateMany(
        { userId: { $in: sharedWith } },
        { $push: { notes: created }, $set: { updatedAt: new Date() } }
      );
    }
    return created;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const listNotes = async (userId: string,): Promise<NoteEntity[]> => {
  const cache = await UserNotesCacheModel.findOne({ userId }).lean();
  if (!cache) return [];
  return cache.notes as unknown as NoteEntity[];
};

const updateNote = async (userId: string, noteId: string, input: CreateNoteEntity): Promise<NoteEntity | null> => {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentSharedRes = await client.query<{ user_id: string }>(
      `SELECT user_id FROM notes_shared WHERE note_id = $1`,
      [noteId]
    );
    const currentShared: string[] = currentSharedRes.rows.map(r => r.user_id);
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (typeof input.title === "string") { fields.push(`title = $${idx++}`); values.push(input.title); }
    if (typeof input.body === "string") { fields.push(`body = $${idx++}`); values.push(input.body); }
    if (fields.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    values.push(noteId); // $idx
    values.push(userId); // $idx+1
    const result = await client.query(
      `UPDATE notes SET ${fields.join(", ")}, updated_at = NOW()
       WHERE id = $${idx++} AND owner_id = $${idx}
       RETURNING id, title, body, owner_id as "ownerId", created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );
    if ((result.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const updated = result.rows[0] as NoteEntity;
    let finalShared: string[] = currentShared;
    if (Array.isArray(input.sharedWith)) {
      const desired = Array.from(new Set(input.sharedWith.map(u => String(u))));
      const toAdd = desired.filter(u => !currentShared.includes(u));
      const toRemove = currentShared.filter(u => !desired.includes(u));
      if (toAdd.length > 0) {
        const valuesPart = toAdd.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO notes_shared (note_id, user_id) VALUES ${valuesPart} ON CONFLICT DO NOTHING`,
          [noteId, ...toAdd]
        );
      }
      if (toRemove.length > 0) {
        await client.query(
          `DELETE FROM notes_shared WHERE note_id = $1 AND user_id = ANY($2::uuid[])`,
          [noteId, toRemove]
        );
      }
      finalShared = desired;
    }
    await client.query('COMMIT');
    // Update caches
    const updatedNote = updated;
    // Owner: replace note object, or add if missing
    const ownerSetRes = await UserNotesCacheModel.updateOne(
      { userId, 'notes.id': noteId },
      { $set: { 'notes.$': updatedNote, updatedAt: new Date() } }
    );
    if (ownerSetRes.matchedCount === 0) {
      await UserNotesCacheModel.updateOne(
        { userId },
        { $addToSet: { notes: updatedNote }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );
    }
    // Shared: compute unchanged, removed, added
    const unchanged = finalShared.filter(u => currentShared.includes(u));
    const removed = currentShared.filter(u => !finalShared.includes(u));
    const added = finalShared.filter(u => !currentShared.includes(u));
    if (unchanged.length > 0) {
      await UserNotesCacheModel.updateMany(
        { userId: { $in: unchanged }, 'notes.id': noteId },
        { $set: { 'notes.$': updatedNote, updatedAt: new Date() } }
      );
    }
    if (added.length > 0) {
      await UserNotesCacheModel.updateMany(
        { userId: { $in: added } },
        { $addToSet: { notes: updatedNote }, $set: { updatedAt: new Date() } }
      );
    }
    if (removed.length > 0) {
      await UserNotesCacheModel.updateMany(
        { userId: { $in: removed } },
        { $pull: { notes: { id: noteId } }, $set: { updatedAt: new Date() } }
      );
    }
    return updated;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const deleteNote = async (userId: string, noteId: string): Promise<boolean> => {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(`DELETE FROM notes WHERE id = $1 AND owner_id = $2`, [noteId, userId]);
    if ((result.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return false;
    }
    const sharedWithRes = await client.query<{ user_id: string }>(`SELECT user_id FROM notes_shared WHERE note_id = $1`, [noteId]);
    await client.query(`DELETE FROM notes_shared WHERE note_id = $1`, [noteId]);
    await client.query('COMMIT');
    await UserNotesCacheModel.updateOne(
      { userId },
      { $pull: { notes: { id: noteId } }, $set: { updatedAt: new Date() } }
    );
    const sharedWith = sharedWithRes.rows.map(r => r.user_id);
    if (sharedWith.length > 0) {
      await UserNotesCacheModel.updateMany(
        { userId: { $in: sharedWith } },
        { $pull: { notes: { id: noteId } }, $set: { updatedAt: new Date() } }
      );
    }
    return true;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};


const toNoteDTO = (note: NoteEntity): NoteDTO => ({
  id: note.id,
  title: note.title,
  body: note.body,
  ownerId: note.ownerId,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});


export default { createNote, toNoteDTO, listNotes, updateNote, deleteNote };


