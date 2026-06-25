/**
 * 可注入、可设种子的随机源。相同种子复现同一序列，便于测试与复盘。
 */

export interface Rng {
  /** 返回 [0, 1) 的浮点数。 */
  next(): number;
}

/** mulberry32：32 位种子、确定性 PRNG。 */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next(): number {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}
