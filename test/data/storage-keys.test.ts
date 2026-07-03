/**
 * T-DEDUP 失败测试（架构种入·不可改）：存储键单一事实源。
 * 当前 storage-keys.ts 为落桩（import 即 throw）→ 应先红，实现到绿。
 * 组件侧字面量替换由复审 grep 核验（`grep -rn "doudizhu\." assets/scripts --include=*.ts`
 * 应仅命中 storage-keys.ts），不在本测试断言。
 */
import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../../assets/scripts/data/storage-keys';

describe('T-DEDUP 存储键单一事实源', () => {
  it('四个键与既有字面量逐一相等（行为零变化）', () => {
    expect(STORAGE_KEYS.settings).toBe('doudizhu.settings');
    expect(STORAGE_KEYS.save).toBe('doudizhu.save');
    expect(STORAGE_KEYS.stats).toBe('doudizhu.stats');
    expect(STORAGE_KEYS.records).toBe('doudizhu.records');
  });

  it('全部键共享 doudizhu. 前缀且互不相同', () => {
    const values = Object.values(STORAGE_KEYS);
    expect(values).toHaveLength(4);
    for (const value of values) expect(value.startsWith('doudizhu.')).toBe(true);
    expect(new Set(values).size).toBe(values.length);
  });
});
