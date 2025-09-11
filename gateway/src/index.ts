import express, { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3000";
const NOTE_SERVICE_URL = process.env.NOTE_SERVICE_URL || "http://note-service:3000";

const app = express();
const port = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});
app.use(limiter);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from gateway" });
});

app.use("/auth", createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));
app.use("/note", createProxyMiddleware({ target: NOTE_SERVICE_URL, changeOrigin: true }));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
