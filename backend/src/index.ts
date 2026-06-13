import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import assemblyLineRoutes from './routes/assemblyLines';
import workstationRoutes from './routes/workstations';
import allocationRoutes from './routes/allocations';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected routes (auth required)
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/assembly-lines', authMiddleware, assemblyLineRoutes);
app.use('/api/workstations', authMiddleware, workstationRoutes);
app.use('/api/assembly-lines/:id/allocations', authMiddleware, allocationRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Assembly Line Manager API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
