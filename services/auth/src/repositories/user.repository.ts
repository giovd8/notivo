import { getDbPool } from "../configs/postgres";
import { User, UserDTO } from "../models/user";

export const findUserByUsername = async (username: string): Promise<User | null> => {
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, username, password_hash as password, created_at as "createdAt"
     FROM users WHERE username = $1`,
    [username]
  );
  if (result.rowCount === 0) return null;
  return result.rows[0] as User;
};

export type CreateUserParams = { username: string; passwordHash: string };
export const createUser = async (data: CreateUserParams): Promise<User> => {
  const pool = getDbPool();
  const result = await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     RETURNING id, username, password_hash as password, created_at as "createdAt"`,
    [data.username, data.passwordHash]
  );
  return result.rows[0] as User;
};

export const toUserDTO = (user: User): UserDTO => ({
  id: user.id,
  username: user.username,
  createdAt: user.createdAt,
});

