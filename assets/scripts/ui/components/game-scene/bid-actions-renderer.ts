import { Color, Graphics } from 'cc';
import { adviseBid } from '../../../ai/bidding-advisor';
import { adviseAction } from '../../../ai/insight';
import type { RoundRuntime } from '../../../flow/round-runtime';
import { RESOURCE_PATHS } from '../../asset-keys';
import { deriveBiddingAdviceView, type BiddingAdviceView } from '../../bidding-advice-view';
import { deriveInsightView } from '../../insight-view';
import { deriveScreenVM } from '../../screen-view';
import type { TableZones } from '../../table-zones';
import { deriveTurnTimer } from '../../turn-timer';
import { addUiTransform, drawPanel } from '../ui-helpers';
import type { GameSceneRendererContext } from './seats-renderer';

const STATUS_TEXT = new Color(255, 247, 226, 255);
const STATUS_BACKDROP = new Color(64, 38, 60, 186);
const BID_ADVICE_BACKDROP = new Color(62, 42, 68, 190);
const BID_ADVICE_STRONG_BACKDROP = new Color(72, 72, 50, 198);
const BID_ADVICE_TEXT = new Color(255, 248, 226, 255);
const BID_ADVICE_STRONG_TEXT = new Color(255, 243, 181, 255);

export function renderBidding(
  ctx: GameSceneRendererContext,
  bidding: ReturnType<typeof deriveScreenVM>['bidding'],
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (!bidding) return;
  const prompt = ctx.rectPoint(layout.statusLine, canvas, 0.5, 0.5);
  renderStatusPill(ctx, 'bidding-prompt', bidding.prompt, prompt.x, prompt.y, Math.min(230, layout.statusLine.width), 32, 16);
  const buttonHeight = 60;
  const buttonWidth = Math.min(118, Math.max(96, (layout.tableActionBar.width - 12) / Math.max(1, bidding.buttons.length)));
  const step = buttonWidth + 10;
  bidding.buttons.forEach((button, index) => {
    const screenX = layout.tableActionBar.x + layout.tableActionBar.width / 2 + (index - (bidding.buttons.length - 1) / 2) * step;
    const screenY = layout.tableActionBar.y + layout.tableActionBar.height * 0.5;
    const pos = ctx.screenPoint(canvas, screenX, screenY);
    ctx.addButton(button.label, pos.x, pos.y, buttonWidth, buttonHeight, button.enabled, () => {
      if (!button.enabled) return;
      void ctx.submitBid(button.id);
    }, ctx.uiRoot, `bid-${button.id}`);
  });
  renderBiddingAdvisor(ctx, layout, canvas);
}

export function renderActions(
  ctx: GameSceneRendererContext,
  play: boolean,
  pass: boolean,
  hint: boolean,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  const y = layout.tableActionBar.y + layout.tableActionBar.height * 0.5;
  const buttonHeight = 60;
  const buttonWidth = Math.min(94, Math.max(78, (layout.tableActionBar.width - 20) / 3));
  const step = buttonWidth + 8;
  const center = layout.tableActionBar.x + layout.tableActionBar.width / 2;
  const playPos = ctx.screenPoint(canvas, center - step, y);
  const passPos = ctx.screenPoint(canvas, center, y);
  const hintPos = ctx.screenPoint(canvas, center + step, y);
  ctx.addButton('出牌', playPos.x, playPos.y, buttonWidth, buttonHeight, play, () => void ctx.submitPlay(), ctx.uiRoot, 'action-play');
  ctx.addButton('不要', passPos.x, passPos.y, buttonWidth, buttonHeight, pass, () => void ctx.submitPass(), ctx.uiRoot, 'action-pass');
  ctx.addButton('提示', hintPos.x, hintPos.y, buttonWidth, buttonHeight, hint, () => ctx.applyHint(), ctx.uiRoot, 'action-hint');
}

export function renderStatus(
  ctx: GameSceneRendererContext,
  text: string,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (!text) return;
  const pos = ctx.rectPoint(layout.statusLine, canvas, 0.5, 0.5);
  renderStatusPill(ctx, 'status-label', text, pos.x, pos.y, Math.min(230, layout.statusLine.width), 30, 15);
}

export function renderTurnTimer(
  ctx: GameSceneRendererContext,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (!ctx.syncTurnTimerKey()) return;
  const timer = deriveTurnTimer(ctx.turnTimerMs - ctx.turnTimerElapsedMs, ctx.turnTimerMs);
  const width = layout.turnTimer.width;
  const height = Math.min(22, layout.turnTimer.height);
  const pos = ctx.rectPoint(layout.turnTimer, canvas, 0.5, 0.5);
  const root = ctx.ensureNode('turn-timer-runtime', ctx.uiRoot);
  root.setPosition(pos.x, pos.y, 0);
  addUiTransform(root, width, height);
  drawPanel(root, width, height, new Color(34, 39, 52, 166));
  ctx.addSprite(RESOURCE_PATHS.badgeTimerV13, -width / 2 + 14, 0, 20, 20, root, 'turn-timer-badge');

  const barWidth = width - 54;
  const barHeight = 4;
  const bar = ctx.ensureNode('turn-timer-bar', root);
  bar.setPosition(-10, -3, 0);
  addUiTransform(bar, barWidth, barHeight);
  const graphics = bar.getComponent(Graphics) ?? bar.addComponent(Graphics);
  graphics.clear();
  graphics.fillColor = new Color(255, 255, 255, 42);
  graphics.roundRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 3);
  graphics.fill();
  graphics.fillColor = timer.urgent ? new Color(255, 114, 114, 235) : new Color(134, 206, 255, 230);
  graphics.roundRect(-barWidth / 2, -barHeight / 2, Math.round((barWidth * timer.pct) / 100), barHeight, 3);
  graphics.fill();

  const label = ctx.addLabel(`计时 ${timer.label}`, width / 2 - 31, 1, 12, root, 56, 20, 'turn-timer-label');
  label.color = timer.urgent ? new Color(255, 196, 196, 255) : new Color(238, 248, 255, 255);
}

export function renderAdvisor(
  ctx: GameSceneRendererContext,
  snapshot: ReturnType<RoundRuntime['currentSnapshot']> | undefined,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (!snapshot?.viewerHand || !ctx.runtime?.isPlayerTurn() || ctx.runtime.phase() !== 'playing') return;
  const togglePos = ctx.rectPoint(layout.advisorDock, canvas, 0.5, 0.5);
  ctx.addButton(
    ctx.advisorEnabled ? '建议开' : '建议关',
    togglePos.x,
    togglePos.y,
    Math.min(92, layout.advisorDock.width),
    60,
    true,
    () => ctx.toggleAdvisor(),
    ctx.uiRoot,
    'advisor-toggle',
  );

  if (!ctx.advisorEnabled) return;
  const insight = deriveInsightView(adviseAction(snapshot.viewerHand, snapshot.top?.pattern ?? null));
  if (!insight.text) return;

  const width = Math.min(148, Math.max(118, layout.advisorDock.width + 32));
  const height = 26;
  const panelPos = ctx.rectPoint(layout.advisorDock, canvas, 0.5, 1.55);
  const root = ctx.ensureNode('advisor-panel', ctx.uiRoot);
  root.setPosition(panelPos.x, panelPos.y, 0);
  addUiTransform(root, width, height);
  const color = insight.isPass
    ? new Color(43, 55, 75, 190)
    : insight.emphasize
      ? new Color(52, 86, 63, 192)
      : new Color(37, 42, 58, 184);
  drawPanel(root, width, height, color);

  const label = ctx.addLabel(insight.text, 0, 1, 12, root, width - 18, height - 4, 'advisor-label');
  label.color = insight.emphasize ? new Color(221, 255, 224, 255) : new Color(255, 248, 226, 255);
}

function renderStatusPill(
  ctx: GameSceneRendererContext,
  name: string,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
): void {
  const root = ctx.ensureNode(name, ctx.uiRoot);
  root.setPosition(x, y, 0);
  addUiTransform(root, width, height);
  drawPanel(root, width, height, STATUS_BACKDROP);
  const label = ctx.addLabel(text, 0, 1, fontSize, root, width - 18, height - 4, `${name}-text`);
  label.color = STATUS_TEXT;
}

function renderBiddingAdvisor(
  ctx: GameSceneRendererContext,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  const state = ctx.runtime?.currentBidding();
  const hand = ctx.runtime?.biddingDeal()?.viewerHand;
  if (
    !state ||
    !hand ||
    !ctx.runtime?.isPlayerTurn() ||
    (state.phase !== 'calling' && state.phase !== 'grabbing')
  ) {
    return;
  }

  const togglePos = ctx.rectPoint(layout.advisorDock, canvas, 0.5, 0.5);
  ctx.addButton(
    ctx.biddingAdvisorEnabled ? '建议开' : '建议关',
    togglePos.x,
    togglePos.y,
    Math.min(92, layout.advisorDock.width),
    60,
    true,
    () => ctx.toggleBiddingAdvisor(),
    ctx.uiRoot,
    'bid-advisor-toggle',
  );

  if (!ctx.biddingAdvisorEnabled) return;

  const view = deriveBiddingAdviceView(adviseBid(hand, state.phase, ctx.settings.difficulty));
  const width = Math.min(176, Math.max(136, layout.advisorDock.width + 54));
  const height = 34;
  const panelPos = ctx.rectPoint(layout.advisorDock, canvas, 0.5, 1.75);
  const root = ctx.ensureNode('bid-advisor-panel', ctx.uiRoot);
  root.setPosition(panelPos.x, panelPos.y, 0);
  addUiTransform(root, width, height);
  drawPanel(root, width, height, view.emphasize ? BID_ADVICE_STRONG_BACKDROP : BID_ADVICE_BACKDROP);

  const label = ctx.addLabel(biddingAdviceText(view), 0, 1, 13, root, width - 18, height - 6, 'bid-advisor-label');
  label.color = view.emphasize ? BID_ADVICE_STRONG_TEXT : BID_ADVICE_TEXT;
}

function biddingAdviceText(view: BiddingAdviceView): string {
  const actionText = view.text.startsWith('建议') ? view.text.slice(2) : view.text;
  return `建议：${actionText}${view.emphasize ? '（手牌强）' : ''}`;
}
