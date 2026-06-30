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
import { errorHandler } from './middleware/errorHandler';
import { startExpiryCron } from './jobs/expiry.cron';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/listings', listingsRoutes);
app.use('/requests', requestsRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/impact', impactRoutes);
app.use('/verification', verificationRoutes);
app.use('/users', usersRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start background jobs
startExpiryCron();

// Global error handler should be the last middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Food Bridge server running on port ${PORT}`);
});

export default app;
