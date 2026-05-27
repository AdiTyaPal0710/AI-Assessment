import express from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './config/env';
import { connectDB } from './config/database';
import { wsManager } from './websocket/manager';
import { startWorker } from './jobs/worker';
import assignmentRoutes from './routes/assignments';

async function main(): Promise<void> {
  // Connect to MongoDB
  await connectDB();

  // Create Express app
  const app = express();

  // Middleware
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/assignments', assignmentRoutes);

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize WebSocket
  wsManager.initialize(server);

  // Start BullMQ worker
  startWorker();

  // Start server
  server.listen(config.port, '0.0.0.0', () => {
    console.log(`🚀 VedaAI Backend running on port ${config.port}`);
    console.log(`📡 WebSocket available at ws://0.0.0.0:${config.port}/ws`);
    console.log(`🔗 API available at http://0.0.0.0:${config.port}/api`);
  });
}

main().catch(console.error);
