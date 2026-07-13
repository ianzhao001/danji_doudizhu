export interface PulseParams {
  scaleUp: number;
  upMs: number;
  downMs: number;
}

export interface FlyFromTo {
  fromY: number;
  toY: number;
  durationMs: number;
}

const PULSE_DURATION = { upMs: 100, downMs: 160 } as const;
const PULSE_SCALE: Record<string, number> = {
  bomb: 1.12,
  rocket: 1.12,
  deal: 1.04,
  play: 1.04,
};

export function pulseParams(cue: string): PulseParams | null {
  const scaleUp = PULSE_SCALE[cue];
  if (scaleUp === undefined) return null;
  return { scaleUp, ...PULSE_DURATION };
}

export function dealCardDelay(index: number, total: number): number {
  const safeIndex = Math.max(0, Math.floor(index));
  const safeTotal = Math.max(1, Math.floor(total));
  const stepMs = safeTotal > 17 ? 18 : 24;
  return safeIndex * stepMs;
}

export function playFlyFromTo(): FlyFromTo {
  return { fromY: -96, toY: 0, durationMs: 180 };
}

// ---- v1.5 W-JUICE 动效参数(纯常量函数·确定性·供 W3 编排消费,vitest 锁) ----

/** 出牌真飞行:x 线性、y 两段缓动抬 liftY 再落,带轻旋转与缩放入场。 */
export function playFlyArc(): { liftY: number; durationMs: number; rotateDeg: number; fromScale: number } {
  return { liftY: 46, durationMs: 220, rotateDeg: 4, fromScale: 0.9 };
}

/** 发牌飞行:自底牌 dock 中心飞至手牌位。 */
export function dealFlight(): { durationMs: number; fromScale: number } {
  return { durationMs: 180, fromScale: 0.85 };
}

/** 结算入场编排:scrim→面板→banner 回弹→明细→按钮 stagger;胜局彩带参数。 */
export function resultEntrance(): {
  scrimMs: number;
  panelMs: number;
  bannerDelayMs: number;
  bannerMs: number;
  detailDelayMs: number;
  detailFadeMs: number;
  springPopMs: number;
  buttonStaggerMs: number;
  buttonSlideMs: number;
  buttonFadeMs: number;
  confettiCount: number;
  confettiFallMs: number;
} {
  return {
    scrimMs: 120,
    panelMs: 180,
    bannerDelayMs: 120,
    bannerMs: 200,
    detailDelayMs: 260,
    detailFadeMs: 160,
    springPopMs: 200,
    buttonStaggerMs: 60,
    buttonSlideMs: 180,
    buttonFadeMs: 160,
    confettiCount: 14,
    confettiFallMs: 1600,
  };
}

/** 炸弹/火箭程序化爆点:光斑散射角度表(确定)、冲击环与抖动参数。 */
export function fxBurst(): {
  sparkAngles: number[];
  sparkDistance: number;
  ringScaleTo: number;
  shakeAmp: number;
  sparkMs: number;
  ringMs: number;
  sparkSizePx: number;
  ringSizePx: number;
  ringAlphaFrom: number;
} {
  return {
    sparkAngles: [15, 75, 135, 195, 255, 315],
    sparkDistance: 78,
    ringScaleTo: 1.6,
    shakeAmp: 6,
    sparkMs: 300,
    ringMs: 260,
    sparkSizePx: 30,
    ringSizePx: 96,
    ringAlphaFrom: 235,
  };
}

// ---- v1.5 W3-B rider 参数(涟漪/火箭爆点/胜局彩带星光·确定性·vitest 纯增量锁) ----

/** 按钮点击涟漪(fx-ring):尺寸基数=按钮 renderHeight,dia=base×sizeRatio。 */
export function buttonRipple(): { sizeRatio: number; scaleFrom: number; scaleTo: number; ms: number; alphaFrom: number } {
  return { sizeRatio: 1.9, scaleFrom: 0.55, scaleTo: 1.3, ms: 240, alphaFrom: 200 };
}

/** 火箭程序化爆点:拖尾升空(高度/时长/尺寸)+顶点星爆(数量/半径/时长/尺寸)。 */
export function rocketBurst(): {
  riseHeight: number;
  riseMs: number;
  trailWidth: number;
  trailHeight: number;
  starCount: number;
  starRadius: number;
  starMs: number;
  starSizePx: number;
} {
  return { riseHeight: 150, riseMs: 380, trailWidth: 36, trailHeight: 120, starCount: 4, starRadius: 46, starMs: 320, starSizePx: 26 };
}

/** 胜局彩带+星光:片尺寸/横摆/旋转/散布带宽比 + 星光脉冲;相位一律 index 确定,零随机。 */
export function resultWinFx(): {
  confettiSizePx: number;
  swayPx: number;
  rotateDeg: number;
  spreadRatio: number;
  starCount: number;
  starPulseMs: number;
  starScaleTo: number;
  starSizePx: number;
} {
  return { confettiSizePx: 22, swayPx: 26, rotateDeg: 50, spreadRatio: 0.86, starCount: 3, starPulseMs: 560, starScaleTo: 1.28, starSizePx: 34 };
}

/** 按钮按压反馈(SCALE 过渡)。 */
export function pressFeedback(): { scale: number; ms: number } {
  return { scale: 0.95, ms: 80 };
}

/** 场景转场黑幕:出场淡入黑 outMs,新场景淡出黑 inMs。 */
export function sceneFade(): { outMs: number; inMs: number } {
  return { outMs: 160, inMs: 180 };
}
