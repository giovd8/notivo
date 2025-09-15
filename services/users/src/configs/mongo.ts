import mongoose from "mongoose";

export const buildMongoUri = (): string => {
  const host = process.env.MONGO_HOST || "mongo";
  const port = process.env.MONGO_PORT || "27017";
  const db = process.env.MONGO_DB || "notivo";
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASSWORD;
  const authPart = user && pass ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : "";
  const authSource = process.env.MONGO_AUTH_SOURCE || (authPart ? "admin" : "");
  const authQuery = authSource ? `?authSource=${encodeURIComponent(authSource)}` : "";
  return process.env.MONGO_URI || `mongodb://${authPart}${host}:${port}/${db}${authQuery}`;
};

export const initMongo = async (): Promise<void> => {
  const uri = buildMongoUri();
  await mongoose.connect(uri);
  console.log("MongoDB connected (users service)");
};

export const closeMongo = async (): Promise<void> => {
  await mongoose.connection.close();
};


