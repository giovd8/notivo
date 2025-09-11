import express from "express";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3000";
const NOTE_SERVICE_URL = process.env.NOTE_SERVICE_URL || "http://note-service:3000";

const app = express();
const port = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});
app.use(limiter);


app.use("/auth", createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));
app.use("/note", createProxyMiddleware({ target: NOTE_SERVICE_URL, changeOrigin: true }));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
