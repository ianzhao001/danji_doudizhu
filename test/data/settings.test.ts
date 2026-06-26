/**
 * M5-03 失败测试：本地设置纯数据层。架构种入，不可改。
 * 当前 settings.ts 为桩（throw not implemented）→ 全部应先红。
 */
import { describe, it, expect } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { defaultSettings, migrateSettings } from '../../assets/scripts/data/settings';

describe('M5-03 本地设置纯数据层', () => {
  it('defaultSettings 稳定默认 + version', () => {
    const d = defaultSettings();
    expect(d.difficulty).toBe(AiLevel.Normal);
    expect(d.sound).toBe(true);
    expect(d.vibration).toBe(true);
    expect(d.animation).toBe(true);
    expect(typeof d.version).toBe('number');
    expect(defaultSettings()).toEqual(d); // 稳定
  });

  it('migrateSettings({}) → 全默认', () => {
    expect(migrateSettings({})).toEqual(defaultSettings());
  });

  it('部分字段对象只补缺失、保留已有合法值', () => {
    const m = migrateSettings({ sound: false });
    expect(m.sound).toBe(false);
    expect(m.animation).toBe(true);
    expect(m.difficulty).toBe(defaultSettings().difficulty);
  });

  it('合法 difficulty 保留，非法回落默认', () => {
    expect(migrateSettings({ difficulty: AiLevel.Hard }).difficulty).toBe(AiLevel.Hard);
    expect(migrateSettings({ difficulty: 'bogus' }).difficulty).toBe(defaultSettings().difficulty);
  });

  it('非对象输入 → 全默认', () => {
    expect(migrateSettings(null)).toEqual(defaultSettings());
    expect(migrateSettings([1, 2])).toEqual(defaultSettings());
    expect(migrateSettings('x')).toEqual(defaultSettings());
  });

  it('migrateSettings(defaultSettings()) 幂等', () => {
    const d = defaultSettings();
    expect(migrateSettings(d)).toEqual(d);
  });
});
