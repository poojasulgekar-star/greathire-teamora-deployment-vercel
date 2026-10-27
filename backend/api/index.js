import dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
  // Ignored in environments where custom DNS servers cannot be set
}
import "dotenv/config";
import { createApp } from "../src/app.js";
import { connectDB } from "../src/config/db.js";
import { validateEnv } from "../src/config/validateEnv.js";
import { logger } from "../src/config/logger.js";
import { seedDatabaseIfEmpty } from "../src/db/seed.js";
import { loadAllData } from "../src/db/loadAll.js";

let app = null;
let initPromise = null;

async function bootstrap() {
  validateEnv();
  await connectDB();
  await seedDatabaseIfEmpty();
  await loadAllData();
  app = createApp();
  logger.info("[serverless] Backend initialized successfully for Vercel");
  return app;
}

export default async function handler(req, res) {
  try {
    if (!initPromise) {
      initPromise = bootstrap();
    }
    await initPromise;
    // Ensure DB connection is active for warm containers whose socket might have timed out
    await connectDB();
    return app(req, res);
  } catch (err) {
    // Reset so the next incoming request can retry rather than permanently caching rejection
    initPromise = null;
    logger.error({ err }, "[serverless] Initialization error");
    return res.status(500).json({ error: "Backend failed to initialize", message: err.message });
  }
}
