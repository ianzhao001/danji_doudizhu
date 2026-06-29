import { describe, expect, it } from 'vitest';
import { deriveAiThinking } from '../../assets/scripts/ui/ai-thinking-view';

describe('deriveAiThinking', () => {
  it('is inactive on hero turn', () => {
    expect(deriveAiThinking(0, 0, 'playing', 0)).toEqual({
      active: false,
      seat: null,
      label: '',
      dots: 0,
    });
  });

  it('is active on AI turn with seat label', () => {
    expect(deriveAiThinking(1, 0, 'playing', 600)).toEqual({
      active: true,
      seat: 1,
      label: 'AI 左家思考中',
      dots: 2,
    });
  });

  it('labels the right AI relative to hero seat', () => {
    expect(deriveAiThinking(2, 0, 'bidding', 0).label).toBe('AI 右家思考中');
    expect(deriveAiThinking(0, 1, 'bidding', 0).label).toBe('AI 右家思考中');
  });

  it('is inactive after settled', () => {
    expect(deriveAiThinking(1, 0, 'settled', 900).active).toBe(false);
  });

  it('cycles dots from 0 to 3', () => {
    expect([0, 299, 300, 899, 900, 1199, 1200].map((ms) => deriveAiThinking(1, 0, 'playing', ms).dots)).toEqual([
      0,
      0,
      1,
      2,
      3,
      3,
      0,
    ]);
  });
});
