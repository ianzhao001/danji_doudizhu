import { Button, Color, Graphics } from 'cc';
import { evaluateHand } from '../../../ai/handStrength';
import type { Card } from '../../../rules';
import { deriveCardMemoryView } from '../../card-memory-view';
import { deriveStrengthMeter } from '../../strength-meter-view';
import { trackPlayed } from '../../../ai/cardMemory';
import type { TableZones } from '../../table-zones';
import { addUiTransform, drawPanel } from '../ui-helpers';
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

function renderStrengthMeter(
  ctx: GameSceneRendererContext,
  hand: Card[],
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  const strength = deriveStrengthMeter(evaluateHand(hand));
  const pos = ctx.rectPoint(layout.strengthMeter, canvas, 0.5, 0.5);
  const width = layout.strengthMeter.width;
  const height = Math.min(28, layout.strengthMeter.height);
  const root = ctx.ensureNode('hud-strength-meter', ctx.uiRoot);
  root.setPosition(pos.x, pos.y, 0);
  addUiTransform(root, width, height);
  drawPanel(root, width, height, new Color(48, 40, 58, 178));

  const barWidth = Math.max(24, width - 92);
  const barHeight = 6;
  const barX = 24;
  const bar = ctx.ensureNode('hud-strength-bar', root);
  bar.setPosition(barX, -5, 0);
  addUiTransform(bar, barWidth, barHeight);
  const graphics = bar.getComponent(Graphics) ?? bar.addComponent(Graphics);
  graphics.clear();
  graphics.fillColor = new Color(255, 255, 255, 42);
  graphics.roundRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 4);
  graphics.fill();
  graphics.fillColor = ctx.strengthColor(strength.tone);
  const filled = Math.round((barWidth * strength.pct) / 100);
  graphics.roundRect(-barWidth / 2, -barHeight / 2, filled, barHeight, 4);
  graphics.fill();

  ctx.addLabel('强度', -width / 2 + 22, 3, 12, root, 42, 20, 'hud-strength-title');
  ctx.addLabel(`${strength.label}${strength.pct}%`, width / 2 - 34, 3, 11, root, 68, 20, 'hud-strength-value');
}

export function renderCardMemory(
  ctx: GameSceneRendererContext,
  hand: Card[],
  layout: TableZones,
  canvas: { width: number; height: number },
): void {
  const memory = deriveCardMemoryView(trackPlayed(ctx.fullGameEvents, hand));
  const rows = ctx.memoryExpanded ? memory.rows : memory.rows.slice(0, 6);
  const panelWidth = ctx.memoryExpanded ? Math.min(204, layout.memoryDock.width + 86) : layout.memoryDock.width;
  const panelHeight = ctx.memoryExpanded ? 96 : layout.memoryDock.height;
  const pos = ctx.rectPoint(layout.memoryDock, canvas, 0.5, ctx.memoryExpanded ? 1.8 : 0.5);
  const verticalBreath = ctx.isLandscape(canvas) && !ctx.memoryExpanded ? -8 : 0;
  const root = ctx.ensureNode('hud-card-memory', ctx.uiRoot);
  root.setPosition(pos.x, pos.y + verticalBreath, 0);
  addUiTransform(root, panelWidth, panelHeight);
  drawPanel(root, panelWidth, panelHeight, new Color(42, 54, 62, 168));

  ctx.addLabel('剩牌', -panelWidth / 2 + 24, panelHeight / 2 - 18, 13, root, 42, 24, 'hud-memory-title');
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
    const item = ctx.addLabel(text, x, y, 12, root, cellWidth, 22, `hud-memory-${index}`);
    item.color = row.exhausted ? new Color(255, 255, 255, 112) : new Color(255, 250, 228, 255);
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
  drawPanel(node, width, height, new Color(255, 238, 198, 214));
  const button = node.getComponent(Button) ?? node.addComponent(Button);
  button.target = node;
  button.transition = Button.Transition.COLOR;
  button.interactable = true;
  button.normalColor = new Color(255, 255, 255, 255);
  button.pressedColor = new Color(255, 228, 176, 255);
  button.hoverColor = new Color(255, 255, 255, 255);
  button.disabledColor = new Color(255, 255, 255, 120);
  node.off(Button.EventType.CLICK);
  node.on(Button.EventType.CLICK, cb);
  const label = ctx.addLabel(text, 0, 1, 13, node, width - 8, height - 4, 'hud-memory-toggle-label');
  label.color = new Color(95, 58, 36, 255);
  label.lineHeight = 17;
}
