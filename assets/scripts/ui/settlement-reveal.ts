export interface SettlementHold {
  readonly remainingMs: number;
}

export interface SettlementRevealParams {
  readonly holdMs: number;
}

export interface SettlementHoldTick {
  readonly hold: SettlementHold;
  readonly justExpired: boolean;
}

export function beginSettlementHold(
  animation: boolean,
  params: SettlementRevealParams,
): SettlementHold {
  return { remainingMs: animation ? Math.max(0, params.holdMs) : 0 };
}

export function tickSettlementHold(
  hold: SettlementHold,
  deltaMs: number,
): SettlementHoldTick {
  const previous = Math.max(0, hold.remainingMs);
  const next = Math.max(0, previous - Math.max(0, deltaMs));
  return {
    hold: { remainingMs: next },
    justExpired: previous > 0 && next === 0,
  };
}

export function isHoldingSettlement(hold: SettlementHold): boolean {
  return hold.remainingMs > 0;
}
