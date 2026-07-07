/**
 * M3-00 叫抢视图模型。架构落桩——实现方实现函数体，使 test/ui/bidding-view.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-bidding-view-model.md。纯函数、确定性，禁止 import `cc`。
 */

import { type BiddingState, type SeatIndex } from '../game';

export interface BiddingButton {
  id: 'call' | 'grab' | 'pass';
  label: string;
  enabled: boolean;
}

export interface BiddingView {
  prompt: string;
  buttons: BiddingButton[];
}

function button(id: BiddingButton['id'], label: string, enabled: boolean): BiddingButton {
  return { id, label, enabled };
}

function seatLabel(seat: SeatIndex): string {
  if (seat === 0) return '你';
  if (seat === 1) return '右家';
  return '左家';
}

function promptForTurn(turn: SeatIndex, viewerSeat: SeatIndex, verb: string): string {
  return turn === viewerSeat ? `轮到你${verb}` : `等待${seatLabel(turn)}${verb}`;
}

export function deriveBiddingView(state: BiddingState, viewerSeat: SeatIndex): BiddingView {
  const enabled = state.turn === viewerSeat;

  if (state.phase === 'calling') {
    return {
      prompt: promptForTurn(state.turn, viewerSeat, '叫地主'),
      buttons: [
        button('call', '叫地主', enabled),
        button('pass', '不叫', enabled),
      ],
    };
  }

  if (state.phase === 'grabbing') {
    return {
      prompt: promptForTurn(state.turn, viewerSeat, '抢地主'),
      buttons: [
        button('grab', '抢', enabled),
        button('pass', '不抢', enabled),
      ],
    };
  }

  return {
    prompt: state.phase === 'done' ? '叫抢结束' : '重新发牌',
    buttons: [
      button('call', '叫地主', false),
      button('grab', '抢', false),
      button('pass', '不叫', false),
    ],
  };
}
