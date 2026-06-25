/**
 * game-core 单局状态机（出牌循环）。
 * 实现方任务：实现以下三个函数体，使 test/game/core.test.ts 转绿。
 * 规则见 coordination/tasks/M2-01-game-core.md。禁止 import `cc`，禁止改本文件签名。
 */

import { Deal } from '../rules';
import { RoundState, RoundAction, ApplyResult, GameSnapshot, SeatIndex } from './types';

const notImplemented = (): never => {
  throw new Error('not implemented');
};

/** 用发牌结果与指定地主创建 Playing 局：地主获底牌(17→20)，turn=地主，top=null。 */
export function createPlayingRound(deal: Deal, landlord: SeatIndex): RoundState {
  void deal;
  void landlord;
  return notImplemented();
}

/** 校验并应用动作；非法抛 IllegalActionError；返回新状态 + 事件序列（不可变更新）。 */
export function apply(state: RoundState, action: RoundAction): ApplyResult {
  void state;
  void action;
  return notImplemented();
}

/** 只读快照；viewer 给定时附其手牌，不泄露他人手牌。 */
export function snapshot(state: RoundState, viewer?: SeatIndex): GameSnapshot {
  void state;
  void viewer;
  return notImplemented();
}
