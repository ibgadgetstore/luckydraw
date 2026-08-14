import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { sqliteDb } from './src/db/sqlite';

// SSE client connections list
const sseClients: Array<{ id: string; res: express.Response }> = [];

function broadcastState(state: any, senderClientId?: string) {
  const payload = JSON.stringify({
    type: 'STATE_UPDATE',
    state,
    senderClientId,
  });

  sseClients.forEach((client) => {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch {
      // client may be closed
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database
  await sqliteDb.init();
  console.log('SQLite Database (database.sqlite) initialized successfully.');

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: 'sqlite',
      time: Date.now(),
      clients: sseClients.length,
    });
  });

  // Get current full state from SQLite
  app.get('/api/sync/state', (req, res) => {
    try {
      const state = sqliteDb.getFullState();
      res.json(state);
    } catch (err) {
      console.error('Error fetching SQLite state:', err);
      res.status(500).json({ error: 'Failed to fetch SQLite state' });
    }
  });

  // Update state directly into SQLite and broadcast via SSE
  app.post('/api/sync/update', (req, res) => {
    const { updates, clientId } = req.body || {};
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    try {
      const updatedState = sqliteDb.updateState(updates);
      broadcastState(updatedState, clientId);

      res.json({
        success: true,
        database: 'sqlite',
        version: updatedState.version,
        lastUpdated: updatedState.lastUpdated,
      });
    } catch (err) {
      console.error('Error updating SQLite state:', err);
      res.status(500).json({ error: 'Failed to persist state into SQLite' });
    }
  });

  // Server-Sent Events (SSE) endpoint for real-time live synchronization
  app.get('/api/sync/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const clientId = Math.random().toString(36).substring(2, 12);
    const clientEntry = { id: clientId, res };
    sseClients.push(clientEntry);

    // Immediately send current SQLite state on connect
    const currentState = sqliteDb.getFullState();
    res.write(`data: ${JSON.stringify({ type: 'INITIAL_STATE', state: currentState })}\n\n`);

    // Keep-alive heartbeat every 20 seconds
    const interval = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch {
        clearInterval(interval);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(interval);
      const index = sseClients.indexOf(clientEntry);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IBGADGET Lucky Draw Server (SQLite Powered) running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
