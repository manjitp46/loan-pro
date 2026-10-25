import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { initDatabase } from './db/database';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend and Docker host
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Initialize SQLite database and run migrations/seeds
initDatabase();

// Mount API routes
app.use('/api', apiRoutes);

// Root route with API metadata
app.get('/', (req, res) => {
  res.json({
    name: 'Loan Tool Financial Engine API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: [
      'GET  /api/health',
      'GET  /api/presets',
      'POST /api/calculate/emi',
      'POST /api/calculate/prepayment',
      'POST /api/calculate/balance-transfer',
      'POST /api/calculate/eligibility',
      'POST /api/calculate/floating-rate',
      'POST /api/calculate/compare',
      'POST /api/saved',
      'GET  /api/saved',
      'GET  /api/saved/:code',
      'DELETE /api/saved/:id',
    ],
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  app.listen(PORT, () => {
    console.log(`🚀 Loan Tool Backend server running on port ${PORT}`);
  });
}
