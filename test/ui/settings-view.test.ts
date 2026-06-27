import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai/strategy';
import { defaultSettings } from '../../assets/scripts/data/settings';
import {
  deriveSettingsView,
  setDifficulty,
  toggleSetting,
} from '../../assets/scripts/ui/settings-view';

describe('M3-22 设置界面 VM', () => {
  it('defaultSettings 映射为固定顺序开关和 normal 难度', () => {
    expect(deriveSettingsView(defaultSettings())).toEqual({
      toggles: [
        { key: 'sound', on: true },
        { key: 'vibration', on: true },
        { key: 'animation', on: true },
      ],
      difficulty: AiLevel.Normal,
    });
  });

  it('toggleSetting 返回新对象，仅翻转目标开关', () => {
    const settings = defaultSettings();
    const next = toggleSetting(settings, 'sound');

    expect(next).not.toBe(settings);
    expect(next.sound).toBe(false);
    expect(settings.sound).toBe(true);
    expect(next).toMatchObject({
      version: settings.version,
      difficulty: settings.difficulty,
      vibration: settings.vibration,
      animation: settings.animation,
    });
  });

  it('setDifficulty 返回新对象，保持 version 与其他字段', () => {
    const settings = defaultSettings();
    const next = setDifficulty(settings, AiLevel.Hard);

    expect(next).not.toBe(settings);
    expect(next.difficulty).toBe(AiLevel.Hard);
    expect(settings.difficulty).toBe(AiLevel.Normal);
    expect(next.version).toBe(settings.version);
    expect(next.sound).toBe(settings.sound);
    expect(next.vibration).toBe(settings.vibration);
    expect(next.animation).toBe(settings.animation);
  });

  it('连续变更可组合且只改目标字段', () => {
    const settings = defaultSettings();
    const next = setDifficulty(toggleSetting(settings, 'vibration'), AiLevel.Simple);

    expect(next).toEqual({
      ...settings,
      difficulty: AiLevel.Simple,
      vibration: false,
    });
    expect(settings).toEqual(defaultSettings());
  });
});
