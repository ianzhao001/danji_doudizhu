import { describe, expect, it } from 'vitest';

import { digestRecords, queryRecords } from '../../assets/scripts/data';
import {
  adviseAction,
  adviseBid,
  bestHint,
  bidConfidence,
  canFinishInOneMove,
  evaluateHand,
  finishingFollow,
  rankHints,
  trackPlayed,
} from '../../assets/scripts/ai';
import { buildTricks, decodeReplay, encodeReplay } from '../../assets/scripts/game';
import {
  askQuit,
  deriveAiThinking,
  deriveBiddingAdviceView,
  deriveCardMemoryView,
  deriveDifficultyPicker,
  deriveInsightView,
  deriveLastActions,
  deriveRecordsDetailView,
  deriveReplayView,
  deriveStatsDetailView,
  deriveStrengthMeter,
  deriveTurnTimer,
  helpSections,
  nextStep,
  pushToast,
  t,
  tickToasts,
  tutorialSteps,
} from '../../assets/scripts/ui';

describe('M6-I1 barrel exports', () => {
  it('exposes data modules added after the earlier barrel pass', () => {
    expect(typeof digestRecords).toBe('function');
    expect(typeof queryRecords).toBe('function');
  });

  it('exposes ai modules added after the earlier barrel pass', () => {
    for (const exported of [
      adviseAction,
      adviseBid,
      bestHint,
      bidConfidence,
      canFinishInOneMove,
      evaluateHand,
      finishingFollow,
      rankHints,
      trackPlayed,
    ]) {
      expect(typeof exported).toBe('function');
    }
  });

  it('exposes game replay helpers through the barrel', () => {
    expect(typeof buildTricks).toBe('function');
    expect(typeof encodeReplay).toBe('function');
    expect(typeof decodeReplay).toBe('function');
  });

  it('exposes ui view models and small helpers added in late batches', () => {
    for (const exported of [
      askQuit,
      deriveAiThinking,
      deriveBiddingAdviceView,
      deriveCardMemoryView,
      deriveDifficultyPicker,
      deriveInsightView,
      deriveLastActions,
      deriveRecordsDetailView,
      deriveReplayView,
      deriveStatsDetailView,
      deriveStrengthMeter,
      deriveTurnTimer,
      helpSections,
      nextStep,
      pushToast,
      t,
      tickToasts,
      tutorialSteps,
    ]) {
      expect(typeof exported).toBe('function');
    }
  });
});
