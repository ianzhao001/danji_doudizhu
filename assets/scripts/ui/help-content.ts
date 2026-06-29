export interface HelpSection {
  id: string;
  title: string;
  lines: string[];
}

const SECTIONS: HelpSection[] = [
  {
    id: 'patterns',
    title: '牌型',
    lines: [
      '支持单牌、对子、三张、三带一、三带二。',
      '顺子至少 5 张连续单牌，连对至少 3 对，连续部分不包含 2 和王。',
      '飞机至少 2 个连续三张，可不带、带等量单牌或等量对子。',
      '四带二可带两张单牌或两对，炸弹为四张同点数，火箭为小王和大王。',
    ],
  },
  {
    id: 'compare',
    title: '出牌比较',
    lines: [
      '普通牌型只有相同主牌型且张数兼容时才能比较大小。',
      '炸弹可以压非炸弹牌型，更大的炸弹可以压较小炸弹。',
      '火箭最大，可以压任意牌型。',
      '2 和王不能参与顺子、连对、飞机的连续部分。',
    ],
  },
  {
    id: 'bidding',
    title: '叫抢地主',
    lines: [
      '玩家依次选择叫地主或不叫，第一个叫地主者成为临时地主。',
      '其余玩家可抢地主，每抢一次倍数翻倍，抢者成为新的临时地主。',
      '临时地主被抢后可反抢，反抢同样翻倍。',
      '一轮无人再抢时最后的临时地主成为地主；无人叫地主则重新发牌。',
    ],
  },
  {
    id: 'scoring',
    title: '计分倍数',
    lines: [
      '最终倍数按底分来源连乘：叫抢倍数 × 炸弹/火箭倍数 × 春天倍数。',
      '每次炸弹或火箭使倍数翻倍。',
      '春天或反春天使倍数翻倍。',
      '地主先出完地主胜，任一农民先出完农民胜。',
    ],
  },
];

export function helpSections(): HelpSection[] {
  return SECTIONS.map((section) => ({ ...section, lines: section.lines.slice() }));
}
