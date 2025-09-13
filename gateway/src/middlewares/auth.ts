import type { NextFunction, Request, Response } from "express";
import { verify, type JwtPayload, type Secret } from "jsonwebtoken";

const getAccessSecret = (): Secret => process.env.JWT_ACCESS_SECRET || "dev-access-secret";

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {};
  const map: Record<string, string> = {};
  cookieHeader.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    if (key) map[key] = val;
  });
  return map;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies["accessToken"];
  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring("Bearer ".length) : undefined;
  const token = cookieToken || headerToken;
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const payload = verify(token, getAccessSecret()) as JwtPayload | string;
    const normalizedPayload: JwtPayload = typeof payload === "string" ? { sub: payload } : payload;
    (req as any).user = normalizedPayload;
    (req as any).accessToken = token;
    req.headers.authorization = `Bearer ${token}`;
    if (normalizedPayload.sub) {
      req.headers["x-user-id"] = String(normalizedPayload.sub);
    }
    if ((normalizedPayload as any).username) {
      req.headers["x-username"] = String((normalizedPayload as any).username);
    }
    next();
  } catch (_err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};