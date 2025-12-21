/// <reference path="../../types/express.d.ts" />
import type { Request, Response, NextFunction } from "express";

export function requestId(req: Request, _res: Response, next: NextFunction) {
  req.id = req.id ?? crypto.randomUUID();
  next();
}
