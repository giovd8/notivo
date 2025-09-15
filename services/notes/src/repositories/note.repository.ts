import { getDbPool } from "../configs/postgres";
import { CreateNoteEntity, NoteDTO, NoteEntity, UpdateNoteEntity } from "../models/note";
import UserSearchCacheModel from "../models/search-cache";
import type { CachedNote, CachedSharedUser, CachedTag } from "../models/user-notes-cache";
import { LabelValue } from "../models/utils";
import { ServerError } from "../utils/server-error";

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
    // Invalidate search caches for impacted users (owner + shared)
    await UserSearchCacheModel.deleteMany({ userId: { $in: [ownerId, ...sharedWith] } });
    return {
      id: created.id,
      title: created.title,
      body: created.body,
      ownerId: created.ownerId,
      sharedWith: cachedUsers.map((u) => ({ label: u.username, value: u.id })) as LabelValue<string>[],
      tags: cachedTags.map((t) => ({ label: t.name, value: t.id })) as LabelValue<string>[],
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

const listNotes = async (userId: string): Promise<NoteDTO[]> => {
  // Delegate to search cache with empty filter to also cache the "no filter" result
  return searchNotes(userId, "", []);
};

const updateNote = async (userId: string, noteId: string, input: UpdateNoteEntity): Promise<NoteDTO | null> => {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ownerCheckRes = await client.query<{ owner_id: string }>(
      `SELECT owner_id FROM notes WHERE id = $1`,
      [noteId]
    );
    if ((ownerCheckRes.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const isOwner = String(ownerCheckRes.rows[0].owner_id) === String(userId);
    if (!isOwner) {
      await client.query('ROLLBACK');
      throw new ServerError('Forbidden', 403);
    }
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
    // Invalidate search caches for all possibly impacted users
    const unchanged = finalShared.filter(u => currentShared.includes(u));
    const removed = currentShared.filter(u => !finalShared.includes(u));
    const added = finalShared.filter(u => !currentShared.includes(u));
    // Invalidate search caches for all possibly impacted users
    const impactedUsersSet = new Set<string>([userId, ...currentShared, ...finalShared]);
    await UserSearchCacheModel.deleteMany({ userId: { $in: Array.from(impactedUsersSet) } });
    return {
      id: updated.id,
      title: updated.title,
      body: updated.body,
      ownerId: updated.ownerId,
      sharedWith: cachedUsers.map((u) => ({ label: u.username, value: u.id })) as LabelValue<string>[],
      tags: cachedTags.map((t) => ({ label: t.name, value: t.id })) as LabelValue<string>[],
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
    const ownerCheckRes = await client.query<{ owner_id: string }>(
      `SELECT owner_id FROM notes WHERE id = $1`,
      [noteId]
    );
    if ((ownerCheckRes.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return false;
    }
    const isOwner = String(ownerCheckRes.rows[0].owner_id) === String(userId);
    if (!isOwner) {
      await client.query('ROLLBACK');
      throw new ServerError('Forbidden', 403);
    }
    const result = await client.query(`DELETE FROM notes WHERE id = $1 AND owner_id = $2`, [noteId, userId]);
    if ((result.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return false;
    }
    const sharedWithRes = await client.query<{ user_id: string }>(`SELECT user_id FROM notes_shared WHERE note_id = $1`, [noteId]);
    await client.query(`DELETE FROM notes_shared WHERE note_id = $1`, [noteId]);
    // notes_tags rows will be removed by ON DELETE CASCADE
    await client.query('COMMIT');
    const sharedWith = sharedWithRes.rows.map(r => r.user_id);
    // Invalidate search caches for owner and all users the note was shared with
    await UserSearchCacheModel.deleteMany({ userId: { $in: [userId, ...sharedWith] } });
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


const loadVisibleNotes = async (userId: string): Promise<CachedNote[]> => {
  const pool = getDbPool();
  // 1) Fetch visible notes (owned or shared with user)
  const notesRes = await pool.query<NoteEntity>(
    `SELECT n.id, n.title, n.body, n.owner_id as "ownerId", n.created_at as "createdAt", n.updated_at as "updatedAt"
     FROM notes n
     WHERE n.owner_id = $1 OR n.id IN (SELECT note_id FROM notes_shared WHERE user_id = $1)`,
    [userId]
  );
  const notes: NoteEntity[] = notesRes.rows || [];
  if (notes.length === 0) return [];
  const noteIds: string[] = notes.map((n) => n.id);

  // 2) Fetch tags for these notes
  const tagsRes = await pool.query<{ note_id: string; id: string; name: string; created_at: Date }>(
    `SELECT nt.note_id, t.id, t.name, t.created_at
     FROM notes_tags nt
     JOIN tags t ON t.id = nt.tag_id
     WHERE nt.note_id = ANY($1::uuid[])`,
    [noteIds]
  );
  const tagsByNote = new Map<string, CachedTag[]>();
  for (const r of tagsRes.rows || []) {
    const list = tagsByNote.get(r.note_id) || [];
    list.push({ id: r.id, name: r.name, createdAt: r.created_at });
    tagsByNote.set(r.note_id, list);
  }

  // 3) Fetch shared users for these notes
  const sharedRes = await pool.query<{ note_id: string; id: string; username: string; created_at: Date }>(
    `SELECT ns.note_id, u.id, u.username, u.created_at
     FROM notes_shared ns
     JOIN users u ON u.id = ns.user_id
     WHERE ns.note_id = ANY($1::uuid[])`,
    [noteIds]
  );
  const usersByNote = new Map<string, CachedSharedUser[]>();
  for (const r of sharedRes.rows || []) {
    const list = usersByNote.get(r.note_id) || [];
    list.push({ id: r.id, username: r.username, createdAt: r.created_at });
    usersByNote.set(r.note_id, list);
  }

  // 4) Build cached notes
  const cached: CachedNote[] = notes.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    ownerId: n.ownerId,
    tags: tagsByNote.get(n.id) || [],
    sharedWith: usersByNote.get(n.id) || [],
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }));
  
  // Sort notes by creation date (newest first)
  return cached.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};


const searchNotes = async (userId: string, search?: string, tags?: string[]): Promise<NoteDTO[]> => {
  const normalizedSearch: string = String(search || "").trim().toLowerCase();
  const normalizedTags: string[] = Array.from(new Set((tags || []).map((t) => String(t)))).sort();
  const key: string = `${normalizedSearch}|${normalizedTags.join(",")}`;

  // Try cache first
  const cached = await UserSearchCacheModel.findOne({ userId, key }).lean();
  if (cached && Array.isArray((cached as any).results)) {
    await UserSearchCacheModel.updateOne({ userId, key }, { $set: { lastUpdated: new Date() } });
    const cachedResults = (((cached as any).results) || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      ownerId: n.ownerId,
      sharedWith: (n.sharedWith || []).map((u: any) => ({ label: String(u.username), value: String(u.id) })),
      tags: (n.tags || []).map((t: any) => ({ label: String(t.name), value: String(t.id) })),
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    } as NoteDTO));
    
    // Ensure cached results are also sorted (newest first)
    return cachedResults.sort((a: NoteDTO, b: NoteDTO) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Load visible notes from Postgres
  const baseNotes = await loadVisibleNotes(userId);
  if (baseNotes.length === 0) {
    await UserSearchCacheModel.updateOne(
      { userId, key },
      { $set: { filter: { text: normalizedSearch, tags: normalizedTags }, results: [], lastUpdated: new Date() } },
      { upsert: true }
    );
    return [];
  }

  const hasText: boolean = normalizedSearch.length > 0;
  const hasTags: boolean = normalizedTags.length > 0;

  const filtered = baseNotes.filter((n: any) => {
    let match = true;
    if (hasText) {
      const inTitle = String(n.title || "").toLowerCase().includes(normalizedSearch);
      const inBody = String(n.body || "").toLowerCase().includes(normalizedSearch);
      match = match && (inTitle || inBody);
    }
    if (hasTags) {
      const noteTagIds: string[] = (n.tags || []).map((t: any) => String(t.id));
      match = match && normalizedTags.every((t) => noteTagIds.includes(t));
    }
    return match;
  });

  // Sort filtered results before caching
  const sortedFiltered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  await UserSearchCacheModel.updateOne(
    { userId, key },
    { $set: { filter: { text: normalizedSearch, tags: normalizedTags }, results: sortedFiltered, lastUpdated: new Date() } },
    { upsert: true }
  );

  const noteDTOs = sortedFiltered.map((n: any) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    ownerId: n.ownerId,
    sharedWith: (n.sharedWith || []).map((u: any) => ({ label: String(u.username), value: String(u.id) })),
    tags: (n.tags || []).map((t: any) => ({ label: String(t.name), value: String(t.id) })),
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  } as NoteDTO));
  
  return noteDTOs;
};

interface TestNoteInput {
  id: string;
  title: string;
  body: string;
  ownerId: string; // username
  sharedWith: string[]; // usernames
  tags: string[]; // tag names
  createdAt: string;
  updatedAt: string;
}

const createTestNotes = async (testNotes: TestNoteInput[]): Promise<NoteDTO[]> => {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Resolve usernames to user IDs
    const usernames = Array.from(new Set([
      ...testNotes.map(n => n.ownerId),
      ...testNotes.flatMap(n => n.sharedWith)
    ]));
    const usersRes = await client.query<{ id: string; username: string }>(
      `SELECT id, username FROM users WHERE username = ANY($1)`,
      [usernames]
    );
    const usernameToId = new Map(usersRes.rows.map(u => [u.username, u.id]));
    
    // Resolve tag names to tag IDs
    const tagNames = Array.from(new Set(testNotes.flatMap(n => n.tags)));
    const tagsRes = await client.query<{ id: string; name: string }>(
      `SELECT id, name FROM tags WHERE name = ANY($1)`,
      [tagNames]
    );
    const tagNameToId = new Map(tagsRes.rows.map(t => [t.name, t.id]));
    
    const createdNotes: NoteDTO[] = [];
    
    for (const testNote of testNotes) {
      const ownerId = usernameToId.get(testNote.ownerId);
      if (!ownerId) throw new Error(`User not found: ${testNote.ownerId}`);
      
      const sharedWithIds = testNote.sharedWith.map(username => {
        const id = usernameToId.get(username);
        if (!id) throw new Error(`User not found: ${username}`);
        return id;
      });
      
      const tagIds = testNote.tags.map(tagName => {
        const id = tagNameToId.get(tagName);
        if (!id) throw new Error(`Tag not found: ${tagName}`);
        return id;
      });
      
      // Create note
      const noteRes = await client.query(
        `INSERT INTO notes (title, body, owner_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, body, owner_id as "ownerId", created_at as "createdAt", updated_at as "updatedAt"`,
        [testNote.title, testNote.body, ownerId, new Date(testNote.createdAt), new Date(testNote.updatedAt)]
      );
      const note = noteRes.rows[0] as NoteEntity;
      
      // Add shared users
      if (sharedWithIds.length > 0) {
        const sharedValues = sharedWithIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO notes_shared (note_id, user_id) VALUES ${sharedValues}`,
          [note.id, ...sharedWithIds]
        );
      }
      
      // Add tags
      if (tagIds.length > 0) {
        const tagValues = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO notes_tags (note_id, tag_id) VALUES ${tagValues}`,
          [note.id, ...tagIds]
        );
      }
      
      // Build enriched note for response
      const [tagsData, usersData] = await Promise.all([
        tagIds.length > 0
          ? client.query<{ id: string; name: string; created_at: Date }>(
              `SELECT id, name, created_at FROM tags WHERE id = ANY($1::uuid[])`,
              [tagIds]
            )
          : Promise.resolve({ rows: [] }),
        sharedWithIds.length > 0
          ? client.query<{ id: string; username: string; created_at: Date }>(
              `SELECT id, username, created_at FROM users WHERE id = ANY($1::uuid[])`,
              [sharedWithIds]
            )
          : Promise.resolve({ rows: [] })
      ]);
      
      const noteDTO: NoteDTO = {
        id: note.id,
        title: note.title,
        body: note.body,
        ownerId: note.ownerId,
        sharedWith: usersData.rows.map(u => ({ label: u.username, value: u.id })),
        tags: tagsData.rows.map(t => ({ label: t.name, value: t.id })),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      };
      
      createdNotes.push(noteDTO);
    }
    
    await client.query('COMMIT');
    return createdNotes;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export default { createNote, toNoteDTO, listNotes, updateNote, deleteNote, searchNotes, createTestNotes };


