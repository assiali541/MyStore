import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required but was not provided.");
  }
  return secret;
}

export function signToken(payload: { id: number; username: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): { id: number; username: string } {
  return jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as { id: number; username: string };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  try {
    const payload = verifyToken(token);
    (req as any).admin = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
