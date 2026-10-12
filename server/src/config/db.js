import mongoose from "mongoose";
import { setServers } from "node:dns";
import { env } from "./env.js";

let connection = null;

export const connectDatabase = async () => {
  if (connection) return connection;

  if (env.mongoDnsServers.length) {
    setServers(env.mongoDnsServers);
  }

  mongoose.set("strictQuery", true);

  connection = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(
    `[db] connected: ${mongoose.connection.name}`
  );

  return connection;
};

export const disconnectDatabase = async () => {
  if (!connection) return;
  await mongoose.disconnect();
  connection = null;
};
