import { sign, verify, type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";

type TokenPair = { accessToken: string; refreshToken: string };

const getJwtSecrets = () => {
  const accessSecret = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
  const refreshSecret = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";
  const accessTtl = process.env.JWT_ACCESS_TTL || "15m";
  const refreshTtl = process.env.JWT_REFRESH_TTL || "7d";
  return { accessSecret, refreshSecret, accessTtl, refreshTtl };
};

const parseTtlToMs = (ttl: string): number => {
  const trimmed = ttl.trim().toLowerCase();
  const match = trimmed.match(/^(\d+)(ms|s|m|h|d)?$/);
  if (!match) {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : 0;
  }
  const value = Number(match[1]);
  const unit = match[2] || "ms";
  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return value;
  }
};

export const getJwtTtlsMs = (): { accessTtlMs: number; refreshTtlMs: number } => {
  const { accessTtl, refreshTtl } = getJwtSecrets();
  return {
    accessTtlMs: parseTtlToMs(accessTtl),
    refreshTtlMs: parseTtlToMs(refreshTtl),
  };
};

export const signTokenPair = (payload: JwtPayload | object): TokenPair => {
  const { accessSecret, refreshSecret, accessTtl, refreshTtl } = getJwtSecrets();
  const accessToken = sign(payload, accessSecret as Secret, { expiresIn: accessTtl as SignOptions["expiresIn"] } as SignOptions);
  const refreshToken = sign(payload, refreshSecret as Secret, { expiresIn: refreshTtl as SignOptions["expiresIn"] } as SignOptions);
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
  const { accessSecret } = getJwtSecrets();
  return verify(token, accessSecret as Secret);
};

export const verifyRefreshToken = (token: string) => {
  const { refreshSecret } = getJwtSecrets();
  return verify(token, refreshSecret as Secret);
};


