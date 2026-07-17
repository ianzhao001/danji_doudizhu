import { Category } from '../rules/pattern';

/** Short user-facing label for every legal Dou Dizhu pattern category. */
export function patternLabel(category: Category): string {
  switch (category) {
    case Category.Single:
      return '单张';
    case Category.Pair:
      return '对子';
    case Category.Trips:
      return '三张';
    case Category.TripsSingle:
      return '三带一';
    case Category.TripsPair:
      return '三带一对';
    case Category.Straight:
      return '顺子';
    case Category.ConsecutivePairs:
      return '连对';
    case Category.Airplane:
      return '飞机';
    case Category.AirplaneSingles:
      return '飞机带单';
    case Category.AirplanePairs:
      return '飞机带对';
    case Category.FourPlusTwoSingles:
      return '四带二';
    case Category.FourPlusTwoPairs:
      return '四带两对';
    case Category.Bomb:
      return '炸弹';
    case Category.Rocket:
      return '王炸';
    default:
      throw new Error(`Unknown pattern category: ${category}`);
  }
}
