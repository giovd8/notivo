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
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring("Bearer ".length);
  } else {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies["accessToken"];
  }

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const payload = verify(token, getAccessSecret()) as JwtPayload | string;
    (req as any).user = typeof payload === "string" ? { sub: payload } : payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};