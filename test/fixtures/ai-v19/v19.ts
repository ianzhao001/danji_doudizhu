/**
 * W-AI-R3 v1.9 冻结基线桶（sota2 · B0 立度量）。
 * 本目录是 v1.9 收版当刻 assets/scripts/ai 层的逐字节拷贝（仅 rules/game import 重定向），
 * 作竞技场 candidate-vs-v19 的旧引擎一侧。**任何人不得改动**——ai-v19-freeze.test.ts 以 sha256 钉死。
 * 由 coordination/scripts/w-ai-freeze-baseline.mjs 生成，冻结当刻跑一次。
 */
import { AiLevel, strategyFor, type AiStrategy } from './strategy';
import { chooseBidByLevel } from './bidding-levels';
import type { BidAction, BiddingState } from '../../../assets/scripts/game';
import type { Card } from '../../../assets/scripts/rules';

export type V19LevelName = 'simple' | 'normal' | 'hard';

function v19LevelOf(name: V19LevelName): AiLevel {
  switch (name) {
    case 'simple':
      return AiLevel.Simple;
    case 'normal':
      return AiLevel.Normal;
    case 'hard':
      return AiLevel.Hard;
    default: {
      const exhaustive: never = name;
      throw new Error(`unknown v19 level: ${String(exhaustive)}`);
    }
  }
}

export function v19StrategyByName(name: V19LevelName): AiStrategy {
  return strategyFor(v19LevelOf(name));
}

export function v19BidByName(hand: Card[], state: BiddingState, name: V19LevelName): BidAction {
  return chooseBidByLevel(hand, state, v19LevelOf(name));
}
