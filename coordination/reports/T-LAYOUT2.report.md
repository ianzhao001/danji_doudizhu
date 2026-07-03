# T-LAYOUT2 实现报告

- 实现方标识：Codex
- 分支：`task/T-LAYOUT2`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/table-layout.ts`
  - 微调横屏 `landscapeLayout` 的行带：为 `infoStrip`、落牌区、状态行、左右翼 dock 预留稳定空间。
  - 无参/390x844 竖屏固定契约未改。
- `assets/scripts/ui/table-zones.ts`
  - 实现 `tableZones(width,height)`。
  - 6 个 legacy 字段直接来自 `tableLayout(width,height)`，新 zones 按相位互斥行带推导。

## 测试与类型检查输出
```
npm --prefix test test -- ui/table-zones.test.ts ui/table-layout.test.ts ui/table-layout-landscape.test.ts ui/table-layout-resolutions.test.ts
=> 4 files / 44 tests passed

npm --prefix test test
=> 135 files / 688 tests passed

npm --prefix test run typecheck
=> tsc --noEmit passed

git diff --check
=> passed

cc import grep:
rg -n "from ['\"]cc['\"]|import .*['\"]cc['\"]" assets/scripts/ui/table-zones.ts assets/scripts/ui/table-layout.ts
=> no matches
```

## 四分辨率 zone 坐标表

格式：`x,y,width,height`。

### 844x390
| zone | rect |
|---|---|
| topBar | 0,0,844,29 |
| infoStrip | 304,37,236,13 |
| opponentLeft | 0,58,135,51 |
| opponentRight | 709,58,135,51 |
| bottomCardsDock | 321,58,203,27 |
| dropZoneLeft | 143,117,127,27 |
| dropZoneRight | 574,117,127,27 |
| dropZoneHero | 338,117,169,27 |
| statusLine | 313,152,219,21 |
| actionBar | 291,181,262,37 |
| strengthMeter | 173,181,110,37 |
| turnTimer | 561,181,110,37 |
| memoryDock | 173,226,110,31 |
| advisorDock | 561,226,110,31 |
| playerHand | 0,308,844,82 |

### 812x375
| zone | rect |
|---|---|
| topBar | 0,0,812,28 |
| infoStrip | 293,36,227,13 |
| opponentLeft | 0,57,130,49 |
| opponentRight | 682,57,130,49 |
| bottomCardsDock | 309,57,195,26 |
| dropZoneLeft | 138,114,122,26 |
| dropZoneRight | 552,114,122,26 |
| dropZoneHero | 325,114,162,26 |
| statusLine | 301,148,211,21 |
| actionBar | 280,177,252,36 |
| strengthMeter | 166,177,106,36 |
| turnTimer | 540,177,106,36 |
| memoryDock | 166,221,106,30 |
| advisorDock | 540,221,106,30 |
| playerHand | 0,296,812,79 |

### 915x412
| zone | rect |
|---|---|
| topBar | 0,0,915,31 |
| infoStrip | 330,39,256,14 |
| opponentLeft | 0,61,146,52 |
| opponentRight | 769,61,146,52 |
| bottomCardsDock | 348,61,220,29 |
| dropZoneLeft | 154,121,128,29 |
| dropZoneRight | 633,121,128,29 |
| dropZoneHero | 368,121,180,29 |
| statusLine | 339,158,238,23 |
| actionBar | 323,189,270,38 |
| strengthMeter | 197,189,118,38 |
| turnTimer | 601,189,118,38 |
| memoryDock | 197,235,118,32 |
| advisorDock | 601,235,118,32 |
| playerHand | 0,326,915,86 |

### 780x360
| zone | rect |
|---|---|
| topBar | 0,0,780,27 |
| infoStrip | 281,35,218,12 |
| opponentLeft | 0,55,125,47 |
| opponentRight | 655,55,125,47 |
| bottomCardsDock | 297,55,187,25 |
| dropZoneLeft | 133,110,117,26 |
| dropZoneRight | 530,110,117,26 |
| dropZoneHero | 312,110,156,26 |
| statusLine | 289,144,203,20 |
| actionBar | 269,172,242,34 |
| strengthMeter | 160,172,101,34 |
| turnTimer | 519,172,101,34 |
| memoryDock | 160,214,101,29 |
| advisorDock | 519,214,101,29 |
| playerHand | 0,284,780,76 |

## 合并证据（approved 后由审查者回填）
- 合并前回归（分支 ef9eb2b）：
  - `npm --prefix test test`：135 files / 688 tests passed
  - `npm --prefix test run typecheck`：tsc --noEmit passed
- merge commit：`adfb876`（--no-ff merge）
- 合并后基线：139 files / 703 tests 绿 + typecheck 净
- BOARD 状态：done `adfb876`

## 与 spec 的偏差 / 关键决策
- `actionBar` 复用 legacy `actionButtons`，便于 P-G3 迁移时保持旧按钮区域语义。
- `dropZoneHero` 复用 legacy `playArea`；左右落点是相邻座位内侧的新显式区。
- 横屏 `topBar`、`opponent`、`playArea`、`actionButtons`、`playerHand` 数值有微调，目的是为新相位可见集提供 8px 以上间距；既有横屏/竖屏布局测试保持全绿。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获 `approved` 前未合并 main
- [x] 未 import cc
