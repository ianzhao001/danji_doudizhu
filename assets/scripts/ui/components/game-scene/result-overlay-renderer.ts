import { BlockInputEvents, director, UIOpacity } from 'cc';
import type { SeatIndex } from '../../../game';
import { RESOURCE_PATHS } from '../../asset-keys';
import { deriveScreenVM } from '../../screen-view';
import type { TableZones } from '../../table-zones';
import { THEME, addUiTransform, drawPanel, toColor } from '../ui-helpers';
import type { GameSceneRendererContext } from './seats-renderer';
import { seatDisplayName } from './seat-display';

function seatNameWithRole(seat: number, isLandlord: boolean): string {
  return `${seatDisplayName(seat)}${isLandlord ? '（地主）' : ''}`;
}

const PANEL_TEXT = toColor(THEME.palette.brandDark);
const PANEL_ACCENT = toColor(THEME.palette.brand);
const PANEL_FALLBACK = toColor(THEME.palette.surface);
const SCORE_FALLBACK = toColor(THEME.palette.textOnAccent, 116);
const HEADING_BACKDROP = toColor(THEME.palette.brandDark, 196);
const HEADING_TEXT = toColor(THEME.palette.textOnAccent);

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
  const panelHeight = Math.max(layout.settlementShowcase.height, Math.min(270, Math.max(244, Math.round(canvas.height * 0.7))));
  addUiTransform(panel, panelWidth, panelHeight);
  drawPanel(panel, panelWidth, panelHeight, PANEL_FALLBACK);

  const skin = ctx.addSprite(RESOURCE_PATHS.settlementPanelV13, 0, 0, panelWidth, panelHeight, panel, 'settlement-panel-skin', true);
  skin.setSiblingIndex(0);
  const titleY = panelHeight / 2 - 24;
  const bannerY = panelHeight / 2 - 76;
  const bannerWidth = Math.min(panelWidth * 0.7, 320);
  const bannerHeight = Math.min(panelHeight * 0.2, 54);
  const banner = ctx.addSprite(
    result.resultText === '胜利' ? RESOURCE_PATHS.settlementBannerWinV13 : RESOURCE_PATHS.settlementBannerLoseV13,
    0,
    bannerY,
    bannerWidth,
    bannerHeight,
    panel,
    'result-banner',
  );
  banner.setSiblingIndex(1);
  const headingBg = ctx.ensureNode('result-heading-backdrop', panel);
  headingBg.setPosition(0, titleY, 0);
  const headingWidth = Math.min(210, panelWidth - 108);
  addUiTransform(headingBg, headingWidth, 28);
  drawPanel(headingBg, headingWidth, 28, HEADING_BACKDROP);
  ctx.addLabel('本局结算', 0, titleY + 1, 18, panel, headingWidth - 18, 24, 'result-heading', HEADING_TEXT);
  ctx.addLabel(result.resultText, 0, bannerY - 1, THEME.typography.xl, panel, bannerWidth - 42, bannerHeight - 12, 'result-title', PANEL_TEXT);
  const multiplierY = bannerY - bannerHeight / 2 - 15;
  const springNote = result.springText ? `  ${result.springText}` : '';
  ctx.addLabel(`倍数 ×${result.multiplier}  炸弹 ${result.bombs}${springNote}`, 0, multiplierY, THEME.typography.md, panel, panelWidth - 60, 24, 'result-multiplier', PANEL_ACCENT);
  const scoreText = result.scores
    .map((row) => `${seatNameWithRole(row.seat, row.isLandlord)}  ${formatScore(row.score)}  余牌 ${handCounts[row.seat as SeatIndex] ?? 0}`)
    .join('\n');
  const scorePanel = ctx.ensureNode('result-score-panel', panel);
  scorePanel.setPosition(0, -31, 0);
  const scorePanelWidth = panelWidth - 74;
  const scorePanelHeight = 42;
  addUiTransform(scorePanel, scorePanelWidth, scorePanelHeight);
  drawPanel(scorePanel, scorePanelWidth, scorePanelHeight, SCORE_FALLBACK);
  const scoreLabel = ctx.addLabel(scoreText, 0, 0, THEME.typography.xs, scorePanel, scorePanelWidth - 18, scorePanelHeight - 4, 'result-scores', PANEL_TEXT);
  scoreLabel.lineHeight = 14;

  const buttonY = -panelHeight / 2 + 34;
  ctx.addButton('再来一局', -68, buttonY, 124, 60, true, () => ctx.startGame(true), panel, 'result-new');
  ctx.addButton('返回大厅', 68, buttonY, 124, 60, true, () => director.loadScene('lobby'), panel, 'result-lobby');
  panel.setSiblingIndex(overlay.children.length - 1);
  overlay.setSiblingIndex(ctx.uiRoot.children.length - 1);
}

function formatScore(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}
