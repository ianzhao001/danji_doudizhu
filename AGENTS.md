# AGENTS.md

This file gives Codex and other coding agents repository-specific guidance.

## Project Overview

This is a Cocos Creator 3.8.8 single-player Dou Dizhu project. The target product is a complete offline mobile portrait game: one human player against two AI players, classic three-player rules, local settings, local records, and no network, account, payment, ads, or matchmaking in the first version.

The project has completed milestone M1: pure rules logic and Cocos-independent rules tests. M0 documentation is complete, and user-approved M0 art resources have been imported under `assets/resources/art/`. There is still no gameplay scene, prefab, UI, game state machine, AI, flow layer, local data layer, or Cocos runtime component.

## Current-Phase Guardrails

Before writing implementation code, read `docs/TASKS.md`.

If `docs/TASKS.md` still says the current phase is M0, do not:

- Add `.ts`, `.js`, `.scene`, `.prefab`, or `.meta` files.
- Modify `assets/`.
- Modify `package.json`, `tsconfig.json`, or `cocos.config.json`.
- Run `git init`, create commits, or otherwise establish Git history.
- Create Cocos scene or prefab files by hand.

During M0, only project documentation changes are expected unless the user explicitly moves the project into a later implementation milestone.

If `docs/TASKS.md` says M1 is complete and M2 has not been explicitly started, do not:

- Add `game`, `ai`, `flow`, `ui`, or `data` implementation modules.
- Add `.scene` or `.prefab` files.
- Modify root `package.json`, `tsconfig.json`, or `cocos.config.json`.
- Run `git init`, create commits, or otherwise establish Git history.

During the M1/M2 handoff, expected changes are documentation-only unless the user explicitly starts M2.

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
