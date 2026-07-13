import { BlockInputEvents, Color, Graphics, Node, UIOpacity, UITransform, tween, view } from 'cc';
import { sceneFade } from '../animation-params';

/**
 * v1.5 P-SCENE-FADE:场景转场黑幕。
 * - fadeThenLoad:当前场景淡入黑幕(outMs)后执行 load;动效关闭时直调 load。
 * - fadeInOnLoad:新场景 onLoad 时铺满幕并淡出(inMs),完成自毁;动效关闭时不铺幕。
 * 黑幕带 BlockInputEvents 防转场期误触。
 */

function buildCurtain(host: Node, name: string): { node: Node; opacity: UIOpacity } {
  const node = new Node(name);
  host.addChild(node);
  node.setSiblingIndex(host.children.length - 1);
  node.setPosition(0, 0, 0);
  const ut = host.getComponent(UITransform);
  const width = ut && ut.width > 0 ? ut.width : view.getVisibleSize().width;
  const height = ut && ut.height > 0 ? ut.height : view.getVisibleSize().height;
  node.addComponent(UITransform).setContentSize(width * 1.5, height * 1.5);
  const graphics = node.addComponent(Graphics);
  graphics.fillColor = new Color(20, 8, 16, 255);
  graphics.rect(-width * 0.75, -height * 0.75, width * 1.5, height * 1.5);
  graphics.fill();
  node.addComponent(BlockInputEvents);
  const opacity = node.addComponent(UIOpacity);
  return { node, opacity };
}

export function fadeThenLoad(host: Node | null, animated: boolean, load: () => void): void {
  if (!animated || !host || !host.isValid) {
    load();
    return;
  }
  const { node, opacity } = buildCurtain(host, 'scene-fade-out');
  opacity.opacity = 0;
  tween(opacity)
    .to(sceneFade().outMs / 1000, { opacity: 255 })
    .call(() => {
      if (node.isValid) load();
    })
    .start();
}

export function fadeInOnLoad(host: Node | null, animated: boolean): void {
  if (!animated || !host || !host.isValid) return;
  const { node, opacity } = buildCurtain(host, 'scene-fade-in');
  opacity.opacity = 255;
  tween(opacity)
    .to(sceneFade().inMs / 1000, { opacity: 0 })
    .call(() => {
      if (!node.isValid) return;
      node.removeFromParent();
      node.destroy();
    })
    .start();
}
