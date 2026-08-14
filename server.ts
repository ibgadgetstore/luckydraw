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
    subtitle: string;
    badgeText: string;
    logoSubtext: string;
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
    { id: 'p1', name: 'iPhone 15 Pro Max', category: 'pusat', weight: 5, percentage: 5, isGrandPrize: true, icon: 'smartphone', color: '#8B5CF6' },
    { id: 'p2', name: 'MacBook Air M2', category: 'pusat', weight: 8, percentage: 8, isGrandPrize: true, icon: 'laptop', color: '#EC4899' },
    { id: 'p3', name: 'iPad Air Gen 5', category: 'pusat', weight: 12, percentage: 12, icon: 'tablet', color: '#3B82F6' },
    { id: 'p4', name: 'Apple Watch Series 9', category: 'pusat', weight: 15, percentage: 15, icon: 'watch', color: '#10B981' },
    { id: 'p5', name: 'AirPods Pro 2', category: 'pusat', weight: 20, percentage: 20, icon: 'headphones', color: '#F59E0B' },
    { id: 'p6', name: 'Voucher Belanja Rp 1 Juta', category: 'pusat', weight: 40, percentage: 40, icon: 'ticket', color: '#6366F1' },
  ],
  cabangPrizes: [
    { id: 'c1', name: 'AirPods 3rd Gen', category: 'cabang', weight: 5, percentage: 5, isGrandPrize: true, icon: 'headphones', color: '#8B5CF6' },
    { id: 'c2', name: 'Smart Powerbank 20.000mAh', category: 'cabang', weight: 10, percentage: 10, icon: 'battery-charging', color: '#EC4899' },
    { id: 'c3', name: 'Fast Wireless Charger', category: 'cabang', weight: 15, percentage: 15, icon: 'zap', color: '#3B82F6' },
    { id: 'c4', name: 'Voucher Potongan Rp 250rb', category: 'cabang', weight: 20, percentage: 20, icon: 'tag', color: '#10B981' },
    { id: 'c5', name: 'Premium Case + Tempered Glass', category: 'cabang', weight: 25, percentage: 25, icon: 'shield', color: '#F59E0B' },
    { id: 'c6', name: 'Exclusive Merchandise IB', category: 'cabang', weight: 25, percentage: 25, icon: 'gift', color: '#6366F1' },
  ],
  winnerHistory: [],
  headerConfig: {
    title: 'IBGADGETSTORE',
    subtitle: 'LUCKY DRAW EXCLUSIVE',
    badgeText: 'EVENT RESMI & TERVERIFIKASI',
    logoSubtext: 'PREMIUM GADGET STORE',
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
