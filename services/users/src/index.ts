import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import express from "express";
import http from "http";
import { getDbPool, initPostgres } from "./configs/postgres";
import userRoutes from "./routes/user.routes";

dotenv.config();

export const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/", userRoutes);
  return app;
};

const start = async () => {
  await initPostgres();
  const app = createApp();
  const port = Number(process.env.PORT || 3002);
  const server = http.createServer(app);

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down...`);
    server.close(async () => {
      try {
        const pool = getDbPool();
        await pool.end();
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


