/**
 * Pick Me Game Server
 * Express + Socket.io + Static Frontend
 */

import express from 'express';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initSocketHandlers } from './socketHandlers.js';
import { listCategories } from './cards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(compression());

// Serve static frontend files from /public (with cache headers for hashed assets)
const publicPath = join(__dirname, '..', 'public');
app.use(express.static(publicPath, {
  setHeaders: (res, path) => {
    if (path.includes('assets')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST']
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get available categories
app.get('/api/categories', (req, res) => {
  res.json(listCategories());
});

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res, next) => {
  // Skip API routes and socket.io
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/health') {
    return next();
  }
  res.sendFile(join(publicPath, 'index.html'));
});

// Initialize socket handlers
initSocketHandlers(io);

// Start server on all interfaces (0.0.0.0) for network access
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════╗
║           PICK ME GAME SERVER             ║
╠═══════════════════════════════════════════╣
║  Server running on port ${PORT}              ║
║  Socket.io ready for connections          ║
║  Accessible on local network              ║
╚═══════════════════════════════════════════╝
  `);
});
