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
  const handPos = this.screenPoint(canvas, canvas.width - 86, topY);

  // v1.6 二次终审「举一反三」:顶栏 HUD 文字原本直接压在桌景照片上——灯笼/彩带/花枝密布,
  // 正是用户所指「会在元素上盖字的设计,不宜出现很多线条」;对比度实测也只有 3.96~4.06:1(门C,差 AA)。
  // 同屏的「地主X」早已有干净名牌底、一眼可读——照此给左右两组补 v18 净底板(单一填充+一条细描边)。
  // 药丸尺寸由内容实测边界推出(徽标外缘…文字外缘 + 呼吸),不写死常量,随视口宽自适应。
  const PILL_H = 26;
  const phaseLabelW = 72;
  const leftFrom = phasePos.x - 56 - 7; // 阶段徽标左缘(22 宽,中心 -45)再留 7 呼吸
  const leftTo = phasePos.x + 4 + phaseLabelW / 2 + 7;
  this.addSprite(RESOURCE_PATHS.infoPillV18, (leftFrom + leftTo) / 2, phasePos.y, leftTo - leftFrom, PILL_H,
    this.uiRoot!, 'top-phase-pill', true);
  const rightFrom = multiplierPos.x - 50 - 8; // 倍数徽标左缘(20 宽,中心 -40)
  const rightTo = handPos.x + 5 + 29 + 8; // 手牌文字右缘(58 宽,中心 +5)
  this.addSprite(RESOURCE_PATHS.infoPillV18, (rightFrom + rightTo) / 2, handPos.y, rightTo - rightFrom, PILL_H,
    this.uiRoot!, 'top-stats-pill', true);

  this.addSprite(RESOURCE_PATHS.badgeTimerV13, phasePos.x - 45, phasePos.y, 22, 22, this.uiRoot!, 'top-phase-badge');
  // v1.6 PL-07:地主名牌换族;倍数/炸弹/手牌小徽标无对应新件,保留 v13 并在 KNOWN_LIMITATIONS 记口径。
  this.addSprite(RESOURCE_PATHS.seatNameplateV18, landlordPos.x, landlordPos.y, 92, 24, this.uiRoot!, 'top-landlord-nameplate', true);
  this.addSprite(RESOURCE_PATHS.badgeMultiplierV13, multiplierPos.x - 40, multiplierPos.y, 20, 20, this.uiRoot!, 'top-multiplier-badge');
  this.addSprite(RESOURCE_PATHS.badgeMultiplierV13, bombsPos.x - 40, bombsPos.y, 20, 20, this.uiRoot!, 'top-bombs-badge');
  this.addSprite(RESOURCE_PATHS.badgeTimerV13, handPos.x - 31, handPos.y, 20, 20, this.uiRoot!, 'top-hand-badge');
  // 文字盒高度收进药丸/名牌净区(81.2% / 81.4%,门B 实测),长文案交 SHRINK 缩字号。
  this.addLabel(phaseText(phase), phasePos.x + 4, phasePos.y, THEME.typography.md, this.uiRoot!, phaseLabelW, 20, 'top-phase', BRIGHT_PANEL_TEXT);
  this.addLabel(topBar.landlordSeat === null ? GAME_TEXT.landlordPending : `${GAME_TEXT.landlordPrefix}${seatDisplayName(topBar.landlordSeat)}`, landlordPos.x, landlordPos.y, THEME.typography.xs, this.uiRoot!, 84, 19, 'top-landlord', BRIGHT_PANEL_TEXT);
  this.addLabel(`${GAME_TEXT.multiplierPrefix}${topBar.multiplier}`, multiplierPos.x + 4, multiplierPos.y, THEME.typography.xs, this.uiRoot!, 74, 20, 'top-multiplier', BRIGHT_PANEL_TEXT);
  this.addLabel(`${GAME_TEXT.bombsPrefix}${topBar.bombs}`, bombsPos.x + 4, bombsPos.y, THEME.typography.xs, this.uiRoot!, 74, 20, 'top-bombs', BRIGHT_PANEL_TEXT);
  this.addLabel(`${GAME_TEXT.handPrefix}${handCount}`, handPos.x + 5, handPos.y, THEME.typography.xs, this.uiRoot!, 58, 20, 'top-hand-count', BRIGHT_PANEL_TEXT);
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
