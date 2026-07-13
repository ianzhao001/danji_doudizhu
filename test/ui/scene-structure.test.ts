/**
 * 场景结构断言(v1.6 审计裁决 P1-1②)。
 * 场景 @property 绑定冷构建后会失效(KNOWN_LIMITATIONS),产品以「按节点名兜底」隐藏场景脚手架。
 * 本测试把兜底名单与 .scene 序列化锚死,双向绊线:
 *   · Creator 里改名/删节点 → 场景断言红(兜底失效,旧背景/占位字冷构建后会漏出);
 *   · 改源码兜底名单没同步本测试 → 名单一致性断言红。
 * 排除:SETTLEMENT_TRANSIENT_HUD_NODE_NAMES 19 名(status-label、turn-timer-runtime、
 * toast-layer-runtime、action-× bid-× advisor-× hud-× 系列、ai-thinking-0..2)为运行时创建节点,
 * 不在场景序列化中(实测双场景 0 命中),不做场景断言。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const GAME_SCENE = new URL('../../assets/scene/game.scene', import.meta.url);
const LOBBY_SCENE = new URL('../../assets/scene/lobby.scene', import.meta.url);
const HELPERS_SRC = new URL('../../assets/scripts/ui/components/game-scene/ui-runtime-helpers.ts', import.meta.url);
const LOBBY_SRC = new URL('../../assets/scripts/ui/components/lobby-scene.ts', import.meta.url);

// 冻结名单(与源码常量一致;消费方式:getChildByName 精确匹配)。
const GAME_SCAFFOLD_NODE_NAMES = [
  'phase-label', 'landlord-label', 'multiplier-label', 'hand-count-label',
  'action-label', 'bottom-cards-label', 'ai-left-label', 'ai-right-label',
  'table-area-label', 'hero-hand-label',
  'card-template-001', 'card-template-002', 'card-template-003', 'card-template-004',
  'game-table-bg', 'card-template',
];
// lobby 占位 label:场景实名带尾注(如 "title-label          斗地主"),源码用 startsWith → 前缀断言,严禁精确匹配。
const LOBBY_LEGACY_LABEL_PREFIXES = ['title-label', 'start-label', 'settings-label', 'records-label'];
const LOBBY_STATIC_BG = 'lobby-bg'; // getChildByName 精确

function sceneNodeNames(url: URL): string[] {
  const entries = JSON.parse(readFileSync(url, 'utf8')) as Array<Record<string, unknown>>;
  return entries
    .filter((entry) => entry.__type__ === 'cc.Node' && typeof entry._name === 'string')
    .map((entry) => entry._name as string);
}

// 从源码文本提取 const X = [ … ]; 数组里的单引号字符串(先剥行注释)。
// 源码 import 'cc' 无法在 node 环境加载,故走文本提取;声明写法变化会以 throw 显式失败。
function extractStringArray(source: string, constName: string): string[] {
  const match = source.match(new RegExp(`const ${constName} = \\[([\\s\\S]*?)\\];`));
  if (!match) throw new Error(`${constName} not found in source`);
  return [...match[1].replace(/\/\/.*$/gm, '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('scene structure(按名兜底名单 ↔ 场景序列化)', () => {
  it('game.scene 含全部脚手架节点名(精确)', () => {
    const names = new Set(sceneNodeNames(GAME_SCENE));
    for (const name of GAME_SCAFFOLD_NODE_NAMES) {
      expect(names.has(name), `game.scene 缺节点「${name}」——按名兜底会失效`).toBe(true);
    }
  });

  it('lobby.scene 含 lobby-bg(精确)与四个占位 label(前缀)', () => {
    const names = sceneNodeNames(LOBBY_SCENE);
    expect(names.includes(LOBBY_STATIC_BG), 'lobby.scene 缺 lobby-bg').toBe(true);
    for (const prefix of LOBBY_LEGACY_LABEL_PREFIXES) {
      expect(names.some((n) => n.startsWith(prefix)), `lobby.scene 缺前缀「${prefix}」节点`).toBe(true);
    }
  });

  it('冻结名单与源码兜底名单零漂移(双向)', () => {
    const helpers = readFileSync(HELPERS_SRC, 'utf8');
    expect(extractStringArray(helpers, 'SCAFFOLD_NODE_NAMES').sort())
      .toEqual([...GAME_SCAFFOLD_NODE_NAMES].sort());
    const lobby = readFileSync(LOBBY_SRC, 'utf8');
    expect(extractStringArray(lobby, 'LEGACY_LABEL_NODE_NAMES').sort())
      .toEqual([...LOBBY_LEGACY_LABEL_PREFIXES].sort());
    expect(lobby).toContain(`'${LOBBY_STATIC_BG}'`);
  });
});
