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
const BUTTON_PRIMARY_TEXT = toColor(THEME.palette.brandDark);
const BUTTON_SECONDARY_TEXT = toColor(THEME.palette.textOnAccent);
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
    skinPath: (buttonName, isEnabled) => this.buttonSkinPath(buttonName, isEnabled),
    textColor: (buttonName, isEnabled) => this.buttonTextColor(buttonName, isEnabled),
    iconPath: (buttonName) => this.buttonIconPath(buttonName),
    layout: ({ name: buttonName, iconPath, width: buttonWidth, height: buttonHeight }) => {
      const decorated = this.isDecoratedButton(buttonName);
      const renderHeight = decorated ? Math.max(buttonHeight, 62) : buttonHeight;
      const showIcon = Boolean(iconPath) && buttonWidth >= 136;
      const labelY = decorated ? -8 : 0;
      return {
        renderHeight,
        label: {
          x: showIcon ? 10 : 0,
          y: labelY,
          width: showIcon ? buttonWidth - 38 : buttonWidth - (decorated ? 14 : 0),
          height: decorated ? Math.max(30, renderHeight - 26) : renderHeight,
          fontSize: decorated ? 17 : 20,
          lineHeight: decorated ? 21 : 24,
        },
        icon: showIcon
          ? {
              x: -buttonWidth / 2 + 23,
              y: labelY,
              size: Math.min(22, Math.max(16, renderHeight - 40)),
            }
          : undefined,
      };
    },
  });
  // V8 用户签收意见②：decorated 装饰底座（宝石顶饰/金属纹）与按钮文字叠糊——
  // 统一加细描边把文字从底纹上分离；描边色按文字明度自适应（浅字配深边、深字配浅边）。
  if (this.isDecoratedButton(nodeName)) {
    const c = label.color;
    const brightText = (c.r + c.g + c.b) / 3 > 150;
    label.enableOutline = true;
    label.outlineColor = brightText ? toColor(THEME.palette.brandDark) : toColor(THEME.palette.accentCream);
    label.outlineWidth = 2;
  }
  return label;
}

export function isDecoratedButton(this: any, name: string): boolean {
  return (
    name.startsWith('action-') ||
    name.startsWith('bid-') ||
    name.startsWith('result-') ||
    name.startsWith('termination-feedback-') ||
    name === 'advisor-toggle'
  );
}

export function buttonSkinPath(this: any, name: string, enabled: boolean): ResourcePath {
  if (!enabled) return RESOURCE_PATHS.btnDisabledV13;
  if (this.isPauseToggleButton(name)) return RESOURCE_PATHS.pauseBtnToggle;
  if (this.isPauseActionButton(name)) return RESOURCE_PATHS.pauseBtnAction;
  if (name === 'action-hint') return RESOURCE_PATHS.btnTertiaryV13;
  if (name === 'action-must-pass') return RESOURCE_PATHS.btnPrimaryV13;
  if (
    name === 'action-play' ||
    name === 'bid-call' ||
    name === 'bid-grab' ||
    name === 'result-new' ||
    name === 'result-lobby' ||
    name === 'pause-continue'
  ) {
    return RESOURCE_PATHS.btnPrimaryV13;
  }
  return RESOURCE_PATHS.btnSecondaryV13;
}

export function buttonTextColor(this: any, name: string, enabled: boolean): Color {
  // V8 用户签收意见②（2026-07-11）：decorated 底座纹样 × 半透明灰字叠糊——禁用态改实白，
  // 禁用感交由暗态皮肤表达；文字与底纹的分离由 addButton 的描边兜底。
  if (!enabled) return this.isDecoratedButton(name) ? BUTTON_SECONDARY_TEXT : BUTTON_DISABLED_TEXT;
  if (name === 'action-must-pass') return toColor(THEME.palette.accentGold);
  if (this.isPauseToggleButton(name)) return BUTTON_PAUSE_TOGGLE_TEXT;
  if (this.isPauseActionButton(name)) return BUTTON_PAUSE_ACTION_TEXT;
  const skin = this.buttonSkinPath(name, enabled);
  if (skin === RESOURCE_PATHS.btnPrimaryV13) return BUTTON_PRIMARY_TEXT;
  if (skin === RESOURCE_PATHS.btnTertiaryV13) return BUTTON_TERTIARY_TEXT;
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
  return drawUiPanelSkin(this.ensureNode.bind(this), this.loadSprite.bind(this), {
    path: RESOURCE_PATHS.panelPopup,
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
