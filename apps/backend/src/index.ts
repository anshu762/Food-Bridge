import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import listingsRoutes from './modules/listings/listings.routes';
import requestsRoutes from './modules/requests/requests.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import impactRoutes from './modules/impact/impact.routes';
import verificationRoutes from './modules/verification/verification.routes';
import usersRoutes from './modules/users/users.routes';
import { apiRateLimiter } from './middleware/rateLimiter';
import adminRoutes from './modules/admin/admin.routes';
import { errorHandler } from './middleware/errorHandler';
import { startExpiryCron } from './jobs/expiry.cron';

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

dotenv.config();

// Ensure Sentry captures as much as possible as early as possible
Sentry.init({
  dsn: process.env.SENTRY_DSN || 'https://public@sentry.example.com/1',
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
});

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());

// Routes
app.use('/auth', authRoutes); // authRoutes has authRateLimiter inside for login/register
app.use('/listings', apiRateLimiter, listingsRoutes);
app.use('/requests', apiRateLimiter, requestsRoutes);
app.use('/notifications', apiRateLimiter, notificationsRoutes);
app.use('/impact', apiRateLimiter, impactRoutes);
app.use('/verification', apiRateLimiter, verificationRoutes);
app.use('/users', apiRateLimiter, usersRoutes);
app.use('/admin', apiRateLimiter, adminRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start background jobs
startExpiryCron();

Sentry.setupExpressErrorHandler(app);

// Global error handler should be the last middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Food Bridge server running on port ${PORT}`);
});

export default app;
