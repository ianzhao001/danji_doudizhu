import { describe, expect, it } from 'vitest';

import { createBidding, GamePhase, Side, type GameSnapshot, type Settlement, type TopPlay } from '../../assets/scripts/game';
import { recognize } from '../../assets/scripts/rules';
import { deriveScreenVM } from '../../assets/scripts/ui/screen-view';
import { cards } from '../rules/_util';

const layoutOpts = { containerWidth: 390, cardWidth: 40, liftOffset: 16 };
const top = (spec: string): TopPlay => ({ seat: 1, pattern: recognize(cards(spec))! });

function snapshot(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 2,
    top: top('3'),
    handCounts: [3, 3, 3],
    winner: null,
    viewerHand: cards('5 K 2'),
    ...overrides,
  };
}

function settlement(overrides: Partial<Settlement> = {}): Settlement {
  return { multiplier: 4, bombs: 1, spring: 'none', scores: [-2, -2, 4], ...overrides };
}

describe('screen view model', () => {
  it('derives playing screen pieces from snapshot', () => {
    const snap = snapshot();
    const selectedCards = cards('K');
    const vm = deriveScreenVM({
      snapshot: snap,
      heroSeat: 0,
      selectedCards,
      recentEvents: [],
      layoutOpts,
    });

    expect(vm.layout.playArea).toBeDefined();
    expect(vm.hand.length).toBe(3);
    expect(vm.actions.play).toBe(true);
    expect(vm.actions.pass).toBe(true);
    expect(vm.bidding).toBeUndefined();
    expect(vm.result).toBeUndefined();
    expect(vm.topBar.landlordSeat).toBe(2);
  });

  it('derives bidding view without snapshot', () => {
    const vm = deriveScreenVM({
      bidding: createBidding(0),
      heroSeat: 0,
      selectedCards: [],
      recentEvents: [],
      layoutOpts,
    });

    expect(vm.bidding).toBeDefined();
    expect(vm.hand).toEqual([]);
    expect(vm.actions).toEqual({ play: false, pass: false, hint: false });
  });

  it('derives settled result and topBar from explicit settlement', () => {
    const vm = deriveScreenVM({
      snapshot: snapshot({ phase: GamePhase.Settled, winner: Side.Landlord }),
      settlement: settlement(),
      heroSeat: 2,
      selectedCards: [],
      recentEvents: [],
      layoutOpts,
    });

    expect(vm.result?.resultText).toBe('胜利');
    expect(vm.topBar.multiplier).toBe(4);
    expect(vm.topBar.bombs).toBe(1);
  });

  it('returns an empty VM boundary without snapshot or bidding', () => {
    const vm = deriveScreenVM({
      heroSeat: 0,
      selectedCards: [],
      recentEvents: [],
      layoutOpts,
    });

    expect(vm.hand).toEqual([]);
    expect(vm.actions).toEqual({ play: false, pass: false, hint: false });
    expect(vm.bidding).toBeUndefined();
    expect(vm.result).toBeUndefined();
    expect(vm.topBar).toEqual({ multiplier: 1, bombs: 0, landlordSeat: 0 });
    expect(vm.layout.topBar).toBeDefined();
  });

  it('keeps topBar defaults for playing snapshots without settlement', () => {
    const vm = deriveScreenVM({
      snapshot: snapshot(),
      heroSeat: 0,
      selectedCards: [],
      recentEvents: [],
      layoutOpts,
    });

    expect(vm.topBar.multiplier).toBe(1);
    expect(vm.topBar.bombs).toBe(0);
  });

  it('does not mutate selectedCards', () => {
    const selectedCards = cards('K');
    const selectedBefore = selectedCards.map((card) => ({ ...card }));

    deriveScreenVM({
      snapshot: snapshot(),
      heroSeat: 0,
      selectedCards,
      recentEvents: [],
      layoutOpts,
    });

    expect(selectedCards).toEqual(selectedBefore);
  });
});
