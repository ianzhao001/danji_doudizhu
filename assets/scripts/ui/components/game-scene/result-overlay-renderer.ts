import { BlockInputEvents, Color, director, UIOpacity } from 'cc';
import type { SeatIndex } from '../../../game';
import { RESOURCE_PATHS } from '../../asset-keys';
import { deriveScreenVM } from '../../screen-view';
import type { TableZones } from '../../table-zones';
import { addUiTransform, drawPanel } from '../ui-helpers';
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
const PANEL_FALLBACK = new Color(255, 237, 246, 238);
const SCORE_FALLBACK = new Color(255, 255, 255, 116);

export function renderResult(
  ctx: GameSceneRendererContext,
  result: ReturnType<typeof deriveScreenVM>['result'],
  handCounts: [number, number, number],
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (!result) return;
  const overlay = ctx.ensureNode('settlement-overlay-runtime', ctx.uiRoot);
  overlay.setPosition(0, 0, 0);
  addUiTransform(overlay, canvas.width, canvas.height);
  ctx.drawDimOverlay(overlay, canvas.width, canvas.height);
  if (!overlay.getComponent(BlockInputEvents)) overlay.addComponent(BlockInputEvents);

  const showcase = ctx.rectPoint(layout.settlementShowcase, canvas, 0.5, 0.5);
  const panel = ctx.ensureNode('settlement-panel-runtime', overlay);
  panel.setPosition(showcase.x, showcase.y, 0);
  panel.setScale(1, 1, 1);
  const opacity = panel.getComponent(UIOpacity) ?? panel.addComponent(UIOpacity);
  opacity.opacity = 255;
  const panelWidth = layout.settlementShowcase.width;
  const panelHeight = Math.max(layout.settlementShowcase.height, Math.min(230, Math.round(canvas.height * 0.6)));
  addUiTransform(panel, panelWidth, panelHeight);
  drawPanel(panel, panelWidth, panelHeight, PANEL_FALLBACK);

  const skin = ctx.addSprite(RESOURCE_PATHS.settlementPanelV13, 0, 0, panelWidth, panelHeight, panel, 'settlement-panel-skin', true);
  skin.setSiblingIndex(0);
  const bannerWidth = Math.min(panelWidth * 0.68, 300);
  const bannerHeight = Math.min(panelHeight * 0.22, 76);
  const banner = ctx.addSprite(
    result.resultText === '胜利' ? RESOURCE_PATHS.settlementBannerWinV13 : RESOURCE_PATHS.settlementBannerLoseV13,
    0,
    panelHeight * 0.26,
    bannerWidth,
    bannerHeight,
    panel,
    'result-banner',
  );
  banner.setSiblingIndex(1);
  ctx.addLabel(result.resultText, 0, panelHeight * 0.26, 30, panel, bannerWidth, bannerHeight, 'result-title', PANEL_TEXT);
  ctx.addLabel(`倍数 ×${result.multiplier}  炸弹 ${result.bombs}`, 0, panelHeight * 0.105, 18, panel, panelWidth - 60, 34, 'result-multiplier', PANEL_ACCENT);
  ctx.addLabel(result.springText || '本局结算', 0, panelHeight * 0.025, 16, panel, panelWidth - 80, 28, 'result-spring', PANEL_MUTED);
  if (result.springText) {
    ctx.addSprite(RESOURCE_PATHS.emphasisSpring, 100, panelHeight * 0.025, 30, 30, panel, 'result-spring-badge');
  }
  const scoreText = result.scores
    .map((row) => `${seatNameWithRole(row.seat, row.isLandlord)}  ${formatScore(row.score)}  余牌 ${handCounts[row.seat as SeatIndex] ?? 0}`)
    .join('\n');
  const scorePanel = ctx.ensureNode('result-score-panel', panel);
  scorePanel.setPosition(0, -panelHeight * 0.18, 0);
  const scorePanelWidth = panelWidth - 74;
  const scorePanelHeight = Math.min(54, panelHeight * 0.25);
  addUiTransform(scorePanel, scorePanelWidth, scorePanelHeight);
  drawPanel(scorePanel, scorePanelWidth, scorePanelHeight, SCORE_FALLBACK);
  ctx.addLabel(scoreText, 0, 0, 17, scorePanel, scorePanelWidth - 16, scorePanelHeight - 6, 'result-scores', PANEL_TEXT);

  const buttonY = -panelHeight * 0.41;
  ctx.addButton('再来一局', -70, buttonY, 112, 44, true, () => ctx.startGame(true), panel, 'result-new');
  ctx.addButton('返回大厅', 70, buttonY, 112, 44, true, () => director.loadScene('lobby'), panel, 'result-lobby');
  panel.setSiblingIndex(overlay.children.length - 1);
  overlay.setSiblingIndex(ctx.uiRoot.children.length - 1);
}

function formatScore(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}
