import mongoose from "mongoose";
import { logger } from "./logger.js";

mongoose.set("strictQuery", true);

let isConnected = false;

/**
 * Connects to MongoDB using MONGODB_URI from the environment.
 * Reconnects gracefully if an existing serverless socket was closed by Atlas.
 */
export async function connectDB() {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }

  // If connection attempt is already in flight, wait for it
  if (mongoose.connection && mongoose.connection.readyState === 2) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once("connected", resolve);
      mongoose.connection.once("error", reject);
    });
    isConnected = true;
    return mongoose.connection;
  }

  let uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env and set MONGODB_URI (local Mongo or a MongoDB Atlas connection string)."
    );
  }

  mongoose.connection.removeAllListeners("connected");
  mongoose.connection.removeAllListeners("error");
  mongoose.connection.removeAllListeners("disconnected");

  mongoose.connection.on("connected", () => {
    logger.info({ db: mongoose.connection.name }, "[mongo] connected");
  });
  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "[mongo] connection error");
  });
  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    logger.warn("[mongo] disconnected");
  });

  const options = {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  };
  if (process.env.MONGODB_DB_NAME) {
    options.dbName = process.env.MONGODB_DB_NAME;
  }

  await mongoose.connect(uri, options);

  isConnected = true;
  return mongoose.connection;
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

export default mongoose;
