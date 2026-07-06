# RELEASE v1.2 打包发布记录（规划者执行 · 2026-07-06）

- 版本：v1.2（终局裁定收版 `24bf5e8`·七波闭合·基线 141 文件/739 用例全绿 + typecheck 净）
- 源提交：main `24bf5e8`
- 执行人：规划者（用户指令「打包发布」·打包为构建/验证动作，无产品码改动）

## 构建

- 工具：Cocos Creator **3.8.8** CLI（web-mobile）
- 命令（沿 v1.1 M6-D1 先例 + E-ORIENT 已验证的 inline packages 形式——CLI shorthand 不读 builder.json，orientation 必须内联传）：

```
env -u ELECTRON_RUN_AS_NODE /Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /Users/admin/Documents/Cocos/斗地主 \
  --build "platform=web-mobile;buildPath=project://build;outputName=web-mobile;debug=false;md5Cache=false;sourceMaps=false;mainBundleCompressionType=merge_dep;packages={\"web-mobile\":{\"orientation\":\"landscape\",\"embedWebDebugger\":false,\"polyfills\":{\"asyncFunctions\":true}}};startScene=dc62324b-10d4-4870-9518-1a34ce682067"
```

- 日志：`build Task (web-mobile) Finished in (3 s)`；`COCOS_EXIT=36`（本机已知 metrics/shutdown SIGTERM quirk，历史各构建一致，产物完好）。
- 注：首次构建未传 packages 时产物 `orientation:auto`（复现 E-ORIENT caveat），已按上式重建修正。

## 产物核验（`build/web-mobile/src/settings.json`）

| 项 | 值 | 判定 |
|---|---|---|
| CocosEngine | 3.8.8 | ✅ |
| launch.launchScene | `db://assets/scene/lobby.scene` | ✅（大厅启动·v1.1 D1 口径） |
| screen.designResolution | **844×390**（policy 3） | ✅（v1.2 横屏） |
| screen.orientation | **landscape** | ✅（E-ORIENT 口径） |
| 产物体量 | 52M / 283 文件 | 记录 |

## 发布冒烟（发布产物上跑 V6 全链 harness）

- 方式：`/tmp/doudizhu-v6-e2e.cjs`（Playwright + Chrome）自起服务指向本产物；seed=20260705。
- 结果：**四横屏（844×390/812×375/915×412/780×360）× 16 captures 全过**——`productErrors=[]`×4、`failedResponses=[]`×4；每档完整链路：lobby → 叫抢 → 出牌（玩家/右家/左家·逆时针）→ 结算 → 再来一局 → 第二局结算 → 返回大厅 + 暂停 menu/confirm。
- 规划者目检发布态 844×390 lobby 首屏：三面板正常渲染、难度三档文案正确、`暂无存档/暂无战绩` 空态正常。
- 证据目录：`(scratchpad)/release-smoke/`（summary.json + 4 档 ×16 图）；构建日志 `(scratchpad)/release-v12-build2.log`。

## 归档

- `build/doudizhu-v1.2-web-mobile.zip`（**43M**·build/ 目录 gitignored，产物不入库）
- sha256：`5d5cd3f0cba3b002847bc6cea83109975ff23da079d049b50c8acbeb23f6b69c`
- 部署方式：任意静态服务器托管 `web-mobile/` 目录（本地体验：`python3 -m http.server` 后浏览器打开 index.html）。

## 结论

**v1.2 web-mobile 发布包就绪**。已知非阻断项见 BOARD v1.3 债务清单（lobby v13 皮肤统一等）。
