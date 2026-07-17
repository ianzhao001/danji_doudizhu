import { Color, Label, Node, Sprite, SpriteFrame, UITransform, resources } from 'cc';
import { RESOURCE_PATHS, spriteFrameResourcePath, type ResourcePath } from '../../asset-keys';
import type { Rect } from '../../table-layout';
import type { TypographyRole } from '../../theme';
import { UI_TEXT_COLORS } from '../../ui-text-colors';
import { THEME, addLabel as addUiLabel, addSkinnedButton, addSkinnedSprite, addUiTransform, drawPanelSkin as drawUiPanelSkin, toColor } from '../ui-helpers';
import { cardKeyFromRuntimeNodeName } from './card-animator';
import { ensureSceneFont } from './font-loader';

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
const SETTLEMENT_SCENE_CHROME_NODE_NAMES = [
  // Settlement keeps the two AI portraits as dim scene framing, but removes
  // the three bright nameplates and the bottom-corner hero cutout.
  'seat-hero',
  'seat-hero-nameplate',
  'seat-left-nameplate',
  'seat-right-nameplate',
];
const PROMINENT_ACTION_BUTTON_NAMES = new Set([
  'action-play',
  'action-pass',
  'action-must-pass',
  'action-hint',
  'bid-call',
  'bid-grab',
  'bid-pass',
]);

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
  enabled = enabled && !this.cardAnimator?.isBusy();
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
    layout: ({ name: buttonName, iconPath, width: buttonWidth, height: buttonHeight }) => {
      // v1.5 P-BTN-SKIN:v15 皮肤中央即纯净文字盘(源图 64%×56% 硬规范),
      // v13 装饰底座的三项补偿(renderHeight 抬高/labelY 下移/明度自适应描边)随皮肤退役。
      const showIcon = Boolean(iconPath) && buttonWidth >= 136;
      // v21 底唇比 v20 厚：64×30 的顶角“暂停”若仍用 action 16/20，
      // 字形带会向下压过净区。最矮 30px 钮用 meta 13/15，其他紧凑钮用 body 14/18；
      // 文字盒几何中心不变，同时守住门 B 与门 I。
      const compactText = buttonHeight <= 32 || buttonWidth <= 70;
      return {
        renderHeight: buttonHeight,
        label: {
          x: showIcon ? THEME.spacing.card : 0,
          y: 0,
          width: showIcon ? buttonWidth - 30 : Math.round(buttonWidth * 0.85),
          height: Math.max(24, Math.round(buttonHeight * 0.62)),
          role: PROMINENT_ACTION_BUTTON_NAMES.has(buttonName)
            ? 'prominentAction'
            : buttonHeight <= 30 ? 'meta' : compactText ? 'body' : 'action',
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
  // W-VISION-COLOR-R2:银白只留给顶部系统级小暂停；所有大按钮严格收敛为
  // 黄(推荐/主要)与绿(次要)两张角色皮。禁用态沿用角色皮，由共享 helper 压暗。
  void enabled;
  if (name === 'pause-open-button') return RESOURCE_PATHS.btnNeutralC2;
  if (
    name === 'action-play' ||
    name === 'bid-call' ||
    name === 'bid-grab' ||
    name === 'pause-continue' ||
    name === 'result-new' ||
    name === 'termination-feedback-restart'
  ) {
    return RESOURCE_PATHS.btnPrimaryC2;
  }
  return RESOURCE_PATHS.btnSecondaryC2;
}

export function buttonTextColor(this: any, name: string, enabled: boolean): Color {
  // 禁用态仍以 disabledButton 为基色，alpha.disabled 作为暗化量；
  // 不把字做半透明，避免与银白底合成后跌破真实 AA。
  if (!enabled) {
    const disabled = UI_TEXT_COLORS.disabledButton;
    const dim = THEME.alpha.disabled;
    return toColor({
      r: Math.max(0, disabled.r - dim),
      g: Math.max(0, disabled.g - dim),
      b: Math.max(0, disabled.b - dim),
      a: disabled.a,
    });
  }
  if (name === 'pause-open-button') {
    return toColor(UI_TEXT_COLORS.neutralButton);
  }
  if (
    name === 'action-play' ||
    name === 'bid-call' ||
    name === 'bid-grab' ||
    name === 'pause-continue' ||
    name === 'result-new' ||
    name === 'termination-feedback-restart'
  ) {
    return toColor(UI_TEXT_COLORS.bidCall);
  }
  return toColor(UI_TEXT_COLORS.bidPass);
}

export function isPauseToggleButton(this: any, name: string): boolean {
  return name.startsWith('pause-setting-');
}

export function isPauseActionButton(this: any, name: string): boolean {
  return (
    // “继续”是暂停菜单唯一推荐动作，刻意不归入银白退路集合。
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

export function loadSprite(this: any, path: ResourcePath, sprite: Sprite | null): SpriteFrame | null {
  if (!sprite) return null;
  const cached = this.spriteFrames.get(path);
  if (cached) {
    this.applySpriteFrame(sprite, cached);
    return cached;
  }
  resources.load(spriteFrameResourcePath(path), SpriteFrame, (error, frame) => {
    if (error || !frame) return;
    this.spriteFrames.set(path, frame);
    this.applySpriteFrame(sprite, frame);
  });
  return null;
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
  // W-VISION S4:两场景弹窗面板统一 v19 皮肤。
  return drawUiPanelSkin(this.ensureNode.bind(this), this.loadSprite.bind(this), {
    path: RESOURCE_PATHS.panelPopupV19,
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
  role: TypographyRole,
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
    role,
    parent,
    width,
    height,
    name: name ?? `label-${text}-${x}-${y}`,
    color,
  });
}

export function ensureNode(this: any, name: string, parent: Node): Node {
  const existing = parent.getChildByName(name);
  if (existing) {
    existing.active = true;
    existing.layer = parent.layer;
    const physicalCardKey = parent.name === 'card-layer-runtime'
      ? cardKeyFromRuntimeNodeName(name)
      : null;
    // T2: sibling order is the z component of the shared physical-card layer.
    // Moving any sibling can indirectly move an owned card, so freeze all
    // card-layer order while one or more tracks own that shared ordering.
    if (!physicalCardKey || !this.cardAnimator?.isAnimating()) {
      existing.setSiblingIndex(parent.children.length - 1);
    }
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

export function hideSettlementSceneChrome(this: any): void {
  for (const name of SETTLEMENT_SCENE_CHROME_NODE_NAMES) this.hideLiveSubtree(name);
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
      const ownedCardKey = parent.name === 'card-layer-runtime'
        ? cardKeyFromRuntimeNodeName(child.name)
        : null;
      if (ownedCardKey && this.cardAnimator?.owns(ownedCardKey)) {
        this.markLiveSubtree(child);
        continue;
      }
      child.removeFromParent();
      child.destroy();
    } else {
      this.pruneInactiveChildren(child);
    }
  }
}

export function hideSceneScaffold(this: any): void {
  // game-scene-skeleton.ts 不在 S1 文件域；利用它 onLoad 必调的脚手架入口启动字体加载。
  // 大厅已预热时会立即命中；直进游戏场景则先用系统字体，到位后强制重排。
  void ensureSceneFont(this.node);
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
