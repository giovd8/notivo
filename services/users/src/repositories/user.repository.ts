import { getDbPool } from "../configs/postgres";
import { UserDTO, UserEntity } from "../models/user";

export const listUsers = async (): Promise<UserEntity[]> => {
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, username, created_at as "createdAt"
     FROM users
     ORDER BY created_at DESC`
  );
  return result.rows as UserEntity[];
};

export const toUserDTO = (user: UserEntity): UserDTO => ({
  id: user.id,
  username: user.username,
  createdAt: user.createdAt,
});

export default { listUsers, toUserDTO };

export const createUser = async (username: string): Promise<UserEntity> => {
  const pool = getDbPool();
  const result = await pool.query(
    `INSERT INTO users (username)
     VALUES ($1)
     RETURNING id, username, created_at as "createdAt"`,
    [username]
  );
  return result.rows[0] as UserEntity;
};

export const findUserById = async (id: string): Promise<UserEntity | null> => {
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, username, created_at as "createdAt"
     FROM users WHERE id = $1`,
    [id]
  );
  if (result.rowCount === 0) return null;
  return result.rows[0] as UserEntity;
};

export const findUserByUsername = async (username: string): Promise<UserEntity | null> => {
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, username, created_at as "createdAt"
     FROM users WHERE username = $1`,
    [username]
  );
  if (result.rowCount === 0) return null;
  return result.rows[0] as UserEntity;
};


