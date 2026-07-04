import { Color, Graphics } from 'cc';
import { evaluateHand } from '../../../ai/handStrength';
import type { Card } from '../../../rules';
import { deriveCardMemoryView } from '../../card-memory-view';
import { deriveStrengthMeter } from '../../strength-meter-view';
import { trackPlayed } from '../../../ai/cardMemory';
import type { TableRegions } from '../../table-layout';
import { addUiTransform, drawPanel } from '../ui-helpers';
import type { GameSceneRendererContext } from './seats-renderer';

export function renderHud(
  ctx: GameSceneRendererContext,
  hand: Card[],
  layout: TableRegions,
  canvas: { width: number; height: number },
): void {
  if (hand.length === 0) return;
  renderStrengthMeter(ctx, hand, layout, canvas);
  renderCardMemory(ctx, hand, layout, canvas);
}

function renderStrengthMeter(
  ctx: GameSceneRendererContext,
  hand: Card[],
  layout: TableRegions,
  canvas: { width: number; height: number },
): void {
  const strength = deriveStrengthMeter(evaluateHand(hand));
  const landscape = ctx.isLandscape(canvas);
  const centerY = landscape
    ? layout.playArea.y + layout.playArea.height + Math.min(14, Math.max(10, (layout.actionButtons.y - (layout.playArea.y + layout.playArea.height)) * 0.36))
    : layout.actionButtons.y - 30;
  const pos = ctx.screenPoint(canvas, canvas.width / 2, centerY);
  const width = landscape ? Math.min(218, Math.max(194, canvas.width * 0.27)) : Math.min(260, Math.max(210, canvas.width - 96));
  const height = landscape ? 26 : 34;
  const root = ctx.ensureNode('hud-strength-meter', ctx.uiRoot);
  root.setPosition(pos.x, pos.y, 0);
  addUiTransform(root, width, height);
  drawPanel(root, width, height, new Color(48, 40, 58, 178));

  const barWidth = width - 104;
  const barHeight = landscape ? 6 : 8;
  const barX = 30;
  const bar = ctx.ensureNode('hud-strength-bar', root);
  bar.setPosition(barX, landscape ? -5 : -7, 0);
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

  ctx.addLabel('手牌强度', -width / 2 + 44, landscape ? 3 : 5, landscape ? 12 : 13, root, 82, 20, 'hud-strength-title');
  ctx.addLabel(`${strength.label} ${strength.pct}%`, width / 2 - 54, landscape ? 3 : 5, landscape ? 12 : 13, root, 102, 20, 'hud-strength-value');
}

export function renderCardMemory(
  ctx: GameSceneRendererContext,
  hand: Card[],
  layout: TableRegions,
  canvas: { width: number; height: number },
): void {
  const memory = deriveCardMemoryView(trackPlayed(ctx.fullGameEvents, hand));
  const rows = ctx.memoryExpanded ? memory.rows : memory.rows.slice(0, 6);
  const landscape = ctx.isLandscape(canvas);
  const panelWidth = landscape
    ? (ctx.memoryExpanded ? 220 : 196)
    : Math.min(334, Math.max(286, canvas.width - 44));
  const panelHeight = landscape
    ? (ctx.memoryExpanded ? 104 : 72)
    : (ctx.memoryExpanded ? 112 : 58);
  const centerX = landscape
    ? Math.max(panelWidth / 2 + 12, layout.playArea.x - panelWidth / 2 - 14)
    : canvas.width / 2;
  const centerY = landscape
    ? layout.playArea.y + layout.playArea.height * 0.55
    : layout.actionButtons.y - (ctx.memoryExpanded ? 98 : 76);
  const pos = ctx.screenPoint(canvas, centerX, centerY);
  const root = ctx.ensureNode('hud-card-memory', ctx.uiRoot);
  root.setPosition(pos.x, pos.y, 0);
  addUiTransform(root, panelWidth, panelHeight);
  drawPanel(root, panelWidth, panelHeight, new Color(42, 54, 62, 168));

  ctx.addLabel('剩牌', -panelWidth / 2 + 24, panelHeight / 2 - 18, 13, root, 42, 24, 'hud-memory-title');
  const toggleLabel = ctx.memoryExpanded ? '收起' : '展开';
  const toggle = ctx.addButton(toggleLabel, -panelWidth / 2 + 76, panelHeight / 2 - 18, 56, 28, true, () => {
    ctx.setMemoryExpanded(!ctx.memoryExpanded);
    ctx.render();
  }, root, 'hud-memory-toggle');
  toggle.fontSize = 14;
  toggle.lineHeight = 18;

  const cols = ctx.memoryExpanded ? 5 : 6;
  const cellWidth = Math.floor((panelWidth - 28) / cols);
  rows.forEach((row, index) => {
    const col = index % cols;
    const line = Math.floor(index / cols);
    const x = -panelWidth / 2 + 16 + cellWidth / 2 + col * cellWidth;
    const y = panelHeight / 2 - (landscape ? 44 : 52) - line * (landscape ? 19 : 24);
    const text = `${row.rankLabel}${row.remaining}`;
    const item = ctx.addLabel(text, x, y, 12, root, cellWidth, 22, `hud-memory-${index}`);
    item.color = row.exhausted ? new Color(255, 255, 255, 112) : new Color(255, 250, 228, 255);
  });

  if (!ctx.memoryExpanded) {
    const more = memory.rows.length - rows.length;
    ctx.addLabel(`+${more}`, panelWidth / 2 - 22, landscape ? -20 : -11, 12, root, 34, 22, 'hud-memory-more');
  }
}
