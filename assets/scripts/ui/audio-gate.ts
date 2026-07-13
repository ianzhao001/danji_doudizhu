import type { Settings } from '../data/settings';
import type { CueId } from './event-cues';

export interface CuePlaybackDecision {
  sound: boolean;
  effect: boolean;
  vibrate: boolean;
}

const EFFECT_CUES = new Set<CueId>(['deal', 'play', 'bomb', 'rocket']);
const VIBRATION_CUES = new Set<CueId>(['bomb', 'rocket', 'settled']);

/**
 * v1.5 T-AUDIO-MAP:震动分级(ms 或 pattern 数组)。
 * decideCuePlayback.vibrate 为 true 时由调用方取 pattern;非震动 cue 返回 null。
 */
export function vibrationPattern(cue: CueId): number | number[] | null {
  switch (cue) {
    case 'bomb':
      return 45;
    case 'rocket':
      return [30, 40, 80];
    case 'settled':
      return 20;
    default:
      return null;
  }
}

export function decideCuePlayback(settings: Settings, cue: CueId): CuePlaybackDecision {
  return {
    sound: settings.sound,
    effect: settings.animation && EFFECT_CUES.has(cue),
    vibrate: settings.vibration && VIBRATION_CUES.has(cue),
  };
}
