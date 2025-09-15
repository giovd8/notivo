import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from "express";
import http from "http";
import { closeMongo, initMongo } from "./configs/mongo";
import { getDbPool, initPostgres } from "./configs/postgres";
import noteRoutes from "./routes/note.routes";
import tagRoutes from "./routes/tag.routes";

dotenv.config();

export const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/", noteRoutes);
  app.use("/tags", tagRoutes);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const message = err?.message ? err.message : 'Internal server error';
    const status = err?.status ? err.status : 500;
    const data = err?.data ? err.data : null;
    console.log(`Note service error - status: ${status}, message: ${message}`);
    return res.status(status).json({ data, message });
  });
  return app;
};

const start = async () => {
  await Promise.all([initPostgres(), initMongo()]);
  const app = createApp();
  const port = Number(process.env.PORT || 3000);
  const server = http.createServer(app);

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down...`);
    server.close(async () => {
      try {
        const pool = getDbPool();
        await pool.end();
        await closeMongo();
      } catch (e) {
        // noop
      } finally {
        process.exit(0);
      }
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
};

start().catch((err) => {
  console.error("Startup error", err);
  process.exit(1);
});
