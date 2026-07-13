# Offline Dou Dizhu

[中文](README.md)

This is an offline, single-player Dou Dizhu project built with Cocos Creator 3.8.8. The human player controls one seat while two computer opponents control the others. It implements the classic three-player rules, a complete round, three AI levels, local settings, match records, and interrupted-game recovery.

The current release is v1.6. The repository is intended to be runnable from source by people who do not have a software-development background.

## Project Overview

| Item | Current configuration |
| --- | --- |
| Game type | Offline, classic three-player Dou Dizhu |
| Engine | Cocos Creator 3.8.8 |
| Language | TypeScript |
| Orientation | Mobile landscape |
| Design resolution | `844×390` |
| Launch scene | `assets/scene/lobby.scene` |
| Build target | `web-mobile` |
| AI levels | Simple, Normal, Hard |
| Verification baseline | 160 test files and 874 passing tests, 2 environment-gated tests skipped, typecheck passing |

## Design Principles

The project is designed around four goals: reliable rules, reproducible flow, replaceable presentation, and an approachable run path.

1. Game rules are separated from presentation. Pattern recognition, round state, AI, and persistence do not depend on Cocos; the UI handles rendering, input, animation, and audio.
2. Every action uses the same rule validation. Human input, AI decisions, and hints share the legal-move enumeration instead of implementing separate rules.
3. State and events are separate. A snapshot describes what the game is now, while the event stream describes what just happened. The UI animates events and then reconciles against the latest snapshot.
4. Random behavior is reproducible. Shuffling and self-play accept deterministic seeds for stable tests and debugging.
5. Data stays on the device. Settings, records, and an unfinished round are not uploaded to a server.
6. The layout is landscape-first. The hand stays at the bottom, the two AI seats stay at the upper sides, and play and action areas remain near the center of the table.

## Game Features

### Core gameplay

- One human player versus two computer players.
- A standard 54-card deck: 17 cards per player and 3 bottom cards.
- Bidding, robbing the landlord, redealing when nobody bids, and assigning the bottom cards to the landlord.
- Singles, pairs, triples, triple-with-single, triple-with-pair, straights, consecutive pairs, airplanes, four-with-two, bombs, rockets, and the other standard combinations used by the project rules.
- Play, pass, trick reset after consecutive passes, win detection, and settlement.
- Bid multipliers, bombs, rockets, spring, and anti-spring scoring.

### AI and hints

- Simple: prioritizes legal, direct actions.
- Normal: adds basic hand decomposition, combinations, teammate awareness, and bomb preservation.
- Hard: adds initiative control, endgame evaluation, visible-card memory, and deeper candidate scoring.
- AI reads only the permitted snapshot and never reads hidden opponent cards.
- Hints reuse the same legal-move foundation as AI and return playable candidates for the current trick.

### Offline experience

- Lobby start flow and difficulty selection.
- Tap and drag hand selection, deselection, and invalid-play protection.
- Pause, resume, restart, and return to lobby.
- Local audio, vibration, animation, and difficulty settings.
- Local match records, history, and statistics.
- Save and recovery for an unfinished round.
- Deal, play, bomb, rocket, transition, and result animations.
- Audio and vibration feedback for actions, plays, bidding, wins, and losses.
- Multiple landscape sizes plus safeguards for text overflow, contrast, and sprite aspect ratio.

To keep the v1.6 lobby simple, secondary entries for records, history, tutorials, and help are hidden. Their underlying modules remain available for future restoration or extension.

## Functional Modules

| Module | Directory | Responsibility |
| --- | --- | --- |
| `rules` | `assets/scripts/rules/` | Cards, shuffling and dealing, pattern recognition, comparison, legal moves, follows, and scoring rules |
| `game` | `assets/scripts/game/` | Bidding, round state machine, action validation, settlement, serialization, replay, and recovery |
| `ai` | `assets/scripts/ai/` | Three play strategies, bidding decisions, hint ranking, hand strength, card memory, and endgame strategy |
| `flow` | `assets/scripts/flow/` | Deal-to-settlement orchestration, AI delays, pause gates, persistence, and event replay |
| `data` | `assets/scripts/data/` | Settings, difficulty, records, statistics, round saves, queries, and migrations |
| `ui` | `assets/scripts/ui/` | Cocos-independent view models, layouts, button states, hints, timers, and strings |
| `ui/components` | `assets/scripts/ui/components/` | Lobby and table Cocos components, node creation, input, animation, audio, and scene transitions |
| `runtime` | `assets/scripts/runtime/` | Adapter between Cocos local storage and the pure data layer |
| `scene` | `assets/scene/` | Lobby and main game scenes |
| `resources` | `assets/resources/` | Cards, characters, UI, effects, fonts, and audio assets |
| `test` | `test/` | Rules, state machine, AI, data, UI logic, integration, and self-play tests |

The dependency direction is fixed as `rules → game → ai/flow → data/ui → Cocos components`. Pure logic layers such as `rules`, `game`, `ai`, `flow`, and `data` must not import `cc` or depend back on presentation code.

## Data Flow

A human or AI action follows this path:

1. The UI collects a human action, or `flow` asks AI for a decision.
2. The action is submitted to the `game` state machine as a `RoundAction`.
3. `game` calls `rules` to validate the pattern, trick ownership, and legality.
4. The state machine updates the `GameSnapshot` and produces a sequence of `GameEvent` values.
5. The UI animates and plays audio from the events, then renders a stable frame from the latest snapshot.
6. The `data` layer saves settings, records, or a recoverable round when appropriate.

## Run the Game Without Development Experience

### What you need

- A Windows or macOS computer.
- Network access to GitHub and the Cocos download service.
- Cocos Dashboard and Cocos Creator 3.8.8.

Official Cocos instructions: [install Cocos Dashboard](https://docs.cocos.com/creator/3.8/manual/en/getting-started/install/). Install exactly Creator 3.8.8; do not open and upgrade the project with another major version.

### Option 1: download the source archive

1. Open the repository: <https://github.com/ianzhao001/danji_doudizhu>.
2. Select `Code`, then `Download ZIP`.
3. Extract the downloaded ZIP. Do not run the project from inside the archive.
4. Open Cocos Dashboard and install Cocos Creator 3.8.8 from the Installs page.
5. Open the Projects page, choose Import, and select the extracted project root. The correct folder contains `assets`, `package.json`, and `cocos.config.json`.
6. Open it with Creator 3.8.8 and wait for the first asset import and script compilation to finish.
7. In the Assets panel, double-click `assets/scene/lobby.scene`.
8. Select the Preview button in the editor toolbar to start the game in a browser.

When the lobby appears, choose a difficulty and start a game. You do not need to edit code or install test dependencies.

### Option 2: clone with Git

If Git and GitHub SSH access are configured, run:

```bash
git clone git@github.com:ianzhao001/danji_doudizhu.git
cd danji_doudizhu
```

Without a GitHub SSH key, use HTTPS:

```bash
git clone https://github.com/ianzhao001/danji_doudizhu.git
cd danji_doudizhu
```

Then follow steps 4 through 8 from Option 1.

## Build the Web Version

The verified release target is a mobile landscape web build.

1. Open the project with Cocos Creator 3.8.8.
2. Make sure `assets/scene/lobby.scene` is saved.
3. Choose Project → Build, or use `Ctrl/Cmd + Shift + B`.
4. Select `Web Mobile` as the platform.
5. Confirm that `lobby.scene` is included as the launch scene, the orientation is landscape, and the build path is the project `build` directory.
6. Select Build and wait for the task to report success.
7. Use the Run or Preview action on the build task page.

The output is normally created in `build/web-mobile/`. The generated `build/` directory is local and is not committed. See the [official Cocos Creator build-panel documentation](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/build-panel.html) for more details.

Android, iOS, WeChat Mini Game, and other native targets require their own SDK, signing, and platform work. They are not part of the currently verified release baseline.

## Developer Verification

Players do not need this section. Developers need Node.js and npm, then run:

```bash
npm --prefix test ci
npm --prefix test test
npm --prefix test run typecheck
git diff --check
```

The isolated test project lives under `test/` and is not included in the Cocos build. The current baseline is 160 passing test files and 874 passing tests, with 2 tests skipped because they require a specific evidence environment.

## Troubleshooting

### Dashboard reports an engine-version mismatch

Install Cocos Creator 3.8.8 from the Dashboard Installs page and explicitly choose that version for this project.

### The first preview is blank or assets are missing

Wait for asset import and TypeScript compilation to finish, then double-click `assets/scene/lobby.scene`. Do not delete or hand-edit `.meta` files.

### The browser reports that WebGL is unavailable

Update the graphics driver, use a recent Chrome, Edge, or Safari release, and make sure hardware acceleration is enabled.

### Preview does not start in the lobby

Confirm that `lobby.scene` is the open scene. Also confirm that the release build uses `lobby.scene` as its launch scene.

### Build-cache output looks stale

Use Clear Build Cache from the build task page and rebuild. Do not hand-edit generated files under `library/`, `temp/`, `build/`, `profiles/`, or `local/`.

## Current Scope and Limitations

- Offline single-player only; there is no matchmaking or human online play.
- No account, payment, advertising, leaderboard, share reward, or cloud-save system.
- Settings, records, and recovery data stay in the current browser's local storage.
- The three AI levels use heuristics and do not claim mathematically optimal play.
- The verified layout is mobile landscape; desktop-wide, tablet-specific, and foldable layouts are not separately designed.
- The turn timer is informational and does not automatically play on timeout.
- See [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) for technical details.

## Detailed Documentation

- [Current tasks and release status](docs/TASKS.md)
- [Game design](docs/GAME_DESIGN.md)
- [Dou Dizhu rules](docs/RULES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [QA checklist](docs/QA_CHECKLIST.md)
- [Known limitations](docs/KNOWN_LIMITATIONS.md)
- [Asset list](docs/ASSET_LIST.md)

## Maintainer Push Workflow

This repository protects its update log. After cloning, maintainers should run once:

```bash
node scripts/install-git-hooks.mjs
```

To publish local main-branch work to `origin/main`, use this command instead of a direct `git push`:

```bash
node scripts/push-with-readme.mjs
```

The command refreshes the remote state, summarizes unpushed commits, writes the Shanghai-time timestamp, commit subjects, affected modules, and diff statistics to both README files, creates a separate log commit, and then pushes. It stops on a dirty worktree, a remote-ahead state, or branch divergence and never rewrites history automatically.

Intentional `git push --no-verify`, edits made directly in the GitHub web interface, and pushes from clones that never installed the hook are outside this mechanism's guarantees.

## Update Log

The update log starts at the formal v1.6 release baseline and does not backfill every earlier development commit.

### 2026-07-13 18:01:55 +08:00

- Target: `origin/main`
- Covered commit: `063017ab2dd5a0c1397370686316d7af9e346992`
- Summary: released v1.6 with final visual polish, interaction refinements, landscape adaptation, and verification evidence.
- Verification: Cocos Creator 3.8.8 `web-mobile`, launch scene `lobby.scene`.

<!-- readme-changelog-covered-through: 063017ab2dd5a0c1397370686316d7af9e346992 -->
