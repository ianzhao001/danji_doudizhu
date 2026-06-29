import { describe, it, expect } from 'vitest';
import { defaultSettings } from '../../assets/scripts/data/settings';
import { type FlowEvent } from '../../assets/scripts/flow';
import { type GameEvent, Side } from '../../assets/scripts/game';
import { Category, Rank, Suit } from '../../assets/scripts/rules';
import { decideCuePlayback } from '../../assets/scripts/ui/audio-gate';
import { pulseParams } from '../../assets/scripts/ui/animation-params';
import { CUE_IDS, type CueId, cueForFlowEvent, cueForGameEvent } from '../../assets/scripts/ui/event-cues';

const EXPECTED_CUE_IDS = [
  'play',
  'pass',
  'bomb',
  'rocket',
  'reset',
  'win',
  'deal',
  'bid',
  'redeal',
  'landlordDecided',
  'settled',
] as const satisfies readonly CueId[];

const CUE_ID_SET = new Set<CueId>(CUE_IDS);

const singlePattern = {
  category: Category.Single,
  mainRank: Rank.R3,
  length: 1,
  cards: [{ rank: Rank.R3, suit: Suit.Spade }],
};

const GAME_EVENTS: GameEvent[] = [
  { type: 'play', seat: 0, pattern: singlePattern },
  { type: 'pass', seat: 0 },
  { type: 'bomb', seat: 1 },
  { type: 'rocket', seat: 2 },
  { type: 'reset', leader: 1 },
  { type: 'win', seat: 0, side: Side.Landlord },
];

const FLOW_EVENTS: FlowEvent[] = [
  { type: 'deal' },
  { type: 'bid', action: { type: 'call', seat: 0 }, multiplier: 1 },
  { type: 'redeal', attempt: 1 },
  { type: 'landlordDecided', landlord: 0, bidMultiplier: 1 },
  { type: 'round', event: { type: 'bomb', seat: 1 } },
  { type: 'settled', settlement: { multiplier: 1, spring: 'none', bombs: 0, scores: [2, -1, -1] } },
];

describe('CueId consistency guard', () => {
  it('exports the complete producible CueId set', () => {
    expect(CUE_IDS).toEqual(EXPECTED_CUE_IDS);
  });

  it('maps every GameEvent type to a valid CueId', () => {
    expect(GAME_EVENTS.map(cueForGameEvent)).toEqual(['play', 'pass', 'bomb', 'rocket', 'reset', 'win']);
    for (const event of GAME_EVENTS) {
      expect(CUE_ID_SET.has(cueForGameEvent(event))).toBe(true);
    }
  });

  it('maps every FlowEvent type to a valid CueId and unwraps round events', () => {
    expect(FLOW_EVENTS.map(cueForFlowEvent)).toEqual(['deal', 'bid', 'redeal', 'landlordDecided', 'bomb', 'settled']);
    const cues: CueId[] = FLOW_EVENTS.map(cueForFlowEvent);
    expect(cues).toHaveLength(FLOW_EVENTS.length);
    for (const event of FLOW_EVENTS) {
      const cue = cueForFlowEvent(event);
      expect(cue).not.toBeNull();
      expect(CUE_ID_SET.has(cue)).toBe(true);
    }
  });

  it('audio-gate effect and vibration cue names are producible', () => {
    for (const cue of ['deal', 'play', 'bomb', 'rocket'] as const satisfies readonly CueId[]) {
      expect(decideCuePlayback(defaultSettings(), cue).effect).toBe(true);
    }
    expect(decideCuePlayback(defaultSettings(), 'bomb').vibrate).toBe(true);
    expect(decideCuePlayback(defaultSettings(), 'pass').effect).toBe(false);
  });

  it('animation pulse cue names are producible and non-pulse cues stay inert', () => {
    for (const cue of ['deal', 'play', 'bomb', 'rocket'] as const satisfies readonly CueId[]) {
      expect(pulseParams(cue)).not.toBeNull();
    }
    expect(pulseParams('pass')).toBeNull();
  });
});
