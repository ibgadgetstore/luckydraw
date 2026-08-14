export type CategoryType = 'pusat' | 'cabang' | 'custom';
export type GameMode = 'wheel' | 'mystery' | 'slot';
export type ThemeMode = 'dark' | 'light';

export interface Prize {
  id: string;
  name: string;
  category: CategoryType;
  color?: string;
  iconType?: 'phone' | 'cash' | 'voucher' | 'wallet' | 'gift';
  stock?: number;
  percentage?: number; // Nilai persentase kemenangan (misal: 10 = 10%)
}

export interface WinnerRecord {
  id: string;
  timestamp: number;
  winnerName: string;
  ticketNumber?: string;
  prizeName: string;
  category: CategoryType;
  gameMode: GameMode;
}

export interface HeaderConfig {
  title: string;
  badge: string;
  subtitle: string;
  systemStatusText: string;
}
