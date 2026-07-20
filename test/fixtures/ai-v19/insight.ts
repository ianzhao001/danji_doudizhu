import { type Card, type HandPattern, type Move, recognize } from '../../../assets/scripts/rules';
import { bestHint } from './hintRank';
import { evaluateHand } from './handStrength';
import { canFinishInOneMove, finishingFollow } from './endgame';

export interface ActionInsight {
  recommended: Move | null;
  shouldPass: boolean;
  rationale: string;
  strengthScore: number;
}

function wholeHandMove(hand: Card[]): Move | null {
  const pattern = recognize(hand);
  return pattern ? { cards: hand.slice(), pattern } : null;
}

export function adviseAction(hand: Card[], top: HandPattern | null): ActionInsight {
  const strengthScore = evaluateHand(hand).score;
  if (hand.length === 0) {
    return { recommended: null, shouldPass: false, rationale: '手牌已空', strengthScore };
  }

  if (top === null) {
    if (canFinishInOneMove(hand)) {
      return {
        recommended: wholeHandMove(hand),
        shouldPass: false,
        rationale: '可一手出完',
        strengthScore,
      };
    }
    const recommended = bestHint(hand, null);
    return {
      recommended,
      shouldPass: false,
      rationale: recommended ? '先出小牌，尽量保留炸弹' : '暂无可出牌',
      strengthScore,
    };
  }

  const finish = finishingFollow(hand, top);
  if (finish) {
    return { recommended: finish, shouldPass: false, rationale: '可一手出完', strengthScore };
  }

  const recommended = bestHint(hand, top);
  if (!recommended) {
    return { recommended: null, shouldPass: true, rationale: '没有合适跟牌，建议过牌', strengthScore };
  }

  return { recommended, shouldPass: false, rationale: '用较小牌跟住，保留关键牌', strengthScore };
}
