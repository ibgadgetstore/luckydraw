import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'database.sqlite');

export interface PrizeRow {
  id: string;
  name: string;
  category: string;
  iconType: string;
  color: string;
  percentage: number;
  isGrandPrize?: boolean;
}

export interface WinnerRow {
  id: string;
  prizeId: string;
  prizeName: string;
  category: string;
  timestamp: number;
  winnerName?: string;
}

export interface AppConfig {
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

class SQLiteStorageManager {
  private db: Database | null = null;
  private SQL: any = null;
  private isInitialized = false;

  public async init() {
    if (this.isInitialized && this.db) return;

    this.SQL = await initSqlJs();

    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const fileBuffer = fs.readFileSync(DB_FILE_PATH);
        this.db = new this.SQL.Database(fileBuffer);
      } catch (err) {
        console.warn('Failed to load existing SQLite file, creating fresh database:', err);
        this.db = new this.SQL.Database();
      }
    } else {
      this.db = new this.SQL.Database();
    }

    this.createTables();
    this.seedDefaultIfEmpty();

    // Ensure initial theme is light mode if it was previously unset
    const currentTheme = this.getSetting('theme');
    if (!currentTheme) {
      this.saveSetting('theme', 'light');
      this.persistToDisk();
    }

    this.isInitialized = true;
  }

  private createTables() {
    if (!this.db) return;

    // Table: prizes
    this.db.run(`
      CREATE TABLE IF NOT EXISTS prizes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        icon_type TEXT NOT NULL,
        color TEXT NOT NULL,
        percentage REAL NOT NULL,
        is_grand_prize INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0
      );
    `);

    // Table: winners
    this.db.run(`
      CREATE TABLE IF NOT EXISTS winners (
        id TEXT PRIMARY KEY,
        prize_id TEXT,
        prize_name TEXT NOT NULL,
        category TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        winner_name TEXT
      );
    `);

    // Table: app_settings
    this.db.run(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  private seedDefaultIfEmpty() {
    if (!this.db) return;

    const countRes = this.db.exec("SELECT COUNT(*) as total FROM prizes WHERE category = 'pusat'");
    const totalPusat = countRes[0]?.values[0]?.[0] || 0;

    if (totalPusat === 0) {
      const defaultPusat: PrizeRow[] = [
        { id: 'p-1', name: 'Free Android', category: 'pusat', iconType: 'phone', color: '#8B5CF6', percentage: 5 },
        { id: 'p-2', name: 'Uang Tunai 300K', category: 'pusat', iconType: 'cash', color: '#06B6D4', percentage: 10 },
        { id: 'p-3', name: 'Potongan Harga 200K', category: 'pusat', iconType: 'voucher', color: '#EC4899', percentage: 15 },
        { id: 'p-4', name: 'Shopeepay 50K', category: 'pusat', iconType: 'wallet', color: '#6366F1', percentage: 15 },
        { id: 'p-5', name: 'Uang Tunai 200K', category: 'pusat', iconType: 'cash', color: '#A78BFA', percentage: 10 },
        { id: 'p-6', name: 'Potongan Harga 300K', category: 'pusat', iconType: 'voucher', color: '#10B981', percentage: 10 },
        { id: 'p-7', name: 'Shopeepay 100K', category: 'pusat', iconType: 'wallet', color: '#D946EF', percentage: 10 },
        { id: 'p-8', name: 'Shopeepay 75K', category: 'pusat', iconType: 'wallet', color: '#14B8A6', percentage: 10 },
        { id: 'p-9', name: 'Uang Tunai 100K', category: 'pusat', iconType: 'cash', color: '#3B82F6', percentage: 15 },
      ];

      const defaultCabang: PrizeRow[] = [
        { id: 'c-1', name: 'Uang Tunai 300K', category: 'cabang', iconType: 'cash', color: '#06B6D4', percentage: 10 },
        { id: 'c-2', name: 'Potongan Harga 200K', category: 'cabang', iconType: 'voucher', color: '#EC4899', percentage: 15 },
        { id: 'c-3', name: 'Shopeepay 50K', category: 'cabang', iconType: 'wallet', color: '#6366F1', percentage: 15 },
        { id: 'c-4', name: 'Uang Tunai 200K', category: 'cabang', iconType: 'cash', color: '#A78BFA', percentage: 10 },
        { id: 'c-5', name: 'Potongan Harga 300K', category: 'cabang', iconType: 'voucher', color: '#10B981', percentage: 15 },
        { id: 'c-6', name: 'Shopeepay 100K', category: 'cabang', iconType: 'wallet', color: '#D946EF', percentage: 10 },
        { id: 'c-7', name: 'Shopeepay 75K', category: 'cabang', iconType: 'wallet', color: '#14B8A6', percentage: 10 },
        { id: 'c-8', name: 'Uang Tunai 100K', category: 'cabang', iconType: 'cash', color: '#3B82F6', percentage: 15 },
      ];

      this.savePrizes('pusat', defaultPusat);
      this.savePrizes('cabang', defaultCabang);

      const defaultHeader = {
        title: 'IBGADGETSTORE',
        badge: 'OFFICIAL LUCKY DRAW',
        subtitle: 'Sistem Undian Eksklusif • Hadiah Pusat & Hadiah Cabang',
        systemStatusText: 'SYSTEM READY',
      };

      this.saveSetting('headerConfig', JSON.stringify(defaultHeader));
      this.saveSetting('theme', 'light');
      this.saveSetting('removeOnWin', 'false');
      this.saveSetting('version', '1');
      this.saveSetting('lastUpdated', String(Date.now()));

      this.persistToDisk();
    }
  }

  public persistToDisk() {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_FILE_PATH, buffer);
    } catch (err) {
      console.error('Failed to write SQLite file to disk:', err);
    }
  }

  public getPrizes(category: 'pusat' | 'cabang'): PrizeRow[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(
      'SELECT id, name, category, icon_type, color, percentage, is_grand_prize FROM prizes WHERE category = :cat ORDER BY sort_order ASC'
    );
    stmt.bind({ ':cat': category });

    const prizes: PrizeRow[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      prizes.push({
        id: String(row.id),
        name: String(row.name),
        category: String(row.category),
        iconType: String(row.icon_type),
        color: String(row.color),
        percentage: Number(row.percentage),
        isGrandPrize: Boolean(row.is_grand_prize),
      });
    }
    stmt.free();
    return prizes;
  }

  public savePrizes(category: 'pusat' | 'cabang', prizes: PrizeRow[]) {
    if (!this.db) return;
    this.db.run('DELETE FROM prizes WHERE category = ?', [category]);

    prizes.forEach((p, idx) => {
      this.db?.run(
        `INSERT INTO prizes (id, name, category, icon_type, color, percentage, is_grand_prize, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id || `${category}-${Date.now()}-${idx}`,
          p.name,
          category,
          p.iconType || 'gift',
          p.color || '#8B5CF6',
          p.percentage || 0,
          p.isGrandPrize ? 1 : 0,
          idx,
        ]
      );
    });

    this.persistToDisk();
  }

  public getWinners(): WinnerRow[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(
      'SELECT id, prize_id, prize_name, category, timestamp, winner_name FROM winners ORDER BY timestamp DESC'
    );

    const winners: WinnerRow[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      winners.push({
        id: String(row.id),
        prizeId: String(row.prize_id || ''),
        prizeName: String(row.prize_name),
        category: String(row.category),
        timestamp: Number(row.timestamp),
        winnerName: row.winner_name ? String(row.winner_name) : undefined,
      });
    }
    stmt.free();
    return winners;
  }

  public saveWinners(winners: WinnerRow[]) {
    if (!this.db) return;
    this.db.run('DELETE FROM winners');

    winners.forEach((w) => {
      this.db?.run(
        `INSERT INTO winners (id, prize_id, prize_name, category, timestamp, winner_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [w.id, w.prizeId, w.prizeName, w.category, w.timestamp, w.winnerName || '']
      );
    });

    this.persistToDisk();
  }

  public getSetting(key: string): string | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT value FROM app_settings WHERE key = :k');
    stmt.bind({ ':k': key });
    let value: string | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      value = String(row.value);
    }
    stmt.free();
    return value;
  }

  public saveSetting(key: string, value: string) {
    if (!this.db) return;
    this.db.run(
      'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    );
    this.persistToDisk();
  }

  public getFullState() {
    const pusatPrizes = this.getPrizes('pusat');
    const cabangPrizes = this.getPrizes('cabang');
    const winnerHistory = this.getWinners();

    const headerConfigStr = this.getSetting('headerConfig');
    const headerConfig = headerConfigStr
      ? JSON.parse(headerConfigStr)
      : {
          title: 'IBGADGETSTORE',
          badge: 'OFFICIAL LUCKY DRAW',
          subtitle: 'Sistem Undian Eksklusif • Hadiah Pusat & Hadiah Cabang',
          systemStatusText: 'SYSTEM READY',
        };

    const theme = this.getSetting('theme') || 'light';
    const removeOnWin = this.getSetting('removeOnWin') === 'true';
    const version = Number(this.getSetting('version') || 1);
    const lastUpdated = Number(this.getSetting('lastUpdated') || Date.now());

    return {
      pusatPrizes,
      cabangPrizes,
      winnerHistory,
      headerConfig,
      theme,
      removeOnWin,
      version,
      lastUpdated,
    };
  }

  public updateState(updates: Record<string, any>) {
    if (Array.isArray(updates.pusatPrizes)) {
      this.savePrizes('pusat', updates.pusatPrizes);
    }
    if (Array.isArray(updates.cabangPrizes)) {
      this.savePrizes('cabang', updates.cabangPrizes);
    }
    if (Array.isArray(updates.winnerHistory)) {
      this.saveWinners(updates.winnerHistory);
    }
    if (updates.headerConfig && typeof updates.headerConfig === 'object') {
      this.saveSetting('headerConfig', JSON.stringify(updates.headerConfig));
    }
    if (typeof updates.theme === 'string') {
      this.saveSetting('theme', updates.theme);
    }
    if (typeof updates.removeOnWin === 'boolean') {
      this.saveSetting('removeOnWin', String(updates.removeOnWin));
    }

    const newVersion = Number(this.getSetting('version') || 1) + 1;
    const now = Date.now();
    this.saveSetting('version', String(newVersion));
    this.saveSetting('lastUpdated', String(now));

    return this.getFullState();
  }
}

export const sqliteDb = new SQLiteStorageManager();
