import { Graphics, Sprite } from 'cc';
import type { TableRegions } from '../../table-layout';
import type { TableZones } from '../../table-zones';
import type { ToggleKey } from '../../settings-view';
import { RESOURCE_PATHS } from '../../asset-keys';
import { t } from '../../strings';
import { THEME, addUiTransform, toColor } from '../ui-helpers';
import { seatDisplayName } from './seat-display';

const GAME_TABLE_BACKGROUND_ASPECT = 1688 / 780;
const BRIGHT_PANEL_TEXT = toColor(THEME.palette.brandDark);
const NAMEPLATE_TEXT = toColor({ r: 70, g: 25, b: 50, a: 255 });
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

interface PillItem {
  key: string;
  width: number;
}

interface PillLayout {
  width: number;
  itemX: Readonly<Record<string, number>>;
}

/** 内容盒是唯一几何来源：药丸只负责在内容并集外补呼吸，不再反推手写锚点。 */
function layoutPill(
  items: readonly PillItem[],
  gap = THEME.spacing.tight,
  padding = THEME.spacing.card,
): PillLayout {
  const contentWidth = items.reduce((sum, item) => sum + item.width, 0)
    + Math.max(0, items.length - 1) * gap;
  let cursor = -contentWidth / 2;
  const itemX: Record<string, number> = {};
  for (const item of items) {
    itemX[item.key] = cursor + item.width / 2;
    cursor += item.width + gap;
  }
  return { width: contentWidth + 2 * padding, itemX };
}

function hudTextWidth(text: string, role: 'action' | 'assistive', minimum: number): number {
  const glyphWidth = THEME.typography[role].size;
  return Math.max(minimum, Math.ceil(Array.from(text).length * glyphWidth * 1.05));
}

export function renderTopBar(this: any,
  phase: string,
  topBar: { multiplier: number; bombs: number; landlordSeat: number | null },
  handCount: number,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  const topY = layout.topBar.y + layout.topBar.height / 2;
  const edge = THEME.spacing.safe;
  const groupGap = THEME.spacing.default;
  const phaseLabel = phaseText(phase);
  const multiplierLabel = `${GAME_TEXT.multiplierPrefix}${topBar.multiplier}`;
  const bombsLabel = `${GAME_TEXT.bombsPrefix}${topBar.bombs}`;
  const handLabel = `${GAME_TEXT.handPrefix}${handCount}`;
  const phaseLabelWidth = hudTextWidth(phaseLabel, 'action', 64);
  const multiplierLabelWidth = hudTextWidth(multiplierLabel, 'assistive', 56);
  const bombsLabelWidth = hudTextWidth(bombsLabel, 'assistive', 56);
  const handLabelWidth = hudTextWidth(handLabel, 'assistive', 56);
  const leftPill = layoutPill([
    { key: 'timer', width: 22 },
    { key: 'phase', width: phaseLabelWidth },
  ]);
  const statsPill = layoutPill([
    { key: 'multiplier', width: multiplierLabelWidth },
    { key: 'bombs', width: bombsLabelWidth },
    { key: 'hand', width: handLabelWidth },
  ], THEME.spacing.default);
  const landlordWidth = 92;
  const leftPillScreenX = layout.topBar.x + edge + leftPill.width / 2;
  const landlordScreenX = leftPillScreenX + leftPill.width / 2 + groupGap + landlordWidth / 2;
  const statsPillScreenX = layout.topBar.x + layout.topBar.width - edge - statsPill.width / 2;
  const leftPillPos = this.screenPoint(canvas, leftPillScreenX, topY);
  const landlordPos = this.screenPoint(canvas, landlordScreenX, topY);
  const statsPillPos = this.screenPoint(canvas, statsPillScreenX, topY);
  const timerPos = this.screenPoint(canvas, leftPillScreenX + leftPill.itemX.timer, topY);
  const phasePos = this.screenPoint(canvas, leftPillScreenX + leftPill.itemX.phase, topY);
  const multiplierPos = this.screenPoint(canvas, statsPillScreenX + statsPill.itemX.multiplier, topY);
  const bombsPos = this.screenPoint(canvas, statsPillScreenX + statsPill.itemX.bombs, topY);
  const handPos = this.screenPoint(canvas, statsPillScreenX + statsPill.itemX.hand, topY);

  // v1.6 二次终审「举一反三」:顶栏 HUD 文字原本直接压在桌景照片上——灯笼/彩带/花枝密布,
  // 正是用户所指「会在元素上盖字的设计,不宜出现很多线条」;对比度实测也只有 3.96~4.06:1(门C,差 AA)。
  // 同屏的「地主X」早已有干净名牌底、一眼可读——照此给左右两组补 c1 象牙白净底板。
  // 药丸尺寸由内容盒并集 + 对称呼吸推出,盒中心恒等于药丸中心。
  const PILL_H = 26;
  this.addSprite(RESOURCE_PATHS.infoPillC1, leftPillPos.x, leftPillPos.y, leftPill.width, PILL_H,
    this.uiRoot!, 'top-phase-pill', true);
  this.addSprite(RESOURCE_PATHS.infoPillC1, statsPillPos.x, statsPillPos.y, statsPill.width, PILL_H,
    this.uiRoot!, 'top-stats-pill', true);

  this.addSpriteContain(RESOURCE_PATHS.countdownRingV19, timerPos.x, timerPos.y, 22, 22, this.uiRoot!, 'top-phase-badge');
  this.addSprite(RESOURCE_PATHS.seatNameplateC1, landlordPos.x, landlordPos.y, landlordWidth, 24, this.uiRoot!, 'top-landlord-nameplate', true);
  // 文字盒高度收进药丸/名牌净区(81.2% / 81.4%,门B 实测),长文案交 SHRINK 缩字号。
  this.addLabel(phaseLabel, phasePos.x, phasePos.y, 'action', this.uiRoot!, phaseLabelWidth, 20, 'top-phase', BRIGHT_PANEL_TEXT);
  this.addLabel(topBar.landlordSeat === null ? GAME_TEXT.landlordPending : `${GAME_TEXT.landlordPrefix}${seatDisplayName(topBar.landlordSeat)}`, landlordPos.x, landlordPos.y, 'assistive', this.uiRoot!, 80, 19, 'top-landlord', NAMEPLATE_TEXT);
  this.addLabel(multiplierLabel, multiplierPos.x, multiplierPos.y, 'assistive', this.uiRoot!, multiplierLabelWidth, 20, 'top-multiplier', BRIGHT_PANEL_TEXT);
  this.addLabel(bombsLabel, bombsPos.x, bombsPos.y, 'assistive', this.uiRoot!, bombsLabelWidth, 20, 'top-bombs', BRIGHT_PANEL_TEXT);
  this.addLabel(handLabel, handPos.x, handPos.y, 'assistive', this.uiRoot!, handLabelWidth, 20, 'top-hand-count', BRIGHT_PANEL_TEXT);
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
        layout.opponentLeft.y + layout.opponentLeft.height + THEME.spacing.card,
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
  this.loadSprite(RESOURCE_PATHS.gameTableBgC1, sprite);
}

export function isLandscape(this: any, canvas: { width: number; height: number }): boolean {
  return canvas.width >= canvas.height;
}
