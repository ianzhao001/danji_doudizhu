import { Graphics, Node, UIOpacity, Vec3, tween } from 'cc';
import { THEME, toColor } from '../ui-helpers';

export function animateScaleIn(this: any, node: Node, fromScale: number, durationMs: number): void {
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = 0;
  node.setScale(fromScale, fromScale, 1);
  tween(node).to(durationMs / 1000, { scale: new Vec3(1, 1, 1) }).start();
  tween(opacity).to(Math.min(0.16, durationMs / 1000), { opacity: 255 }).start();
}

export function prepareToastAnimation(this: any, node: Node, id: number): void {
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  // Re-renders refresh toast content/existence but must not overwrite a
  // transform/opacity tween that already owns this one-shot id.
  if (!this.cardAnimator?.claimAnimationId(`toast:${id}`)) return;
  if (!this.settings.animation) {
    opacity.opacity = 255;
    node.setScale(1, 1, 1);
    return;
  }
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

/** S5b 瞬时落物：从当前 transform 落至目标，停留后淡出并销毁。 */
export function animateTransientDropAndDestroy(
  node: Node,
  target: Vec3,
  params: {
    dropMs: number;
    holdMs: number;
    fadeMs: number;
  },
): void {
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  opacity.opacity = 255;
  tween(node)
    .to(params.dropMs / 1000, {
      position: target,
      scale: new Vec3(1, 1, 1),
    }, { easing: 'backOut' })
    .start();
  tween(opacity)
    .delay((params.dropMs + params.holdMs) / 1000)
    .to(params.fadeMs / 1000, { opacity: 0 })
    .call(() => {
      if (!node.isValid) return;
      node.removeFromParent();
      node.destroy();
    })
    .start();
}
