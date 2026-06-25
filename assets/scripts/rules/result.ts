/**
 * 出牌合法性校验结果。
 */

import { Card } from './card';
import { HandPattern, recognize } from './pattern';
import { beats } from './compare';

export type RuleViolation = 'INVALID_PATTERN' | 'CANNOT_BEAT';

export interface RuleResult {
  ok: boolean;
  reason?: RuleViolation;
  /** 识别成功时附带牌型（即使 CANNOT_BEAT 也会带上）。 */
  pattern?: HandPattern;
}

/**
 * 校验一手牌是否可出。
 * - 非法牌型 → INVALID_PATTERN
 * - 有当前牌权且压不过 → CANNOT_BEAT
 * - 否则 ok。
 */
export function validatePlay(cards: Card[], current?: HandPattern | null): RuleResult {
  const pattern = recognize(cards);
  if (!pattern) return { ok: false, reason: 'INVALID_PATTERN' };
  if (current && !beats(pattern, current)) {
    return { ok: false, reason: 'CANNOT_BEAT', pattern };
  }
  return { ok: true, pattern };
}
