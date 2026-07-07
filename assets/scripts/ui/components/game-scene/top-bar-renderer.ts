import { Color, Graphics, Sprite } from 'cc';
import type { TableRegions } from '../../table-layout';
import type { TableZones } from '../../table-zones';
import type { ToggleKey } from '../../settings-view';
import { RESOURCE_PATHS } from '../../asset-keys';
import { t } from '../../strings';
import { addUiTransform } from '../ui-helpers';
import { seatDisplayName } from './seat-display';

const GAME_TABLE_BACKGROUND_ASPECT = 1688 / 780;
const BRIGHT_PANEL_TEXT = new Color(108, 46, 76, 255);
const GAME_TEXT = {
  phaseBidding: t('phase.bidding'),
  phasePlaying: t('phase.playing'),
  phaseSettled: t('phase.settled'),
  phaseDisposed: t('phase.disposed'),
  landlordPending: t('game.landlordPending'),
  landlordPrefix: t('game.landlordPrefix'),
  multiplierPrefix: t('game.multiplierPrefix'),
  bombsPrefix: t('game.bombsPrefix'),
  handPrefix: t('game.handPrefix'),
  sound: t('settings.sound'),
  animation: t('settings.animation'),
  vibration: t('settings.vibration'),
  on: t('common.on'),
  off: t('common.off'),
};

function phaseText(phase: string): string {
  if (phase === 'bidding') return GAME_TEXT.phaseBidding;
  if (phase === 'playing') return GAME_TEXT.phasePlaying;
  if (phase === 'settled') return GAME_TEXT.phaseSettled;
  if (phase === 'disposed') return GAME_TEXT.phaseDisposed;
  return phase;
}

function compactToggleText(label: string, on: boolean): string {
  return label + (on ? GAME_TEXT.on : GAME_TEXT.off);
}

export function renderTopBar(this: any,
  phase: string,
  topBar: { multiplier: number; bombs: number; landlordSeat: number | null },
  handCount: number,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  const topY = Math.max(14, layout.topBar.y + layout.topBar.height * 0.52);
  const phasePos = this.screenPoint(canvas, 70, topY);
  const landlordPos = this.screenPoint(canvas, 178, topY);
  const multiplierPos = this.screenPoint(canvas, canvas.width - 265, topY);
  const bombsPos = this.screenPoint(canvas, canvas.width - 165, topY);
  const handPos = this.screenPoint(canvas, canvas.width - 68, topY);
  this.addSprite(RESOURCE_PATHS.badgeTimerV13, phasePos.x - 45, phasePos.y, 22, 22, this.uiRoot!, 'top-phase-badge');
  this.addSprite(RESOURCE_PATHS.seatNameplateV13, landlordPos.x, landlordPos.y, 92, 24, this.uiRoot!, 'top-landlord-nameplate', true);
  this.addSprite(RESOURCE_PATHS.badgeMultiplierV13, multiplierPos.x - 40, multiplierPos.y, 20, 20, this.uiRoot!, 'top-multiplier-badge');
  this.addSprite(RESOURCE_PATHS.badgeMultiplierV13, bombsPos.x - 40, bombsPos.y, 20, 20, this.uiRoot!, 'top-bombs-badge');
  this.addSprite(RESOURCE_PATHS.badgeTimerV13, handPos.x - 34, handPos.y, 20, 20, this.uiRoot!, 'top-hand-badge');
  this.addLabel(phaseText(phase), phasePos.x + 4, phasePos.y, 16, this.uiRoot!, 112, 24, 'top-phase', BRIGHT_PANEL_TEXT);
  this.addLabel(topBar.landlordSeat === null ? GAME_TEXT.landlordPending : `${GAME_TEXT.landlordPrefix}${seatDisplayName(topBar.landlordSeat)}`, landlordPos.x, landlordPos.y, 11, this.uiRoot!, 84, 20, 'top-landlord', BRIGHT_PANEL_TEXT);
  this.addLabel(`${GAME_TEXT.multiplierPrefix}${topBar.multiplier}`, multiplierPos.x + 4, multiplierPos.y, 11, this.uiRoot!, 74, 20, 'top-multiplier', BRIGHT_PANEL_TEXT);
  this.addLabel(`${GAME_TEXT.bombsPrefix}${topBar.bombs}`, bombsPos.x + 4, bombsPos.y, 11, this.uiRoot!, 74, 20, 'top-bombs', BRIGHT_PANEL_TEXT);
  this.addLabel(`${GAME_TEXT.handPrefix}${handCount}`, handPos.x + 2, handPos.y, 11, this.uiRoot!, 62, 20, 'top-hand-count', BRIGHT_PANEL_TEXT);
}

export function renderRuntimeSettings(this: any, layout: TableRegions, canvas: { width: number; height: number }): void {
  const settings = this.settings;
  const controls: { key: ToggleKey; label: string; on: boolean; fx: number }[] = [
    { key: 'sound', label: GAME_TEXT.sound, on: settings.sound, fx: 0.22 },
    { key: 'animation', label: GAME_TEXT.animation, on: settings.animation, fx: 0.5 },
    { key: 'vibration', label: GAME_TEXT.vibration, on: settings.vibration, fx: 0.78 },
  ];
  const landscape = this.isLandscape(canvas);
  const y = landscape
    ? Math.max(
        layout.opponentLeft.y + layout.opponentLeft.height + 10,
        layout.playArea.y - 13,
      )
    : layout.opponentLeft.y + layout.opponentLeft.height * 0.35;
  const landscapeXs = [canvas.width / 2 - 96, canvas.width / 2, canvas.width / 2 + 96];
  for (const control of controls) {
    const index = controls.indexOf(control);
    const x = landscape ? landscapeXs[index] : canvas.width * control.fx;
    const pos = this.screenPoint(canvas, x, y);
    this.addButton(
      compactToggleText(control.label, control.on),
      pos.x,
      pos.y,
      landscape ? 72 : 88,
      landscape ? 26 : 32,
      true,
      () => this.toggleRuntimeSetting(control.key),
      this.uiRoot!,
      `setting-${control.key}`,
    );
  }
}

export function renderPlaceholderBackground(this: any, canvas: { width: number; height: number }): void {
  if (this.background) this.background.node.active = false;
  const node = this.ensureNode('game-table-background-runtime', this.node);
  node.setSiblingIndex(0);
  node.setPosition(0, 0, 0);
  const width = Math.max(canvas.width, canvas.height * GAME_TABLE_BACKGROUND_ASPECT);
  const height = Math.max(canvas.height, canvas.width / GAME_TABLE_BACKGROUND_ASPECT);
  addUiTransform(node, width, height);
  node.getComponent(Graphics)?.clear();
  const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
  sprite.type = Sprite.Type.SIMPLE;
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  this.loadSprite(RESOURCE_PATHS.gameTableBgV13, sprite);
}

export function isLandscape(this: any, canvas: { width: number; height: number }): boolean {
  return canvas.width >= canvas.height;
}
