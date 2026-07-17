import { Node, Tween, UIOpacity, Vec3, tween } from 'cc';
import {
  CardAnimationLifecycle,
  type CardAnimationSink,
  type CardChoreography,
  type CardChoreographyTrack,
  type CardTransform,
} from '../../card-choreography';

export const CARD_RUNTIME_NODE_PREFIX = 'card:';

type RuntimeCardNode = Node & {
  __cardStageKey?: string;
  __cardStageZone?: string;
  __cardStageZ?: number;
};

export function cardRuntimeNodeName(key: string): string {
  return `${CARD_RUNTIME_NODE_PREFIX}${key}`;
}

export function cardKeyFromRuntimeNodeName(name: string): string | null {
  return name.startsWith(CARD_RUNTIME_NODE_PREFIX)
    ? name.slice(CARD_RUNTIME_NODE_PREFIX.length)
    : null;
}

/**
 * Cocos adapter for the engine-free card choreography.
 *
 * `prepare()` claims keys before render, `startPrepared()` runs after render
 * has refreshed content, and every completion/interrupt writes the pure
 * choreography terminal exactly before ownership is released.
 */
export class CardAnimator {
  private readonly lifecycle: CardAnimationLifecycle<RuntimeCardNode>;
  private readonly animationIds = new Set<string>();

  constructor(onSettled?: () => void) {
    const sink: CardAnimationSink<RuntimeCardNode> = {
      apply: (node, transform, opacity) => {
        if (node.isValid) applyCardTransform(node, transform, opacity);
      },
      stop: (node) => {
        Tween.stopAllByTarget(node);
        const opacity = node.getComponent(UIOpacity);
        if (opacity) Tween.stopAllByTarget(opacity);
      },
      animate: (node, track, done) => this.startTrack(node, track, done),
    };
    this.lifecycle = new CardAnimationLifecycle(sink, onSettled);
  }

  owns(key: string): boolean {
    return this.lifecycle.owns(key);
  }

  isAnimating(): boolean {
    return this.lifecycle.isAnimating();
  }

  isBusy(): boolean {
    return this.lifecycle.isBusy();
  }

  /** R1/R2: duplicate/no-op ignores; a changed new id settles before claim. */
  prepare(choreography: CardChoreography): boolean {
    return this.lifecycle.prepare(choreography);
  }

  /** Start only after render has ensured all key-addressed physical nodes. */
  startPrepared(resolveNode: (key: string) => Node | null): void {
    this.lifecycle.startPrepared((key) => {
      const node = resolveNode(key) as RuntimeCardNode | null;
      return node?.isValid ? node : null;
    });
  }

  /** R2/public settlement: stop every tween, snap terminals, then release. */
  settleAll(notify = true): void {
    this.lifecycle.settleAll(notify);
  }

  /** One shared R1 gate replaces per-renderer result/toast id caches. */
  claimAnimationId(id: string): boolean {
    if (this.animationIds.has(id)) return false;
    this.animationIds.add(id);
    return true;
  }

  hasAnimationId(id: string): boolean {
    return this.animationIds.has(id);
  }

  reset(): void {
    this.lifecycle.reset();
    this.animationIds.clear();
  }

  private startTrack(node: RuntimeCardNode, track: CardChoreographyTrack, done: () => void): void {
    const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    let motion = tween(node);
    let fade = tween(opacity);
    for (const segment of track.segments) {
      const seconds = segment.durationMs / 1000;
      motion = motion
        .call(() => {
          if (!node.isValid) return;
          node.__cardStageZ = segment.to.z;
          reorderCardLayer(node.parent);
        })
        .to(seconds, {
          position: new Vec3(segment.to.x, segment.to.y, 0),
          scale: new Vec3(segment.to.scale, segment.to.scale, 1),
          angle: segment.to.angle,
        }, { easing: segment.easing });
      fade = fade.to(seconds, { opacity: segment.opacity }, { easing: segment.easing });
    }
    motion.call(done).start();
    fade.start();
  }
}

function applyCardTransform(
  node: RuntimeCardNode,
  transform: CardTransform,
  opacityValue: number,
): void {
  const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  node.setPosition(transform.x, transform.y, 0);
  node.setScale(transform.scale, transform.scale, 1);
  node.angle = transform.angle;
  node.__cardStageZ = transform.z;
  opacity.opacity = opacityValue;
  reorderCardLayer(node.parent);
}

function reorderCardLayer(parent: Node | null): void {
  if (!parent) return;
  const cards = parent.children
    .filter((child): child is RuntimeCardNode => child.name.startsWith(CARD_RUNTIME_NODE_PREFIX))
    .sort((left, right) => (left.__cardStageZ ?? 0) - (right.__cardStageZ ?? 0));
  cards.forEach((card, index) => card.setSiblingIndex(index));
}
