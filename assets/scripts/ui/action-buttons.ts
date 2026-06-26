/**
 * M3-00 操作按钮状态模型（出牌/过牌/提示）。架构落桩——实现方实现函数体，使 test/ui/action-buttons.test.ts 转绿。
 * 规则见 coordination/tasks/M3-00-action-buttons.md。纯函数、确定性，禁止 import `cc`。
 * 复用 rules 的 validatePlay/legalFollows/enumerateMoves。
 */

import { type Card } from '../rules';
import { type GameSnapshot, type SeatIndex } from '../game';

export interface ActionButtonsState {
  play: boolean;
  pass: boolean;
  hint: boolean;
}

export function deriveActionButtons(args: {
  snapshot: GameSnapshot;
  selectedCards: Card[];
  viewerSeat?: SeatIndex;
}): ActionButtonsState {
  throw new Error('M3-00 action-buttons not implemented');
}
