# AGENTS.md

This file gives repository-level guidance for contributors and automation.

## Project Overview

This repository is a Cocos Creator 3.8.8 single-player Dou Dizhu project. The shipped target is an offline mobile game with one human player versus two computer opponents, classic three-player rules, local settings, and local records.

## Current Guardrails

- Read `docs/TASKS.md` and `coordination/BOARD.md` first for the current shipped status.
- Do not modify root `package.json`, `tsconfig.json`, or `cocos.config.json` unless a task explicitly requires it.
- Do not hand-write `.meta` files.
- Do not hand-author Cocos `.scene` or `.prefab` files outside the editor workflow.

## Source Of Truth

Use documents in this order:

- `docs/TASKS.md`
- `docs/ROADMAP.md`
- `docs/GAME_DESIGN.md`
- `docs/RULES.md`
- `docs/ARCHITECTURE.md`
- `docs/QA_CHECKLIST.md`
- `docs/ASSET_LIST.md`

If documents conflict, treat `docs/TASKS.md` as the current execution gate.

## Architecture Rules

Keep pure game logic separate from Cocos presentation code.

- `rules`: pure card and move logic, no Cocos imports
- `game`: round state machine and settlement
- `ai`: decision strategies based on read-only snapshots
- `flow`: orchestration for deal, bid, turn loop, and settlement
- `data`: local settings, records, and serialization
- `ui`: Cocos components, scenes, input, animation, and audio

Pure layers (`rules`, `game`, `ai`, `flow`, `data`) must not import `cc`.

Red lines added by the v1.6 audit ruling (machine-enforced):

- Pure layers must not call `Math.random`, `Date.now`, or `performance.now`; determinism comes from `createRng(seed)` in `rules/rng.ts`, with seeds injected by the UI shell.
- `Math.random` is banned in all product code under `assets/scripts` (UI included). UI may use `Date.now` for presentation-only timing.
- Rollback-only asset keys live in `ui/asset-keys-rollback.ts` and must have zero consumption outside that file (preload tables included).
- Scene-component `@property` decorators are capped by a decrease-only ratchet (currently 14). New scene references must use by-name fallback — cold builds break `@property` bindings.
- These rules are enforced by `test/architecture-gates.test.ts` (plus `test/ui/scene-structure.test.ts` for by-name fallback lists). Relaxing any of them means editing those tests in the same review.

## Project Notes

- Use Cocos Creator 3.8.8 to open, run, and build the project.
- Do not manually edit generated folders such as `library/`, `temp/`, `build/`, `profiles/`, or `local/`.
- Root tests live under `test/`; run them with `npm --prefix test test`.
- Production TypeScript is checked by `test/source-typecheck-gate.test.ts` using `tsconfig-scan.json`.

## Working Style

- Keep changes scoped to the active milestone.
- Avoid speculative scaffolding for later milestones.
- Update docs when changing scope, rules, or shipped behavior.
