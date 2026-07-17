#!/usr/bin/env node
/**
 * W-VISION-S5b runtime evidence:
 * - play rise / impact / rebound frames
 * - post-settle pattern burst
 * - settlement score roll
 * - landlord hat ceremony
 * - three completed rounds followed by a clean new-round leak census
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = path.join(ROOT, 'coordination/reports/W-VISION-S5b-evidence');
const SHOTS = path.join(OUT, 'shots');
const BASE = process.env.S5B_BASE ?? 'http://127.0.0.1:7792/build/web-mobile/';
const SEED = 14;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });

const HELPERS = `
function walkNodes(cb) {
  const scene = globalThis.cc?.director?.getScene?.();
  if (!scene) return null;
  const stack = [scene];
  while (stack.length) {
    const node = stack.pop();
    if (cb(node)) return node;
    for (const child of node.children || []) stack.push(child);
  }
  return null;
}
function findSkeleton() {
  let found = null;
  walkNodes((node) => {
    for (const component of node._components || []) {
      if (component && typeof component.render === 'function'
        && component.runtime !== undefined && typeof component.startGame === 'function') {
        found = component;
        return true;
      }
    }
    return false;
  });
  return found;
}
function sceneName() { return globalThis.cc?.director?.getScene?.()?.name ?? null; }
function nodeByName(name) {
  let found = null;
  walkNodes((node) => {
    if (node.name === name && node.activeInHierarchy) { found = node; return true; }
    return false;
  });
  return found;
}
function nodeByPrefix(prefix) {
  let found = null;
  walkNodes((node) => {
    if (node.name.startsWith(prefix) && node.activeInHierarchy) { found = node; return true; }
    return false;
  });
  return found;
}
function nodeByLabel(text) {
  const cc = globalThis.cc;
  let found = null;
  walkNodes((node) => {
    if (!node.activeInHierarchy) return false;
    for (const component of node._components || []) {
      if (component && typeof component.string === 'string' && component.string.trim() === text) {
        let current = node;
        for (let index = 0; index < 4 && current; index += 1) {
          if (current.getComponent(cc.Button)) { found = current; return true; }
          current = current.parent;
        }
      }
    }
    return false;
  });
  return found;
}
function viewportPoint(node) {
  const cc = globalThis.cc;
  const canvas = cc.director.getScene().getComponentInChildren(cc.Canvas);
  const screen = canvas.cameraComponent.worldToScreen(node.worldPosition);
  const dom = document.getElementById('GameCanvas').getBoundingClientRect();
  const size = cc.view.getCanvasSize();
  return {
    x: dom.left + screen.x * (dom.width / size.width),
    y: dom.top + dom.height - screen.y * (dom.height / size.height),
  };
}
function buttonPoint(nameOrLabel) {
  const node = nodeByName(nameOrLabel) ?? nodeByLabel(nameOrLabel);
  if (!node) return { ok: false, target: nameOrLabel };
  return { ok: true, target: nameOrLabel, ...viewportPoint(node) };
}
function enabledButtonPoint(nameOrLabel) {
  const node = nodeByName(nameOrLabel) ?? nodeByLabel(nameOrLabel);
  if (!node) return { ok: false, enabled: false, target: nameOrLabel };
  const button = node.getComponent(globalThis.cc.Button);
  return { ok: true, enabled: Boolean(button?.interactable), target: nameOrLabel, ...viewportPoint(node) };
}
function turnInfo() {
  const skeleton = findSkeleton();
  return {
    phase: skeleton?.runtime?.phase?.() ?? null,
    myTurn: Boolean(skeleton?.runtime?.isPlayerTurn?.()),
    settled: Boolean(skeleton?.runtime?.settlement?.()),
    scores: skeleton?.runtime?.settlement?.()?.scores ?? null,
  };
}
function handCards() {
  const skeleton = findSkeleton();
  const layer = nodeByName('card-layer-runtime');
  if (!layer) return [];
  return layer.children
    .filter((node) => node.activeInHierarchy && node.name.startsWith('card:') && node.__cardStageZone === 'hand')
    .sort((left, right) => left.position.x - right.position.x)
    .map((node) => {
      const key = node.name.slice('card:'.length);
      const placement = skeleton?.cardStage?.byKey?.get?.(key) ?? null;
      return { key, selected: placement?.selected === true, ...viewportPoint(node) };
    });
}
function selectedKeys() {
  return handCards().filter((card) => card.selected).map((card) => card.key);
}
function cardSample(key) {
  const skeleton = findSkeleton();
  const layer = nodeByName('card-layer-runtime');
  const node = layer?.children?.find((child) => child.name === 'card:' + key) ?? null;
  const terminal = skeleton?.cardStage?.byKey?.get?.(key) ?? null;
  if (!node || !terminal) return null;
  return {
    key,
    zone: node.__cardStageZone ?? null,
    current: {
      x: node.position.x,
      y: node.position.y,
      scale: node.scale.x,
      angle: node.angle,
      z: node.__cardStageZ ?? null,
    },
    terminal: {
      x: terminal.x,
      y: terminal.y,
      scale: terminal.scale,
      angle: terminal.angle,
      z: terminal.z,
    },
  };
}
function transientSample(prefix) {
  const node = nodeByPrefix(prefix);
  if (!node) return null;
  const opacity = (node._components || []).find((component) => typeof component?.opacity === 'number');
  return {
    name: node.name,
    position: { x: node.position.x, y: node.position.y },
    scale: node.scale.x,
    opacity: opacity?.opacity ?? 255,
  };
}
function scoreSample() {
  const node = nodeByName('result-scores');
  const label = node?.getComponent(globalThis.cc.Label);
  if (!label) return null;
  return {
    text: label.string,
    rollId: label.__scoreRollId ?? null,
    done: label.__scoreRollDone ?? null,
  };
}
function animationBusy() {
  const skeleton = findSkeleton();
  return Boolean(skeleton?.cardAnimator?.isBusy?.());
}
function fxCensus() {
  const layer = nodeByName('fx-layer-runtime');
  return layer ? layer.children.filter((node) => node.isValid).map((node) => node.name).sort() : [];
}
function landlordDiagnostic() {
  const skeleton = findSkeleton();
  return {
    animation: skeleton?.settings?.animation ?? null,
    animationIds: Array.from(skeleton?.cardAnimator?.animationIds ?? []),
    recentEvents: (skeleton?.recentEvents ?? []).map((event) =>
      event.type === 'round' ? 'round:' + event.event?.type : event.type),
    fx: fxCensus(),
  };
}
function cardLayerState() {
  const skeleton = findSkeleton();
  const layer = nodeByName('card-layer-runtime');
  if (!layer) return { count: 0, expected: skeleton?.cardStage?.placements?.length ?? 0, drift: ['missing-layer'] };
  const nodes = layer.children.filter((node) => node.name.startsWith('card:') && node.isValid);
  const drift = [];
  for (const node of nodes) {
    const key = node.name.slice('card:'.length);
    const placement = skeleton?.cardStage?.byKey?.get?.(key);
    if (!placement) { drift.push(key + ':missing-placement'); continue; }
    const values = [
      ['x', node.position.x, placement.x],
      ['y', node.position.y, placement.y],
      ['scale', node.scale.x, placement.scale],
      ['angle', node.angle, placement.angle],
      ['z', node.__cardStageZ, placement.z],
    ];
    for (const [field, actual, expected] of values) {
      if (actual !== expected) drift.push(key + ':' + field + ':' + actual + '!=' + expected);
    }
  }
  return { count: nodes.length, expected: skeleton?.cardStage?.placements?.length ?? 0, drift };
}
`;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] });
const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
const page = await context.newPage();
const client = await context.newCDPSession(page);
await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') pageErrors.push(`console:${message.text()}`);
});

const evalIn = (expression) => page.evaluate(`(() => { ${HELPERS}; return (${expression}); })()`);
const tap = async (point, settleMs = 0) => {
  const touch = { x: Math.round(point.x), y: Math.round(point.y), id: 0, radiusX: 1, radiusY: 1 };
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch] });
  await page.waitForTimeout(60);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  if (settleMs > 0) await page.waitForTimeout(settleMs);
};
const tapTarget = async (target, settleMs = 0) => {
  const point = await evalIn(`buttonPoint(${JSON.stringify(target)})`);
  if (!point.ok) throw new Error(`button not found: ${target}`);
  await tap(point, settleMs);
};
const shot = async (name) => {
  const file = path.join(SHOTS, `${name}.png`);
  // WebGL 首次 readback 偶发拿到分块黑帧；先预热一次，不把预热图落证据。
  await page.screenshot({ captureBeyondViewport: false });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  await page.screenshot({ path: file, captureBeyondViewport: false });
  return path.relative(ROOT, file);
};
const shotFast = async (name) => {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, captureBeyondViewport: false });
  return path.relative(ROOT, file);
};
const waitUntil = async (predicate, timeoutMs, label, stepMs = 20) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await predicate();
    if (value) return value;
    await page.waitForTimeout(stepMs);
  }
  throw new Error(`timeout: ${label}`);
};
const waitAnimationIdle = () => waitUntil(
  async () => !(await evalIn('animationBusy()')),
  6000,
  'animation idle',
);

const summary = {
  task: 'W-VISION-S5b',
  base: BASE,
  seed: SEED,
  capturedAt: new Date().toISOString(),
  frames: {},
  playSamples: {},
  scoreSamples: {},
  landlordSample: null,
  landlordDiagnostic: null,
  rounds: [],
  leak: null,
  pageErrors,
};

await page.goto(`${BASE}?seed=${SEED}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.evaluate(() => {
  localStorage.removeItem('doudizhu.save');
  localStorage.setItem('doudizhu.settings', JSON.stringify({
    sound: false,
    vibration: false,
    animation: true,
    difficulty: 'simple',
  }));
});
await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'lobby'; })()`, undefined, {
  timeout: 90000,
  polling: 250,
});
await page.waitForTimeout(1200);
summary.frames.lobby = await shot('state-lobby');

await tapTarget('home-start-button', 800);
await page.waitForFunction(`(() => { ${HELPERS}; return sceneName() === 'game' && Boolean(findSkeleton()); })()`, undefined, {
  timeout: 30000,
  polling: 200,
});
await page.waitForTimeout(1000);
summary.frames.bidding = await shot('state-bidding');

async function bidToPlaying(captureHat) {
  let hatCaptured = false;
  const captureHatFrame = async () => {
    const sample = await evalIn("transientSample('landlord-ceremony-')");
    if (!captureHat || !sample || hatCaptured || sample.opacity < 180) return false;
    summary.landlordSample = sample;
    summary.frames.landlord = await shot('landlord-ceremony');
    hatCaptured = true;
    return true;
  };
  for (let index = 0; index < 50; index += 1) {
    if ((await evalIn('turnInfo().phase')) === 'playing') {
      if (captureHat && !hatCaptured) {
        const deadline = Date.now() + 1200;
        while (Date.now() < deadline && !hatCaptured) {
          await captureHatFrame();
          if (!hatCaptured) await page.waitForTimeout(15);
        }
        if (!hatCaptured) summary.landlordDiagnostic = await evalIn('landlordDiagnostic()');
      }
      return hatCaptured;
    }
    let acted = false;
    for (const label of ['叫地主', '抢地主', '抢']) {
      const point = await evalIn(`buttonPoint(${JSON.stringify(label)})`);
      if (!point.ok) continue;
      await tap(point, 0);
      acted = true;
      break;
    }
    const until = Date.now() + 1150;
    while (Date.now() < until) {
      await captureHatFrame();
      if ((await evalIn('turnInfo().phase')) === 'playing' && (!captureHat || hatCaptured)) return hatCaptured;
      await page.waitForTimeout(20);
    }
    if (!acted) await page.waitForTimeout(180);
  }
  throw new Error('bidding did not reach playing');
}

async function waitHeroTurn() {
  return waitUntil(async () => {
    const info = await evalIn('turnInfo()');
    return info.settled || (info.phase === 'playing' && info.myTurn) ? info : null;
  }, 30000, 'hero turn', 100);
}

async function playRecommended(capturePhase = null) {
  await waitAnimationIdle();
  const mustPass = await evalIn("enabledButtonPoint('action-must-pass')");
  if (mustPass.enabled) {
    await tap(mustPass, 100);
    return { kind: 'must-pass', selected: [] };
  }
  const hintButton = await evalIn("enabledButtonPoint('action-hint')");
  if (!hintButton.enabled) {
    const passOnly = await evalIn("enabledButtonPoint('action-pass')");
    if (passOnly.enabled) {
      await tap(passOnly, 100);
      return { kind: 'pass', selected: [] };
    }
    throw new Error('hero turn has neither hint nor pass action');
  }
  await tapTarget('action-hint', 120);
  const selected = await evalIn('selectedKeys()');
  if (selected.length === 0) {
    const pass = await evalIn("enabledButtonPoint('action-pass')");
    if (pass.enabled) {
      await tap(pass, 100);
      return { kind: 'pass', selected };
    }
    throw new Error('hint selected no cards and pass is absent');
  }
  const key = selected[0];
  await tapTarget('action-play', 0);
  if (!capturePhase) return { kind: 'play', selected };

  const sample = await waitUntil(async () => {
    const current = await evalIn(`cardSample(${JSON.stringify(key)})`);
    if (!current) return null;
    const atTerminalPoint = Math.abs(current.current.x - current.terminal.x) < 0.1
      && Math.abs(current.current.y - current.terminal.y) < 0.1
      && current.current.angle === current.terminal.angle
      && current.current.z === current.terminal.z;
    if (capturePhase === 'rise') {
      return !atTerminalPoint && Math.abs(current.current.angle) > 0.2 ? current : null;
    }
    if (capturePhase === 'impact') {
      return atTerminalPoint && current.current.scale < current.terminal.scale * 0.98 ? current : null;
    }
    return atTerminalPoint
      && current.current.scale >= current.terminal.scale * 0.92
      && current.current.scale < current.terminal.scale * 0.999
      ? current
      : null;
  }, 700, `${capturePhase} sample`, 3);
  summary.playSamples[capturePhase] = sample;
  await page.evaluate(() => globalThis.cc?.game?.pause?.());
  try {
    await page.evaluate(() => globalThis.cc?.director?.tick?.(0));
    summary.frames[capturePhase] = await shotFast(`play-${capturePhase}`);
  } finally {
    await page.evaluate(() => globalThis.cc?.game?.resume?.());
  }

  if (!summary.frames.pattern) {
    const burst = await waitUntil(
      async () => {
        const current = await evalIn("transientSample('pattern-burst-')");
        return current?.opacity >= 220 ? current : null;
      },
      1200,
      'pattern burst',
      15,
    );
    summary.playSamples.pattern = burst;
    summary.frames.pattern = await shot('pattern-burst');
  }
  return { kind: 'play', selected };
}

async function playToSettlement(captureScore) {
  for (let index = 0; index < 420; index += 1) {
    const score = await evalIn('scoreSample()');
    if (captureScore && score?.done === false && !summary.frames.scoreStart) {
      summary.scoreSamples.start = score;
      summary.frames.scoreStart = await shot('score-roll-start');
      await page.waitForTimeout(360);
      summary.scoreSamples.mid = await evalIn('scoreSample()');
      summary.frames.scoreMid = await shot('score-roll-mid');
      await page.waitForTimeout(300);
      summary.scoreSamples.final = await evalIn('scoreSample()');
      summary.frames.scoreFinal = await shot('score-roll-final');
    }
    const info = await evalIn('turnInfo()');
    if (info.settled) {
      if (!captureScore || summary.frames.scoreFinal) {
        await waitAnimationIdle();
        return info;
      }
      await page.waitForTimeout(30);
      continue;
    }
    if (info.phase !== 'playing' || !info.myTurn) {
      await page.waitForTimeout(100);
      continue;
    }
    await playRecommended(false);
    await page.waitForTimeout(80);
  }
  throw new Error('round did not settle');
}

await bidToPlaying(true);
for (const phase of ['rise', 'impact', 'rebound']) {
  let captured = false;
  while (!captured) {
    const turn = await waitHeroTurn();
    if (turn.settled) throw new Error(`round settled before ${phase} frame`);
    const result = await playRecommended(phase);
    captured = result.kind === 'play';
  }
}
await waitAnimationIdle();
summary.frames.playing = await shot('state-playing');

const firstSettlement = await playToSettlement(true);
summary.frames.settled = await shot('state-settled');
await page.waitForTimeout(1000);
summary.rounds.push({
  index: 1,
  scores: firstSettlement.scores,
  fx: await evalIn('fxCensus()'),
  cardLayer: await evalIn('cardLayerState()'),
});

for (let round = 2; round <= 3; round += 1) {
  await tapTarget('result-new', 500);
  await bidToPlaying(false);
  const settlement = await playToSettlement(false);
  await page.waitForTimeout(1000);
  summary.rounds.push({
    index: round,
    scores: settlement.scores,
    fx: await evalIn('fxCensus()'),
    cardLayer: await evalIn('cardLayerState()'),
  });
}

// Existing settled win FX intentionally lives until the next round. Start a
// clean fourth round, wait for deal settlement, then require the shared fx
// layer to be completely empty and the physical card layer to match CardStage.
await tapTarget('result-new', 500);
await waitAnimationIdle();
await page.waitForTimeout(900);
summary.leak = {
  completedRounds: 3,
  fx: await evalIn('fxCensus()'),
  cardLayer: await evalIn('cardLayerState()'),
  patternNodes: await evalIn("fxCensus().filter((name) => name.startsWith('pattern-burst-'))"),
  landlordNodes: await evalIn("fxCensus().filter((name) => name.startsWith('landlord-ceremony-'))"),
};
summary.frames.afterThreeRounds = await shot('after-three-rounds-clean');

fs.writeFileSync(path.join(OUT, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
await browser.close();

const failures = [];
if (!summary.frames.landlord) failures.push('landlord ceremony frame missing');
for (const name of ['rise', 'impact', 'rebound', 'pattern', 'scoreStart', 'scoreMid', 'scoreFinal']) {
  if (!summary.frames[name]) failures.push(`${name} frame missing`);
}
if (summary.pageErrors.length > 0) failures.push(`page errors: ${summary.pageErrors.join(' | ')}`);
if (summary.leak?.fx?.length !== 0) failures.push(`fx leak: ${summary.leak.fx.join(',')}`);
if (summary.leak?.patternNodes?.length !== 0) failures.push('pattern burst leaked');
if (summary.leak?.landlordNodes?.length !== 0) failures.push('landlord ceremony leaked');
if (summary.leak?.cardLayer?.count !== summary.leak?.cardLayer?.expected) failures.push('card layer count drift');
if (summary.leak?.cardLayer?.drift?.length !== 0) failures.push(`card transform drift: ${summary.leak.cardLayer.drift.join(',')}`);

console.log(JSON.stringify({
  frames: Object.keys(summary.frames),
  playSamples: summary.playSamples,
  scoreSamples: summary.scoreSamples,
  rounds: summary.rounds.map((round) => ({
    index: round.index,
    scores: round.scores,
    transientFx: round.fx.filter((name) =>
      name.startsWith('pattern-burst-') || name.startsWith('landlord-ceremony-')),
    cardLayer: round.cardLayer,
  })),
  leak: summary.leak,
  pageErrors: summary.pageErrors,
  failures,
}, null, 2));

if (failures.length > 0) process.exitCode = 1;
