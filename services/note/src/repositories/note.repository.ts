import { getDbPool } from "../configs/postgres";
import { CreateNoteDTO, ListFilter, NoteDTO, NoteEntity, UpdateNoteDTO } from "../models/note";

export const createNote = async (ownerId: string, input: CreateNoteDTO): Promise<NoteEntity> => {
  const pool = getDbPool();
  const result = await pool.query(
    `INSERT INTO notes (title, body, owner_id)
     VALUES ($1, $2, $3)
     RETURNING id, title, body, owner_id as "ownerId", created_at as "createdAt", updated_at as "updatedAt"`,
    [input.title, input.body, ownerId]
  );
  return result.rows[0] as NoteEntity;
};

export const toNoteDTO = (note: NoteEntity): NoteDTO => ({
  id: note.id,
  title: note.title,
  body: note.body,
  ownerId: note.ownerId,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

export const listNotes = async (userId: string, filter: ListFilter): Promise<NoteEntity[]> => {
  const pool = getDbPool();
  if (filter === "shared") {
    const result = await pool.query(
      `SELECT n.id, n.title, n.body, n.owner_id as "ownerId", n.created_at as "createdAt", n.updated_at as "updatedAt"
       FROM notes n
       INNER JOIN notes_shared ns ON ns.note_id = n.id
       WHERE ns.user_id = $1
       ORDER BY n.created_at DESC`,
      [userId]
    );
    return result.rows as NoteEntity[];
  }
  const result = await pool.query(
    `SELECT id, title, body, owner_id as "ownerId", created_at as "createdAt", updated_at as "updatedAt"
     FROM notes
     WHERE owner_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows as NoteEntity[];
};

export const updateNote = async (userId: string, noteId: string, input: UpdateNoteDTO): Promise<NoteEntity | null> => {
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
  const result = await pool.query(`DELETE FROM notes WHERE id = $1 AND owner_id = $2`, [noteId, userId]);
  return (result.rowCount ?? 0) > 0;
};

export default { createNote, toNoteDTO, listNotes, updateNote, deleteNote };


