/**
 * T-VIEW-SEAT 改种（规划者·2026-07-06）：v1.2 P-G7 逆时针座位映射后，
 * 下家（offset 1）在【右】、上家（offset 2）在【左】——label 期望随 seat-display 语义翻转。
 * 今日红因：ai-thinking-view.ts 仍用旧映射（offset 1=左家）。
 */
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

  it('is active on AI turn with seat label（下家 offset1 = 右家）', () => {
    expect(deriveAiThinking(1, 0, 'playing', 600)).toEqual({
      active: true,
      seat: 1,
      label: 'AI 右家思考中',
      dots: 2,
    });
  });

  it('labels relative to hero seat（offset2 = 左家·逆时针）', () => {
    expect(deriveAiThinking(2, 0, 'bidding', 0).label).toBe('AI 左家思考中');
    expect(deriveAiThinking(0, 1, 'bidding', 0).label).toBe('AI 左家思考中');
    expect(deriveAiThinking(2, 1, 'bidding', 0).label).toBe('AI 右家思考中');
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
