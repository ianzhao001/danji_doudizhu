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
}): ScreenVM {
  const { snapshot, bidding, heroSeat, selectedCards, layoutOpts, settlement } = args;
  const hand = snapshot
    ? layoutHandInteractive({
        hand: snapshot.viewerHand ?? [],
        selected: selectedCards,
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
    topBar: {
      multiplier: settlement?.multiplier ?? 1,
      bombs: settlement?.bombs ?? 0,
      landlordSeat: snapshot?.landlord ?? null,
    },
  };
}
