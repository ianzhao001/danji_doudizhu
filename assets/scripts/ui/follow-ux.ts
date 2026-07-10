/**
 * 跟牌交互派生：要不起 / 报单报双。纯函数，禁 `cc`。
 */

import { legalFollows } from '../rules';
import { GamePhase, type GameSnapshot, type SeatIndex } from '../game';

export interface SeatAlert {
  seat: SeatIndex;
  kind: 'lastOne' | 'lastTwo';
}

export interface FollowUx {
  mustPass: boolean;
  alerts: SeatAlert[];
}

const SEATS: SeatIndex[] = [0, 1, 2];

export function deriveFollowUx(args: { snapshot: GameSnapshot; viewerSeat?: SeatIndex }): FollowUx {
  const { snapshot } = args;
  const viewerSeat = args.viewerSeat ?? snapshot.turn;

  let mustPass = false;
  if (snapshot.turn === viewerSeat && snapshot.top !== null) {
    const hand = snapshot.viewerHand ?? [];
    mustPass = legalFollows(hand, snapshot.top.pattern).length === 0;
  }

  const alerts: SeatAlert[] = [];
  if (snapshot.phase === GamePhase.Playing && snapshot.winner === null) {
    snapshot.handCounts.forEach((count, index) => {
      if (count === 1) alerts.push({ seat: index as SeatIndex, kind: 'lastOne' });
      else if (count === 2) alerts.push({ seat: index as SeatIndex, kind: 'lastTwo' });
    });
  }

  return { mustPass, alerts };
}
