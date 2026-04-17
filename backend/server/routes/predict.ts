import { Router } from 'express';
import type { Pool } from 'pg';
import { authMiddleware } from '../lib/index.js';
import { predictCycles } from '../lib/cyclePredictor.js';

export function createPredictRouter(db: Pool): Router {
  const router = Router();

  router.get('/', authMiddleware, async (req, res, next) => {
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
      res.json(predictCycles(dates));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
