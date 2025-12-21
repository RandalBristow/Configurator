import type { Request, Response, NextFunction } from "express";
import { env } from "../../config/env";
import { HttpError } from "../errors/httpError";

// If API_KEY is unset, the middleware is a no-op (open access).
export function apiKeyGuard(req: Request, _res: Response, next: NextFunction) {
  if (!env.apiKey) return next();
  const headerKey = req.header("x-api-key");
  if (headerKey && headerKey === env.apiKey) return next();
  next(new HttpError(401, "Unauthorized"));
}
