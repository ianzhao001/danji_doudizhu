import { Color, Label, Node, Sprite, SpriteFrame, UITransform, resources } from 'cc';
import { RESOURCE_PATHS, spriteFrameResourcePath, type ResourcePath } from '../../asset-keys';
import type { Rect } from '../../table-layout';
import { THEME, addLabel as addUiLabel, addSkinnedButton, addSkinnedSprite, addUiTransform, drawPanelSkin as drawUiPanelSkin, toColor } from '../ui-helpers';

const LANDSCAPE_CANVAS = { width: 844, height: 390 };
const SCAFFOLD_NODE_NAMES = [
  'phase-label',
  'landlord-label',
  'multiplier-label',
  'hand-count-label',
  'action-label',
  'bottom-cards-label',
  'ai-left-label',
  'ai-right-label',
  'table-area-label',
  'hero-hand-label',
  'card-template-001',
  'card-template-002',
  'card-template-003',
  'card-template-004',
  // v1.6 二次终审:这两个原本靠 @property(background / cardTemplate)在 onLoad 里关掉。
  // 但场景 @property 绑定依赖场景序列化 —— 冷构建(rm -rf library 后全量重导)实测两者双双变 null,
  // 于是场景里的旧静态背景 game-table-bg(绿桌)不再被关闭,直接盖在运行时 v13 粉桌之上(截图实锤)。
  // 任何人冷构建都会中招,故改为按名兜底(与其余脚手架节点同一机制),不再依赖序列化。
  'game-table-bg',
  'card-template',
];
const SETTLEMENT_TRANSIENT_HUD_NODE_NAMES = [
  'status-label',
  'bidding-prompt',
  'turn-timer-runtime',
  'toast-layer-runtime',
  'hud-strength-meter',
  'hud-card-memory',
  'advisor-toggle',
  'advisor-panel',
  'bid-advisor-toggle',
  'bid-advisor-panel',
  'action-play',
  'action-pass',
  'action-hint',
  'bid-call',
  'bid-grab',
  'bid-pass',
  'ai-thinking-0',
  'ai-thinking-1',
  'ai-thinking-2',
];
// v1.6 二次终审:v18 primary 为亮莓粉实底 rgb(242,151,188),与标准深莓 rgb(108,46,76) 仅 4.66:1(余量薄);
// primary 专用更深莓字 rgb(70,25,50) → 对比 6.83:1。其余态底色浅,沿用标准深莓。
const BUTTON_PRIMARY_TEXT = toColor({ r: 70, g: 25, b: 50, a: 255 });
// v1.5 P-BTN-SKIN:v15 secondary 为暖奶油盘面,白字不可读——统一深莓文字。
const BUTTON_SECONDARY_TEXT = toColor(THEME.palette.brandDark);
const BUTTON_TERTIARY_TEXT = toColor(THEME.palette.brandDark);
const BUTTON_DISABLED_TEXT = toColor(THEME.palette.textDisabled);
const BUTTON_PAUSE_TOGGLE_TEXT = toColor(THEME.palette.brandDark);
const BUTTON_PAUSE_ACTION_TEXT = toColor(THEME.palette.brandDark);

export function addButton(this: any,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  enabled: boolean,
  cb: () => void,
  parent: Node = this.uiRoot!,
  name?: string,
): Label {
  const nodeName = name ?? `button-${text}-${x}-${y}`;
  const label = addSkinnedButton(this.ensureNode.bind(this), this.loadSprite.bind(this), {
    text,
    x,
    y,
    width,
    height,
    enabled,
    cb,
    parent,
    name: nodeName,
    owner: this,
    feel: {
      animated: Boolean(this.settings?.animation),
      onClickSound: () => this.playUiSound?.(RESOURCE_PATHS.audioButton),
      // W3-B P-BTN-FEEL-B:涟漪挂 fx 层(prune 豁免),世界坐标由 renderButtonRipple 换算。
      rippleAt: (worldPos, sizeBase) => this.renderButtonRipple?.(worldPos, sizeBase),
    },
    skinPath: (buttonName, isEnabled) => this.buttonSkinPath(buttonName, isEnabled),
    textColor: (buttonName, isEnabled) => this.buttonTextColor(buttonName, isEnabled),
    iconPath: (buttonName) => this.buttonIconPath(buttonName),
    layout: ({ iconPath, width: buttonWidth, height: buttonHeight }) => {
      // v1.5 P-BTN-SKIN:v15 皮肤中央即纯净文字盘(源图 64%×56% 硬规范),
      // v13 装饰底座的三项补偿(renderHeight 抬高/labelY 下移/明度自适应描边)随皮肤退役。
      const showIcon = Boolean(iconPath) && buttonWidth >= 136;
      const compact = buttonWidth < 110;
      return {
        renderHeight: buttonHeight,
        label: {
          x: showIcon ? 10 : 0,
          y: 0,
          width: showIcon ? buttonWidth - 30 : Math.round(buttonWidth * 0.85),
          height: Math.max(24, Math.round(buttonHeight * 0.62)),
          fontSize: compact ? 17 : 20,
          lineHeight: compact ? 21 : 24,
        },
        icon: showIcon
          ? {
              x: -buttonWidth / 2 + 23,
              y: 0,
              size: Math.min(22, Math.max(16, buttonHeight - 40)),
            }
          : undefined,
      };
    },
  });
  return label;
}

export function buttonSkinPath(this: any, name: string, enabled: boolean): ResourcePath {
  // v1.6 二次终审整改:全部按钮统一 v18 极简族(单一填充+一条细描边),弃 v17 多层描边(键保留回滚)。
  if (!enabled) return RESOURCE_PATHS.btnDisabledV18;
  if (this.isPauseToggleButton(name)) return RESOURCE_PATHS.btnSecondaryV18;
  if (name === 'action-hint') return RESOURCE_PATHS.btnTertiaryV18;
  if (
    this.isPauseActionButton(name) ||
    name === 'action-must-pass' ||
    name === 'action-play' ||
    name === 'bid-call' ||
    name === 'bid-grab' ||
    name === 'result-new' ||
    name === 'result-lobby'
  ) {
    return RESOURCE_PATHS.btnPrimaryV18;
  }
  return RESOURCE_PATHS.btnSecondaryV18;
}

export function buttonTextColor(this: any, name: string, enabled: boolean): Color {
  // v1.5 P-BTN-SKIN:v15 全族按钮中央为浅色纯净文字盘(对 brandDark 对比 ≥4.5:1 出厂硬门),
  // 文字统一深莓色;v13 时代的「禁用白字/要不起金字」补偿随皮肤退役。
  if (!enabled) return BUTTON_DISABLED_TEXT;
  if (this.isPauseToggleButton(name)) return BUTTON_PAUSE_TOGGLE_TEXT;
  if (this.isPauseActionButton(name)) return BUTTON_PRIMARY_TEXT; // v18: pause action 用 primary 皮(亮莓底)→同用深莓字
  const skin = this.buttonSkinPath(name, enabled);
  if (skin === RESOURCE_PATHS.btnPrimaryV18) return BUTTON_PRIMARY_TEXT;
  if (skin === RESOURCE_PATHS.btnTertiaryV18) return BUTTON_TERTIARY_TEXT;
  return BUTTON_SECONDARY_TEXT;
}

export function isPauseToggleButton(this: any, name: string): boolean {
  return name.startsWith('pause-setting-');
}

export function isPauseActionButton(this: any, name: string): boolean {
  return (
    name === 'pause-continue' ||
    name === 'pause-restart' ||
    name === 'pause-quit' ||
    name === 'pause-confirm' ||
    name === 'pause-cancel'
  );
}

export function buttonIconPath(this: any, name: string): ResourcePath | null {
  if (name === 'action-play') return RESOURCE_PATHS.iconPlay;
  if (name === 'action-pass') return RESOURCE_PATHS.iconPass;
  if (name === 'action-must-pass') return RESOURCE_PATHS.iconPass;
  if (name === 'action-hint') return RESOURCE_PATHS.iconHint;
  if (name === 'bid-call' || name === 'bid-grab') return RESOURCE_PATHS.iconBid;
  if (name === 'pause-open-button') return RESOURCE_PATHS.iconSettings;
  if (name === 'pause-confirm' || name === 'pause-quit') return RESOURCE_PATHS.iconBack;
  return null;
}

export function addSprite(this: any,
  path: ResourcePath,
  x: number,
  y: number,
  width: number,
  height: number,
  parent: Node,
  name: string,
  sliced = false,
): Node {
  return addSkinnedSprite(this.ensureNode.bind(this), this.loadSprite.bind(this), {
    path,
    x,
    y,
    width,
    height,
    parent,
    name,
    sliced,
  });
}

/**
 * v1.6 二次终审整改②(icon 变形):等比内接——按 SpriteFrame 的真实 rect 比例,最大化地放进 (width × height) 框内。
 *
 * SIMPLE 精灵直接给宽高 = 按框拉伸。图源经 trimType=auto 削掉透明边后,rect 比例常常已不等于原图比例,
 * 塞进按原图比例配的框里就会变形(s4-image-gates.py 门E 实测:hero 立绘偏 10.2%、右家 7.5%)。
 * 帧是异步加载的,故在帧落位后再定尺寸;命中缓存时同帧生效。
 */
export function addSpriteContain(this: any,
  path: ResourcePath,
  x: number,
  y: number,
  width: number,
  height: number,
  parent: Node,
  name: string,
): Node {
  const node: Node = this.addSprite(path, x, y, width, height, parent, name);
  const fit = (frame: SpriteFrame): void => {
    // 异步回调落地时,节点可能已被 render prune 销毁(换局/切相位)——必须查 isValid,否则 use-after-destroy。
    if (!node.isValid) return;
    const rect = frame.rect;
    if (!rect || !rect.width || !rect.height) return;
    const k = Math.min(width / rect.width, height / rect.height);
    addUiTransform(node, Math.round(rect.width * k), Math.round(rect.height * k));
  };
  const cached: SpriteFrame | undefined = this.spriteFrames.get(path);
  if (cached) {
    fit(cached);
    return node;
  }
  resources.load(spriteFrameResourcePath(path), SpriteFrame, (error, frame) => {
    if (!error && frame) fit(frame);
  });
  return node;
}

export function loadSprite(this: any, path: ResourcePath, sprite: Sprite | null): void {
  if (!sprite) return;
  const cached = this.spriteFrames.get(path);
  if (cached) {
    this.applySpriteFrame(sprite, cached);
    return;
  }
  resources.load(spriteFrameResourcePath(path), SpriteFrame, (error, frame) => {
    if (error || !frame) return;
    this.spriteFrames.set(path, frame);
    this.applySpriteFrame(sprite, frame);
  });
}

export function applySpriteFrame(this: any, sprite: Sprite, frame: SpriteFrame): void {
  if (!sprite.isValid || !sprite.node?.isValid) return;
  try {
    sprite.spriteFrame = frame;
  } catch (error) {
    if (sprite.isValid && sprite.node?.isValid) throw error;
  }
}

export function drawPanelSkin(this: any, parent: Node, width: number, height: number, name = 'panel-skin'): Node {
  // v1.5 P-LOBBY-UNIFY2:两场景弹窗面板统一 v15 皮肤(与 lobby 同键,v12/v13 分裂结案)。
  return drawUiPanelSkin(this.ensureNode.bind(this), this.loadSprite.bind(this), {
    path: RESOURCE_PATHS.panelPopupV15,
    parent,
    width,
    height,
    name,
  });
}

export function addLabel(this: any,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  parent: Node = this.uiRoot!,
  width = 220,
  height = 72,
  name?: string,
  color = toColor(THEME.palette.textOnAccent),
): Label {
  return addUiLabel(this.ensureNode.bind(this), {
    text,
    x,
    y,
    fontSize,
    parent,
    width,
    height,
    name: name ?? `label-${text}-${x}-${y}`,
    color,
    lineHeightOffset: 5,
  });
}

export function ensureNode(this: any, name: string, parent: Node): Node {
  const existing = parent.getChildByName(name);
  if (existing) {
    existing.active = true;
    existing.layer = parent.layer;
    existing.setSiblingIndex(parent.children.length - 1);
    this.liveRenderNodes?.add(existing);
    return existing;
  }
  const node = new Node(name);
  node.parent = parent;
  node.layer = parent.layer;
  node.active = true;
  node.setSiblingIndex(parent.children.length - 1);
  this.liveRenderNodes?.add(node);
  return node;
}

export function beginRenderDiff(this: any): void {
  this.liveRenderNodes = new Set<Node>();
}

export function hideSettledTransientHud(this: any): void {
  for (const name of SETTLEMENT_TRANSIENT_HUD_NODE_NAMES) this.hideLiveSubtree(name);
}

export function hideLiveSubtree(this: any, name: string): void {
  if (!this.uiRoot) return;
  const node = this.uiRoot.getChildByName(name);
  if (!node) return;
  node.active = false;
  this.markLiveSubtree(node);
}

export function markLiveSubtree(this: any, node: Node): void {
  this.liveRenderNodes?.add(node);
  for (const child of node.children) this.markLiveSubtree(child);
}

export function endRenderDiff(this: any): void {
  if (this.uiRoot && this.liveRenderNodes) this.pruneInactiveChildren(this.uiRoot);
  this.liveRenderNodes = null;
}

export function pruneInactiveChildren(this: any, parent: Node): void {
  const live = this.liveRenderNodes;
  if (!live) return;
  for (const child of parent.children.slice()) {
    if (!live.has(child)) {
      child.removeFromParent();
      child.destroy();
    } else {
      this.pruneInactiveChildren(child);
    }
  }
}

export function hideSceneScaffold(this: any): void {
  for (const name of SCAFFOLD_NODE_NAMES) {
    const child = this.node.getChildByName(name);
    if (child) child.active = false;
  }
}

export function strengthColor(this: any, tone: 'weak' | 'mid' | 'strong'): Color {
  if (tone === 'strong') return toColor(THEME.palette.success);
  if (tone === 'mid') return toColor(THEME.palette.warning);
  return toColor(THEME.palette.danger);
}

export function canvasSize(this: any): { width: number; height: number } {
  const size = this.node.getComponent(UITransform)?.contentSize;
  return {
    width: Math.max(1, size?.width ?? LANDSCAPE_CANVAS.width),
    height: Math.max(1, size?.height ?? LANDSCAPE_CANVAS.height),
  };
}

export function rectPoint(this: any, rect: Rect, canvas: { width: number; height: number }, fx: number, fy: number): { x: number; y: number } {
  return this.screenPoint(canvas, rect.x + rect.width * fx, rect.y + rect.height * fy);
}

export function screenPoint(this: any, canvas: { width: number; height: number }, screenX: number, screenY: number): { x: number; y: number } {
  return {
    x: Math.round(screenX - canvas.width / 2),
    y: Math.round(canvas.height / 2 - screenY),
  };
}
