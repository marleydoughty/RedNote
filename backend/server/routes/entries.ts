import { Router } from 'express';
import type { Pool } from 'pg';
import { ClientError, authMiddleware } from '../lib/index.js';
import type { AuthenticatedRequest } from '../lib/authorization-middleware.js';

export function createEntriesRouter(db: Pool): Router {
  const router = Router();

  router.get('/', authMiddleware, async (req, res, next) => {
    try {
      const { start, end } = req.query;
      if (!start || !end)
        throw new ClientError(400, 'start and end query params are required');
      const { userId } = (req as AuthenticatedRequest).user;
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

  router.post('/', authMiddleware, async (req, res, next) => {
    try {
      const { date, isPeriod, notes } = req.body;
      if (!date) throw new ClientError(400, 'date is required');
      const { userId } = (req as AuthenticatedRequest).user;
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

  router.patch('/:date', authMiddleware, async (req, res, next) => {
    try {
      const { date } = req.params;
      const { isPeriod, notes } = req.body;
      const { userId } = (req as AuthenticatedRequest).user;

      console.log('PATCH request:', {
        date,
        isPeriod,
        notes,
        notesType: typeof notes,
      });

      // Build update query dynamically to handle empty strings
      const updates: string[] = [];
      const values: any[] = [userId, date];
      let paramCount = 2;

      if (isPeriod !== undefined && isPeriod !== null) {
        paramCount++;
        updates.push(`"isPeriod" = $${paramCount}`);
        values.push(isPeriod);
      }

      if (notes !== undefined) {
        paramCount++;
        updates.push(`"notes" = $${paramCount}`);
        values.push(notes === '' || notes === null ? null : notes);
      }

      if (updates.length === 0) {
        throw new ClientError(400, 'No fields to update');
      }

      updates.push('"updatedAt" = now()');

      console.log(
        'SQL:',
        `UPDATE "cycle_entries" SET ${updates.join(
          ', '
        )} WHERE "userId" = $1 AND "date" = $2`
      );
      console.log('Values:', values);

      const result = await db.query(
        `UPDATE "cycle_entries"
         SET ${updates.join(', ')}
         WHERE "userId" = $1
           AND "date" = $2
         RETURNING *`,
        values
      );

      console.log('Updated entry:', result.rows[0]);

      if (!result.rows[0])
        throw new ClientError(404, `No entry found for ${date}`);
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:date', authMiddleware, async (req, res, next) => {
    try {
      const { date } = req.params;
      const { userId } = (req as AuthenticatedRequest).user;
      const result = await db.query(
        `DELETE FROM "cycle_entries"
         WHERE "userId" = $1
           AND "date" = $2
         RETURNING *`,
        [userId, date]
      );
      if (!result.rows[0])
        throw new ClientError(404, `No entry found for ${date}`);
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
