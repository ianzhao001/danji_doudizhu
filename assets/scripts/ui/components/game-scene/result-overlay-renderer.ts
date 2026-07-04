import { director, Sprite } from 'cc';
import { RESOURCE_PATHS } from '../../asset-keys';
import { deriveScreenVM } from '../../screen-view';
import { addUiTransform, loadSprite } from '../ui-helpers';
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

export function renderResult(
  ctx: GameSceneRendererContext,
  result: ReturnType<typeof deriveScreenVM>['result'],
  canvas: { width: number; height: number },
): void {
  if (!result) return;
  const panel = ctx.ensureNode('settlement-panel-runtime', ctx.uiRoot);
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
  loadSprite(RESOURCE_PATHS.settlementBg, sprite, ctx.spriteFrames);
  ctx.addLabel(result.resultText, 0, panelHeight * 0.36, 34, panel, 220, 72, 'result-title');
  ctx.addLabel(`倍数 ×${result.multiplier}  炸弹 ${result.bombs}`, 0, panelHeight * 0.22, 20, panel, 240, 40, 'result-multiplier');
  ctx.addLabel(result.springText || '本局结算', 0, panelHeight * 0.12, 18, panel, 240, 40, 'result-spring');
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
  );
  ctx.addButton('再来一局', -74, buttonY, 116, 42, true, () => ctx.startGame(true), panel, 'result-new');
  ctx.addButton('返回大厅', 74, buttonY, 116, 42, true, () => director.loadScene('lobby'), panel, 'result-lobby');
  if (ctx.settings.animation) ctx.animateScaleIn(panel, 0.92, 180);
}
