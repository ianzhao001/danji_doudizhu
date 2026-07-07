import { AudioClip, UIOpacity, Vec3, resources, sys, tween } from 'cc';
import { STORAGE_KEYS } from '../../../data/storage-keys';
import { saveSettings } from '../../../data/settingsStorage';
import type { FlowEvent } from '../../../flow/types';
import { cocosStorage } from '../../../runtime/cocos-storage';
import { pulseParams } from '../../animation-params';
import { decideCuePlayback } from '../../audio-gate';
import { RESOURCE_PATHS, cueAudioPath, type ResourcePath } from '../../asset-keys';
import { cueForFlowEvent, type CueId } from '../../event-cues';
import type { ToggleKey } from '../../settings-view';

const SETTINGS_KEY = STORAGE_KEYS.settings;

export function playCue(this: any, event: FlowEvent): void {
  const cue = cueForFlowEvent(event);
  if (!cue) return;
  const settings = this.settings;
  const decision = decideCuePlayback(settings, cue);
  const path = cueAudioPath(cue);
  if (decision.effect) this.playEffect(cue);
  if (decision.vibrate) this.vibrate();
  if (!decision.sound || !path || !this.audioSource) return;
  resources.load(path, AudioClip, (error, clip) => {
    if (!error && clip && this.audioSource && decideCuePlayback(this.settings, cue).sound) {
      this.audioSource.playOneShot(clip);
    }
  });
}

export function playEffect(this: any, cue: CueId): void {
  if (!this.uiRoot) return;
  const params = pulseParams(cue);
  if (!params) return;
  const target = cue === 'bomb' || cue === 'rocket' || cue === 'play' ? this.playAreaRoot ?? this.uiRoot : this.uiRoot;
  tween(target)
    .to(params.upMs / 1000, { scale: new Vec3(params.scaleUp, params.scaleUp, 1) })
    .to(params.downMs / 1000, { scale: new Vec3(1, 1, 1) })
    .start();
  if (cue === 'bomb' || cue === 'rocket') {
    this.renderEmphasis(cue === 'bomb' ? RESOURCE_PATHS.emphasisBomb : RESOURCE_PATHS.emphasisRocket, cue);
    const origin = target.position.clone();
    tween(target)
      .by(0.04, { position: new Vec3(5, 0, 0) })
      .by(0.08, { position: new Vec3(-10, 0, 0) })
      .by(0.04, { position: new Vec3(5, 0, 0) })
      .call(() => target.setPosition(origin))
      .start();
  }
}

export function renderEmphasis(this: any, path: ResourcePath, name: string): void {
  if (!this.uiRoot) return;
  const node = this.addSprite(path, 0, 8, 72, 72, this.uiRoot, `emphasis-${name}`);
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = 0;
  node.setScale(0.86, 0.86, 1);
  tween(node)
    .to(0.12, { scale: new Vec3(1.05, 1.05, 1) })
    .to(0.22, { scale: new Vec3(0.98, 0.98, 1) })
    .start();
  tween(opacity)
    .to(0.12, { opacity: 255 })
    .delay(0.24)
    .to(0.18, { opacity: 0 })
    .start();
}

export function toggleRuntimeSetting(this: any, key: ToggleKey): void {
  const next = toggleSetting(this.settings, key);
  try {
    saveSettings(cocosStorage(), SETTINGS_KEY, next);
    this.settings = next;
  } catch (error) {
    console.warn('saveSettings failed', error);
  }
  this.render();
}

export function vibrate(this: any): void {
  try {
    const navigatorLike = (globalThis as { navigator?: { vibrate?: (pattern: number | number[]) => boolean } }).navigator;
    if (navigatorLike?.vibrate) {
      navigatorLike.vibrate(30);
      return;
    }
    (sys as unknown as { vibrate?: () => void }).vibrate?.();
  } catch {
    // Vibration is optional across platforms; unsupported targets should stay silent.
  }
}
