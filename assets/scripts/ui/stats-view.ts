import type { MatchStats } from '../data/stats';

export interface StatsView {
  rounds: number;
  wins: number;
  losses: number;
  winRatePct: number;
  asLandlord: number;
  landlordWins: number;
  asFarmer: number;
  farmerWins: number;
  netScore: number;
  netScoreLabel: string;
}

function scoreLabel(score: number): string {
  if (score > 0) return `+${score}`;
  return String(score);
}

export function deriveStatsView(stats: MatchStats): StatsView {
  const wins = stats.landlordWins + stats.farmerWins;
  const losses = stats.rounds - wins;
  const winRatePct = stats.rounds === 0 ? 0 : Math.round((wins / stats.rounds) * 100);

  return {
    rounds: stats.rounds,
    wins,
    losses,
    winRatePct,
    asLandlord: stats.asLandlord,
    landlordWins: stats.landlordWins,
    asFarmer: stats.asFarmer,
    farmerWins: stats.farmerWins,
    netScore: stats.netScore,
    netScoreLabel: scoreLabel(stats.netScore),
  };
}
