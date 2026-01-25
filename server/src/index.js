/**
 * Inner Circle Game Server
 * Express + Socket.io
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initSocketHandlers } from './socketHandlers.js';
import { categories } from './cards.js';

const PORT = process.env.PORT || 3001;

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

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
  res.json(categories);
});

// Initialize socket handlers
initSocketHandlers(io);

// Start server on all interfaces (0.0.0.0) for network access
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════╗
║         INNER CIRCLE GAME SERVER          ║
╠═══════════════════════════════════════════╣
║  Server running on port ${PORT}              ║
║  Socket.io ready for connections          ║
║  Accessible on local network              ║
╚═══════════════════════════════════════════╝
  `);
});
