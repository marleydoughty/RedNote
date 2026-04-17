import 'dotenv/config.js';
import express from 'express';
import pg from 'pg';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { ClientError, errorMiddleware, authMiddleware } from './lib/index.js';
import {
  DEFAULT_CYCLE_LENGTH,
  MIN_CYCLE_GAP_DAYS,
  OVULATION_WINDOW_END,
  PREDICTION_COUNT,
} from './constants/cycleConstants.js';

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

const app = express();

const reactStaticDir = new URL('../../frontend/dist', import.meta.url).pathname;
const uploadsStaticDir = new URL('public', import.meta.url).pathname;

app.use(express.static(reactStaticDir));
app.use(express.static(uploadsStaticDir));
app.use(express.json());

const tokenSecret = process.env.TOKEN_SECRET ?? '';
if (!tokenSecret) throw new Error('TOKEN_SECRET not found in env');

/** Converts a UTC Date to a YYYY-MM-DD string without timezone drift. */
function utcDateStr(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password))
    return 'Password must contain an uppercase letter';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
    return 'Password must contain a symbol';
  return null;
}

/** GET /api/auth/check-username?username=xxx */
app.get('/api/auth/check-username', async (req, res, next) => {
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

/** POST /api/auth/sign-up */
app.post('/api/auth/sign-up', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ClientError(400, 'username and password are required');
    }
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
      {
        expiresIn: '7d',
      }
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

/** POST /api/auth/sign-in */
app.post('/api/auth/sign-in', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ClientError(400, 'username and password are required');
    }
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
      {
        expiresIn: '7d',
      }
    );
    res.json({ user: { userId: user.userId, username: user.username }, token });
  } catch (err) {
    next(err);
  }
});

// ─── Protected Routes ─────────────────────────────────────────────────────────

/** GET /api/entries?start=YYYY-MM-DD&end=YYYY-MM-DD */
app.get('/api/entries', authMiddleware, async (req, res, next) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      throw new ClientError(400, 'start and end query params are required');
    }

    const userId = req.user!.userId;

    const result = await db.query(
      `SELECT * FROM "cycle_entries"
       WHERE "userId" = $1
         AND "date" BETWEEN $2 AND $3
       ORDER BY "date" ASC`,
      [userId, start, end]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/** POST /api/entries — create or upsert an entry for a date */
app.post('/api/entries', authMiddleware, async (req, res, next) => {
  try {
    const { date, isPeriod, notes } = req.body;
    if (!date) throw new ClientError(400, 'date is required');

    const userId = req.user!.userId;

    const result = await db.query(
      `INSERT INTO "cycle_entries" ("userId", "date", "isPeriod", "notes")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("userId", "date") DO UPDATE
         SET "isPeriod"  = EXCLUDED."isPeriod",
             "notes"     = EXCLUDED."notes",
             "updatedAt" = now()
       RETURNING *`,
      [userId, date, isPeriod ?? false, notes ?? null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/entries/:date — update notes or isPeriod on an existing entry */
app.patch('/api/entries/:date', authMiddleware, async (req, res, next) => {
  try {
    const { date } = req.params;
    const { isPeriod, notes } = req.body;
    const userId = req.user!.userId;

    const result = await db.query(
      `UPDATE "cycle_entries"
       SET "isPeriod"  = COALESCE($3, "isPeriod"),
           "notes"     = COALESCE($4, "notes"),
           "updatedAt" = now()
       WHERE "userId" = $1
         AND "date" = $2
       RETURNING *`,
      [userId, date, isPeriod ?? null, notes ?? null]
    );

    if (!result.rows[0]) {
      throw new ClientError(404, `No entry found for ${date}`);
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/entries/:date */
app.delete('/api/entries/:date', authMiddleware, async (req, res, next) => {
  try {
    const { date } = req.params;
    const userId = req.user!.userId;

    const result = await db.query(
      `DELETE FROM "cycle_entries"
       WHERE "userId" = $1
         AND "date" = $2
       RETURNING *`,
      [userId, date]
    );

    if (!result.rows[0]) {
      throw new ClientError(404, `No entry found for ${date}`);
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/** GET /api/predict — return predicted period + ovulation data */
app.get('/api/predict', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const result = await db.query(
      `SELECT "date" FROM "cycle_entries"
       WHERE "userId" = $1
         AND "isPeriod" = true
       ORDER BY "date" ASC`,
      [userId]
    );

    const dates: Date[] = result.rows.map(
      (r: { date: string }) => new Date(r.date)
    );

    if (dates.length === 0) {
      return res.json({
        predictions: [],
        averageCycleLength: null,
        ovulationDays: [],
        nextPeriodStart: null,
      });
    }

    const dateSet = new Set(dates.map(utcDateStr));

    // Find cycle start dates — a day is a start if the previous day isn't marked
    const rawStarts = dates.filter((d) => {
      const prev = new Date(d);
      prev.setUTCDate(prev.getUTCDate() - 1);
      return !dateSet.has(utcDateStr(prev));
    });

    // Merge starts that are fewer than 3 days apart (same period, gap in logging)
    const startDates = rawStarts.filter((d, i) => {
      if (i === 0) return true;
      const daysSincePrev =
        (d.getTime() - rawStarts[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      return daysSincePrev >= MIN_CYCLE_GAP_DAYS;
    });

    const lastStart = startDates[startDates.length - 1];
    let avgCycle = DEFAULT_CYCLE_LENGTH;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    if (startDates.length >= 2) {
      const totalDays = startDates
        .slice(1)
        .reduce(
          (sum, d, i) =>
            sum +
            (d.getTime() - startDates[i].getTime()) / (1000 * 60 * 60 * 24),
          0
        );

      avgCycle = Math.round(totalDays / (startDates.length - 1));
      confidence = startDates.length >= 3 ? 'high' : 'medium';
    }

    const predictions = Array.from({ length: PREDICTION_COUNT }, (_, i) => {
      const predicted = new Date(lastStart);
      predicted.setUTCDate(predicted.getUTCDate() + avgCycle * (i + 1));
      return { date: utcDateStr(predicted), confidence };
    });

    const nextPeriodStart = predictions[0]?.date ?? null;

    const ovulationDays: string[] = [];
    if (nextPeriodStart) {
      const ovulationDate = new Date(`${nextPeriodStart}T00:00:00Z`);
      ovulationDate.setUTCDate(
        ovulationDate.getUTCDate() - OVULATION_WINDOW_END
      );

      ovulationDays.push(utcDateStr(ovulationDate));
    }

    res.json({
      predictions,
      averageCycleLength: avgCycle,
      ovulationDays,
      nextPeriodStart,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Fallback & Error ─────────────────────────────────────────────────────────

app.get('*', (req, res) => res.sendFile(`${reactStaticDir}/index.html`));
app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log('Listening on port', process.env.PORT);
});
