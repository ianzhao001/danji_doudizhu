import { BlockInputEvents, Node, director } from 'cc';
import { askQuit, cancelQuit, closeMenu, openMenu } from '../../pause-menu';
import { t } from '../../strings';
import type { TableRegions } from '../../table-layout';
import { THEME, addUiTransform, toColor } from '../ui-helpers';

const BRIGHT_PANEL_TEXT = toColor(THEME.palette.brandDark);
const BRIGHT_PANEL_MUTED = toColor(THEME.palette.textSecondary);
const GAME_TEXT = {
  pause: t('game.pause'),
  progressKept: t('game.progressKept'),
  sound: t('settings.sound'),
  animation: t('settings.animation'),
  vibration: t('settings.vibration'),
  on: t('common.on'),
  off: t('common.off'),
  continue: t('common.continue'),
  restartShort: t('common.restartShort'),
  exit: t('common.exit'),
  quitTitle: t('game.quitTitle'),
  quitHint: t('game.quitHint'),
  confirm: t('common.confirm'),
  cancel: t('common.cancel'),
};

function compactToggleText(label: string, on: boolean): string {
  return label + (on ? GAME_TEXT.on : GAME_TEXT.off);
}

export function renderPauseControl(this: any, layout: TableRegions, canvas: { width: number; height: number }): void {
  const screenY = Math.max(28, layout.topBar.y + layout.topBar.height * 0.52);
  const pos = this.screenPoint(canvas, canvas.width - 42, screenY);
  const label = this.addButton(
    GAME_TEXT.pause,
    pos.x,
    pos.y,
    64,
    30,
    true,
    () => this.openPauseMenu(),
    this.uiRoot!,
    'pause-open-button',
  );
  label.fontSize = THEME.typography.md;
  label.lineHeight = 20;
}

export function renderPauseOverlay(this: any, canvas: { width: number; height: number }): void {
  if (this.pauseState.stage === 'closed') {
    this.renderedPauseStage = 'closed';
    return;
  }

  const root = this.ensureNode('pause-overlay-runtime', this.uiRoot!);
  root.setPosition(0, 0, 0);
  addUiTransform(root, canvas.width, canvas.height);
  this.drawDimOverlay(root, canvas.width, canvas.height);
  if (!root.getComponent(BlockInputEvents)) root.addComponent(BlockInputEvents);

  const panelWidth = Math.min(320, Math.max(286, canvas.width - 56));
  const panelHeight = this.pauseState.stage === 'confirm-quit' ? 232 : 306;
  const panel = this.ensureNode('pause-panel', root);
  panel.setPosition(0, 12, 0);
  panel.setScale(1, 1, 1);
  addUiTransform(panel, panelWidth, panelHeight);
  this.drawPanelSkin(panel, panelWidth, panelHeight);

  const shouldAnimate = this.settings.animation && this.renderedPauseStage !== this.pauseState.stage;
  if (this.pauseState.stage === 'menu') this.renderPauseMenu(panel, panelWidth, panelHeight);
  else this.renderPauseConfirm(panel, panelWidth, panelHeight);
  if (shouldAnimate) this.animateScaleIn(panel, 0.96, 130);
  this.renderedPauseStage = this.pauseState.stage;
}

export function renderPauseMenu(this: any, panel: Node, panelWidth: number, panelHeight: number): void {
  this.addLabel(GAME_TEXT.pause, 0, panelHeight / 2 - 46, 26, panel, panelWidth - 48, 48, 'pause-title', BRIGHT_PANEL_TEXT);
  const hint = this.addLabel(GAME_TEXT.progressKept, 0, panelHeight / 2 - 82, 14, panel, panelWidth - 58, 30, 'pause-hint', BRIGHT_PANEL_MUTED);
  hint.color = BRIGHT_PANEL_MUTED;
  const buttonWidth = Math.min(88, Math.max(82, Math.floor((panelWidth - 56) / 3)));
  const buttonStep = buttonWidth + 8;
  const buttonHeight = 60;
  const leftX = -buttonStep;
  const rightX = buttonStep;
  this.addButton(compactToggleText(GAME_TEXT.sound, this.settings.sound), leftX, 20, buttonWidth, buttonHeight, true, () => this.toggleRuntimeSetting('sound'), panel, 'pause-setting-sound');
  this.addButton(compactToggleText(GAME_TEXT.animation, this.settings.animation), 0, 20, buttonWidth, buttonHeight, true, () => this.toggleRuntimeSetting('animation'), panel, 'pause-setting-animation');
  this.addButton(compactToggleText(GAME_TEXT.vibration, this.settings.vibration), rightX, 20, buttonWidth, buttonHeight, true, () => this.toggleRuntimeSetting('vibration'), panel, 'pause-setting-vibration');
  this.addButton(GAME_TEXT.continue, leftX, -58, buttonWidth, buttonHeight, true, () => this.closePauseMenu(), panel, 'pause-continue');
  this.addButton(GAME_TEXT.restartShort, 0, -58, buttonWidth, buttonHeight, true, () => this.restartFromPause(), panel, 'pause-restart');
  this.addButton(GAME_TEXT.exit, rightX, -58, buttonWidth, buttonHeight, true, () => this.askPauseQuit(), panel, 'pause-quit');
}

export function renderPauseConfirm(this: any, panel: Node, panelWidth: number, panelHeight: number): void {
  this.addLabel(
    GAME_TEXT.quitTitle,
    0,
    panelHeight / 2 - 48,
    THEME.typography.xl,
    panel,
    panelWidth - 48,
    48,
    'pause-confirm-title',
    BRIGHT_PANEL_TEXT,
  );
  const hint = this.addLabel(
    GAME_TEXT.quitHint,
    0,
    14,
    THEME.typography.md,
    panel,
    panelWidth - 58,
    36,
    'pause-confirm-hint',
    BRIGHT_PANEL_MUTED,
  );
  hint.color = BRIGHT_PANEL_MUTED;
  this.addButton(GAME_TEXT.confirm, -64, -64, 112, 60, true, () => director.loadScene('lobby'), panel, 'pause-confirm');
  this.addButton(GAME_TEXT.cancel, 64, -64, 112, 60, true, () => this.cancelPauseQuit(), panel, 'pause-cancel');
}

export function openPauseMenu(this: any): void {
  this.pauseState = openMenu(this.pauseState);
  this.runtime?.pause();
  this.render();
}

export function closePauseMenu(this: any): void {
  this.pauseState = closeMenu(this.pauseState);
  this.runtime?.resume();
  this.render();
}

export function askPauseQuit(this: any): void {
  this.pauseState = askQuit(this.pauseState);
  this.render();
}

export function cancelPauseQuit(this: any): void {
  this.pauseState = cancelQuit(this.pauseState);
  this.render();
}

export function restartFromPause(this: any): void {
  this.pauseState = closeMenu(this.pauseState);
  this.startGame(true);
}
