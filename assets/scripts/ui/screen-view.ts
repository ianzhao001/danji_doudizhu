/**
 * M3-01 整屏 VM 集成层。组合已有 UI 纯逻辑岛，保持 Cocos 组件侧变薄。
 */

import type { Card } from '../rules';
import type { BiddingState, GameSnapshot, SeatIndex, Settlement } from '../game';
import type { FlowEvent } from '../flow/types';
import { deriveActionButtons, type ActionButtonsState } from './action-buttons';
import { deriveBiddingView, type BiddingView } from './bidding-view';
import { layoutHandInteractive, type InteractiveSlot } from './hand-interaction';
import { deriveResultView, type ResultView } from './result-view';
import { tableLayout, type TableRegions } from './table-layout';

export interface ScreenVM {
  layout: TableRegions;
  hand: InteractiveSlot[];
  actions: ActionButtonsState;
  bidding?: BiddingView;
  result?: ResultView;
  topBar: { multiplier: number; bombs: number; landlordSeat: SeatIndex | null };
}

function deriveTopBar(args: {
  snapshot?: GameSnapshot;
  bidding?: BiddingState;
  settlement?: Settlement;
}): ScreenVM['topBar'] {
  const { snapshot, bidding, settlement } = args;
  if (settlement) {
    return {
      multiplier: settlement.multiplier,
      bombs: settlement.bombs,
      landlordSeat: snapshot?.landlord ?? null,
    };
  }
  if (snapshot) {
    return {
      multiplier: snapshot.bidMultiplier ?? 1,
      bombs: snapshot.bombsPlayed ?? 0,
      landlordSeat: snapshot.landlord,
    };
  }
  if (bidding) {
    return {
      multiplier: bidding.multiplier > 0 ? bidding.multiplier : 1,
      bombs: 0,
      landlordSeat: null,
    };
  }
  return { multiplier: 1, bombs: 0, landlordSeat: null };
}

function emptyActions(): ActionButtonsState {
  return { play: false, pass: false, hint: false };
}

export function deriveScreenVM(args: {
  snapshot?: GameSnapshot;
  bidding?: BiddingState;
  heroSeat: SeatIndex;
  selectedCards: Card[];
  recentEvents: FlowEvent[];
  layoutOpts: { containerWidth: number; containerHeight?: number; cardWidth: number; liftOffset: number };
  settlement?: Settlement;
  biddingHand?: Card[];
}): ScreenVM {
  const { snapshot, bidding, heroSeat, selectedCards, layoutOpts, settlement, biddingHand } = args;
  const hand = snapshot
    ? layoutHandInteractive({
        hand: snapshot.viewerHand ?? [],
        selected: selectedCards,
        ...layoutOpts,
      })
    : biddingHand
      ? layoutHandInteractive({
          hand: biddingHand,
          selected: [],
          ...layoutOpts,
        })
    : [];

  return {
    layout:
      layoutOpts.containerHeight === undefined
        ? tableLayout()
        : tableLayout(layoutOpts.containerWidth, layoutOpts.containerHeight),
    hand,
    actions: snapshot ? deriveActionButtons({ snapshot, selectedCards, viewerSeat: heroSeat }) : emptyActions(),
    bidding: bidding ? deriveBiddingView(bidding, heroSeat) : undefined,
    result: settlement ? deriveResultView({ settlement, landlord: snapshot?.landlord ?? 0, heroSeat }) : undefined,
    topBar: deriveTopBar({ snapshot, bidding, settlement }),
  };
}
