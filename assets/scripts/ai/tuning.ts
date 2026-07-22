export interface AiTuning {
  hardLeadShedWeight: number;
  pimcLeadBand: number;
  highCardSpendPressureMultiplier: number;
  highCardSpendBaseMultiplier: number;
  urgentThreshold: number;
  passUnits: Readonly<{
    landlord: number;
    farmer: number;
    highTopShift: number;
  }>;
}

function freezeTuning(tuning: AiTuning): AiTuning {
  return Object.freeze({
    ...tuning,
    passUnits: Object.freeze({ ...tuning.passUnits }),
  });
}

export const DEFAULT_TUNING: AiTuning = freezeTuning({
  hardLeadShedWeight: 20,
  pimcLeadBand: 200,
  highCardSpendPressureMultiplier: 7,
  highCardSpendBaseMultiplier: 3,
  urgentThreshold: 8,
  passUnits: {
    landlord: 4,
    farmer: 4,
    highTopShift: 0,
  },
});

let activeTuning = DEFAULT_TUNING;

export function getTuning(): AiTuning {
  return activeTuning;
}

/** 仅供离线参数搜索和测试注入；产品决策代码只读取 getTuning()。 */
export function __setTuningForOfflineSearch(tuning: AiTuning): void {
  activeTuning = tuning === DEFAULT_TUNING ? DEFAULT_TUNING : freezeTuning(tuning);
}
