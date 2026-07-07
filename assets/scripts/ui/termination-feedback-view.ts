import type { RuntimeTerminationReason } from '../flow/round-runtime';

export interface TerminationFeedbackArgs {
  phase: string;
  reason: RuntimeTerminationReason | null;
  alreadyNotified: boolean;
}

export interface TerminationFeedback {
  text: string;
}

export function deriveTerminationFeedback(args: TerminationFeedbackArgs): TerminationFeedback | null {
  if (args.alreadyNotified || args.phase !== 'disposed') return null;
  if (args.reason === 'redealExhausted') return { text: '重发次数耗尽，本局已终止' };
  if (args.reason === 'error') return { text: '对局发生内部错误，已终止' };
  return null;
}
