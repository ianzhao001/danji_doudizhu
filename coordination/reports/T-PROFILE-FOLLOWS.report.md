# T-PROFILE-FOLLOWS Report

## Status

- Result: complete
- Branch: `task/T-PROFILE-FOLLOWS`
- Worktree: `/Users/admin/Documents/Cocos/斗地主.worktrees/T-PROFILE-FOLLOWS`
- Scope: added standalone bench script plus this report only; no product code changed.

## Reproduction

- Bench: `npm --prefix test exec tsx test/bench/legal-follows.bench.ts`
- Full test: `npm --prefix test test`
- Typecheck: `npm --prefix test run typecheck`

Bench uses seeds `1..60` and rotates levels by seed:

- seed index `0 mod 3`: `[simple, normal, hard]`
- seed index `1 mod 3`: `[normal, hard, simple]`
- seed index `2 mod 3`: `[hard, simple, normal]`

Because product strategies statically import `legalFollows`, the bench does not patch product code. It runs a pure baseline pass, then a profile pass that probes `legalFollows` with the same follow-turn hand/current-pattern input before delegating to the normal strategy path. The probe count matches one follow-turn `legalFollows` call per AI decision; the ratio below uses the uninstrumented baseline wall time.

## Environment

- Node: `v24.15.0`
- Platform: `darwin arm64`
- CPU: `Apple M4 Pro`
- CPU count: `12`
- Load average during final bench: `[5.882, 9.482, 8.542]`
- Bench concurrency: `1`

## Results

- Baseline selfplay 60 seeds: `3787.832ms`
- Average per seed: `63.131ms`
- Total turns: `2332`
- Average turns per seed: `38.867`
- Landlords: `[40, 17, 3]`
- Winners: `{ "landlord": 50, "farmer": 10 }`

`legalFollows` profile:

- Calls: `1898`
- Cumulative time: `166.629ms`
- Average per call: `0.088ms`
- Ratio of baseline wall time: `0.044` / `4.4%`
- Ratio of instrumented wall time: `0.042` / `4.2%`
- Zero-result calls: `824`
- Average result moves: `2.009`

By current-pattern category:

| Category | Calls | Total ms | Max ms |
| --- | ---: | ---: | ---: |
| Single | 1174 | 87.621 | 5.630 |
| Pair | 362 | 35.769 | 4.094 |
| Straight | 126 | 19.223 | 1.826 |
| TripsPair | 85 | 6.743 | 0.425 |
| ConsecutivePairs | 46 | 6.920 | 0.942 |
| Bomb | 45 | 3.873 | 0.266 |
| Rocket | 34 | 3.180 | 0.301 |
| TripsSingle | 15 | 2.014 | 0.369 |
| AirplanePairs | 7 | 0.929 | 0.333 |
| AirplaneSingles | 4 | 0.355 | 0.228 |

Top 5 heaviest single calls:

| ms | Seed | Turn | Seat | Level | Hand count | Current shape | Result moves | Hand shape |
| ---: | ---: | ---: | ---: | --- | ---: | --- | ---: | --- |
| 5.630 | 52 | 8 | 2 | hard | 17 | `Single len=1 main=9 cards=[9]` | 6 | `Jx3 5x2 3x2 Xx1 7x1 10x3 8x1 2x1 Qx1 4x1 Kx1` |
| 4.094 | 13 | 20 | 2 | hard | 17 | `Pair len=2 main=J cards=[J J]` | 3 | `Ax2 5x2 Kx2 xx1 4x3 6x3 Jx1 Qx2 3x1` |
| 2.565 | 39 | 7 | 1 | simple | 14 | `Single len=1 main=2 cards=[2]` | 0 | `Qx2 6x2 9x3 Jx1 7x2 2x1 Kx2 8x1` |
| 1.929 | 57 | 4 | 1 | simple | 17 | `Pair len=2 main=3 cards=[3 3]` | 5 | `5x1 10x2 Qx2 3x1 7x2 xx1 Kx2 Ax2 6x1 2x1 9x1 8x1` |
| 1.826 | 47 | 1 | 1 | hard | 17 | `Straight len=10 main=Q cards=[3 4 5 6 7 8 9 10 J Q]` | 2 | `4x1 6x2 Jx2 Kx1 Ax1 9x2 8x2 Qx1 7x1 10x2 5x1 xx1` |

## Planner Threshold Decision

- Threshold: `legalFollows` ratio `> 40%` or selfplay 60 seeds `> 30000ms`.
- Observed: `4.4%` and `3787.832ms`.
- Decision data: below both thresholds.
- Recommendation to planner: do not dispatch second-stage equivalent pruning from this measurement; archive as "不动 keystone".

## Verification

- `npm --prefix test install`: pass
- `npm --prefix test exec tsx test/bench/legal-follows.bench.ts`: pass
- `npm --prefix test test`: pass, 148 files / 762 tests
- `npm --prefix test run typecheck`: pass

## Review (审查者·GLM-5.2·2026-07-08)

- Verdict: **approved**
- Branch: `task/T-PROFILE-FOLLOWS` @ `f7dffd0`（merge-base `620510f`·executor commit `f7dffd0`·仅 2 新文件）

### 文件域核销

- 执行者 commit `f7dffd0` 仅触 2 新文件：`test/bench/legal-follows.bench.ts`（325 行）+ `coordination/reports/T-PROFILE-FOLLOWS.report.md`（89 行）✅
- 产品代码零改动：diff stat 确认无任何 `assets/` 文件变更 ✅
- 分支基于旧 main（`620510f`·P-GS-SPLIT2/P-BID-POLISH 前）；merge 时仅增 2 新文件，无冲突（main 无 `test/bench/` 目录）✅

### bench 隔离核

- vitest config `include: ['**/*.test.ts']`；bench 文件名 `.bench.ts` 不匹配 → 不入默认套件 ✅
- 全量 vitest 套件数不变（merge 后 main 仍 149/770）✅
- bench 为独立脚本经 `npm --prefix test exec tsx` 跑，不影响 CI ✅

### 数据可复现性核

- 确定性指标完全一致（审查者独立复跑）：seeds 1..60、turns 2332、landlords [40,17,3]、winners {landlord:50,farmer:10}、legalFollows calls 1898 ✅
- 耗时指标因机器负载差异合理浮动（baseline 3187ms vs 报告 3788ms·loadavg 不同），ratio 1.5%~4.4% 均远低于 40% 阈值 ✅
- 环境记录完整：Node 版本、platform、arch、CPU model、cpuCount、loadavg、concurrency ✅

### 阈值裁定核

- `legalFollows` 占比 4.4%（< 40%）且 selfplay 60 seeds 3788ms（< 30000ms）→ 双双低于阈值 → 不派第二段等价剪枝 ✅
- 报告只交数据与复现命令，无优化实现 ✅

### 纯层核

- bench 文件 imports：`node:os`/`node:perf_hooks`（Node 内置）+ `ai`/`flow`/`game`/`rules` barrel（纯逻辑层）✅
- 零 `cc` import ✅
- barrel exports 使用 `export *` 语法，P-GS-SPLIT2/P-BID-POLISH 未改纯逻辑层 → bench imports 在当前 main 仍有效 ✅

### 质量门

- `npm --prefix test test`：148 files / 762 tests 全绿（旧 main 基线·bench 不入套件）✅
- `npm --prefix test run typecheck`：净（bench 文件编译通过）✅
- `git diff --check`：净 ✅
- `npm --prefix test exec tsx test/bench/legal-follows.bench.ts`：审查者独立复跑成功，确定性指标全匹配 ✅

### 全量回扫

- 覆盖全仓 + 本任务 diff（2 新文件）
- 回扫结果：0 域内致命 · 0 域外致命 · 0 拿不准
- 跨模块回归：bench 为独立脚本，无任何模块 import bench；产品代码零改动，无下游影响
