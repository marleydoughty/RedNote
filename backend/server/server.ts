import 'dotenv/config.js';
import express from 'express';
import pg from 'pg';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './lib/index.js';
import { createAuthRouter } from './routes/auth.js';
import { createEntriesRouter } from './routes/entries.js';
import { createPredictRouter } from './routes/predict.js';

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
app.use(cookieParser());

const tokenSecret = process.env.TOKEN_SECRET ?? '';
if (!tokenSecret) throw new Error('TOKEN_SECRET not found in env');

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', createAuthRouter(db, tokenSecret));
app.use('/api/entries', createEntriesRouter(db));
app.use('/api/predict', createPredictRouter(db));

// ─── Fallback & Error ─────────────────────────────────────────────────────────
app.get('*', (_req, res) => res.sendFile(`${reactStaticDir}/index.html`));
app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log('Listening on port', process.env.PORT);
});
