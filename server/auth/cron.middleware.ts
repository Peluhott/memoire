import { Request, Response, NextFunction } from "express";

export function authenticateCronSecret(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const requestSecret = req.header("x-cron-secret");
  const configuredSecret = process.env.CRON_SECRET;

  if (!configuredSecret || requestSecret !== configuredSecret) {
    return res.status(401).json({ error: "unauthorized" });
  }

  return next();
}
