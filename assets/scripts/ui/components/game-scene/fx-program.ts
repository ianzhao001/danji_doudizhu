import { Node, Tween, UIOpacity, UITransform, Vec3, tween } from 'cc';
import { buttonRipple, fxBurst, rocketBurst } from '../../animation-params';
import { RESOURCE_PATHS } from '../../asset-keys';

/**
 * v1.5 W3-B:程序化特效(涟漪/炸弹爆点/火箭升空)。
 * 统一挂 fx 层(render prune 豁免),tween 完成自毁;时长与几何基数全部出自 animation-params 纯岛,
 * 代码内只保留无量纲相位比例。调用方均已被 decideCuePlayback/feel.animated 的 animation 开关闸住。
 */

function fadeOutAndDestroy(node: Node, delayMs: number, fadeMs: number, fromOpacity = 255): void {
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = fromOpacity;
  tween(opacity)
    .delay(delayMs / 1000)
    .to(fadeMs / 1000, { opacity: 0 })
    .call(() => {
      node.removeFromParent();
      node.destroy();
    })
    .start();
}

/** 按钮点击白金涟漪(fx-ring):以按钮世界坐标为心,尺寸基数=renderHeight。 */
export function renderButtonRipple(this: any, worldPos: Vec3, sizeBase: number): void {
  if (!this.uiRoot) return;
  const params = buttonRipple();
  const layer = this.ensureFxLayer();
  const local = this.uiRoot.getComponent(UITransform)?.convertToNodeSpaceAR(worldPos) ?? new Vec3(0, 0, 0);
  const dia = sizeBase * params.sizeRatio;
  const node = this.addSprite(RESOURCE_PATHS.fxRing, local.x, local.y, dia, dia, layer, `fx-ripple-${Date.now()}`);
  node.setScale(params.scaleFrom, params.scaleFrom, 1);
  tween(node).to(params.ms / 1000, { scale: new Vec3(params.scaleTo, params.scaleTo, 1) }, { easing: 'quadOut' }).start();
  fadeOutAndDestroy(node, 0, params.ms, params.alphaFrom);
}

/** 炸弹爆点:冲击环 + 光斑×6 径向散射(角度表确定);stamp 与双轴抖动由 playEffect 侧保持。 */
export function renderBombBurst(this: any): void {
  if (!this.uiRoot) return;
  const params = fxBurst();
  const layer = this.ensureFxLayer();
  const stamp = Date.now();

  const ring = this.addSprite(RESOURCE_PATHS.fxRing, 0, 8, params.ringSizePx, params.ringSizePx, layer, `fx-bomb-ring-${stamp}`);
  ring.setScale(0.5, 0.5, 1);
  tween(ring).to(params.ringMs / 1000, { scale: new Vec3(params.ringScaleTo, params.ringScaleTo, 1) }, { easing: 'quadOut' }).start();
  fadeOutAndDestroy(ring, 0, params.ringMs, params.ringAlphaFrom);

  params.sparkAngles.forEach((deg: number, index: number) => {
    const rad = (deg * Math.PI) / 180;
    const spark = this.addSprite(RESOURCE_PATHS.fxSpark, 0, 8, params.sparkSizePx, params.sparkSizePx, layer, `fx-bomb-spark-${stamp}-${index}`);
    tween(spark)
      .to(params.sparkMs / 1000, {
        position: new Vec3(Math.cos(rad) * params.sparkDistance, 8 + Math.sin(rad) * params.sparkDistance, 0),
        scale: new Vec3(0.5, 0.5, 1),
      }, { easing: 'quadOut' })
      .start();
    fadeOutAndDestroy(spark, params.sparkMs * 0.4, params.sparkMs * 0.6);
  });
}

/** 火箭爆点:拖尾升空 + 顶点星爆(相位按 index 均布,零随机)。 */
export function renderRocketBurst(this: any): void {
  if (!this.uiRoot) return;
  const params = rocketBurst();
  const layer = this.ensureFxLayer();
  const stamp = Date.now();

  const trail = this.addSprite(RESOURCE_PATHS.fxTrail, 0, -params.riseHeight / 2, params.trailWidth, params.trailHeight, layer, `fx-rocket-trail-${stamp}`);
  tween(trail)
    .to(params.riseMs / 1000, { position: new Vec3(0, params.riseHeight / 2, 0) }, { easing: 'quadIn' })
    .start();
  fadeOutAndDestroy(trail, params.riseMs * 0.55, params.riseMs * 0.45);

  for (let index = 0; index < params.starCount; index += 1) {
    const rad = (index / params.starCount) * Math.PI * 2 + Math.PI / params.starCount;
    const star = this.addSprite(RESOURCE_PATHS.fxStar, 0, params.riseHeight / 2, params.starSizePx, params.starSizePx, layer, `fx-rocket-star-${stamp}-${index}`);
    const opacity = star.getComponent(UIOpacity) ?? star.addComponent(UIOpacity);
    opacity.opacity = 0;
    star.setScale(0.4, 0.4, 1);
    tween(star)
      .delay(params.riseMs / 1000)
      .to(params.starMs / 1000, {
        position: new Vec3(Math.cos(rad) * params.starRadius, params.riseHeight / 2 + Math.sin(rad) * params.starRadius, 0),
        scale: new Vec3(1, 1, 1),
      }, { easing: 'quadOut' })
      .start();
    tween(opacity)
      .delay(params.riseMs / 1000)
      .to((params.starMs * 0.2) / 1000, { opacity: 255 })
      .delay((params.starMs * 0.45) / 1000)
      .to((params.starMs * 0.35) / 1000, { opacity: 0 })
      .call(() => {
        star.removeFromParent();
        star.destroy();
      })
      .start();
  }
}

/** 清空 fx 层(startGame/跨局复位):停 tween 防僵尸回调,再销毁。 */
export function clearFxLayer(this: any): void {
  const layer = this.uiRoot?.getChildByName('fx-layer-runtime');
  if (!layer) return;
  for (const child of layer.children.slice()) {
    Tween.stopAllByTarget(child);
    const opacity = child.getComponent(UIOpacity);
    if (opacity) Tween.stopAllByTarget(opacity);
    child.removeFromParent();
    child.destroy();
  }
}
