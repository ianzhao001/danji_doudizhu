/**
 * T-DEDUP 本地存储键单一事实源。架构落桩——实现方实现（去掉 throw、给出常量），
 * 使 test/data/storage-keys.test.ts 转绿，并把两巨组件的 'doudizhu.*' 字面量全部替换为本模块 import。
 * 规则见 coordination/tasks/T-DEDUP.md。纯常量模块，禁止 import `cc`。
 */

export interface StorageKeys {
  readonly settings: string;
  readonly save: string;
  readonly stats: string;
  readonly records: string;
}

export const STORAGE_KEYS = {
  settings: 'doudizhu.settings',
  save: 'doudizhu.save',
  stats: 'doudizhu.stats',
  records: 'doudizhu.records',
} as const satisfies StorageKeys;
