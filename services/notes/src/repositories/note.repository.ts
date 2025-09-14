import { getDbPool } from "../configs/postgres";
import { CreateNoteEntity, NoteDTO, NoteEntity } from "../models/note";
import UserNotesCacheModel from "../models/user-notes-cache";

export const createNote = async (ownerId: string, input: CreateNoteEntity): Promise<NoteEntity> => {
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

export const toNoteDTO = (note: NoteEntity): NoteDTO => ({
  id: note.id,
  title: note.title,
  body: note.body,
  ownerId: note.ownerId,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

export const listNotes = async (userId: string,): Promise<NoteEntity[]> => {
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, title, body, owner_id as "ownerId", created_at as "createdAt", updated_at as "updatedAt"
     FROM notes
     WHERE owner_id = $1 OR owner_id IN (SELECT user_id FROM notes_shared WHERE note_id = notes.id)
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows as NoteEntity[];
};

export const updateNote = async (userId: string, noteId: string, input: CreateNoteEntity): Promise<NoteEntity | null> => {
  const pool = getDbPool();
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (typeof input.title === "string") { fields.push(`title = $${idx++}`); values.push(input.title); }
  if (typeof input.body === "string") { fields.push(`body = $${idx++}`); values.push(input.body); }
  if (fields.length === 0) return null;
  values.push(noteId); // $idx
  values.push(userId); // $idx+1
  const result = await pool.query(
    `UPDATE notes SET ${fields.join(", ")}, updated_at = NOW()
     WHERE id = $${idx++} AND owner_id = $${idx}
     RETURNING id, title, body, owner_id as "ownerId", created_at as "createdAt", updated_at as "updatedAt"`,
    values
  );
  if ((result.rowCount ?? 0) === 0) return null;
  return result.rows[0] as NoteEntity;
};

export const deleteNote = async (userId: string, noteId: string): Promise<boolean> => {
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

export default { createNote, toNoteDTO, listNotes, updateNote, deleteNote };


