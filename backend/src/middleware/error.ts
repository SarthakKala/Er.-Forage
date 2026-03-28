import { NextFunction, Request, Response } from "express";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Something went wrong",
    code: "INTERNAL_ERROR"
  });
}
