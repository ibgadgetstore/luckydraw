import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';

interface AppState {
  pusatPrizes: any[];
  cabangPrizes: any[];
  winnerHistory: any[];
  headerConfig: {
    title: string;
    badge: string;
    subtitle: string;
    systemStatusText: string;
  };
  theme: string;
  removeOnWin: boolean;
  version: number;
  lastUpdated: number;
}

const STATE_FILE = path.join(process.cwd(), 'undian_state.json');

// Default initial state
const defaultState: AppState = {
  pusatPrizes: [
    { id: 'p-1', name: 'Free Android', category: 'pusat', iconType: 'phone', color: '#8B5CF6', percentage: 5 },
    { id: 'p-2', name: 'Uang Tunai 300K', category: 'pusat', iconType: 'cash', color: '#06B6D4', percentage: 10 },
    { id: 'p-3', name: 'Potongan Harga 200K', category: 'pusat', iconType: 'voucher', color: '#EC4899', percentage: 15 },
    { id: 'p-4', name: 'Shopeepay 50K', category: 'pusat', iconType: 'wallet', color: '#6366F1', percentage: 15 },
    { id: 'p-5', name: 'Uang Tunai 200K', category: 'pusat', iconType: 'cash', color: '#A78BFA', percentage: 10 },
    { id: 'p-6', name: 'Potongan Harga 300K', category: 'pusat', iconType: 'voucher', color: '#10B981', percentage: 10 },
    { id: 'p-7', name: 'Shopeepay 100K', category: 'pusat', iconType: 'wallet', color: '#D946EF', percentage: 10 },
    { id: 'p-8', name: 'Shopeepay 75K', category: 'pusat', iconType: 'wallet', color: '#14B8A6', percentage: 10 },
    { id: 'p-9', name: 'Uang Tunai 100K', category: 'pusat', iconType: 'cash', color: '#3B82F6', percentage: 15 },
  ],
  cabangPrizes: [
    { id: 'c-1', name: 'Uang Tunai 300K', category: 'cabang', iconType: 'cash', color: '#06B6D4', percentage: 10 },
    { id: 'c-2', name: 'Potongan Harga 200K', category: 'cabang', iconType: 'voucher', color: '#EC4899', percentage: 15 },
    { id: 'c-3', name: 'Shopeepay 50K', category: 'cabang', iconType: 'wallet', color: '#6366F1', percentage: 15 },
    { id: 'c-4', name: 'Uang Tunai 200K', category: 'cabang', iconType: 'cash', color: '#A78BFA', percentage: 10 },
    { id: 'c-5', name: 'Potongan Harga 300K', category: 'cabang', iconType: 'voucher', color: '#10B981', percentage: 15 },
    { id: 'c-6', name: 'Shopeepay 100K', category: 'cabang', iconType: 'wallet', color: '#D946EF', percentage: 10 },
    { id: 'c-7', name: 'Shopeepay 75K', category: 'cabang', iconType: 'wallet', color: '#14B8A6', percentage: 10 },
    { id: 'c-8', name: 'Uang Tunai 100K', category: 'cabang', iconType: 'cash', color: '#3B82F6', percentage: 15 },
  ],
  winnerHistory: [],
  headerConfig: {
    title: 'IBGADGETSTORE',
    badge: 'OFFICIAL LUCKY DRAW',
    subtitle: 'Sistem Undian Eksklusif • Hadiah Pusat & Hadiah Cabang',
    systemStatusText: 'SYSTEM READY',
  },
  theme: 'dark',
  removeOnWin: false,
  version: 1,
  lastUpdated: Date.now(),
};

// Load saved state or use default
let currentState: AppState = { ...defaultState };

try {
  if (fs.existsSync(STATE_FILE)) {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    currentState = { ...defaultState, ...parsed };
  }
} catch (e) {
  console.warn('Could not load initial state file:', e);
}

function persistState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(currentState, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save state file:', e);
  }
}

// SSE client connections list
const sseClients: Array<{ id: string; res: express.Response }> = [];

function broadcastState(senderClientId?: string) {
  const payload = JSON.stringify({
    type: 'STATE_UPDATE',
    state: currentState,
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

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now(), clients: sseClients.length });
  });

  // Get current full state
  app.get('/api/sync/state', (req, res) => {
    res.json(currentState);
  });

  // Update state from any client
  app.post('/api/sync/update', (req, res) => {
    const { updates, clientId } = req.body || {};
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    currentState = {
      ...currentState,
      ...updates,
      version: (currentState.version || 0) + 1,
      lastUpdated: Date.now(),
    };

    persistState();
    broadcastState(clientId);

    res.json({
      success: true,
      version: currentState.version,
      lastUpdated: currentState.lastUpdated,
    });
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

    // Immediately send current state on connect
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
    console.log(`IBGADGET Lucky Draw Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
