import { Button, Color, Graphics } from 'cc';
import { evaluateHand } from '../../../ai/handStrength';
import type { Card } from '../../../rules';
import { deriveCardMemoryView } from '../../card-memory-view';
import { deriveStrengthMeter } from '../../strength-meter-view';
import { trackPlayed } from '../../../ai/cardMemory';
import type { TableZones } from '../../table-zones';
import { THEME, addUiTransform, drawPanel, toColor } from '../ui-helpers';
import type { GameSceneRendererContext } from './seats-renderer';

export function renderHud(
  ctx: GameSceneRendererContext,
  hand: Card[],
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (hand.length === 0) return;
  renderStrengthMeter(ctx, hand, layout, canvas);
  renderCardMemory(ctx, hand, layout, canvas);
}

// V8 用户签收意见③（2026-07-11）：记牌器与强度条前端不可见——仅渲染短路，
// 纯岛/评估逻辑/设置/测试全部保留，后续版本翻 true 即可重开。
const SHOW_STRENGTH_METER = false;
const SHOW_MEMORY_DOCK = false;

function renderStrengthMeter(
  ctx: GameSceneRendererContext,
  hand: Card[],
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (!SHOW_STRENGTH_METER) return;
  const strength = deriveStrengthMeter(evaluateHand(hand));
  const pos = ctx.rectPoint(layout.strengthMeter, canvas, 0.5, 0.5);
  const width = layout.strengthMeter.width;
  const height = Math.min(28, layout.strengthMeter.height);
  const root = ctx.ensureNode('hud-strength-meter', ctx.uiRoot);
  root.setPosition(pos.x, pos.y, 0);
  addUiTransform(root, width, height);
  drawPanel(root, width, height, toColor(THEME.palette.surfaceRaised));

  const barWidth = Math.max(24, width - 92);
  const barHeight = 6;
  const barX = 24;
  const bar = ctx.ensureNode('hud-strength-bar', root);
  bar.setPosition(barX, -5, 0);
  addUiTransform(bar, barWidth, barHeight);
  const graphics = bar.getComponent(Graphics) ?? bar.addComponent(Graphics);
  graphics.clear();
  graphics.fillColor = toColor(THEME.palette.textOnAccent, 42);
  graphics.roundRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 4);
  graphics.fill();
  graphics.fillColor = ctx.strengthColor(strength.tone);
  const filled = Math.round((barWidth * strength.pct) / 100);
  graphics.roundRect(-barWidth / 2, -barHeight / 2, filled, barHeight, 4);
  graphics.fill();

  ctx.addLabel('强度', -width / 2 + 22, 3, THEME.typography.xs, root, 42, 20, 'hud-strength-title');
  ctx.addLabel(`${strength.label}${strength.pct}%`, width / 2 - 34, 3, 11, root, 68, 20, 'hud-strength-value');
}

export function renderCardMemory(
  ctx: GameSceneRendererContext,
  hand: Card[],
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  if (!SHOW_MEMORY_DOCK) return;
  const memory = deriveCardMemoryView(trackPlayed(ctx.fullGameEvents, hand));
  const rows = ctx.memoryExpanded ? memory.rows : memory.rows.slice(0, 6);
  const panelWidth = ctx.memoryExpanded ? Math.min(204, layout.memoryDock.width + 86) : layout.memoryDock.width;
  const panelHeight = ctx.memoryExpanded ? 96 : layout.memoryDock.height;
  const pos = ctx.rectPoint(layout.memoryDock, canvas, 0.5, ctx.memoryExpanded ? 1.8 : 0.5);
  const verticalBreath = ctx.isLandscape(canvas) && !ctx.memoryExpanded ? -8 : 0;
  const root = ctx.ensureNode('hud-card-memory', ctx.uiRoot);
  root.setPosition(pos.x, pos.y + verticalBreath, 0);
  addUiTransform(root, panelWidth, panelHeight);
  drawPanel(root, panelWidth, panelHeight, toColor(THEME.palette.surfaceRaised, 168));

  ctx.addLabel('剩牌', -panelWidth / 2 + 24, panelHeight / 2 - 18, THEME.typography.sm, root, 42, 24, 'hud-memory-title');
  const toggleLabel = ctx.memoryExpanded ? '收起' : '展开';
  addCompactHudButton(ctx, root, toggleLabel, -panelWidth / 2 + 76, panelHeight / 2 - 18, () => {
    ctx.setMemoryExpanded(!ctx.memoryExpanded);
    ctx.render();
  });

  const cols = ctx.memoryExpanded ? 5 : 6;
  const cellWidth = Math.floor((panelWidth - 28) / cols);
  rows.forEach((row, index) => {
    const col = index % cols;
    const line = Math.floor(index / cols);
    const x = -panelWidth / 2 + 16 + cellWidth / 2 + col * cellWidth;
    const y = panelHeight / 2 - 44 - line * 19;
    const text = `${row.rankLabel}${row.remaining}`;
    const item = ctx.addLabel(text, x, y, THEME.typography.xs, root, cellWidth, 22, `hud-memory-${index}`);
    item.color = row.exhausted ? toColor(THEME.palette.textOnAccent, 112) : toColor(THEME.palette.accentCream);
  });
}

function addCompactHudButton(
  ctx: GameSceneRendererContext,
  parent: ReturnType<GameSceneRendererContext['ensureNode']>,
  text: string,
  x: number,
  y: number,
  cb: () => void,
): void {
  const width = 56;
  const height = 28;
  const node = ctx.ensureNode('hud-memory-toggle', parent);
  node.setPosition(x, y, 0);
  addUiTransform(node, width, height);
  drawPanel(node, width, height, toColor(THEME.palette.accentCream, 214));
  const button = node.getComponent(Button) ?? node.addComponent(Button);
  button.target = node;
  button.transition = Button.Transition.COLOR;
  button.interactable = true;
  button.normalColor = toColor(THEME.palette.textOnAccent);
  button.pressedColor = toColor(THEME.palette.accentCream, 255);
  button.hoverColor = toColor(THEME.palette.textOnAccent);
  button.disabledColor = toColor(THEME.palette.textOnAccent, 120);
  node.off(Button.EventType.CLICK);
  node.on(Button.EventType.CLICK, cb);
  const label = ctx.addLabel(text, 0, 1, THEME.typography.sm, node, width - 8, height - 4, 'hud-memory-toggle-label');
  label.color = toColor(THEME.palette.brandDark);
  label.lineHeight = 17;
}
