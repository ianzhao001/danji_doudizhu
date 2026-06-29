import type { ActionInsight } from '../ai/insight';

export interface InsightView {
  text: string;
  isPass: boolean;
  emphasize: boolean;
}

export function deriveInsightView(insight: ActionInsight): InsightView {
  const hasRecommendation = insight.recommended !== null;
  const text = insight.shouldPass ? '建议过牌' : hasRecommendation ? insight.rationale : '';
  return {
    text,
    isPass: insight.shouldPass,
    emphasize: insight.strengthScore >= 67,
  };
}
