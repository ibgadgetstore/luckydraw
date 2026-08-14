import { Prize } from '../types';

/**
 * Memilih pemenang berdasarkan bobot/persentase kemenangan setiap hadiah.
 * Algoritma Weighted Random Selection.
 */
export function pickWeightedWinner(prizes: Prize[]): { prize: Prize; index: number } {
  if (prizes.length === 0) {
    throw new Error('Daftar hadiah kosong');
  }

  // Hitung total persentase / weight
  const weights = prizes.map((p) => Math.max(p.percentage ?? 10, 0.01));
  const totalWeight = weights.reduce((acc, curr) => acc + curr, 0);

  // Random point antara 0 sampai totalWeight
  const randomPoint = Math.random() * totalWeight;

  let cumulativeWeight = 0;
  for (let i = 0; i < prizes.length; i++) {
    cumulativeWeight += weights[i];
    if (randomPoint <= cumulativeWeight) {
      return { prize: prizes[i], index: i };
    }
  }

  // Fallback ke item terakhir
  return { prize: prizes[prizes.length - 1], index: prizes.length - 1 };
}

/**
 * Menghitung total persentase dari daftar hadiah.
 */
export function calculateTotalPercentage(prizes: Prize[]): number {
  const sum = prizes.reduce((acc, curr) => acc + (curr.percentage ?? 0), 0);
  return Math.round(sum * 100) / 100;
}

/**
 * Menyeimbangkan persentase semua hadiah agar totalnya tepat 100%.
 */
export function equalizePercentages(prizes: Prize[]): Prize[] {
  if (prizes.length === 0) return [];
  const equalValue = Math.floor((100 / prizes.length) * 10) / 10;
  const remainder = Math.round((100 - equalValue * prizes.length) * 10) / 10;

  return prizes.map((p, idx) => ({
    ...p,
    percentage: idx === 0 ? Math.round((equalValue + remainder) * 10) / 10 : equalValue,
  }));
}
