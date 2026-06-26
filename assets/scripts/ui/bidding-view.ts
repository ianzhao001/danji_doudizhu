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

export function deriveBiddingView(state: BiddingState, viewerSeat: SeatIndex): BiddingView {
  const enabled = state.turn === viewerSeat;

  if (state.phase === 'calling') {
    return {
      prompt: `请座位 ${state.turn + 1} 行动`,
      buttons: [
        button('call', '叫地主', enabled),
        button('pass', '不叫', enabled),
      ],
    };
  }

  if (state.phase === 'grabbing') {
    return {
      prompt: `请座位 ${state.turn + 1} 行动`,
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
