import * as bcrypt from "bcryptjs";
import { getJwtTtlsMs, signTokenPair, verifyRefreshToken } from "../configs/jwt";
import { UserCredentialDTO, UserDTO } from "../models/user";
import { createSession, deleteSessionByRefreshToken, findSessionByRefreshToken, replaceSessionTokens } from "../repositories/session.repository";
import { createUser, findUserByUsername, toUserDTO } from "../repositories/user.repository";

const registerUser = async (payload: UserCredentialDTO): Promise<UserDTO> => {
  const existing = await findUserByUsername(payload.username);
  if (existing) {
    throw new Error("USERNAME_TAKEN");
  }
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const created = await createUser({ username: payload.username, password: passwordHash });
  return toUserDTO(created);
};

const loginUser = async (username: string, password: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = await findUserByUsername(username);
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new Error("INVALID_CREDENTIALS");
  }
  const { accessToken, refreshToken } = signTokenPair({ sub: user.id, username: user.username });

  const now = new Date();
  const { accessTtlMs } = getJwtTtlsMs();
  const expiresAt = new Date(now.getTime() + accessTtlMs);

  await createSession({
    userId: user.id,
    token: accessToken,
    refreshToken,
    createdAt: now,
    expiresAt,
  });
  return { accessToken, refreshToken };
};

const refreshTokens = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  if (!refreshToken) throw new Error("INVALID_REFRESH");
  const session = await findSessionByRefreshToken(refreshToken);
  if (!session) throw new Error("INVALID_REFRESH");
  try {
    const decoded = verifyRefreshToken(refreshToken) as any;
    const { accessToken, refreshToken: nextRefresh } = signTokenPair({ sub: decoded.sub, username: decoded.username });
    const now = new Date();
    const { accessTtlMs } = getJwtTtlsMs();
    const expiresAt = new Date(now.getTime() + accessTtlMs);
    await replaceSessionTokens(refreshToken, { token: accessToken, refreshToken: nextRefresh, expiresAt });
    return { accessToken, refreshToken: nextRefresh };
  } catch {
    throw new Error("INVALID_REFRESH");
  }
};

const logoutUser = async (refreshToken: string): Promise<void> => {
  if (!refreshToken) throw new Error("INVALID_REFRESH");
  const existing = await findSessionByRefreshToken(refreshToken);
  if (!existing) throw new Error("INVALID_REFRESH");
  await deleteSessionByRefreshToken(refreshToken);
};

export default { registerUser, loginUser, refreshTokens, logoutUser };


