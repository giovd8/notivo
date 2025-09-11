import * as bcrypt from "bcryptjs";
import { signTokenPair, verifyRefreshToken } from "../configs/jwt";
import { UserCreateDTO, UserDTO } from "../models/user";
import { createSession, deleteUserSessions, findSessionByRefreshToken, replaceSessionTokens } from "../repositories/session.repository";
import { createUser, findUserByUsername, toUserDTO } from "../repositories/user.repository";

export const registerUser = async (payload: UserCreateDTO): Promise<UserDTO> => {
  const existing = await findUserByUsername(payload.username);
  if (existing) {
    throw new Error("USERNAME_TAKEN");
  }
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const created = await createUser({ username: payload.username, passwordHash });
  return toUserDTO(created);
};

export const loginUser = async (username: string, password: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = await findUserByUsername(username);
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new Error("INVALID_CREDENTIALS");
  }
  const { accessToken, refreshToken } = signTokenPair({ sub: user.id, username: user.username });

  const now = new Date();
  const accessTtlMs = 15 * 60 * 1000; // mirror default 15m
  const expiresAt = new Date(now.getTime() + accessTtlMs);

  await deleteUserSessions(user.id);
  await createSession({
    userId: user.id,
    token: accessToken,
    refreshToken,
    createdAt: now,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

export const refreshTokens = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  if (!refreshToken) throw new Error("INVALID_REFRESH");
  const session = await findSessionByRefreshToken(refreshToken);
  if (!session) throw new Error("INVALID_REFRESH");
  try {
    const decoded = verifyRefreshToken(refreshToken) as any;
    const { accessToken, refreshToken: nextRefresh } = signTokenPair({ sub: decoded.sub, username: decoded.username });
    const now = new Date();
    const accessTtlMs = 15 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + accessTtlMs);
    await replaceSessionTokens(refreshToken, { token: accessToken, refreshToken: nextRefresh, expiresAt });
    return { accessToken, refreshToken: nextRefresh };
  } catch {
    throw new Error("INVALID_REFRESH");
  }
};


