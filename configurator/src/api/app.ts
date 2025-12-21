import express from "express";
import { apiRouter } from "./routes";
import { env } from "../config/env";
import { requestId } from "./middleware/requestId";
import { httpLogger } from "./middleware/logger";
import { apiKeyGuard } from "./middleware/apiKey";
import { errorHandler } from "./errors/errorHandler";
import cors from "cors";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    }),
  );
  app.use(requestId);
  app.use(httpLogger);
  app.use(express.json());
  app.use(apiKeyGuard);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", apiRouter);

  app.use(errorHandler);

  return app;
}

// Convenience factory with configured port (used by tests if needed)
export function buildApp() {
  return { app: createApp(), port: env.port };
}
