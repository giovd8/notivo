import { getDbPool } from "../configs/postgres";
import { UserCredentialDTO, UserDTO, UserEntity } from "../models/user";

export const findUserById = async (id: string): Promise<UserEntity | null> => {
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, username, password_hash as "passwordHash", created_at as "createdAt"
     FROM users WHERE id = $1`,
    [id]
  );
  if (result.rowCount === 0) return null;
  return result.rows[0] as UserEntity;
};

export const findUserByUsername = async (username: string): Promise<UserEntity | null> => {
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, username, password_hash as "passwordHash", created_at as "createdAt"
     FROM users WHERE username = $1`,
    [username]
  );
  if (result.rowCount === 0) return null;
  return result.rows[0] as UserEntity;
};

export const createUser = async (data: UserCredentialDTO): Promise<UserEntity> => {
  const pool = getDbPool();
  const result = await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     RETURNING id, username, password_hash as "password", created_at as "createdAt"`,
    [data.username, data.password]
  );
  return result.rows[0] as UserEntity;
};

export const toUserDTO = (user: UserEntity): UserDTO => ({
  id: user.id,
  username: user.username,
  createdAt: user.createdAt,
});

