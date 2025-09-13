import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { Pool } from "pg";

const app = express();
const port = process.env.PORT || 3000;

const mongoConnect = async () => {
  const mongoHost = process.env.MONGO_HOST || "localhost";
  const mongoPort = process.env.MONGO_PORT || "27017";
  const mongoDb = process.env.MONGO_DB || "notivo";
  const mongoUser = process.env.MONGO_USER;
  const mongoPass = process.env.MONGO_PASSWORD;
  const authPart = mongoUser && mongoPass ? `${mongoUser}:${mongoPass}@` : "";
  const uri = process.env.MONGO_URI || `mongodb://${authPart}${mongoHost}:${mongoPort}/${mongoDb}`;
  await mongoose.connect(uri);
  console.log("MongoDB connected");
};

let pgPool: Pool | null = null;
const postgresConnect = async () => {
  const host = process.env.POSTGRES_HOST || "localhost";
  const port = Number(process.env.POSTGRES_PORT || 5432);
  const user = process.env.PGUSER || "user";
  const password = process.env.PGPASSWORD || "pass";
  const database = process.env.PGDATABASE || "mydb";
  pgPool = new Pool({ host, port, user, password, database });
  await pgPool.query("SELECT 1");
  console.log("Postgres connected");
};

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from note service");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

(async () => {
  try {
    await Promise.all([mongoConnect(), postgresConnect()]);
  } catch (err) {
    console.error("Database connection error", err);
    process.exit(1);
  }
})();
