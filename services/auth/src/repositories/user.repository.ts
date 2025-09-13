import { getDbPool } from "../configs/postgres";
import { UserDTO, UserEntity } from "../models/user";

const getBaseUrl = () => {
  return process.env.USERS_SERVICE_URL || "http://users-service:3000";
};

export const findUserById = async (id: string): Promise<UserEntity | null> => {
  const baseUrl = getBaseUrl();
  const resp = await fetch(`${baseUrl}/users/${id}`);
  if (!resp.ok) return null;
  const json = await resp.json();
  const user = json?.data as { id: string; username: string; createdAt: string } | null;
  if (!user) return null;
  const pool = getDbPool();
  const acc = await pool.query(
    `SELECT password_hash as "passwordHash" FROM accounts WHERE user_id = $1`,
    [user.id]
  );
  if ((acc.rowCount ?? 0) === 0) return null;
  return { id: user.id, username: user.username, createdAt: new Date(user.createdAt), passwordHash: acc.rows[0].passwordHash } as UserEntity;
};

export const findUserByUsername = async (username: string): Promise<UserEntity | null> => {
  const baseUrl = getBaseUrl();
  const resp = await fetch(`${baseUrl}/users/search/by-username?username=${encodeURIComponent(username)}`);
  if (!resp.ok) return null;
  const json = await resp.json();
  const user = json?.data as { id: string; username: string; createdAt: string } | null;
  if (!user) return null;
  const pool = getDbPool();
  const acc = await pool.query(
    `SELECT password_hash as "passwordHash" FROM accounts WHERE user_id = $1`,
    [user.id]
  );
  if ((acc.rowCount ?? 0) === 0) return null;
  return { id: user.id, username: user.username, createdAt: new Date(user.createdAt), passwordHash: acc.rows[0].passwordHash } as UserEntity;
};

export const toUserDTO = (user: UserEntity): UserDTO => ({
  id: user.id,
  username: user.username,
  createdAt: user.createdAt,
});

