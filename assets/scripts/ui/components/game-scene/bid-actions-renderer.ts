import { Graphics } from 'cc';
import { adviseBid } from '../../../ai/bidding-advisor';
import { adviseAction } from '../../../ai/insight';
import type { RoundRuntime } from '../../../flow/round-runtime';
import { RESOURCE_PATHS } from '../../asset-keys';
import { deriveBiddingAdviceView, type BiddingAdviceView } from '../../bidding-advice-view';
import { deriveInsightView } from '../../insight-view';
import { deriveScreenVM } from '../../screen-view';
import { t } from '../../strings';
import type { TableZones } from '../../table-zones';
import type { TypographyRole } from '../../theme';
import { deriveTurnTimer } from '../../turn-timer';
import { THEME, addUiTransform, drawPanel, toColor } from '../ui-helpers';
import { applyPillSkin, PILL_TEXT, type GameSceneRendererContext } from './seats-renderer';

// v1.6 二次终审:药丸皮 v15 深底→v18 浅底,浅奶油字随之只剩 1.22:1(ASCII 亮度图实测:字比底还亮)。深莓字 = 7.7:1。
const STATUS_TEXT = PILL_TEXT;
// 告急字色:palette.danger (176,72,88) 压 v18 浅药丸只有 4.20:1(差 AA),加深到 6.2:1。
const TIMER_URGENT_TEXT = toColor({ r: 150, g: 40, b: 60, a: 255 });
const BID_ADVICE_BACKDROP = toColor(THEME.palette.surfaceRaised, 190);
const BID_ADVICE_STRONG_BACKDROP = toColor(THEME.palette.warning, 198);
const BID_ADVICE_TEXT = toColor(THEME.palette.accentCream);
const BID_ADVICE_STRONG_TEXT = toColor(THEME.palette.accentGold);

export function renderBidding(
  ctx: GameSceneRendererContext,
  bidding: ReturnType<typeof deriveScreenVM>['bidding'],
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (!bidding) return;
  const landscape = ctx.isLandscape(canvas);
  const prompt = ctx.rectPoint(layout.statusLine, canvas, 0.5, 0.5);
  renderStatusPill(ctx, 'bidding-prompt', bidding.prompt, prompt.x, prompt.y,
    Math.min(230, layout.statusLine.width), landscape ? layout.statusLine.height : 32, 'action');
  const buttonHeight = landscape ? layout.tableActionBar.height : 60;
  const buttonWidth = Math.min(118, Math.max(96, (layout.tableActionBar.width - THEME.spacing.comfortable) / Math.max(1, bidding.buttons.length)));
  const step = buttonWidth + THEME.spacing.card;
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

// V9 后用户裁决(2026-07-11·v1.5):提示功能前端隐藏——不删除只隐藏,隐藏后不迭代。
// 逻辑(applyHint/adviseBestMove/nextHint)与桥测试全保留(对齐 SHOW_MEMORY_DOCK 先例)。
// V10 用户终审整改(2026-07-12):恢复提示按钮;当初 v1.5 裁决②所指为「建议」功能——见 SHOW_ADVISOR。
const SHOW_HINT_ACTION = true;
// V10 用户终审整改:隐藏「建议开/关」功能(对局内建议 dock+叫抢建议)——只隐藏不删除,隐藏期间不迭代;
// adviseAction/adviseBid 与既有测试全保留,翻 true 即可重开。
const SHOW_ADVISOR = false;

export function renderActions(
  ctx: GameSceneRendererContext,
  play: boolean,
  pass: boolean,
  hint: boolean,
  layout: TableZones,
  canvas: { width: number; height: number },
  mustPass = false,
): void {
  const y = layout.tableActionBar.y + layout.tableActionBar.height * 0.5;
  const buttonHeight = ctx.isLandscape(canvas) ? layout.tableActionBar.height : 60;
  const buttonWidth = Math.min(94, Math.max(78, (layout.tableActionBar.width - THEME.spacing.safe) / 3));
  const step = buttonWidth + THEME.spacing.default;
  const center = layout.tableActionBar.x + layout.tableActionBar.width / 2;
  const playEnabled = mustPass ? false : play;
  const hintEnabled = mustPass ? false : hint;

  type ActionSpec = { text: string; enabled: boolean; cb: () => void; name: string };
  const actions: ActionSpec[] = [
    { text: t('action.play'), enabled: playEnabled, cb: () => void ctx.submitPlay(), name: 'action-play' },
    {
      text: mustPass ? t('action.mustPass') : t('action.pass'),
      enabled: pass,
      cb: () => void ctx.submitPass(),
      name: mustPass ? 'action-must-pass' : 'action-pass',
    },
  ];
  if (SHOW_HINT_ACTION) {
    actions.push({ text: t('action.hint'), enabled: hintEnabled, cb: () => ctx.applyHint(), name: 'action-hint' });
  }

  // 可见按钮数组居中布点:2 键 = center ∓ step/2,3 键 = center-step / center / center+step。
  const startX = center - ((actions.length - 1) * step) / 2;
  actions.forEach((action, index) => {
    const pos = ctx.screenPoint(canvas, startX + index * step, y);
    ctx.addButton(action.text, pos.x, pos.y, buttonWidth, buttonHeight, action.enabled, action.cb, ctx.uiRoot, action.name);
  });
}

export function renderStatus(
  ctx: GameSceneRendererContext,
  text: string,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (!text) return;
  const pos = ctx.rectPoint(layout.statusLine, canvas, 0.5, 0.5);
  renderStatusPill(ctx, 'status-label', text, pos.x, pos.y, Math.min(230, layout.statusLine.width),
    ctx.isLandscape(canvas) ? layout.statusLine.height : 30, 'body');
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
  // v1.6 二次终审「举一反三」——倒计时条原是三重违规:
  //  ① 深炭紫底(surfaceRaised 48,40,58)是全 UI 唯一的深色残留(旧深色主题遗物),粉系里极突兀;
  //  ② urgent 时暗红字压深底只有 1.6:1,几乎读不出;
  //  ③ 进度条(4px 细线)就画在字脚下 —— 正是用户所指「盖字的设计不宜出现很多线条」。
  // 改法:换 v19 浅药丸皮与独立倒计时环,去掉压字的进度条,
  // 只留「计时 Ns」+ 告急时字转深红(浅底上 6.2:1)。倒计时语义由数字本身承载,更简洁。
  applyPillSkin(ctx, root, width, height);
  ctx.ensureNode('turn-timer-bar', root).getComponent(Graphics)?.clear();
  const iconWidth = 18;
  const contentGap = THEME.spacing.tight;
  const labelWidth = Math.max(44, width - 64);
  const contentWidth = iconWidth + contentGap + labelWidth;
  const iconX = -contentWidth / 2 + iconWidth / 2;
  const labelX = contentWidth / 2 - labelWidth / 2;
  ctx.addSprite(RESOURCE_PATHS.countdownRingV19, iconX, 0, iconWidth, iconWidth, root, 'turn-timer-badge');

  // 门B:文字盒排在徽标右侧的剩余净区内(原 x=w/2-31、盒宽 56 会向右越出净区 4px);
  // 药丸仅 22 高,默认行高 16 也会让字形带越出净区(15)→ 行高压到 13。
  const label = ctx.addLabel(`计时 ${timer.label}`, labelX, 0, 'assistive', root,
    labelWidth, Math.max(13, height - THEME.spacing.default), 'turn-timer-label');
  label.color = timer.urgent ? TIMER_URGENT_TEXT : STATUS_TEXT;
}

export function renderAdvisor(
  ctx: GameSceneRendererContext,
  snapshot: ReturnType<RoundRuntime['currentSnapshot']> | undefined,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (!SHOW_ADVISOR) return;
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
    ? toColor(THEME.palette.surfaceRaised, 190)
    : insight.emphasize
      ? toColor(THEME.palette.success, 192)
      : toColor(THEME.palette.surfaceRaised, 184);
  drawPanel(root, width, height, color);

  const label = ctx.addLabel(insight.text, 0, 1, 'assistive', root, width - THEME.spacing.safe, height - THEME.spacing.tight, 'advisor-label');
  label.color = insight.emphasize ? toColor(THEME.palette.textOnAccent) : toColor(THEME.palette.accentCream);
}

function renderStatusPill(
  ctx: GameSceneRendererContext,
  name: string,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  role: TypographyRole,
): void {
  const root = ctx.ensureNode(name, ctx.uiRoot);
  root.setPosition(x, y, 0);
  addUiTransform(root, width, height);
  applyPillSkin(ctx, root, width, height);
  // 门B:文字盒收进药丸净区,且 y 归 0——原来 y=+1 的偏移让字形带上缘越出净区顶。
  const label = ctx.addLabel(text, 0, 0, role, root, width - THEME.spacing.safe,
    Math.max(12, Math.floor(height * 0.72)), `${name}-text`);
  label.color = STATUS_TEXT;
}

function renderBiddingAdvisor(
  ctx: GameSceneRendererContext,
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (!SHOW_ADVISOR) return;
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

  const label = ctx.addLabel(biddingAdviceText(view), 0, 1, 'meta', root, width - THEME.spacing.safe, height - 6, 'bid-advisor-label');
  label.color = view.emphasize ? BID_ADVICE_STRONG_TEXT : BID_ADVICE_TEXT;
}

function biddingAdviceText(view: BiddingAdviceView): string {
  const actionText = view.text.startsWith('建议') ? view.text.slice(2) : view.text;
  return `建议：${actionText}${view.emphasize ? '（手牌强）' : ''}`;
}
