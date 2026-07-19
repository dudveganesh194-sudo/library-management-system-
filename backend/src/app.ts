/**
 * Express application setup.
 * This file configures middleware, mounts all feature routers,
 * and sets up error handling. It does NOT start the HTTP server.
 */

import 'express-async-errors'; // Must be imported first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Feature routers
import authRouter from './features/auth/auth.routes';
import userRouter from './features/users/user.routes';
import studentRouter from './features/students/student.routes';
import seatRouter from './features/seats/seat.routes';
import paymentRouter from './features/payments/payment.routes';
import reportRouter from './features/reports/report.routes';
import settingsRouter from './features/settings/settings.routes';
import floorRouter from './features/floors/floor.routes';
import superAdminRouter from './features/super-admin/super-admin.routes';

const app = express();

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);

      // Allow any netlify.app subdomain
      if (origin.endsWith('.netlify.app')) return callback(null, true);

      // Allow any vercel.app subdomain
      if (origin.endsWith('.vercel.app')) return callback(null, true);

      // Allow explicitly listed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later' },
});

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (env.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Root Route ────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: '📚 Library ERP API is running',
    version: '1.0.0',
    docs: '/health',
  });
});

// Support HEAD / for Render health checks
app.head('/', (_req, res) => {
  res.sendStatus(200);
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/students', studentRouter);
app.use('/api/seats', seatRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/reports', reportRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/floors', floorRouter);
app.use('/api/super-admin', superAdminRouter);

// ── 404 & Error Handlers (must be last) ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
