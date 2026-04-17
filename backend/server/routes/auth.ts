import { Router } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import type { Pool } from 'pg';
import { ClientError } from '../lib/index.js';

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password))
    return 'Password must contain an uppercase letter';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
    return 'Password must contain a symbol';
  return null;
}

export function createAuthRouter(db: Pool, tokenSecret: string): Router {
  const router = Router();

  router.get('/check-username', async (req, res, next) => {
    try {
      const { username } = req.query;
      if (!username) throw new ClientError(400, 'username is required');
      const result = await db.query(
        `SELECT 1 FROM "users" WHERE "username" = $1`,
        [username]
      );
      res.json({ available: result.rows.length === 0 });
    } catch (err) {
      next(err);
    }
  });

  router.post('/sign-up', async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if (!username || !password)
        throw new ClientError(400, 'username and password are required');
      const passwordError = validatePassword(password);
      if (passwordError) throw new ClientError(400, passwordError);

      const hashed = await argon2.hash(password);
      const result = await db.query(
        `INSERT INTO "users" ("username", "password")
         VALUES ($1, $2)
         RETURNING "userId", "username"`,
        [username, hashed]
      );
      const user = result.rows[0];
      const token = jwt.sign(
        { userId: user.userId, username: user.username },
        tokenSecret,
        { expiresIn: '7d' }
      );
      res.status(201).json({ user, token });
    } catch (err: any) {
      if (err.code === '23505') {
        next(new ClientError(409, 'username already taken'));
      } else {
        next(err);
      }
    }
  });

  router.post('/sign-in', async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if (!username || !password)
        throw new ClientError(400, 'username and password are required');
      const result = await db.query(
        `SELECT * FROM "users" WHERE "username" = $1`,
        [username]
      );
      const user = result.rows[0];
      if (!user) throw new ClientError(401, 'invalid credentials');
      const valid = await argon2.verify(user.password, password);
      if (!valid) throw new ClientError(401, 'invalid credentials');
      const token = jwt.sign(
        { userId: user.userId, username: user.username },
        tokenSecret,
        { expiresIn: '7d' }
      );
      res.json({
        user: { userId: user.userId, username: user.username },
        token,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
