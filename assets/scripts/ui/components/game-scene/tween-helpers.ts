import { Color, Graphics, Node, UIOpacity, Vec3, tween } from 'cc';
import { dealCardDelay, playFlyFromTo } from '../../animation-params';

export function animateCardDeal(this: any, node: Node, x: number, y: number, index: number, total: number): void {
  const delay = dealCardDelay(index, total) / 1000;
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = 0;
  node.setPosition(x, y - 42, 0);
  tween(node).delay(delay).to(0.18, { position: new Vec3(x, y, 0) }).start();
  tween(opacity).delay(delay).to(0.12, { opacity: 255 }).start();
}

export function animateCardPlay(this: any, node: Node, x: number, y: number): void {
  const fly = playFlyFromTo();
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = 0;
  node.setPosition(x, y + fly.fromY, 0);
  tween(node).to(fly.durationMs / 1000, { position: new Vec3(x, y + fly.toY, 0) }).start();
  tween(opacity).to(Math.min(0.14, fly.durationMs / 1000), { opacity: 255 }).start();
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
  graphics.fillColor = new Color(0, 0, 0, 218);
  graphics.rect(-width / 2, -height / 2, width, height);
  graphics.fill();
}
