/** sota2-R4 B2 AI 决策诊断旁路。时钟由安装方注入，模块本身不读取系统时基。 */

import type { SeatIndex } from '../game';

export interface AiDecisionDraft {
  seat: SeatIndex;
  path: string;
  topK?: { move: string; score: number }[];
  voteGap?: number;
  worlds?: number;
  elapsedMs?: number;
}

export interface DecisionSink {
  publish(draft: AiDecisionDraft): void;
  now?: () => number;
}

let installedSink: DecisionSink | null = null;

export function installDecisionSink(sink: DecisionSink): void {
  installedSink = sink;
}

export function uninstallDecisionSink(): void {
  installedSink = null;
}

export function hasDecisionSink(): boolean {
  return installedSink !== null;
}

export function publishDecision(draft: AiDecisionDraft): void {
  try {
    installedSink?.publish(draft);
  } catch {
    // 诊断旁路不得影响 AI 的正常决策。
  }
}

export function decisionNow(): number | null {
  try {
    const value = installedSink?.now?.();
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
