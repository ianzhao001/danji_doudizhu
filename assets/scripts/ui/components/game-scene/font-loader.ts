import { Asset, Label, Node, resources } from 'cc';
import { RESOURCE_PATHS } from '../../asset-keys';

export const REGULAR_FONT_FAMILY = 'SourceHanSansCN';
export const FIRST_FRAME_FONT_TIMEOUT_MS = 2_000;

let regularFontLoaded = false;
let regularFontPromise: Promise<boolean> | null = null;

function loadRegularFontAsset(): Promise<Asset | null> {
  return new Promise((resolve) => {
    // SourceHanSansCN-Regular.otf 被 Creator 3.8.8 按原始 cc.Asset 导入，不是 TTFFont。
    try {
      resources.load(RESOURCE_PATHS.fontRegular, Asset, (error, asset) => {
        resolve(error || !asset ? null : asset);
      });
    } catch {
      resolve(null);
    }
  });
}

async function loadRegularFont(): Promise<boolean> {
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) return false;
  const asset = await loadRegularFontAsset();
  const url = asset?.nativeUrl;
  if (!url) return false;
  try {
    const face = new FontFace(REGULAR_FONT_FAMILY, `url(${url})`, { style: 'normal', weight: '400' });
    const loadedFace = await face.load();
    (document.fonts as unknown as { add(font: FontFace): void }).add(loadedFace);
    regularFontLoaded = true;
    return true;
  } catch {
    // 字体加载失败时保持系统字体，不让首屏白屏。
    return false;
  }
}

export function ensureLoaded(): Promise<boolean> {
  if (regularFontLoaded) return Promise.resolve(true);
  if (!regularFontPromise) {
    const attempt = loadRegularFont().catch(() => false);
    regularFontPromise = attempt;
    void attempt.then((loaded) => {
      // DOM 尚未就绪或一次资源加载失败时允许下个场景重试；成功结果才永久复用。
      if (!loaded && regularFontPromise === attempt) regularFontPromise = null;
    });
  }
  return regularFontPromise;
}

export function applyRegularFont(label: Label): void {
  label.useSystemFont = true;
  label.fontFamily = REGULAR_FONT_FAMILY;
  if (regularFontLoaded) label.updateRenderData(true);
}

export function reflowSceneLabels(root: Node): void {
  if (!root.isValid) return;
  for (const label of root.getComponentsInChildren(Label)) {
    if (!label.isValid) continue;
    label.useSystemFont = true;
    label.fontFamily = REGULAR_FONT_FAMILY;
    // fontFamily/string setter 对等值会早返；字体异步到位后必须直接脏化渲染数据。
    label.updateRenderData(true);
  }
}

interface FontLoadOutcome {
  readonly loaded: boolean;
  readonly timedOut: boolean;
}

function awaitWithTimeout(pending: Promise<boolean>, timeoutMs: number): Promise<FontLoadOutcome> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: FontLoadOutcome): void => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      resolve(outcome);
    };
    const timer = globalThis.setTimeout(() => finish({ loaded: false, timedOut: true }), timeoutMs);
    void pending.then((loaded) => {
      finish({ loaded, timedOut: false });
    }, () => finish({ loaded: false, timedOut: false }));
  });
}

/**
 * 首帧最多等待 2s；超时后调用方继续用系统字体渲染。
 * 原始加载 promise 不取消，稍后到位会强制重排当前场景的全部 Label。
 */
export async function ensureSceneFont(root: Node, timeoutMs = FIRST_FRAME_FONT_TIMEOUT_MS): Promise<boolean> {
  const pending = ensureLoaded();
  const outcome = await awaitWithTimeout(pending, timeoutMs);
  if (outcome.loaded) {
    reflowSceneLabels(root);
    return true;
  }
  if (outcome.timedOut) {
    void pending.then((loaded) => {
      if (loaded) reflowSceneLabels(root);
    });
  }
  return false;
}
