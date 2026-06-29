# Architecture Decisions

本文件记录 v1 发布前已落地的关键架构决策，便于后续交接与复盘。

## ADR-001 Pure Logic And Cocos Presentation Are Separated

- Background: 项目是 Cocos Creator 3.8.8 单机斗地主，但核心规则、状态机、AI、数据持久化需要在 Vitest 中独立验证。
- Decision: `rules`/`game`/`ai`/`flow`/`data` 保持无 `cc` import；Cocos 相关代码只留在 `ui/components/*` 与 `runtime/cocos-storage.ts` 等表现/桥接层。
- Reason: 纯逻辑可在 Node 测试中快速回归，编辑器层只做薄渲染和事件接线。
- Impact: 新纯模块必须通过零 `cc` 检查；编辑器任务单独按 Creator 验收模板提供截图和 Console 证据。
- Trace: `coordination/PROTOCOL.md`；M5-14；第七批 M5-20/M5-21；第十一批验收记录。

## ADR-002 CueId Is A Literal Union

- Background: 音效和动画门控都依赖 cue id，早期 `CueId=string` 缺少编译期保护。
- Decision: M6-L6 将 `CueId` 收紧为由 `CUE_IDS` 派生的字面量联合。
- Reason: 让 audio-gate、animation-params、event-cues 之间的 cue 名称漂移能被类型和测试捕获。
- Impact: 新 cue 必须先加入集中集合，并补一致性护栏。
- Trace: M6-L6 `4c840ed`；`test/ui/cue-id-consistency.test.ts`。

## ADR-003 Persistence DTOs Live Above Data IO

- Background: 早期 resume/session 曾出现 `game→data` 和 `data→flow` 类型/运行时依赖边。
- Decision: M5-14 把 `ResumePayload`、`RoundFinishInput` 上移到 `game/types.ts`，并让 data 层只处理存储与投影。
- Reason: 防止纯层互相倒灌，保持恢复、聚合、存储的边界清晰。
- Impact: `flow→data` 保持零 import；save events 必须逐元素校验；commit finished round 做幂等处理。
- Trace: M5-14 `578d378`；`test/data/session-atomicity.test.ts`；`test/data/save-events-validation.test.ts`。

## ADR-004 Settings Controls Are Runtime-Injected

- Background: Cocos `.scene`/`.prefab`/`.meta` 不应手写，编辑器资源容易产生本地脏文件。
- Decision: M6-C1 的设置控件采用组件运行时注入，而不是手写 scene 节点。
- Reason: 降低 scene 冲突和 UUID 风险，仍能在 Creator 预览中完成交互验证。
- Impact: 后续编辑器任务优先薄组件/运行时注入；确需 scene/meta 改动时必须由 Creator 生成并在 report 列明。
- Trace: M6-C1 `31b5668`；BOARD 编辑器任务验收模板。

## ADR-005 Art Uses Preview Packages Before Asset Import

- Background: 文生图素材需要先过技术规格和用户视觉终审，不能直接污染 `assets/`。
- Decision: ART 任务先输出到 `asset-previews/pink-cartoon-production-v2/`；视觉通过后再开 ART-IMPORT 任务导入 `assets/resources/`。
- Reason: 分离生成、审美确认、编辑器导入三个风险面。
- Impact: 架构只验尺寸、透明、命名、无字、PROMPTS；视觉终审归用户。
- Trace: ART-01 `a181d45`；ART-02/03/04 `6eb8995`；ART-IMPORT-02/03/04 specs。

## ADR-006 New Pure Modules Use Direct Imports Until Barrel Integration

- Background: 多 worktree 并行新增模块时，各任务同时改 `index.ts` 容易产生桶导出冲突。
- Decision: 第六批以后纯 spec 默认 import 直引，不改 `index.ts`；批量合并后由 M6-I1 统一补 barrel exports。
- Reason: 降低并行冲突，让功能实现和公共 API 整合分离。
- Impact: 单任务测试可以直引新模块；合并后由 M6-I1 做唯一 re-export 整合。
- Trace: 第六批派发策略；M6-I1；第十一/十二/十三批 BOARD。
