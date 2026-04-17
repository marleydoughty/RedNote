import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ClientError } from './client-error.js';

export type AuthenticatedUser = {
  userId: number;
  username: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

const secret = process.env.TOKEN_SECRET ?? '';
if (!secret) throw new Error('TOKEN_SECRET not found in env');

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.token;
  if (!token) {
    throw new ClientError(401, 'authentication required');
  }
  (req as AuthenticatedRequest).user = jwt.verify(
    token,
    secret
  ) as AuthenticatedUser;
  next();
}
