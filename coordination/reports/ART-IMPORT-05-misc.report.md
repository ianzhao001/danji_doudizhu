# ART-IMPORT-05-misc 导入报告

- 实现方标识：Codex
- 分支：`task/art-final-review-assets`
- 状态：in-review
- 用户视觉批准来源：本对话中用户在查看 `/tmp/doudizhu-art-final-review-final/index.html` 后明确回复「视觉通过，继续导入」。
- 说明：仓库中原有 `ART-05-misc-assets.md` 要求视觉通过后另开导入；本次按用户直接指令同步完成 misc 导入并单独落 report。

## 改了哪些文件
- 新增目录：`assets/resources/art/misc/`
- 新增 misc PNG：
  - `splash.png`
  - `app-icon.png`
  - `empty-records.png`
  - `badge-win.png`
  - `badge-lose.png`
- Cocos Creator 3.8.8 自动生成 `misc.meta` 与上述 `.png.meta`。
- `assets/scripts/ui/asset-keys.ts`：新增 `splash`、`appIcon`、`emptyRecords`、`settlementWinBadge`、`settlementLoseBadge`。
- `test/ui/asset-keys.test.ts`：补资源键断言。

## 导入清单与键映射
- `splash.png` → `splash` → `art/misc/splash`
- `app-icon.png` → `appIcon` → `art/misc/app-icon`
- `empty-records.png` → `emptyRecords` → `art/misc/empty-records`
- `badge-win.png` → `settlementWinBadge` → `art/misc/badge-win`
- `badge-lose.png` → `settlementLoseBadge` → `art/misc/badge-lose`

## 验证
```
PNG/meta validation:
5 misc PNGs exist, expected sizes pass, .meta exists, duplicate UUIDs []

Cocos Creator:
temp/logs/project.log contains Cocos Creator v3.8.8
rg -i "error|exception|failed" temp/logs/project.log
无命中

npm --prefix test test
Test Files  133 passed (133)
Tests       653 passed (653)

npm --prefix test run typecheck
tsc --noEmit

git diff --check
通过，无输出
```

## 自检
- [x] 用户视觉终审已通过
- [x] 资源导入 `assets/resources/art/misc/`
- [x] `.meta` 由 Creator 生成
- [x] `asset-keys` 路径无扩展名、无重复
- [x] 未手写 `.meta`
