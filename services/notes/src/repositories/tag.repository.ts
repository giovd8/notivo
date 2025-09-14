import { getDbPool } from "../configs/postgres";
import { TagEntity } from "../models/tag";
import TagsCacheModel from "../models/tags-cache";

const upsertTags = async (names: string[]): Promise<TagEntity[]> => {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const lower = names
      .map((n) => String(n || '').trim())
      .filter((n) => n.length > 0)
      .map((n) => n.toLowerCase());
    const unique = Array.from(new Set(lower));
    if (unique.length === 0) {
      await client.query('ROLLBACK');
      return [] as TagEntity[];
    }
    const inserted: TagEntity[] = [];
    for (const name of unique) {
      const res = await client.query(
        `INSERT INTO tags (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name, created_at as "createdAt"`,
        [name]
      );
      inserted.push(res.rows[0] as TagEntity);
    }
    await client.query('COMMIT');
    await TagsCacheModel.updateOne(
      { key: 'global' },
      { $addToSet: { tags: { $each: inserted } }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
    return inserted;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const listTags = async (): Promise<TagEntity[]> => {
  const cache = await TagsCacheModel.findOne({ key: 'global' }).lean();
  if (!cache) return [] as TagEntity[];
  return cache.tags as unknown as TagEntity[];
};

export default { upsertTags, listTags };


