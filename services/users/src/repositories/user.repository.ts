import { getDbPool } from "../configs/postgres";
import { UserDTO, UserEntity } from "../models/user";
import UserNotesCacheModel from "../models/user-notes-cache";
import UsersCacheModel, { CachedUser } from "../models/users-cache";

const createUser = async (username: string): Promise<UserEntity> => {
  const pool = getDbPool();
  const result = await pool.query(
    `INSERT INTO users (username)
     VALUES ($1)
     RETURNING id, username, created_at as "createdAt"`,
    [username]
  );
  const created = result.rows[0] as UserEntity;
  try {
    await updateUsersCacheOnCreate(created);
    await UserNotesCacheModel.updateOne(
      { userId: created.id },
      { $setOnInsert: { notes: [], updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (_err) {
    // cache update failure should not block user creation
  }
  return created;
};

const findUserById = async (id: string): Promise<UserEntity | null> => {
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, username, created_at as "createdAt"
     FROM users WHERE id = $1`,
    [id]
  );
  if (result.rowCount === 0) return null;
  return result.rows[0] as UserEntity;
};

const findUserByUsername = async (username: string): Promise<UserEntity | null> => {
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, username, created_at as "createdAt"
     FROM users WHERE username = $1`,
    [username]
  );
  if (result.rowCount === 0) return null;
  return result.rows[0] as UserEntity;
};

 const listUsers = async (): Promise<UserEntity[]> => {
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, username, created_at as "createdAt"
     FROM users
     ORDER BY created_at DESC`
  );
  return result.rows as UserEntity[];
};

const toUserDTO = (user: UserEntity): UserDTO => ({
  id: user.id,
  username: user.username,
  createdAt: user.createdAt,
});

export default { listUsers, toUserDTO, createUser, findUserById, findUserByUsername };

const updateUsersCacheOnCreate = async (newUser: UserEntity): Promise<void> => {
  const pool = getDbPool();
  const allUsersResult = await pool.query<{ id: string; username: string; createdAt: Date }>(
    `SELECT id, username, created_at as "createdAt" FROM users ORDER BY created_at DESC`
  );
  const allUsers = allUsersResult.rows.map((u) => ({ id: u.id, username: u.username, createdAt: u.createdAt })) as CachedUser[];
  const othersForNewUser = allUsers.filter((u) => u.id !== newUser.id);
  await UsersCacheModel.updateOne(
    { userId: newUser.id },
    { $set: { others: othersForNewUser, updatedAt: new Date() } },
    { upsert: true }
  );
  if (othersForNewUser.length === 0) return;
  const newUserCached: CachedUser = { id: newUser.id, username: newUser.username, createdAt: newUser.createdAt };
  await UsersCacheModel.updateMany(
    { userId: { $in: othersForNewUser.map((u) => u.id) } },
    { $addToSet: { others: newUserCached }, $set: { updatedAt: new Date() } }
  );
};
