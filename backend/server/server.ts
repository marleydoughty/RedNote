import 'dotenv/config.js';
import express from 'express';
import pg from 'pg';
import { ClientError, errorMiddleware } from './lib/index.js';

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

const DEMO_USER_ID = 'demo-user-1';

/** Converts a UTC Date to a YYYY-MM-DD string without timezone drift. */
function utcDateStr(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** In the future this can come from auth/session. */
function getUserId(): string {
  return DEMO_USER_ID;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/** GET /api/entries?start=YYYY-MM-DD&end=YYYY-MM-DD */
app.get('/api/entries', async (req, res, next) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      throw new ClientError(400, 'start and end query params are required');
    }

    const userId = getUserId();

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
app.post('/api/entries', async (req, res, next) => {
  try {
    const { date, isPeriod, notes } = req.body;
    if (!date) throw new ClientError(400, 'date is required');

    const userId = getUserId();

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
app.patch('/api/entries/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const { isPeriod, notes } = req.body;
    const userId = getUserId();

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
app.delete('/api/entries/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const userId = getUserId();

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
app.get('/api/predict', async (req, res, next) => {
  try {
    const userId = getUserId();

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

    const startDates = dates.filter((d) => {
      const prev = new Date(d);
      prev.setUTCDate(prev.getUTCDate() - 1);
      return !dateSet.has(utcDateStr(prev));
    });

    const lastStart = startDates[startDates.length - 1];
    let avgCycle = 28;
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

    const predictions = [1, 2, 3].map((i) => {
      const predicted = new Date(lastStart);
      predicted.setUTCDate(predicted.getUTCDate() + avgCycle * i);
      return { date: utcDateStr(predicted), confidence };
    });

    const nextPeriodStart = predictions[0]?.date ?? null;

    const ovulationDays: string[] = [];
    if (nextPeriodStart) {
      const ovulationDate = new Date(`${nextPeriodStart}T00:00:00Z`);
      ovulationDate.setUTCDate(ovulationDate.getUTCDate() - 14);

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
