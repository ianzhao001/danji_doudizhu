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
