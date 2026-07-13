import { Graphics, Node, UIOpacity, Vec3, tween } from 'cc';
import { dealCardDelay, dealFlight, playFlyArc, playFlyFromTo } from '../../animation-params';
import { THEME, toColor } from '../ui-helpers';

export function animateCardDeal(this: any, node: Node, x: number, y: number, index: number, total: number): void {
  // v1.5 P-CARD-FLIGHT:发牌自上方中央「散开落位」轨迹(替代原地 42px 升起),带 0.85→1 缩放。
  const delay = dealCardDelay(index, total) / 1000;
  const flight = dealFlight();
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = 0;
  node.setPosition(x * 0.15, y + 120, 0);
  node.setScale(flight.fromScale, flight.fromScale, 1);
  tween(node)
    .delay(delay)
    .to(flight.durationMs / 1000, { position: new Vec3(x, y, 0), scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
    .start();
  tween(opacity).delay(delay).to(0.12, { opacity: 255 }).start();
}

export function animateCardPlay(this: any, node: Node, x: number, y: number, fromDir?: { dx: number; dy: number }): void {
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = 0;
  if (!fromDir) {
    // 无方向(断局恢复重建/兜底):保持既有自下方淡入语义。
    const fly = playFlyFromTo();
    node.setPosition(x, y + fly.fromY, 0);
    tween(node).to(fly.durationMs / 1000, { position: new Vec3(x, y + fly.toY, 0) }).start();
    tween(opacity).to(Math.min(0.14, fly.durationMs / 1000), { opacity: 255 }).start();
    return;
  }
  // v1.5 P-CARD-FLIGHT:方向化弧线飞入(hero 自下、左右家自侧翼),两段缓动+轻旋转回正。
  const arc = playFlyArc();
  const dur = arc.durationMs / 1000;
  const tilt = fromDir.dx === 0 ? arc.rotateDeg : arc.rotateDeg * Math.sign(fromDir.dx);
  node.setPosition(x + fromDir.dx, y + fromDir.dy, 0);
  node.angle = tilt;
  tween(node)
    .to(dur * 0.55, { position: new Vec3(x + fromDir.dx * 0.3, y + arc.liftY, 0) }, { easing: 'quadOut' })
    .to(dur * 0.45, { position: new Vec3(x, y, 0), angle: 0 }, { easing: 'quadIn' })
    .start();
  tween(opacity).to(Math.min(0.14, dur), { opacity: 255 }).start();
}

export function animateScaleIn(this: any, node: Node, fromScale: number, durationMs: number): void {
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = 0;
  node.setScale(fromScale, fromScale, 1);
  tween(node).to(durationMs / 1000, { scale: new Vec3(1, 1, 1) }).start();
  tween(opacity).to(Math.min(0.16, durationMs / 1000), { opacity: 255 }).start();
}

export function prepareToastAnimation(this: any, node: Node, id: number): void {
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  if (!this.settings.animation) {
    opacity.opacity = 255;
    node.setScale(1, 1, 1);
    return;
  }
  if (this.animatedToastIds.has(id)) {
    opacity.opacity = 255;
    node.setScale(1, 1, 1);
    return;
  }
  this.animatedToastIds.add(id);
  opacity.opacity = 0;
  node.setScale(0.96, 0.96, 1);
  tween(opacity).to(0.14, { opacity: 255 }).start();
  tween(node).to(0.14, { scale: new Vec3(1, 1, 1) }).start();
}

export function drawDimOverlay(this: any, parent: Node, width: number, height: number): void {
  const graphics = parent.getComponent(Graphics) ?? parent.addComponent(Graphics);
  graphics.clear();
  graphics.fillColor = toColor(THEME.palette.overlayScrim);
  graphics.rect(-width / 2, -height / 2, width, height);
  graphics.fill();
}
