import { Pool } from "pg";

let pool: Pool | null = null;


export const getDbPool = (): Pool => {
  if (pool) return pool;
  const host = process.env.POSTGRES_HOST || "localhost";
  const port = Number(process.env.POSTGRES_PORT || 5432);
  const user = process.env.POSTGRES_USER || "user";
  const password = process.env.POSTGRES_PASSWORD || "pass";
  const database = process.env.POSTGRES_DB || "notivo";
  pool = new Pool({ host, port, user, password, database });
  return pool;
};

export const initPostgres = async (): Promise<void> => {
  const pg = getDbPool();
  await pg.query("SELECT 1");
  console.log("Postgres connected");
};


