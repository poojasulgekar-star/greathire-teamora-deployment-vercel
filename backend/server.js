import dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
  // Ignored in environments where custom DNS servers cannot be set
}
import "dotenv/config";
import { createApp } from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { validateEnv } from "./src/config/validateEnv.js";
import { logger } from "./src/config/logger.js";
import { seedDatabaseIfEmpty } from "./src/db/seed.js";
import { loadAllData } from "./src/db/loadAll.js";

validateEnv();

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    await seedDatabaseIfEmpty();
    await loadAllData();

    let app = createApp();
    app.listen(PORT, "0.0.0.0", () => {
      logger.info({ port: PORT }, `GreatHire Teamora API listening on 0.0.0.0:${PORT}`);
      // logger.info({ port: PORT }, `GreatHire Teamora API listening on http://localhost:${PORT}`);

    });
  } catch (err) {
    logger.error({ err }, "[boot] failed to start server");
    process.exit(1);
  }
}

start();
