import { BlockInputEvents, Color, director, Graphics, Sprite } from 'cc';
import { RESOURCE_PATHS } from '../../asset-keys';
import { deriveScreenVM } from '../../screen-view';
import { addUiTransform } from '../ui-helpers';
import type { GameSceneRendererContext } from './seats-renderer';

function seatName(seat: number): string {
  if (seat === 0) return '你';
  if (seat === 1) return '左家';
  if (seat === 2) return '右家';
  return `座位${seat + 1}`;
}

function seatNameWithRole(seat: number, isLandlord: boolean): string {
  return `${seatName(seat)}${isLandlord ? '（地主）' : ''}`;
}

const PANEL_TEXT = new Color(108, 46, 76, 255);
const PANEL_MUTED = new Color(142, 88, 108, 235);
const PANEL_ACCENT = new Color(198, 68, 124, 255);

export function renderResult(
  ctx: GameSceneRendererContext,
  result: ReturnType<typeof deriveScreenVM>['result'],
  canvas: { width: number; height: number },
): void {
  if (!result) return;
  const overlay = ctx.ensureNode('settlement-overlay-runtime', ctx.uiRoot);
  overlay.setPosition(0, 0, 0);
  addUiTransform(overlay, canvas.width, canvas.height);
  ctx.drawDimOverlay(overlay, canvas.width, canvas.height);
  if (!overlay.getComponent(BlockInputEvents)) overlay.addComponent(BlockInputEvents);

  const panel = ctx.ensureNode('settlement-panel-runtime', overlay);
  panel.setPosition(0, Math.round(canvas.height * 0.005), 0);
  panel.setScale(1, 1, 1);
  const landscape = ctx.isLandscape(canvas);
  const panelWidth = landscape
    ? Math.min(360, Math.max(300, canvas.width * 0.42))
    : Math.min(330, Math.max(280, canvas.width - 60));
  const panelHeight = landscape
    ? Math.min(318, Math.max(278, canvas.height - 54))
    : Math.min(420, Math.max(360, canvas.height - 220));
  addUiTransform(panel, panelWidth, panelHeight);
  const sprite = panel.getComponent(Sprite) ?? panel.addComponent(Sprite);
  sprite.type = Sprite.Type.SIMPLE;
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  ctx.loadSprite(RESOURCE_PATHS.settlementBg, sprite);
  const fill = ctx.ensureNode('settlement-panel-fill', panel);
  const fillWidth = panelWidth - 44;
  const fillHeight = panelHeight - (landscape ? 92 : 120);
  fill.setPosition(0, landscape ? -panelHeight * 0.025 : -panelHeight * 0.045, 0);
  fill.setSiblingIndex(0);
  addUiTransform(fill, fillWidth, fillHeight);
  const fillGraphics = fill.getComponent(Graphics) ?? fill.addComponent(Graphics);
  fillGraphics.clear();
  fillGraphics.fillColor = new Color(255, 247, 226, 238);
  fillGraphics.roundRect(-fillWidth / 2, -fillHeight / 2, fillWidth, fillHeight, 18);
  fillGraphics.fill();
  ctx.addSprite(
    result.resultText === '胜利' ? RESOURCE_PATHS.settlementWinBadge : RESOURCE_PATHS.settlementLoseBadge,
    -106,
    panelHeight * 0.35,
    58,
    58,
    panel,
    'result-outcome-badge',
  );
  ctx.addLabel(result.resultText, 8, panelHeight * 0.36, 34, panel, 220, 72, 'result-title', PANEL_TEXT);
  ctx.addLabel(`倍数 ×${result.multiplier}  炸弹 ${result.bombs}`, 0, panelHeight * 0.22, 20, panel, 240, 40, 'result-multiplier', PANEL_ACCENT);
  ctx.addLabel(result.springText || '本局结算', 0, panelHeight * 0.12, 18, panel, 240, 40, 'result-spring', PANEL_MUTED);
  if (result.springText) {
    ctx.addSprite(RESOURCE_PATHS.emphasisSpring, 110, panelHeight * 0.12, 34, 34, panel, 'result-spring-badge');
  }
  const scoresHeight = landscape ? Math.min(98, panelHeight * 0.31) : 112;
  const buttonY = landscape ? -panelHeight * 0.31 : -panelHeight * 0.37;
  ctx.addLabel(
    result.scores.map((row) => `${seatNameWithRole(row.seat, row.isLandlord)}: ${row.score}`).join('\n'),
    0,
    landscape ? -panelHeight * 0.075 : -panelHeight * 0.08,
    18,
    panel,
    280,
    scoresHeight,
    'result-scores',
    PANEL_TEXT,
  );
  ctx.addButton('再来一局', -74, buttonY, 116, 42, true, () => ctx.startGame(true), panel, 'result-new');
  ctx.addButton('返回大厅', 74, buttonY, 116, 42, true, () => director.loadScene('lobby'), panel, 'result-lobby');
  if (ctx.settings.animation) ctx.animateScaleIn(panel, 0.92, 180);
  panel.setSiblingIndex(overlay.children.length - 1);
  overlay.setSiblingIndex(ctx.uiRoot.children.length - 1);
}
