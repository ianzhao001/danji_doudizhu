import { Side } from '../game';
import type { RecordEntry, RecordsState } from './records';

export interface StatsDigest {
  total: number;
  wins: number;
  losses: number;
  winRatePct: number;
  currentStreak: number;
  bestWinStreak: number;
  bestScore: number;
  worstScore: number;
  totalBombs: number;
  springCount: number;
  landlordRounds: number;
  landlordWins: number;
  farmerRounds: number;
  farmerWins: number;
}

function heroWon(entry: RecordEntry): boolean {
  const heroIsLandlord = entry.heroSeat === entry.landlord;
  return (
    (heroIsLandlord && entry.winner === Side.Landlord) ||
    (!heroIsLandlord && entry.winner === Side.Farmer)
  );
}

function emptyDigest(): StatsDigest {
  return {
    total: 0,
    wins: 0,
    losses: 0,
    winRatePct: 0,
    currentStreak: 0,
    bestWinStreak: 0,
    bestScore: 0,
    worstScore: 0,
    totalBombs: 0,
    springCount: 0,
    landlordRounds: 0,
    landlordWins: 0,
    farmerRounds: 0,
    farmerWins: 0,
  };
}

export function digestRecords(records: RecordsState): StatsDigest {
  const entries = records.entries;
  if (entries.length === 0) return emptyDigest();

  let wins = 0;
  let bestWinStreak = 0;
  let runningWinStreak = 0;
  let bestScore = entries[0].heroScore;
  let worstScore = entries[0].heroScore;
  let totalBombs = 0;
  let springCount = 0;
  let landlordRounds = 0;
  let landlordWins = 0;
  let farmerRounds = 0;
  let farmerWins = 0;

  for (const entry of entries) {
    const won = heroWon(entry);
    const heroIsLandlord = entry.heroSeat === entry.landlord;
    if (won) {
      wins += 1;
      runningWinStreak += 1;
      bestWinStreak = Math.max(bestWinStreak, runningWinStreak);
    } else {
      runningWinStreak = 0;
    }

    bestScore = Math.max(bestScore, entry.heroScore);
    worstScore = Math.min(worstScore, entry.heroScore);
    totalBombs += entry.bombs;
    if (entry.spring !== 'none') springCount += 1;

    if (heroIsLandlord) {
      landlordRounds += 1;
      if (won) landlordWins += 1;
    } else {
      farmerRounds += 1;
      if (won) farmerWins += 1;
    }
  }

  let currentStreak = 0;
  const latestWon = heroWon(entries[entries.length - 1]);
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (heroWon(entries[i]) !== latestWon) break;
    currentStreak += latestWon ? 1 : -1;
  }

  const total = entries.length;
  const losses = total - wins;
  return {
    total,
    wins,
    losses,
    winRatePct: Math.round((wins / total) * 100),
    currentStreak,
    bestWinStreak,
    bestScore,
    worstScore,
    totalBombs,
    springCount,
    landlordRounds,
    landlordWins,
    farmerRounds,
    farmerWins,
  };
}
