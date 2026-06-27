import type { Settings } from '../data/settings';
import type { AiLevel } from '../ai/strategy';

export type ToggleKey = 'sound' | 'vibration' | 'animation';

export interface SettingsView {
  toggles: { key: ToggleKey; on: boolean }[];
  difficulty: AiLevel;
}

const TOGGLE_KEYS: ToggleKey[] = ['sound', 'vibration', 'animation'];

export function deriveSettingsView(settings: Settings): SettingsView {
  return {
    toggles: TOGGLE_KEYS.map((key) => ({ key, on: settings[key] })),
    difficulty: settings.difficulty,
  };
}

export function toggleSetting(settings: Settings, key: ToggleKey): Settings {
  return {
    ...settings,
    [key]: !settings[key],
  };
}

export function setDifficulty(settings: Settings, level: AiLevel): Settings {
  return {
    ...settings,
    difficulty: level,
  };
}
