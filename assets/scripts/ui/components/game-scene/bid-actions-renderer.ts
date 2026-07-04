import { Color, Graphics } from 'cc';
import { adviseAction } from '../../../ai/insight';
import type { RoundRuntime } from '../../../flow/round-runtime';
import { deriveInsightView } from '../../insight-view';
import { deriveScreenVM } from '../../screen-view';
import type { TableRegions } from '../../table-layout';
import { deriveTurnTimer } from '../../turn-timer';
import { addUiTransform, drawPanel } from '../ui-helpers';
import type { GameSceneRendererContext } from './seats-renderer';

export function renderBidding(
  ctx: GameSceneRendererContext,
  bidding: ReturnType<typeof deriveScreenVM>['bidding'],
  layout: TableRegions,
  canvas: { width: number; height: number },
): void {
  if (!bidding) return;
  const promptY = Math.max(layout.playArea.y + layout.playArea.height + 16, layout.actionButtons.y - 50);
  const prompt = ctx.screenPoint(canvas, canvas.width / 2, promptY);
  ctx.addLabel(bidding.prompt, prompt.x, prompt.y, 18, ctx.uiRoot, 220, 72, 'bidding-prompt');
  bidding.buttons.forEach((button, index) => {
    const spacing = Math.min(118, layout.actionButtons.width / Math.max(1, bidding.buttons.length));
    const screenX = layout.actionButtons.x + layout.actionButtons.width / 2 + (index - (bidding.buttons.length - 1) / 2) * spacing;
    const screenY = layout.actionButtons.y + Math.min(12, layout.actionButtons.height * 0.2);
    const pos = ctx.screenPoint(canvas, screenX, screenY);
    ctx.addButton(button.label, pos.x, pos.y, 112, 42, button.enabled, () => {
      if (!button.enabled) return;
      void ctx.submitBid(button.id);
    }, ctx.uiRoot, `bid-${button.id}`);
  });
}

export function renderActions(
  ctx: GameSceneRendererContext,
  play: boolean,
  pass: boolean,
  hint: boolean,
  layout: TableRegions,
  canvas: { width: number; height: number },
): void {
  const y = layout.actionButtons.y + layout.actionButtons.height * (ctx.isLandscape(canvas) ? 0.48 : 0.78);
  const playPos = ctx.screenPoint(canvas, layout.actionButtons.x + layout.actionButtons.width * 0.1, y);
  const passPos = ctx.screenPoint(canvas, layout.actionButtons.x + layout.actionButtons.width * 0.5, y);
  const hintPos = ctx.screenPoint(canvas, layout.actionButtons.x + layout.actionButtons.width * 0.9, y);
  ctx.addButton('出牌', playPos.x, playPos.y, 84, 38, play, () => void ctx.submitPlay(), ctx.uiRoot, 'action-play');
  ctx.addButton('不要', passPos.x, passPos.y, 84, 38, pass, () => void ctx.submitPass(), ctx.uiRoot, 'action-pass');
  ctx.addButton('提示', hintPos.x, hintPos.y, 84, 38, hint, () => ctx.applyHint(), ctx.uiRoot, 'action-hint');
}

export function renderStatus(
  ctx: GameSceneRendererContext,
  text: string,
  layout: TableRegions,
  canvas: { width: number; height: number },
): void {
  if (!text) return;
  const y = ctx.isLandscape(canvas) ? layout.actionButtons.y - 10 : layout.playerHand.y + 2;
  const pos = ctx.screenPoint(canvas, canvas.width / 2, y);
  ctx.addLabel(text, pos.x, pos.y, 18, ctx.uiRoot, 180, 32, 'status-label');
}

export function renderTurnTimer(
  ctx: GameSceneRendererContext,
  layout: TableRegions,
  canvas: { width: number; height: number },
): void {
  if (!ctx.syncTurnTimerKey()) return;
  const timer = deriveTurnTimer(ctx.turnTimerMs - ctx.turnTimerElapsedMs, ctx.turnTimerMs);
  const landscape = ctx.isLandscape(canvas);
  const width = landscape ? 126 : Math.min(188, Math.max(150, layout.actionButtons.width - 88));
  const height = landscape ? 20 : 22;
  const timerX = landscape ? Math.min(canvas.width - width / 2 - 18, canvas.width / 2 + 178) : canvas.width / 2;
  const timerY = landscape
    ? layout.playArea.y + layout.playArea.height + Math.min(14, Math.max(10, (layout.actionButtons.y - (layout.playArea.y + layout.playArea.height)) * 0.36))
    : layout.actionButtons.y + 13;
  const pos = ctx.screenPoint(canvas, timerX, timerY);
  const root = ctx.ensureNode('turn-timer-runtime', ctx.uiRoot);
  root.setPosition(pos.x, pos.y, 0);
  addUiTransform(root, width, height);
  drawPanel(root, width, height, new Color(34, 39, 52, 166));

  const barWidth = width - (landscape ? 54 : 68);
  const barHeight = landscape ? 4 : 5;
  const bar = ctx.ensureNode('turn-timer-bar', root);
  bar.setPosition(landscape ? -10 : -14, landscape ? -3 : -3, 0);
  addUiTransform(bar, barWidth, barHeight);
  const graphics = bar.getComponent(Graphics) ?? bar.addComponent(Graphics);
  graphics.clear();
  graphics.fillColor = new Color(255, 255, 255, 42);
  graphics.roundRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 3);
  graphics.fill();
  graphics.fillColor = timer.urgent ? new Color(255, 114, 114, 235) : new Color(134, 206, 255, 230);
  graphics.roundRect(-barWidth / 2, -barHeight / 2, Math.round((barWidth * timer.pct) / 100), barHeight, 3);
  graphics.fill();

  const label = ctx.addLabel(`计时 ${timer.label}`, width / 2 - (landscape ? 31 : 35), 1, 12, root, landscape ? 56 : 60, 20, 'turn-timer-label');
  label.color = timer.urgent ? new Color(255, 196, 196, 255) : new Color(238, 248, 255, 255);
}

export function renderAdvisor(
  ctx: GameSceneRendererContext,
  snapshot: ReturnType<RoundRuntime['currentSnapshot']> | undefined,
  layout: TableRegions,
  canvas: { width: number; height: number },
): void {
  if (!snapshot?.viewerHand || !ctx.runtime?.isPlayerTurn() || ctx.runtime.phase() !== 'playing') return;
  const centerY = advisorCenterY(ctx, layout);
  const landscape = ctx.isLandscape(canvas);
  const toggleX = landscape ? Math.max(84, canvas.width / 2 - 178) : layout.actionButtons.x + 34;
  const togglePos = ctx.screenPoint(canvas, toggleX, centerY);
  ctx.addButton(
    ctx.advisorEnabled ? '建议开' : '建议关',
    togglePos.x,
    togglePos.y,
    landscape ? 64 : 70,
    landscape ? 24 : 30,
    true,
    () => ctx.toggleAdvisor(),
    ctx.uiRoot,
    'advisor-toggle',
  );

  if (!ctx.advisorEnabled) return;
  const insight = deriveInsightView(adviseAction(snapshot.viewerHand, snapshot.top?.pattern ?? null));
  if (!insight.text) return;

  const width = landscape ? Math.min(190, Math.max(164, canvas.width * 0.22)) : Math.min(226, Math.max(188, canvas.width - 156));
  const height = landscape ? 24 : 30;
  const panelX = landscape
    ? Math.max(width / 2 + 18, canvas.width / 2 - 86)
    : Math.min(canvas.width - width / 2 - 24, layout.actionButtons.x + layout.actionButtons.width * 0.66);
  const panelPos = ctx.screenPoint(canvas, panelX, centerY);
  const root = ctx.ensureNode('advisor-panel', ctx.uiRoot);
  root.setPosition(panelPos.x, panelPos.y, 0);
  addUiTransform(root, width, height);
  const color = insight.isPass
    ? new Color(43, 55, 75, 190)
    : insight.emphasize
      ? new Color(52, 86, 63, 192)
      : new Color(37, 42, 58, 184);
  drawPanel(root, width, height, color);

  const label = ctx.addLabel(insight.text, 0, 1, landscape ? 12 : 13, root, width - 18, height - 4, 'advisor-label');
  label.color = insight.emphasize ? new Color(221, 255, 224, 255) : new Color(255, 248, 226, 255);
}

function advisorCenterY(ctx: GameSceneRendererContext, layout: TableRegions): number {
  if (layout.playArea.width > layout.playArea.height * 2) {
    return layout.playArea.y + layout.playArea.height + Math.min(14, Math.max(10, (layout.actionButtons.y - (layout.playArea.y + layout.playArea.height)) * 0.36));
  }
  const defaultY = layout.playArea.y + layout.playArea.height + 56;
  return ctx.memoryExpanded && ctx.advisorEnabled ? layout.playArea.y + layout.playArea.height + 24 : defaultY;
}
