/**
 * W-VISION S5b 编排契约修订（规划者预写红种子 · 2026-07-16 · sota2）。
 *
 * 落位：Codex 逐字节覆盖 test/ui/card-choreography.test.ts，独立 seed commit。
 * 唯一语义变更：**出牌轨道由「恰好两段」升级为「恰好三段」**——
 *   ①rise(quadOut,拱顶+侧倾) ②impact(落点压扁:x/y/z/angle 已到 next,仅 scale 压至
 *   next.scale×[0.85,0.98)) ③rebound(回弹,终态逐字段 ≡ next placement 裸字段)。
 * 「末段终态 ≡ next.byKey 裸字段」「durations 求和 ≡ durationMs」「instant 归零同路」
 * 三条核心不变量一字不变。其余用例逐字保留。
 * 预期红因（S5b 实现前）：现实现 playSegments 只有 rise+settle 两段 → 三段断言红。
 */
import { describe, expect, it } from 'vitest';
import { Rank, Suit, type Card } from '../../assets/scripts/rules';
import { cardKey } from '../../assets/scripts/rules/guards';
import type { CardPlacement, CardStage, CardZone } from '../../assets/scripts/ui/card-stage';
import {
  CardAnimationLifecycle,
  decideCardChoreographyStart,
  instant,
  isNoopCardChoreography,
  planCardChoreography,
  type CardAnimationSink,
  type CardTransform,
} from '../../assets/scripts/ui/card-choreography';

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

function placement(
  value: Card,
  zone: CardZone,
  transform: { x: number; y: number; scale?: number; angle?: number; z: number },
  spawnFrom: CardPlacement['spawnFrom'] = null,
): CardPlacement {
  return {
    key: cardKey(value),
    card: value,
    zone,
    x: transform.x,
    y: transform.y,
    scale: transform.scale ?? 1,
    angle: transform.angle ?? 0,
    z: transform.z,
    faceUp: true,
    selected: false,
    interactive: zone === 'hand',
    spawnFrom,
  };
}

function stage(placements: readonly CardPlacement[]): CardStage {
  return {
    placements,
    byKey: new Map(placements.map((item) => [item.key, item])),
    handHits: [],
  };
}

const THREE = card(Rank.R3, Suit.Spade);
const FOUR = card(Rank.R4, Suit.Heart);
const FIVE = card(Rank.R5, Suit.Club);

interface FakeCardNode {
  transform: CardTransform | null;
  opacity: number | null;
  stops: number;
}

function animationHarness(onSettled?: () => void): {
  lifecycle: CardAnimationLifecycle<FakeCardNode>;
  pending: Map<FakeCardNode, () => void>;
  animated: FakeCardNode[];
} {
  const pending = new Map<FakeCardNode, () => void>();
  const animated: FakeCardNode[] = [];
  const sink: CardAnimationSink<FakeCardNode> = {
    apply(node, transform, opacity) {
      node.transform = { ...transform };
      node.opacity = opacity;
    },
    stop(node) {
      node.stops += 1;
      pending.delete(node);
    },
    animate(node, _track, done) {
      animated.push(node);
      pending.set(node, done);
    },
  };
  return { lifecycle: new CardAnimationLifecycle(sink, onSettled), pending, animated };
}

function fakeNode(): FakeCardNode {
  return { transform: null, opacity: null, stops: 0 };
}

/**
 * Load-bearing invariant gate: compare against CardPlacement's raw fields.
 * Never route this expectation through the production transform converter,
 * which would make a transform regression self-fulfilling.
 */
function expectTransformMatchesPlacement(
  actual: CardTransform | null,
  placement: CardPlacement,
  message = `${placement.key} transform drifted from CardStage`,
): void {
  expect(actual, `${message}: transform must exist`).not.toBeNull();
  if (!actual) return;
  expect(actual.x, `${message}: x`).toBe(placement.x);
  expect(actual.y, `${message}: y`).toBe(placement.y);
  expect(actual.scale, `${message}: scale`).toBe(placement.scale);
  expect(actual.angle, `${message}: angle`).toBe(placement.angle);
  expect(actual.z, `${message}: z`).toBe(placement.z);
}

describe('W-VISION S3 card-choreography 纯岛', () => {
  it('stage diff 按 next z 顺序产出 track，并单列消失 key、跳过完全未动的牌', () => {
    const unmovedBefore = placement(THREE, 'hand', { x: -80, y: -120, z: 3_000 });
    const removed = placement(FOUR, 'table', { x: 0, y: 10, scale: 0.8, z: 2_000 });
    const unmovedAfter = { ...unmovedBefore };
    const added = placement(
      FIVE,
      'hand',
      { x: 40, y: -120, z: 3_001 },
      { x: 0, y: 150, scale: 0.18, angle: 0 },
    );

    const choreography = planCardChoreography({
      id: 'deal:1',
      previous: stage([removed, unmovedBefore]),
      next: stage([unmovedAfter, added]),
    });

    expect(choreography.tracks.map((track) => track.key)).toEqual([cardKey(FIVE)]);
    expect(choreography.removedKeys).toEqual([cardKey(FOUR)]);
    expect(choreography.tracks.some((track) => choreography.removedKeys.includes(track.key))).toBe(false);
    expect(choreography.tracks[0].from).toEqual({ x: 0, y: 150, scale: 0.18, angle: 0, z: 3_001 });
    expect(choreography.tracks[0].fromOpacity).toBe(0);
  });

  it('hand → table 是确定的三段飞行(rise/impact压扁/rebound)，最后一段严格等于 next placement', () => {
    const previous = placement(THREE, 'hand', { x: -90, y: -130, z: 3_000 });
    const next = placement(THREE, 'table', { x: 12, y: 4, scale: 0.74, angle: 0, z: 2_000 });
    const choreography = planCardChoreography({
      id: 'play:hero:1',
      previous: stage([previous]),
      next: stage([next]),
    });
    const track = choreography.tracks[0];

    expect(track.segments).toHaveLength(3);
    // ①rise:拱顶高于两端 + 侧倾
    expect(track.segments[0].to.y).toBeGreaterThan(Math.max(previous.y, next.y));
    expect(track.segments[0].to.angle).not.toBe(0);
    // ②impact:x/y/z/angle 已到 next,仅 scale 压扁至 next.scale×[0.85, 0.98)——
    // 弹跳只准动 scale,不准动落点(落点漂移会破坏「牌落在哪」的权威语义)。
    const impact = track.segments[1];
    expect(impact.to.x).toBe(next.x);
    expect(impact.to.y).toBe(next.y);
    expect(impact.to.z).toBe(next.z);
    expect(impact.to.angle).toBe(next.angle);
    expect(impact.to.scale).toBeGreaterThanOrEqual(next.scale * 0.85);
    expect(impact.to.scale).toBeLessThan(next.scale * 0.98);
    expect(impact.durationMs).toBeGreaterThan(0);
    // ③rebound:终态逐字段 ≡ next placement 裸字段(核心不变量,不经产品换算函数)
    expectTransformMatchesPlacement(track.segments.at(-1)!.to, next);
    expect(track.segments.at(-1)!.opacity).toBe(255);
    expect(track.segments.at(-1)!.durationMs).toBeGreaterThan(0);
    expect(track.segments.reduce((sum, segment) => sum + segment.durationMs, 0)).toBe(choreography.durationMs);
  });

  it('所有 track 的终态都逐字段等于 next.byKey，含 z 与 opacity 收口', () => {
    const beforeThree = placement(THREE, 'hand', { x: -70, y: -130, z: 3_000 });
    const beforeFour = placement(FOUR, 'hand', { x: 0, y: -130, z: 3_001 });
    const afterThree = placement(THREE, 'table', { x: -10, y: 8, scale: 0.72, z: 2_000 });
    const afterFour = placement(FOUR, 'hand', { x: -35, y: -112, z: 3_000 });
    const afterFive = placement(
      FIVE,
      'bottom',
      { x: 25, y: 150, scale: 0.4, z: 1_000 },
      { x: 0, y: 150, scale: 0.12, angle: 0 },
    );
    const next = stage([afterFive, afterThree, afterFour]);
    const choreography = planCardChoreography({
      id: 'mixed:1',
      previous: stage([beforeThree, beforeFour]),
      next,
    });

    expect(choreography.tracks).toHaveLength(3);
    for (const track of choreography.tracks) {
      const terminal = track.segments.at(-1)!;
      expectTransformMatchesPlacement(
        terminal.to,
        next.byKey.get(track.key)!,
        `${track.key} terminal transform drifted from CardStage`,
      );
      expect(terminal.opacity).toBe(255);
    }
  });

  it('门自证：终态 x 偏移 7px 必被 CardPlacement 裸字段判据抓住', () => {
    const expected = placement(THREE, 'table', { x: 12, y: 4, scale: 0.74, angle: 2, z: 2_000 });
    const shifted: CardTransform = {
      x: expected.x + 7,
      y: expected.y,
      scale: expected.scale,
      angle: expected.angle,
      z: expected.z,
    };

    expect(
      () => expectTransformMatchesPlacement(
        shifted,
        expected,
        'MUTATION SELF-CHECK: terminal offset must be rejected',
      ),
    ).toThrow(/MUTATION SELF-CHECK: terminal offset must be rejected: x/);
  });

  it('新手牌从 spawnFrom 发牌且 stagger 可重复，输出不依赖 id 以外的外部状态', () => {
    const next = stage([
      placement(THREE, 'hand', { x: -30, y: -130, z: 3_000 }, { x: 0, y: 150, scale: 0.18, angle: 0 }),
      placement(FOUR, 'hand', { x: 30, y: -130, z: 3_001 }, { x: 0, y: 150, scale: 0.18, angle: 0 }),
    ]);
    const args = { id: 'deal:2', previous: stage([]), next } as const;
    const first = planCardChoreography(args);
    const second = planCardChoreography(args);

    expect(first).toEqual(second);
    expect(first.tracks[0].segments).toHaveLength(1);
    expect(first.tracks[1].segments).toHaveLength(2);
    expect(first.tracks[1].segments[0].opacity).toBe(0);
    expect(first.tracks[1].segments[0].durationMs).toBeGreaterThan(0);
    expect(first.durationMs).toBeGreaterThan(first.tracks[0].segments[0].durationMs);
  });

  it('R1/R2：同 id 与 stage no-op ignore；有 diff 的新 id 才 settle-and-start', () => {
    const choreography = planCardChoreography({
      id: 'event:7',
      previous: stage([]),
      next: stage([placement(THREE, 'hand', { x: 0, y: -120, z: 3_000 })]),
    });

    expect(decideCardChoreographyStart('event:7', choreography)).toEqual({ kind: 'ignore' });
    const decision = decideCardChoreographyStart('event:6', choreography);
    expect(decision.kind).toBe('settle-and-start');
    if (decision.kind === 'settle-and-start') expect(decision.choreography).toBe(choreography);

    const stable = stage([placement(FOUR, 'hand', { x: 0, y: -120, z: 3_000 })]);
    const audioOnlyCue = planCardChoreography({ id: 'bomb:8', previous: stable, next: stable });
    expect(isNoopCardChoreography(audioOnlyCue)).toBe(true);
    expect(decideCardChoreographyStart('event:7', audioOnlyCue)).toEqual({ kind: 'ignore' });
  });

  it('R3 instant 归零整条时间路径但保留 id、终态与原编排输入', () => {
    const before = placement(THREE, 'hand', { x: -60, y: -130, z: 3_000 });
    const after = placement(THREE, 'table', { x: 8, y: 6, scale: 0.7, z: 2_000 });
    const choreography = planCardChoreography({
      id: 'play:instant',
      previous: stage([before]),
      next: stage([after]),
      blocking: false,
    });
    const originalTerminal = choreography.tracks[0].segments.at(-1)!;
    const immediate = instant(choreography);

    expect(immediate.id).toBe(choreography.id);
    expect(immediate.blocking).toBe(false);
    expect(immediate.durationMs).toBe(0);
    expect(immediate.tracks.flatMap((track) => track.segments).every((segment) => segment.durationMs === 0)).toBe(true);
    expect(immediate.tracks[0].segments.at(-1)!.to).toEqual(originalTerminal.to);
    expect(immediate.tracks[0].segments.at(-1)!.opacity).toBe(originalTerminal.opacity);
    expect(choreography.durationMs).toBeGreaterThan(0);
  });

  it('有限性防线：输出全有限；NaN stage 与空 id 立即拒绝', () => {
    const nextPlacement = placement(THREE, 'table', { x: 11, y: 9, scale: 0.75, angle: 2, z: 2_000 });
    const choreography = planCardChoreography({
      id: 'finite:1',
      previous: stage([]),
      next: stage([nextPlacement]),
    });
    for (const track of choreography.tracks) {
      for (const transform of [track.from, ...track.segments.map((segment) => segment.to)]) {
        expect(Object.values(transform).every(Number.isFinite)).toBe(true);
      }
      expect(track.segments.every((segment) => Number.isFinite(segment.durationMs))).toBe(true);
    }

    const invalid = placement(FOUR, 'hand', { x: Number.NaN, y: 0, z: 3_000 });
    expect(() => planCardChoreography({ id: 'bad', previous: stage([]), next: stage([invalid]) })).toThrow(
      'next.4:H.x must be finite',
    );
    expect(() => planCardChoreography({ id: '', previous: stage([]), next: stage([]) })).toThrow(
      'id must not be empty',
    );
  });

  it('动画生命周期：natural finish 先写 next 终态，再释放所有权', () => {
    const before = placement(THREE, 'hand', { x: -60, y: -130, z: 3_000 });
    const after = placement(THREE, 'table', { x: 8, y: 6, scale: 0.7, z: 2_000 });
    const choreography = planCardChoreography({
      id: 'lifecycle:natural',
      previous: stage([before]),
      next: stage([after]),
    });
    let settled = 0;
    const { lifecycle, pending } = animationHarness(() => { settled += 1; });
    const node = fakeNode();

    expect(lifecycle.prepare(choreography)).toBe(true);
    expect(lifecycle.owns(cardKey(THREE))).toBe(true);
    lifecycle.startPrepared(() => node);
    expectTransformMatchesPlacement(node.transform, before);
    expect(lifecycle.isBusy()).toBe(true);

    pending.get(node)!();
    expectTransformMatchesPlacement(node.transform, after);
    expect(node.opacity).toBe(255);
    expect(lifecycle.owns(cardKey(THREE))).toBe(false);
    expect(lifecycle.isBusy()).toBe(false);
    expect(settled).toBe(1);
  });

  it('动画生命周期：R2 新 id 先 stop+收到旧终态，旧回调不能穿透新编排', () => {
    const hand = placement(THREE, 'hand', { x: -60, y: -130, z: 3_000 });
    const tableA = placement(THREE, 'table', { x: 8, y: 6, scale: 0.7, z: 2_000 });
    const tableB = placement(THREE, 'table', { x: 28, y: 12, scale: 0.75, z: 2_000 });
    const first = planCardChoreography({ id: 'lifecycle:first', previous: stage([hand]), next: stage([tableA]) });
    const second = planCardChoreography({ id: 'lifecycle:second', previous: stage([tableA]), next: stage([tableB]) });
    const { lifecycle, pending } = animationHarness();
    const node = fakeNode();

    lifecycle.prepare(first);
    lifecycle.startPrepared(() => node);
    const staleDone = pending.get(node)!;
    expect(lifecycle.prepare(second)).toBe(true);
    expect(node.stops).toBe(1);
    expectTransformMatchesPlacement(node.transform, tableA);
    expect(lifecycle.owns(cardKey(THREE))).toBe(true);

    lifecycle.startPrepared(() => node);
    staleDone();
    expect(lifecycle.isBusy()).toBe(true);
    pending.get(node)!();
    expectTransformMatchesPlacement(node.transform, tableB);
    expect(node.opacity).toBe(255);
    expect(lifecycle.isBusy()).toBe(false);
  });

  it('动画生命周期：instant 同路立即终态；缺节点也不留 busy/owned 死锁', () => {
    const after = placement(
      FIVE,
      'hand',
      { x: 40, y: -120, z: 3_001 },
      { x: 0, y: 150, scale: 0.18, angle: 0 },
    );
    const choreography = instant(planCardChoreography({
      id: 'lifecycle:instant',
      previous: stage([]),
      next: stage([after]),
    }));
    let settled = 0;
    const { lifecycle, animated } = animationHarness(() => { settled += 1; });
    const node = fakeNode();

    lifecycle.prepare(choreography);
    lifecycle.startPrepared(() => node);
    expect(animated).toHaveLength(0);
    expectTransformMatchesPlacement(node.transform, after);
    expect(node.opacity).toBe(255);
    expect(lifecycle.isBusy()).toBe(false);
    expect(settled).toBe(1);

    const missing = animationHarness();
    missing.lifecycle.prepare({ ...choreography, id: 'lifecycle:missing' });
    missing.lifecycle.startPrepared(() => null);
    expect(missing.lifecycle.isAnimating()).toBe(false);
    expect(missing.lifecycle.isBusy()).toBe(false);
  });
});
