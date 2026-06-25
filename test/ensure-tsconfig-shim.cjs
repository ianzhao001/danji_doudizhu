/**
 * CLI 测试环境补丁：
 * Cocos 根 tsconfig.json 里 `extends: "./temp/cli/tsconfig.cocos.json"`，
 * 但该文件仅在编辑器/构建时生成，CLI 跑 vitest 时缺失，导致 esbuild 解析 tsconfig 报错。
 * 这里在 temp/（Cocos 的临时目录，已 gitignore）补一个最小占位，保证可解析。
 * 作为 pretest 钩子运行，temp/ 被清理后会自动重建，不触碰任何真实配置或 assets/。
 */
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..', 'temp', 'cli');
const file = path.join(dir, 'tsconfig.cocos.json');

if (!fs.existsSync(file)) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ compilerOptions: {} }, null, 2));
}
