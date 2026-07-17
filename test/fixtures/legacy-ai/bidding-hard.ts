/**
 * W-AUDIT-AI B2:困难档结构化判强。
 * 旧口径 thresholdFor(Hard)=1——一张高牌(≥2)就叫/抢,17 张几乎逢局必抢,
 * 烂手当地主 1v2 是「Hard 作地主胜率反转」(hard-depth.test.ts 曾登记)的直接成因。
 * 新口径:火箭/炸弹恒强;≥3 张控牌(2/王)恒强;恰 2 张控牌须配短手型(精确拆解 ≤8 手)。
 */
import { type Card } from '../../../assets/scripts/rules';
import { decompose } from './decompose';
import { evaluateHand } from './handStrength';

export function isHardStrongHand(hand: Card[]): boolean {
  const strength = evaluateHand(hand);
  if (strength.rockets > 0 || strength.bombs > 0) return true;
  if (strength.highCards >= 3) return true;
  if (strength.highCards >= 2 && decompose(hand).moveCount <= 8) return true;
  return false;
}
