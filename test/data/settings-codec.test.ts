/**
 * M5-05 失败测试：本地设置编解码（架构种入·不可改）。
 * 当前 settingsCodec.ts 为桩（throw not implemented）→ 应先红。
 * 同时补齐 M5-03 评审意见 #4 的回归（非法布尔/旧 version 迁移）。
 */
import { describe, it, expect } from 'vitest';
import { serializeSettings, deserializeSettings } from '../../assets/scripts/data/settingsCodec';
import { defaultSettings, SETTINGS_VERSION, type Settings } from '../../assets/scripts/data/settings';
import { AiLevel } from '../../assets/scripts/ai';

describe('M5-05 本地设置编解码', () => {
  it('serialize→deserialize 往返：与原 Settings 深相等', () => {
    const s: Settings = { version: SETTINGS_VERSION, difficulty: AiLevel.Hard, sound: false, vibration: true, animation: false };
    expect(deserializeSettings(serializeSettings(s))).toEqual(s);
  });

  it('deserializeSettings 非法 JSON → defaultSettings（不抛错）', () => {
    expect(deserializeSettings('not json')).toEqual(defaultSettings());
  });

  it('deserializeSettings("{}" → 全默认', () => {
    expect(deserializeSettings('{}')).toEqual(defaultSettings());
  });

  it('非法布尔回默认：sound:"false" → sound === true', () => {
    const back = deserializeSettings('{"sound":"false"}');
    expect(back.sound).toBe(true);
  });

  it('旧/缺 version 迁到当前：{"version":0} → version === SETTINGS_VERSION', () => {
    const back = deserializeSettings('{"version":0}');
    expect(back.version).toBe(SETTINGS_VERSION);
  });

  it('非法 difficulty 字符串 → 回落默认 difficulty', () => {
    const back = deserializeSettings('{"difficulty":"godlike"}');
    expect(back.difficulty).toBe(defaultSettings().difficulty);
  });
});
