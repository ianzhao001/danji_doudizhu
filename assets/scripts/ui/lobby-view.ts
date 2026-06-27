import type { SaveSlot } from '../data/save';
import type { MatchStats } from '../data/stats';

export interface LobbyView {
  hasSavedGame: boolean;
  continueLabel: string;
  summary: {
    rounds: number;
    winRatePct: number;
    netScore: number;
  };
}

export function deriveLobbyView(args: { savedSlot: SaveSlot | null; stats: MatchStats }): LobbyView {
  const hasSavedGame = args.savedSlot !== null;
  const wins = args.stats.landlordWins + args.stats.farmerWins;

  return {
    hasSavedGame,
    continueLabel: hasSavedGame ? '继续对局' : '新对局',
    summary: {
      rounds: args.stats.rounds,
      winRatePct: args.stats.rounds === 0 ? 0 : Math.round((wins / args.stats.rounds) * 100),
      netScore: args.stats.netScore,
    },
  };
}
