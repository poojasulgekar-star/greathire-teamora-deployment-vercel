import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getClientOrigins } from "./config/clientOrigins.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
let openapiDocument = {};
try {
  openapiDocument = YAML.parse(readFileSync(join(__dirname, "..", "openapi.yaml"), "utf8"));
} catch (err) {
  openapiDocument = {
    openapi: "3.0.0",
    info: { title: "GreatHire Teamora API", version: "1.0.0" },
    paths: {},
  };
}

import { logger } from "./config/logger.js";
import passport from "./config/passport.js";
import { ApiError } from "./middleware/errorHandler.js";
import { attachUser } from "./middleware/auth.js";
import authRoutes from "./routes/authRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import employeeDashboardRoutes from "./routes/employeeDashboardRoutes.js";
import employeeProfileRoutes from "./routes/employeeProfileRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import storageRoutes from "./routes/storageRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  let app = express();

  // Trust first proxy hop (Vercel reverse proxy) so req.ip and rate-limiting work properly
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      redact: ["req.headers.authorization", "req.headers.cookie"],
      customLogLevel: (req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    })
  );

  let clientOrigins = getClientOrigins();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        let normalized = origin.trim().replace(/\/+$/, "");
        let isAllowed = clientOrigins.some((allowed) => {
          let cleanAllowed = allowed.replace(/\/+$/, "");
          if (cleanAllowed === normalized) return true;
          if (cleanAllowed.includes("*")) {
            let regex = new RegExp("^" + cleanAllowed.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
            return regex.test(normalized);
          }
          return false;
        });

        if (isAllowed) {
          callback(null, true);
          return;
        }

        logger.warn({ origin, allowed: clientOrigins }, "[cors] denied origin");
        callback(new ApiError(403, `Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    })
  );
  // Mount binary file storage upload/download before express.json()
  // so file streams are piped directly to GridFS without middleware parsing limits
  app.use("/api/messages/storage", storageRoutes);

  // Profile photos are sent as compressed data URLs, which need more than Express's default JSON limit.
  app.use(express.json({ limit: "150kb" }));
  app.use(passport.initialize());

  // Non-blocking: populates req.user when a valid Bearer token is sent, but
  // every route below still works without one (see middleware/auth.js).
  app.use(attachUser);

  app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "GreatHire Teamora API is running" });
  });

  // Interactive API docs — http://localhost:5000/api-docs
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

  app.use("/api/auth", authRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/leave", leaveRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/employee", employeeDashboardRoutes);
  app.use("/api/employees", employeeProfileRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/schedule", scheduleRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
