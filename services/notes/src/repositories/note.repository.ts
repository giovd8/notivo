import { getDbPool } from "../configs/postgres";
import { CreateNoteEntity, NoteDTO, NoteEntity, UpdateNoteEntity } from "../models/note";
import UserNotesCacheModel, { CachedNote, CachedSharedUser, CachedTag } from "../models/user-notes-cache";

const createNote = async (ownerId: string, input: CreateNoteEntity): Promise<NoteDTO> => {
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
    const tags = Array.isArray(input.tags) ? Array.from(new Set(input.tags.map(t => String(t)))) : [];
    if (tags.length > 0) {
      const values = tags.map((_, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO notes_tags (note_id, tag_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        [noteId, ...tags]
      );
    }
    await client.query('COMMIT');
    // Build enriched cached note with full tags and shared users
    const [tagsRes, usersRes] = await Promise.all([
      tags.length > 0
        ? client.query<{ id: string; name: string; created_at: Date }>(
            `SELECT id, name, created_at FROM tags WHERE id = ANY($1::uuid[])`,
            [tags]
          )
        : Promise.resolve({ rows: [] as any[] } as any),
      sharedWith.length > 0
        ? client.query<{ id: string; username: string; created_at: Date }>(
            `SELECT id, username, created_at FROM users WHERE id = ANY($1::uuid[])`,
            [sharedWith]
          )
        : Promise.resolve({ rows: [] as any[] } as any),
    ]);
    const cachedTags: CachedTag[] = (tagsRes.rows || []).map((r: { id: string; name: string; created_at: Date }) => ({ id: r.id, name: r.name, createdAt: r.created_at }));
    const cachedUsers: CachedSharedUser[] = (usersRes.rows || []).map((r: { id: string; username: string; created_at: Date }) => ({ id: r.id, username: r.username, createdAt: r.created_at }));
    const cachedNote: CachedNote = {
      id: created.id,
      title: created.title,
      body: created.body,
      ownerId: created.ownerId,
      tags: cachedTags,
      sharedWith: cachedUsers,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
    await UserNotesCacheModel.updateOne(
      { userId: ownerId },
      { $push: { notes: cachedNote }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
    if (sharedWith.length > 0) {
      await UserNotesCacheModel.updateMany(
        { userId: { $in: sharedWith } },
        { $push: { notes: cachedNote }, $set: { updatedAt: new Date() } }
      );
    }
    return {
      id: created.id,
      title: created.title,
      body: created.body,
      ownerId: created.ownerId,
      sharedWith: cachedUsers.map((u) => u.id),
      tags: cachedTags.map((t) => t.id),
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    } as NoteDTO;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const listNotes = async (userId: string,): Promise<NoteDTO[]> => {
  const cache = await UserNotesCacheModel.findOne({ userId }).lean();
  if (!cache) return [];
  return (cache.notes || []).map((n: any) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    ownerId: n.ownerId,
    sharedWith: (n.sharedWith || []).map((u: any) => String(u.username)),
    tags: (n.tags || []).map((t: any) => String(t.name)),
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  } as NoteDTO));
};

const updateNote = async (userId: string, noteId: string, input: UpdateNoteEntity): Promise<NoteDTO | null> => {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentSharedRes = await client.query<{ user_id: string }>(
      `SELECT user_id FROM notes_shared WHERE note_id = $1`,
      [noteId]
    );
    const currentShared: string[] = currentSharedRes.rows.map(r => r.user_id);
    const currentTagsRes = await client.query<{ tag_id: string }>(
      `SELECT tag_id FROM notes_tags WHERE note_id = $1`,
      [noteId]
    );
    const currentTags: string[] = currentTagsRes.rows.map(r => r.tag_id);
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (typeof input.title === "string") { fields.push(`title = $${idx++}`); values.push(input.title); }
    if (typeof input.body === "string") { fields.push(`body = $${idx++}`); values.push(input.body); }
    let updated: NoteEntity;
    if (fields.length === 0) {
      const selectRes = await client.query(
        `SELECT id, title, body, owner_id as "ownerId", created_at as "createdAt", updated_at as "updatedAt" FROM notes WHERE id = $1 AND owner_id = $2`,
        [noteId, userId]
      );
      if ((selectRes.rowCount ?? 0) === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      updated = selectRes.rows[0] as NoteEntity;
    } else {
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
      updated = result.rows[0] as NoteEntity;
    }
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
    let finalTags: string[] = currentTags;
    if (Array.isArray(input.tags)) {
      const desiredTags = Array.from(new Set(input.tags.map(t => String(t))));
      const tagsToAdd = desiredTags.filter(t => !currentTags.includes(t));
      const tagsToRemove = currentTags.filter(t => !desiredTags.includes(t));
      if (tagsToAdd.length > 0) {
        const valuesPart = tagsToAdd.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO notes_tags (note_id, tag_id) VALUES ${valuesPart} ON CONFLICT DO NOTHING`,
          [noteId, ...tagsToAdd]
        );
      }
      if (tagsToRemove.length > 0) {
        await client.query(
          `DELETE FROM notes_tags WHERE note_id = $1 AND tag_id = ANY($2::uuid[])`,
          [noteId, tagsToRemove]
        );
      }
      finalTags = desiredTags;
    }
    await client.query('COMMIT');
    // Build enriched cached note
    const [tagsRes, usersRes] = await Promise.all([
      finalTags.length > 0
        ? client.query<{ id: string; name: string; created_at: Date }>(
            `SELECT id, name, created_at FROM tags WHERE id = ANY($1::uuid[])`,
            [finalTags]
          )
        : Promise.resolve({ rows: [] as any[] } as any),
      finalShared.length > 0
        ? client.query<{ id: string; username: string; created_at: Date }>(
            `SELECT id, username, created_at FROM users WHERE id = ANY($1::uuid[])`,
            [finalShared]
          )
        : Promise.resolve({ rows: [] as any[] } as any),
    ]);
    const cachedTags: CachedTag[] = (tagsRes.rows || []).map((r: { id: string; name: string; created_at: Date }) => ({ id: r.id, name: r.name, createdAt: r.created_at }));
    const cachedUsers: CachedSharedUser[] = (usersRes.rows || []).map((r: { id: string; username: string; created_at: Date }) => ({ id: r.id, username: r.username, createdAt: r.created_at }));
    const updatedCachedNote: CachedNote = {
      id: updated.id,
      title: updated.title,
      body: updated.body,
      ownerId: updated.ownerId,
      tags: cachedTags,
      sharedWith: cachedUsers,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
    // Update caches
    // Owner: replace note object, or add if missing
    const ownerSetRes = await UserNotesCacheModel.updateOne(
      { userId, 'notes.id': noteId },
      { $set: { 'notes.$': updatedCachedNote, updatedAt: new Date() } }
    );
    if (ownerSetRes.matchedCount === 0) {
      await UserNotesCacheModel.updateOne(
        { userId },
        { $addToSet: { notes: updatedCachedNote }, $set: { updatedAt: new Date() } },
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
        { $set: { 'notes.$': updatedCachedNote, updatedAt: new Date() } }
      );
    }
    if (added.length > 0) {
      await UserNotesCacheModel.updateMany(
        { userId: { $in: added } },
        { $addToSet: { notes: updatedCachedNote }, $set: { updatedAt: new Date() } }
      );
    }
    if (removed.length > 0) {
      await UserNotesCacheModel.updateMany(
        { userId: { $in: removed } },
        { $pull: { notes: { id: noteId } }, $set: { updatedAt: new Date() } }
      );
    }
    return {
      id: updated.id,
      title: updated.title,
      body: updated.body,
      ownerId: updated.ownerId,
      sharedWith: finalShared,
      tags: finalTags,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    } as NoteDTO;
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
    // notes_tags rows will be removed by ON DELETE CASCADE
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
  sharedWith: [],
  tags: [],
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});


export default { createNote, toNoteDTO, listNotes, updateNote, deleteNote };


