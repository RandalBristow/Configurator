import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { HttpError } from "./httpError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }
  console.error(err);
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        message: "Unique constraint violation",
        code: err.code,
        meta: err.meta,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "Record not found",
        code: err.code,
        meta: err.meta,
      });
    }
    return res.status(500).json({
      message: err.message,
      code: err.code,
      meta: err.meta,
    });
  }
  const message = err instanceof Error ? err.message : String(err);
  return res.status(500).json({ message });
}
