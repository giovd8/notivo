import { getDbPool } from "../configs/postgres";

export interface CreateAccountInput {
  userId: string;
  passwordHash: string;
}

export const createAccount = async (input: CreateAccountInput): Promise<void> => {
  const pool = getDbPool();
  await pool.query(
    `INSERT INTO accounts (user_id, password_hash)
     VALUES ($1, $2)`,
    [input.userId, input.passwordHash]
  );
};

export default { createAccount };


