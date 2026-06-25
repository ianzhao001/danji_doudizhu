import { defineConfig } from 'vitest/config';

// 测试在 test/ 下，规则源码在 ../assets/scripts/rules。
// tsconfigRaw：内联 tsconfig，阻止 esbuild 向上找到 Cocos 根 tsconfig
//   （其 extends 指向编辑器生成的 temp/cli/tsconfig.cocos.json，CLI 环境下不存在）。
// fs.allow：放开父目录，便于 import 仓库内 assets 的纯 TS 源码。
export default defineConfig({
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: 'es2020',
        useDefineForClassFields: true,
      },
    },
  },
  test: {
    // 覆盖 rules/ 及后续 game/ ai/ flow/ selfplay/ 等所有测试目录
    include: ['**/*.test.ts'],
    environment: 'node',
  },
  server: {
    fs: { allow: ['..'] },
  },
});
