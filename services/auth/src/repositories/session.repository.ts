import mongoose from "mongoose";
import { SessionDocument } from "../models/session";

const getCollection = () => {
  const conn = mongoose.connection.useDb("user_cache");
  return conn.collection<SessionDocument>("sessions");
};

export const createSession = async (doc: SessionDocument): Promise<void> => {
  const col = getCollection();
  await col.insertOne(doc as any);
};

export const deleteUserSessions = async (userId: string): Promise<void> => {
  const col = getCollection();
  await col.deleteMany({ userId });
};

export const findSessionByRefreshToken = async (refreshToken: string): Promise<SessionDocument | null> => {
  const col = getCollection();
  return await col.findOne({ refreshToken });
};

export const replaceSessionTokens = async (
  refreshToken: string,
  next: { token: string; refreshToken: string; expiresAt: Date }
): Promise<void> => {
  const col = getCollection();
  await col.updateOne(
    { refreshToken },
    { $set: { token: next.token, refreshToken: next.refreshToken, expiresAt: next.expiresAt } }
  );
};


