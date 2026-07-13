/**
 * M6-L1 失败测试：audio-gate 决策纯函数（架构种入·不可改）。当前 audio-gate.ts 未实现 → 应先红。
 * 规则见 coordination/tasks/M6-L1-audio-gate.md。纯函数、确定性、禁止 import `cc`。
 *
 * decideCuePlayback(settings, cue) → { sound, effect, vibrate }：
 * - sound=false → 任意 cue 的 sound 都为 false（静音）
 * - animation=false → 任意 cue 的 effect 都为 false（无动效）
 * - vibration=false → 任意 cue 的 vibrate 都为 false（不震）
 * - 全开 + bomb → { sound:true, effect:true, vibrate:true }
 * - pass/win 等「无动效 cue」即便 animation=true 也返回 effect:false（仅音效，无整屏动效）
 *   （动效 cue 集合 = deal/play/bomb/rocket，与 game-scene-skeleton.playEffect 现状对齐）
 */
import { describe, it, expect } from 'vitest';
import { decideCuePlayback } from '../../assets/scripts/ui/audio-gate';
import { defaultSettings, type Settings } from '../../assets/scripts/data/settings';

const ALL_CUES = ['deal', 'play', 'pass', 'bomb', 'rocket', 'win', 'settled', 'landlordDecided', 'redeal', 'bid', 'reset'] as const;
type Cue = (typeof ALL_CUES)[number];

function settingsWith(partial: Partial<Settings>): Settings {
  return { ...defaultSettings(), ...partial };
}

describe('M6-L1 audio-gate 决策', () => {
  it('sound=false 时任意 cue 全静音', () => {
    for (const cue of ALL_CUES) {
      expect(decideCuePlayback(settingsWith({ sound: false }), cue).sound).toBe(false);
    }
  });

  it('animation=false 时任意 cue 无动效', () => {
    for (const cue of ALL_CUES) {
      expect(decideCuePlayback(settingsWith({ animation: false }), cue).effect).toBe(false);
    }
  });

  it('vibration=false 时任意 cue 不震', () => {
    for (const cue of ALL_CUES) {
      expect(decideCuePlayback(settingsWith({ vibration: false }), cue).vibrate).toBe(false);
    }
  });

  it('全开 + bomb 触发 sound+effect+vibrate', () => {
    const r = decideCuePlayback(defaultSettings(), 'bomb');
    expect(r).toEqual({ sound: true, effect: true, vibrate: true });
  });

  it('动效 cue 集合（deal/play/bomb/rocket）在全开下 effect=true，其余 cue effect=false', () => {
    const EFFECT_CUES: Cue[] = ['deal', 'play', 'bomb', 'rocket'];
    for (const cue of ALL_CUES) {
      const r = decideCuePlayback(defaultSettings(), cue);
      expect(r.effect).toBe(EFFECT_CUES.includes(cue));
    }
  });

  it('确定性：同 settings+cue 两次结果深相等', () => {
    const s = settingsWith({ sound: true, animation: true, vibration: false });
    for (const cue of ALL_CUES) {
      expect(decideCuePlayback(s, cue)).toEqual(decideCuePlayback(s, cue));
    }
  });
});

// ---- v1.5 T-AUDIO-MAP 增量:vibrationPattern 分级 + VIBRATION_CUES 扩展(纯增量,不改上方既有断言) ----
import { vibrationPattern } from '../../assets/scripts/ui/audio-gate';

describe('v1.5 vibrationPattern 震动分级', () => {
  it('bomb=45 / rocket=[30,40,80] / settled=20 / 其余 null', () => {
    expect(vibrationPattern('bomb')).toBe(45);
    expect(vibrationPattern('rocket')).toEqual([30, 40, 80]);
    expect(vibrationPattern('settled')).toBe(20);
    expect(vibrationPattern('play')).toBeNull();
    expect(vibrationPattern('deal')).toBeNull();
    expect(vibrationPattern('win')).toBeNull();
  });

  it('扩展后的 VIBRATION_CUES 语义:vibration 开 + rocket/settled 触发 vibrate', () => {
    const on = { sound: true, vibration: true, animation: true, difficulty: 'simple' } as Parameters<typeof decideCuePlayback>[0];
    expect(decideCuePlayback(on, 'rocket').vibrate).toBe(true);
    expect(decideCuePlayback(on, 'settled').vibrate).toBe(true);
    expect(decideCuePlayback(on, 'play').vibrate).toBe(false);
  });

  it('确定性:vibrationPattern 两次调用深相等', () => {
    expect(vibrationPattern('rocket')).toEqual(vibrationPattern('rocket'));
  });
});
