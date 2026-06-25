# AGENTS.md

This file gives Codex and other coding agents repository-specific guidance.

## Project Overview

This is a Cocos Creator 3.8.8 single-player Dou Dizhu project. The target product is a complete offline mobile portrait game: one human player against two AI players, classic three-player rules, local settings, local records, and no network, account, payment, ads, or matchmaking in the first version.

The project has completed M0 (docs) and M1 (pure rules logic + Cocos-independent rules tests); user-approved M0 art is under `assets/resources/art/`. **M2 (single-round state machine) is now in progress via multi-AI collaboration on git worktrees** (see `coordination/`). On `main` there is still no merged `game`/`ai`/`flow`/`ui`/`data` module, scene, prefab, or Cocos runtime component.

## Current-Phase Guardrails

Read `docs/TASKS.md` and `coordination/BOARD.md` for the current milestone and task status before writing code.

**M0 (docs) and M1 (pure `rules` layer + Vitest) are complete. M2 (single-round state machine) is in progress, executed via multi-AI collaboration on git worktrees — see `coordination/PROTOCOL.md`.** Git is now initialized and used for this collaboration (this supersedes the earlier M0/M1 "do not git init" guardrail).

Still off-limits unless a task explicitly requires it:

- Do not modify root `package.json`, `tsconfig.json`, or `cocos.config.json`.
- Do not hand-write `.meta`; let Cocos Creator generate them.
- Do not create Cocos `.scene` / `.prefab` by hand (that is M3, in-editor).

If you are an **implementer AI**, follow `coordination/PROTOCOL.md`: work only inside your task's declared file scope on its own worktree branch, never edit tests or `main`, and keep pure layers (`rules`/`game`/`ai`/`flow`/`data`) free of `cc` imports.

## Source Of Truth

Use the docs in this order:

- `docs/TASKS.md` for current milestone and task status.
- `docs/ROADMAP.md` for M0-M6 iteration sequencing and acceptance criteria.
- `docs/GAME_DESIGN.md` for product scope and portrait mobile UX.
- `docs/RULES.md` for classic Dou Dizhu rule boundaries.
- `docs/ARCHITECTURE.md` for future code layering, dependencies, and data flow.
- `docs/QA_CHECKLIST.md` for validation requirements.
- `docs/ASSET_LIST.md` for planned art, audio, font, and animation needs.

If these documents conflict, treat `docs/TASKS.md` as the current execution gate and update the docs before implementing behavior.

## Architecture Rules For Future Implementation

Keep pure game logic separate from Cocos presentation code.

Planned dependency direction:

- `rules`: pure card, hand-pattern, move-generation, comparison, dealing, bidding, and scoring logic. No Cocos imports.
- `game`: round state machine and settlement. Depends on `rules`.
- `ai`: decision strategies based on `rules` and read-only snapshots. Do not mutate hidden game state.
- `flow`: thin orchestration for deal -> bid -> turn loop -> settlement, including AI thinking delay. Do not duplicate rule checks.
- `data`: local settings, records, difficulty configuration, and serialized save data.
- `ui`: Cocos components, scenes, input, animation, and audio. UI may consume game snapshots and events, but should not reimplement complex rules.

Pure layers (`rules`, `game`, `ai`, `flow`, `data`) must not import `cc`.

## Cocos Project Notes

- Use Cocos Creator 3.8.8 to open, run, and build the project.
- Do not manually edit generated or ignored folders such as `library/`, `temp/`, `build/`, `profiles/`, or `local/`.
- Let Cocos Creator create and maintain scene, prefab, asset, and `.meta` files.
- Root `package.json` has no npm scripts. M1 rules tests are isolated in `test/`; run them with `cd test && npm test`.
- The rules test runner may print a non-blocking Vite warning because Cocos uses root `package.json` field `"type": "3d"`.

## Testing Direction

Current M1 validation:

- `assets/scripts/rules/` contains the pure rules layer.
- `test/rules/` contains Vitest coverage for deck creation, deterministic shuffle/deal, hand recognition, comparison, validation, `enumerateMoves`, and `legalFollows`.
- Rules source can be type-checked independently with the local TypeScript installed under `test/node_modules`.

When M2+ implementation begins:

- Prefer a Cocos-independent test runner, planned as Vitest, for `rules`, `game`, and `ai`.
- Test deterministic dealing with injectable seeded randomness.
- Test hand recognition, legal move generation, move comparison, bidding, turn flow, settlement, and serialization.
- Add AI self-play smoke tests once the state machine exists.
- Validate UI manually in mobile portrait, especially 390x844.

## Working Style

- Keep changes scoped to the active milestone.
- Avoid speculative scaffolding for later milestones.
- Do not refactor Cocos configuration or generated files unless a task explicitly requires it.
- Update docs and QA checklists when changing project scope, rules, or milestone status.
