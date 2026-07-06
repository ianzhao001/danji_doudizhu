/**
 * M4 难度 AI 接口契约（架构维护——实现方只读不改）。
 * 引擎无关，禁止 import `cc`。三档策略实现见 ai/levels/{simple,normal,hard}.ts，
 * 由 M4-01/02/03 各自分支实现；本文件仅定义难度枚举、策略签名与分派。
 */

import type { Rng } from '../rules';
import type { GameEvent, GameSnapshot, RoundAction } from '../game';
import { simpleStrategy } from './levels/simple';
import { normalStrategy } from './levels/normal';
import { hardStrategy } from './levels/hard';

/** AI 难度档位。 */
export enum AiLevel {
  Simple = 'simple',
  Normal = 'normal',
  Hard = 'hard',
}

/**
 * 难度策略：基于只读 GameSnapshot 与可注入 Rng 产出一个合法 RoundAction。
 * 与基线 chooseAction 同形，便于 flow 后续按难度替换出牌决策。
 */
export type AiStrategy = (snapshot: GameSnapshot, rng: Rng, history?: GameEvent[]) => RoundAction;

/** 按难度返回对应策略函数。 */
export function strategyFor(level: AiLevel): AiStrategy {
  switch (level) {
    case AiLevel.Simple:
      return simpleStrategy;
    case AiLevel.Normal:
      return normalStrategy;
    case AiLevel.Hard:
      return hardStrategy;
    default: {
      const exhaustive: never = level;
      throw new Error(`unknown AiLevel: ${String(exhaustive)}`);
    }
  }
}

/** 便捷分派：按难度直接对快照产出动作。 */
export function chooseActionByLevel(
  snapshot: GameSnapshot,
  rng: Rng,
  level: AiLevel,
): RoundAction {
  return strategyFor(level)(snapshot, rng);
}
