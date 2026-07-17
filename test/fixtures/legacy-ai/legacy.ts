/**
 * W-AI legacy 冻结基线桶（规划者直落 main · 2026-07-17 · sota2）。
 * 本目录是 W-AI 开波时 main（9f4d34a 后）ai 层的逐字节拷贝（仅 rules/game import 重定向），
 * 作竞技场 new-vs-legacy 的旧引擎一侧。**任何人不得改动**——legacy-freeze.test.ts 以 sha256 钉死。
 */
import { AiLevel, strategyFor, type AiStrategy } from './strategy';
import { chooseBidByLevel } from './bidding-levels';
import type { BidAction, BiddingState } from '../../../assets/scripts/game';
import type { Card } from '../../../assets/scripts/rules';

export type LegacyLevelName = 'simple' | 'normal' | 'hard';

function legacyLevelOf(name: LegacyLevelName): AiLevel {
  switch (name) {
    case 'simple':
      return AiLevel.Simple;
    case 'normal':
      return AiLevel.Normal;
    case 'hard':
      return AiLevel.Hard;
    default: {
      const exhaustive: never = name;
      throw new Error(`unknown legacy level: ${String(exhaustive)}`);
    }
  }
}

export function legacyStrategyByName(name: LegacyLevelName): AiStrategy {
  return strategyFor(legacyLevelOf(name));
}

export function legacyBidByName(hand: Card[], state: BiddingState, name: LegacyLevelName): BidAction {
  return chooseBidByLevel(hand, state, legacyLevelOf(name));
}
