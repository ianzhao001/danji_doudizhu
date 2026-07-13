import { AudioClip, UIOpacity, Vec3, resources, sys, tween } from 'cc';
import { STORAGE_KEYS } from '../../../data/storage-keys';
import { saveSettings } from '../../../data/settingsStorage';
import type { FlowEvent } from '../../../flow/types';
import { cocosStorage } from '../../../runtime/cocos-storage';
import { fxBurst, pulseParams } from '../../animation-params';
import { decideCuePlayback, vibrationPattern } from '../../audio-gate';
import { RESOURCE_PATHS, cueAudioPath, type ResourcePath } from '../../asset-keys';
import { cueForFlowEvent, type CueId } from '../../event-cues';
import type { ToggleKey } from '../../settings-view';

const SETTINGS_KEY = STORAGE_KEYS.settings;

export function playCue(this: any, event: FlowEvent): void {
  const cue = cueForFlowEvent(event);
  if (!cue) return;
  const settings = this.settings;
  const decision = decideCuePlayback(settings, cue);
  // v1.5 T-AUDIO-MAP:胜负音归 settled 单点分流(win cue 音频已退役,防双响)。
  const audioContext = event.type === 'settled' ? { heroWon: event.settlement.scores[0] > 0 } : undefined;
  const path = cueAudioPath(cue, audioContext);
  if (decision.effect) this.playEffect(cue);
  if (decision.vibrate) this.vibrate(cue);
  if (!decision.sound || !path || !this.audioSource) return;
  resources.load(path, AudioClip, (error, clip) => {
    if (!error && clip && this.audioSource && decideCuePlayback(this.settings, cue).sound) {
      this.audioSource.playOneShot(clip);
    }
  });
}

/** v1.5 P-BTN-FEEL/P-AUDIO-WIRE:UI 即时音(按钮点击/选牌),经 settings.sound 开关,与 cue 通道解耦。 */
export function playUiSound(this: any, path: ResourcePath): void {
  if (!this.settings?.sound || !this.audioSource) return;
  resources.load(path, AudioClip, (error, clip) => {
    if (!error && clip && this.audioSource && this.settings?.sound) {
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
  // v1.5 W3-B P-FX-PROGRAM:炸弹=stamp+冲击环+光斑×6+双轴抖动;火箭=stamp+拖尾升空+顶点星爆(spec 无抖动)。
  if (cue === 'bomb') {
    this.renderEmphasis(RESOURCE_PATHS.emphasisBomb, cue);
    this.renderBombBurst?.();
    const shake = fxBurst().shakeAmp;
    const origin = target.position.clone();
    tween(target)
      .by(0.04, { position: new Vec3(shake, -shake, 0) })
      .by(0.08, { position: new Vec3(-2 * shake, 2 * shake, 0) })
      .by(0.04, { position: new Vec3(shake, -shake, 0) })
      .call(() => target.setPosition(origin))
      .start();
  } else if (cue === 'rocket') {
    this.renderEmphasis(RESOURCE_PATHS.emphasisRocket, cue);
    this.renderRocketBurst?.();
  }
}

export function renderEmphasis(this: any, path: ResourcePath, name: string): void {
  if (!this.uiRoot) return;
  // v1.5 P-FX-LAYER:瞬时特效挂常驻 fx 层(render prune 豁免,修早剪 bug),tween 完成即自毁。
  const layer = this.ensureFxLayer();
  const node = this.addSprite(path, 0, 8, 72, 72, layer, `emphasis-${name}-${Date.now()}`);
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
    .call(() => {
      node.removeFromParent();
      node.destroy();
    })
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

export function vibrate(this: any, cue?: CueId): void {
  try {
    // v1.5 P-AUDIO-WIRE:震动分级消费 vibrationPattern(bomb 45 / rocket [30,40,80] / settled 20);
    // 未知/无 cue 沿用旧 30ms 兜底。
    const pattern = (cue ? vibrationPattern(cue) : null) ?? 30;
    const navigatorLike = (globalThis as { navigator?: { vibrate?: (pattern: number | number[]) => boolean } }).navigator;
    if (navigatorLike?.vibrate) {
      navigatorLike.vibrate(pattern);
      return;
    }
    (sys as unknown as { vibrate?: () => void }).vibrate?.();
  } catch {
    // Vibration is optional across platforms; unsupported targets should stay silent.
  }
}
