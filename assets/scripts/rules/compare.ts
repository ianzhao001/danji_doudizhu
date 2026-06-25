/**
 * 牌型比较：candidate 能否压过 current。
 * 火箭最大；炸弹压非炸弹、大炸弹压小炸弹；其余须同类同长，再比主点数；跨型不可比。
 */

import { Category, HandPattern } from './pattern';

export function beats(cand: HandPattern, cur: HandPattern): boolean {
  if (!cand || !cur) return false;

  // 火箭压一切（牌组只有一副，火箭对火箭不会发生）
  if (cand.category === Category.Rocket) return cur.category !== Category.Rocket;
  if (cur.category === Category.Rocket) return false;

  const candBomb = cand.category === Category.Bomb;
  const curBomb = cur.category === Category.Bomb;
  if (candBomb && !curBomb) return true; // 炸弹压非炸弹
  if (!candBomb && curBomb) return false; // 非炸弹压不过炸弹
  if (candBomb && curBomb) return cand.mainRank > cur.mainRank; // 大炸弹压小炸弹

  // 其余：必须同类、同张数，再比主点数
  if (cand.category !== cur.category) return false;
  if (cand.length !== cur.length) return false;
  return cand.mainRank > cur.mainRank;
}
