import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/error';

import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';
import reservationRoutes from './routes/reservation.routes';
import reviewRoutes from './routes/review.routes';
import settingsRoutes from './routes/settings.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';
import tableRoutes from './routes/table.routes';
import socialRoutes from './routes/social.routes';
import { uploadDir } from './controllers/upload.controller';

export const app = express();

app.set('trust proxy', 1);

// Allowed origins from CORS_ORIGINS or default in development
const corsOriginsEnv = process.env.CORS_ORIGINS;
export const allowedOrigins: string[] = corsOriginsEnv
  ? corsOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean)
  : process.env.NODE_ENV === 'production'
  ? []
  : ['http://localhost:5173'];

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Serve uploaded menu images statically
app.use('/uploads', express.static(uploadDir));

// Health check endpoint (public, unauthenticated)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Euroshub Kitchen API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', menuRoutes);
app.use('/api', orderRoutes);
app.use('/api', reservationRoutes);
app.use('/api', reviewRoutes);
app.use('/api', settingsRoutes);
app.use('/api', tableRoutes);
app.use('/api', socialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', uploadRoutes);

// 404 handler for undefined routes
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested API route does not exist.',
    },
  });
});

// Centralized error handler
app.use(errorHandler);
