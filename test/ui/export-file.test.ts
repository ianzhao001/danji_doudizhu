/**
 * sota2-R4 B3 种子②（规划者预写红种子 · 2026-07-21 · sota2）：
 * runtime/export-file——Blob 下载优先、剪贴板兜底、双失败静默返回 failed。
 *
 * 落位：Codex 逐字节复制到 test/ui/export-file.test.ts，独立 seed commit（先红取证）。
 * 预期红（对当前 main，规划者已预验）：整文件红（runtime/export-file 模块不存在，import 失败）。
 *
 * 契约（B3 卡片同源）：
 *   - exportJsonFile(filename, text): Promise<'download'|'clipboard'|'failed'>；
 *     读 globalThis.document/URL/navigator（web-mobile 唯一平台），任何一步异常不上抛。
 *
 * 负向变异自证（实现后逐条自查，报告注明红几条）：
 *   ① 下载成功仍走剪贴板（顺序颠倒）→ 用例① 红（返回值不是 download）。
 *   ② 兜底吞掉 clipboard 结果恒 failed → 用例② 红。
 *   ③ 双失败上抛 → 用例③ 红。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportJsonFile } from '../../assets/scripts/runtime/export-file';

type AnchorStub = { href: string; download: string; click: () => void };

function stubDom(options: { anchorThrows?: boolean }): { clicks: number } {
  const state = { clicks: 0 };
  vi.stubGlobal('document', {
    createElement: (tag: string): AnchorStub => {
      if (options.anchorThrows) throw new Error('no dom');
      expect(tag).toBe('a');
      return { href: '', download: '', click: () => { state.clicks += 1; } };
    },
  });
  vi.stubGlobal('URL', {
    createObjectURL: () => 'blob:mock',
    revokeObjectURL: () => {},
  });
  return state;
}

afterEach(() => vi.unstubAllGlobals());

describe('sota2-R4 B3 导出通道', () => {
  it('① 正常路径：Blob 下载成功，返回 download 且触发 click', async () => {
    const dom = stubDom({});
    vi.stubGlobal('navigator', {});
    await expect(exportJsonFile('ddz-1.json', '{"a":1}')).resolves.toBe('download');
    expect(dom.clicks).toBe(1);
  });

  it('② 下载不可用：回退剪贴板，返回 clipboard', async () => {
    stubDom({ anchorThrows: true });
    const writes: string[] = [];
    vi.stubGlobal('navigator', {
      clipboard: { writeText: (text: string) => { writes.push(text); return Promise.resolve(); } },
    });
    await expect(exportJsonFile('ddz-2.json', '{"b":2}')).resolves.toBe('clipboard');
    expect(writes).toEqual(['{"b":2}']);
  });

  it('③ 双失败：静默返回 failed，不上抛', async () => {
    stubDom({ anchorThrows: true });
    vi.stubGlobal('navigator', {
      clipboard: { writeText: () => Promise.reject(new Error('denied')) },
    });
    await expect(exportJsonFile('ddz-3.json', '{}')).resolves.toBe('failed');
  });
});
