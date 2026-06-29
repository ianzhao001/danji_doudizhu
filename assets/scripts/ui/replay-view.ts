import type { ReplayPlay, ReplayTrick } from '../game/trick-replay';

export interface ReplayView {
  trickLabel: string;
  plays: string[];
  hasPrev: boolean;
  hasNext: boolean;
  progressLabel: string;
}

const KIND_LABEL: Record<ReplayPlay['kind'], string> = {
  play: '出牌',
  pass: '不要',
  bomb: '炸弹',
  rocket: '火箭',
};

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, Math.trunc(index)));
}

function playLabel(play: ReplayPlay): string {
  return `座位${play.seat} ${KIND_LABEL[play.kind]}`;
}

export function deriveReplayView(tricks: ReplayTrick[], index: number): ReplayView {
  if (tricks.length === 0) {
    return { trickLabel: '暂无回放', plays: [], hasPrev: false, hasNext: false, progressLabel: '0/0' };
  }

  const currentIndex = clampIndex(index, tricks.length);
  const trick = tricks[currentIndex];
  return {
    trickLabel: `第 ${currentIndex + 1} 墩`,
    plays: trick.plays.map(playLabel),
    hasPrev: currentIndex > 0,
    hasNext: currentIndex < tricks.length - 1,
    progressLabel: `${currentIndex + 1}/${tricks.length}`,
  };
}
