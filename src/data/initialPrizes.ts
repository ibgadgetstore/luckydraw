import { Prize } from '../types';

export const COLOR_PALETTE = [
  '#8B5CF6', // Soft Violet
  '#A78BFA', // Lavender Purple
  '#06B6D4', // Cyan Teal
  '#EC4899', // Rose Orchid
  '#3B82F6', // Royal Indigo Blue
  '#10B981', // Emerald Mint
  '#D946EF', // Fuchsia Magenta
  '#6366F1', // Deep Indigo
  '#14B8A6', // Jewel Teal
  '#F43F5E', // Vivid Rose
];

export const INITIAL_HADIAH_PUSAT: Prize[] = [
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

export const INITIAL_HADIAH_CABANG: Prize[] = [
  { id: 'c-1', name: 'Uang Tunai 300K', category: 'cabang', iconType: 'cash', color: '#06B6D4', percentage: 10 },
  { id: 'c-2', name: 'Potongan Harga 200K', category: 'cabang', iconType: 'voucher', color: '#EC4899', percentage: 15 },
  { id: 'c-3', name: 'Shopeepay 50K', category: 'cabang', iconType: 'wallet', color: '#6366F1', percentage: 15 },
  { id: 'c-4', name: 'Uang Tunai 200K', category: 'cabang', iconType: 'cash', color: '#A78BFA', percentage: 10 },
  { id: 'c-5', name: 'Potongan Harga 300K', category: 'cabang', iconType: 'voucher', color: '#10B981', percentage: 15 },
  { id: 'c-6', name: 'Shopeepay 100K', category: 'cabang', iconType: 'wallet', color: '#D946EF', percentage: 10 },
  { id: 'c-7', name: 'Shopeepay 75K', category: 'cabang', iconType: 'wallet', color: '#14B8A6', percentage: 10 },
  { id: 'c-8', name: 'Uang Tunai 100K', category: 'cabang', iconType: 'cash', color: '#3B82F6', percentage: 15 },
];

export const INITIAL_HEADER_CONFIG = {
  title: 'IBGADGETSTORE',
  badge: 'OFFICIAL LUCKY DRAW',
  subtitle: 'Sistem Undian Eksklusif • Hadiah Pusat & Hadiah Cabang',
  systemStatusText: 'SYSTEM READY',
};
