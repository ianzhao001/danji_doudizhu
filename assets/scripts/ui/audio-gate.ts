import type { Settings } from '../data/settings';
import type { CueId } from './event-cues';

export interface CuePlaybackDecision {
  sound: boolean;
  effect: boolean;
  vibrate: boolean;
}

const EFFECT_CUES = new Set<CueId>(['deal', 'play', 'bomb', 'rocket']);
const VIBRATION_CUES = new Set<CueId>(['bomb']);

export function decideCuePlayback(settings: Settings, cue: CueId): CuePlaybackDecision {
  return {
    sound: settings.sound,
    effect: settings.animation && EFFECT_CUES.has(cue),
    vibrate: settings.vibration && VIBRATION_CUES.has(cue),
  };
}
