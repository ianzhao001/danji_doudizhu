import { BlockInputEvents, Graphics, Label, Node, Rect, Sprite, SpriteFrame, UIOpacity, Vec3, director, resources, tween } from 'cc';
import { resultEntrance, resultWinFx, settlementScoreRoll } from '../../animation-params';
import type { SeatIndex } from '../../../game';
import { RESOURCE_PATHS, spriteFrameResourcePath } from '../../asset-keys';
import { deriveScreenVM } from '../../screen-view';
import type { TableZones } from '../../table-zones';
import { THEME, addUiTransform, drawPanel, toColor } from '../ui-helpers';
import type { GameSceneRendererContext } from './seats-renderer';
import { seatDisplayName } from './seat-display';
import { fadeThenLoad } from '../scene-transition';
import { scoreRollFrames } from '../../score-roll';
import { composeSessionRows } from '../../session-score';

function seatNameWithRole(seat: number, isLandlord: boolean): string {
  return `${seatDisplayName(seat)}${isLandlord ? '（地主）' : ''}`;
}

const PANEL_TEXT = toColor(THEME.palette.brandDark);
// v1.6 二次终审:倍数行原用 brand (198,68,124) 压奶油面板仅 4.23:1(门C 实测)——加深到 5.4:1,仍是强调粉。
const PANEL_ACCENT = toColor({ r: 176, g: 52, b: 106, a: 255 });
const SCORE_FALLBACK = toColor(THEME.palette.textOnAccent, 116);
const HEADING_BACKDROP = toColor(THEME.palette.brandDark, 196);
const HEADING_TEXT = toColor(THEME.palette.textOnAccent);

type ScoreRollRuntimeLabel = Label & {
  __scoreRollId?: string;
  __scoreRollDone?: boolean;
};

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
  // W-VISION S4:结算面板换 v19;入场编排零改动。
  const skin = ctx.addSprite(RESOURCE_PATHS.settlementPanelV19, 0, 0, panelWidth, panelHeight, panel, 'settlement-panel-skin', true);
  skin.setSiblingIndex(0);
  const titleY = panelHeight / 2 - 24;
  const bannerY = panelHeight / 2 - 76;
  const bannerWidth = Math.min(panelWidth * 0.7, 320);
  const bannerHeight = Math.min(panelHeight * 0.2, 54);
  // v1.6 二次终审整改③(举一反三):v15 胜/负横幅是燕尾缎带——alpha 掩膜中段行最窄仅 75%(门D),
  // 即用户所指「依旧有不规则图像」的最后一处;且蓝紫缎带在全粉主题里偏色、双线内框贴着标题。
  // 换 v19 专用牌型牌匾(规则圆角 + 单一填充 + 一条细描边)。
  const banner = ctx.addSprite(
    RESOURCE_PATHS.patternLabelV19,
    0,
    bannerY,
    bannerWidth,
    bannerHeight,
    panel,
    'result-banner',
    true,
  );
  banner.setSiblingIndex(1);
  const headingBg = ctx.ensureNode('result-heading-backdrop', panel);
  headingBg.setPosition(0, titleY, 0);
  const headingWidth = Math.min(210, panelWidth - 108);
  const headingHeight = 34;
  addUiTransform(headingBg, headingWidth, headingHeight);
  drawPanel(headingBg, headingWidth, headingHeight, HEADING_BACKDROP);
  ctx.addLabel('本局结算', 0, titleY + 1, 'sectionTitle', panel,
    headingWidth - 18, THEME.typography.sectionTitle.lineHeight, 'result-heading', HEADING_TEXT);
  // 牌匾净区 94.6%×83.8%(门B):标题盒收进净区,长文案交 SHRINK 缩字号,永不压到描边。
  ctx.addLabel(result.resultText, 0, bannerY - 1, 'hero', panel,
    Math.round(bannerWidth * 0.85), Math.round(bannerHeight * 0.80), 'result-title', PANEL_TEXT);
  const multiplierY = bannerY - bannerHeight / 2 - 15;
  const springNote = result.springText ? `  ${result.springText}` : '';
  ctx.addLabel(`倍数 ×${result.multiplier}  炸弹 ${result.bombs}${springNote}`, 0, multiplierY, 'action', panel, panelWidth - 60, 24, 'result-multiplier', PANEL_ACCENT);
  const rows = composeSessionRows(result.scores, ctx.sessionTotals());
  const scoreTextFor = (values: readonly number[]): string => rows
    .map((row, index) => `${seatNameWithRole(row.seat, row.isLandlord)}  本局${formatScore(row.delta)}  累计${formatScore(values[index])}  余牌 ${handCounts[row.seat as SeatIndex] ?? 0}`)
    .join('\n');
  const scoreText = scoreTextFor(rows.map((row) => row.total));
  const resultKey = `${result.resultText}|${result.multiplier}|${scoreText}`;
  const resultAnimationId = `result:${resultKey}`;
  const firstResultRender = ctx.claimAnimationId(resultAnimationId);
  const animateResultEntrance = ctx.settings.animation && firstResultRender;
  // 三行 meta 的总行高为 45；板高取 47，给文字留满行高，同时在最矮 780×360 视口中
  // 避开倍率行。板底与按钮顶始终由 comfortable token 保持 12px 间距。
  const scorePanel = ctx.ensureNode('result-score-panel', panel);
  const scorePanelWidth = panelWidth - 74;
  const scorePanelHeight = 47;
  const actionHeight = 60;
  const buttonY = -panelHeight / 2 + 34;
  const scorePanelY = buttonY + actionHeight / 2 + THEME.spacing.comfortable + scorePanelHeight / 2;
  scorePanel.setPosition(0, scorePanelY, 0);
  addUiTransform(scorePanel, scorePanelWidth, scorePanelHeight);
  drawPanel(scorePanel, scorePanelWidth, scorePanelHeight, SCORE_FALLBACK);
  const existingScoreLabel = scorePanel
    .getChildByName('result-scores')
    ?.getComponent(Label) as ScoreRollRuntimeLabel | null;
  const rollingScore = existingScoreLabel?.__scoreRollId === resultAnimationId
    && existingScoreLabel.__scoreRollDone === false;
  const scoreLabel = ctx.addLabel(
    rollingScore
      ? existingScoreLabel.string
      : animateResultEntrance
        ? scoreTextFor(rows.map((row) => row.total - row.delta))
        : scoreText,
    0,
    0,
    'meta',
    scorePanel,
    scorePanelWidth - 18,
    scorePanelHeight - 2,
    'result-scores',
    PANEL_TEXT,
  ) as ScoreRollRuntimeLabel;

  ctx.addButton('再来一局', -68, buttonY, 124, actionHeight, true, () => ctx.startGame(true), panel, 'result-new');
  ctx.addButton('返回大厅', 68, buttonY, 124, actionHeight, true, () => {
    // v1.5 P-SCENE-FADE:黑幕淡入后切场景(动效关闭时直切)。
    fadeThenLoad(ctx.uiRoot, ctx.settings.animation, () => director.loadScene('lobby'));
  }, panel, 'result-lobby');
  // v1.5 P-RESULT-CINE:春天/反春 stamp(emphasis-spring 资产接活,读 result.springText,不动 cue 契约)。
  let springNode: Node | null = null;
  if (result.springText) {
    springNode = ctx.addSprite(RESOURCE_PATHS.emphasisSpring, bannerWidth / 2 - 8, bannerY + 14, 52, 52, panel, 'result-spring-stamp');
  }

  // v1.5 P-RESULT-CINE:败局暗角(上下 vignette 带,静态呈现;入场时随 scrim 淡入)。
  const isWin = result.resultText === '胜利';
  let vignette: Node | null = null;
  if (!isWin) {
    vignette = ctx.ensureNode('result-vignette', overlay);
    vignette.setPosition(0, 0, 0);
    addUiTransform(vignette, canvas.width, canvas.height);
    const g = vignette.getComponent(Graphics) ?? vignette.addComponent(Graphics);
    g.clear();
    g.fillColor = toColor(THEME.palette.brandDark, 96);
    g.rect(-canvas.width / 2, canvas.height / 2 - 56, canvas.width, 56);
    g.rect(-canvas.width / 2, -canvas.height / 2, canvas.width, 56);
    g.fill();
    vignette.setSiblingIndex(0);
  }

  panel.setSiblingIndex(overlay.children.length - 1);
  overlay.setSiblingIndex(ctx.uiRoot.children.length - 1);

  // v1.5 P-RESULT-CINE:入场编排(仅结算首帧播;animation=false 或已播过=保持既有静态直达)。
  if (animateResultEntrance) {
    const timing = resultEntrance();
    const overlayOpacity = overlay.getComponent(UIOpacity) ?? overlay.addComponent(UIOpacity);
    overlayOpacity.opacity = 0;
    tween(overlayOpacity).to(timing.scrimMs / 1000, { opacity: 255 }).start();

    panel.setScale(0.92, 0.92, 1);
    tween(panel).to(timing.panelMs / 1000, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' }).start();

    const bannerTargetY = bannerY;
    banner.setPosition(0, bannerTargetY + 40, 0);
    tween(banner)
      .delay(timing.bannerDelayMs / 1000)
      .to(timing.bannerMs / 1000, { position: new Vec3(0, bannerTargetY, 0) }, { easing: isWin ? 'backOut' : 'quadOut' })
      .start();

    const detailNodes: Node[] = [scorePanel];
    if (springNode) detailNodes.push(springNode);
    for (const detail of detailNodes) {
      const op = detail.getComponent(UIOpacity) ?? detail.addComponent(UIOpacity);
      op.opacity = 0;
      tween(op).delay(timing.detailDelayMs / 1000).to(timing.detailFadeMs / 1000, { opacity: 255 }).start();
    }
    const roll = settlementScoreRoll();
    const scoreFrames = rows.map((row) => scoreRollFrames(row.total - row.delta, row.total, roll.steps));
    scoreLabel.__scoreRollId = resultAnimationId;
    scoreLabel.__scoreRollDone = false;
    let scoreTween = tween(scoreLabel.node).delay(timing.detailDelayMs / 1000);
    for (let index = 0; index < roll.steps; index += 1) {
      scoreTween = scoreTween
        .call(() => {
          if (!scoreLabel.isValid || !scoreLabel.node?.isValid) return;
          scoreLabel.string = scoreTextFor(scoreFrames.map((frames) => frames[index]));
        })
        .delay(roll.stepMs / 1000);
    }
    scoreTween
      .call(() => {
        if (!scoreLabel.isValid || !scoreLabel.node?.isValid) return;
        scoreLabel.string = scoreText;
        scoreLabel.__scoreRollDone = true;
      })
      .start();
    if (springNode) {
      springNode.setScale(1.5, 1.5, 1);
      tween(springNode)
        .delay(timing.detailDelayMs / 1000)
        .to(timing.springPopMs / 1000, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
        .start();
    }

    ['result-new', 'result-lobby'].forEach((name, index) => {
      const buttonNode = ctx.ensureNode(name, panel);
      const targetY = buttonY;
      buttonNode.setPosition(buttonNode.position.x, targetY - 16, 0);
      const op = buttonNode.getComponent(UIOpacity) ?? buttonNode.addComponent(UIOpacity);
      op.opacity = 0;
      const delay = (timing.detailDelayMs + index * timing.buttonStaggerMs) / 1000;
      tween(buttonNode).delay(delay).to(timing.buttonSlideMs / 1000, { position: new Vec3(buttonNode.position.x, targetY, 0) }, { easing: 'quadOut' }).start();
      tween(op).delay(delay).to(timing.buttonFadeMs / 1000, { opacity: 255 }).start();
    });

    // v1.5 W3-B P-RESULT-CINE-B:胜局彩带+星光(fx 层免剪,startGame clearFxLayer 统一回收;败局无)。
    if (isWin) spawnResultWinFx(ctx, timing, showcase, panelWidth, panelHeight, bannerY, bannerWidth, resultAnimationId);
  }
}

function spawnResultWinFx(
  ctx: GameSceneRendererContext,
  timing: ReturnType<typeof resultEntrance>,
  center: { x: number; y: number },
  panelWidth: number,
  panelHeight: number,
  bannerY: number,
  bannerWidth: number,
  resultAnimationId: string,
): void {
  const fx = resultWinFx();
  const layer = ctx.fxLayer();

  // 星光:banner 两侧与上缘,scale 脉冲循环(index 相位,零随机)。
  for (let i = 0; i < fx.starCount; i += 1) {
    const offsetX = (i - (fx.starCount - 1) / 2) * (bannerWidth * 0.42);
    const offsetY = bannerY + (i % 2 === 0 ? 20 : 34);
    const star = ctx.addSprite(RESOURCE_PATHS.fxStarV19, center.x + offsetX, center.y + offsetY, fx.starSizePx, fx.starSizePx, layer, `result-fx-star-${i}`);
    const starOpacity = star.getComponent(UIOpacity) ?? star.addComponent(UIOpacity);
    starOpacity.opacity = 165;
    tween(star)
      .delay((i / fx.starCount) * (fx.starPulseMs / 1000))
      .repeatForever(
        tween(star)
          .to(fx.starPulseMs / 2000, { scale: new Vec3(fx.starScaleTo, fx.starScaleTo, 1) })
          .to(fx.starPulseMs / 2000, { scale: new Vec3(1, 1, 1) }),
      )
      .start();
  }

  // 彩带:fx-confetti 4×2 图集运行时裁格(128px cell),竖落+横摆+旋转循环;散布/相位 index 确定。
  resources.load(spriteFrameResourcePath(RESOURCE_PATHS.fxConfettiV19), SpriteFrame, (error, base) => {
    if (error || !base || !layer.isValid || !ctx.hasAnimationId(resultAnimationId)) return;
    for (let i = 0; i < timing.confettiCount; i += 1) {
      const cell = i % 8;
      const frame = new SpriteFrame();
      frame.texture = base.texture;
      frame.rect = new Rect((cell % 4) * 128, Math.floor(cell / 4) * 128, 128, 128);
      const node = new Node(`result-fx-confetti-${i}`);
      node.parent = layer;
      node.layer = layer.layer;
      addUiTransform(node, fx.confettiSizePx, fx.confettiSizePx);
      const sprite = node.addComponent(Sprite);
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.type = Sprite.Type.SIMPLE;
      sprite.spriteFrame = frame;
      const u = (i * 0.618034) % 1;
      const x0 = center.x + (u - 0.5) * panelWidth * fx.spreadRatio;
      const yTop = center.y + panelHeight / 2 + fx.confettiSizePx;
      const yBottom = center.y - panelHeight / 2 - fx.confettiSizePx;
      const swayDir = i % 2 === 0 ? 1 : -1;
      const angle0 = ((i * 47) % 90) - 45;
      node.setPosition(x0, yTop, 0);
      node.angle = angle0;
      const fallSeconds = timing.confettiFallMs / 1000;
      tween(node)
        .delay(u * fallSeconds)
        .repeatForever(
          tween(node)
            .set({ position: new Vec3(x0, yTop, 0), angle: angle0 })
            .to(fallSeconds, {
              position: new Vec3(x0 + swayDir * fx.swayPx, yBottom, 0),
              angle: angle0 + swayDir * fx.rotateDeg,
            }, { easing: 'quadIn' }),
        )
        .start();
    }
  });
}

function formatScore(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}
