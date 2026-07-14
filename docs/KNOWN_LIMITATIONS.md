# Known Limitations

本文件记录当前版本的已知限制与后续债务，不作为缺陷清单。

## Product Scope

- 当前版本为离线单机、横屏、经典三人斗地主。
- 不包含联网、账号、支付、广告、匹配、排行榜或云存档。
- 战绩、设置与断局恢复均为本地存储。

## Platform And Layout

- 当前发布基线为 `844x390` 横屏 `web-mobile`。
- 桌面大屏、平板专属布局与折叠屏适配不在当前版本范围内。

## AI And Gameplay

- 策略只基于可见快照与玩家手牌做决策，不读取对手隐藏手牌。
- 三档难度属于启发式策略，不承诺最优解。
- **困难档 v2(W-AUDIT-AI,2026-07-13)**:精确拆牌引擎驱动(`ai/decompose.ts`,最少手数+最优分解,默认炸弹保护)——领出按分解组件白出、跟牌按结构代价定压/过(无安全跟法不再无脑烧炸)、必胜看破全程(≤17 张)、叫分弃「1 高牌即抢」换结构化判强(`ai/bidding-hard.ts`);农民侧用公开底牌归因(RoundState v2 `bottom`)。强度门:T-AI-2 胜率差 Hard−Normal ≥ +0.05(实测 +0.117)、Hard−Simple ≥ +0.15(实测 +0.567);重型门(100 seeds)G2 地主角色差 ≥ +0.03(实测 +0.16,历史「Hard 作地主弱于 Normal」反转已消灭)、G3 ≥ 0。**跌破门槛即强度回归,不许调低门槛消红。**
- 提示按钮 = `adviseBestMove` 委托困难档最优推荐(同信息面,不作弊),随困难档升级自动升级;`SHOW_ADVISOR` 隐藏件(对局建议 dock/叫抢建议面板)冻结未迭代。
- **静态门的能力边界与运行时闭合(W-AUDIT-AI R1–R7 对抗复审结论·常驻判据)**:提示委托链(按钮→ctx 绑定→applyHint→pickHint→hard)有两层门。**静态层**=纯岛行为契约 + TypeScript AST 源码契约(真身唯一/规范体逐字/负向不变式:禁遮蔽·禁字符串访问·禁成员赋值/使能量与守卫链全锁),七轮红队注入(注释假方法抢占、barrel 别名进口、吞历史、结果覆盖、实例属性遮蔽、使能量常量化、假守卫、上游实参强制、上游中间变量改写)逐一封堵——**但静态门原理上无法穷尽一个 import `cc` 的大组件里任意一行的运行时颠覆**,只作「疏漏级改写」的拦截器。**运行时层(完备证据)**=`coordination/scripts/w-audit-hint-probe.mjs`:冷构建产物上走真实链路(大厅→难度切困难→开始新局→真实叫抢→hero 回合)后 **CDP 真点击 action-hint**,录下选中与当时快照+历史入 `coordination/reports/W-AUDIT-AI-evidence/hint-capture.json`;`test/verify/hint-runtime-capture.test.ts` 离线复算 `adviseBestMove` 逐张对照 —— **「点击 → 选中 == 困难档最优推荐」端到端闭合**。**规矩:凡改提示链路(applyHint / hint-flow / 按钮注册 / ctx 绑定 / hard 决策),冷构建收版时必须重跑该探针刷新证据**,否则运行时门守的是旧引擎。
- turn timer 仅作提示，不会超时自动代打。

## Save And Resume

- `RoundState` 目前重点覆盖 Playing 与 Settled 路径。
- bidding 阶段的恢复不是当前重点场景。
- 存档损坏按 data 层约定抛错或降级处理。
- **存档版本化走显式迁移链(v1.6 审计 P1-3)**:老版本经 `game/serialize.ts` 的 `MIGRATIONS` 逐级 N→N+1 升到当前版;**高于当前版本仍硬拒,只升不降**;同版本内新增可选字段经 `CURRENT_VERSION_ADDITIVE_DEFAULTS` 补默认。外层槽位信封(`data/save.ts` `SAVE_VERSION`)暂仍为版本硬拒,升信封版时需另配链。
- v1 存档格式已冻结为 golden 绊线(`test/game/fixtures/round-save.v1.golden.json`,由真实 `serializeRound` 一次性生成,**永不重新生成**):任何使 v1 存档不可加载或语义漂移的改动都会先撞 `test/game/serialize-golden-v1.test.ts`——去写迁移器,不许改 fixture。
- **存档格式通则**:改 `RoundState`/存档字段=先想迁移——新增可选字段登记默认值,其余一律升版本+写迁移器+golden 绊线转绿,禁止原地重定义既有版本字段含义。
- resume 不回传 RNG seed(v1.6 审计登记·低优先):生产 seed 默认时间戳、三档 AI 出牌不消费 rng,断局恢复后「同种子复现同局」本就不成立,与该姿态自洽;未来若需复现,把 seed 纳入 `ResumePayload` 即可。

## Assets And Audio

- v1.5 起大厅与游戏内 UI 已统一为 v15 皮肤族(v12/v13 分裂结案);v13/v1 键与文件保留仅作回滚。**口径修正(v1.6)**:顶栏倍数/炸弹/手牌/相位小徽标(badge-multiplier-v13/badge-timer-v13)与牌面/头像/桌布仍消费 v13 键(无 v15 对应件,v1.7 素材);顶栏地主名牌已于 v1.6 换 seatNameplateV15。
- **按钮族 v17(v1.6 终审整改①)**:全场景按钮(含暂停 toggle/action)统一 **btn-{primary,secondary,tertiary,disabled}-v17 规则圆角矩形**——用户点名"不要异形形状",v15 异形花瓣端头按钮与 pause-btn-toggle/action 专皮**保留仅作回滚,产品已不消费**。capInsets **34 四向 = 统一保守留量**(**Creator 从 SpriteFrame trim 后有效 rect 算 inset**,本图 trim rect=(6,6,468,148);相对该 rect 实测圆角固定边带需求约 **23–28px**,34 覆盖四向并留余量,非硬下限。初设 28/18 时**垂直 18px 不足**致 9-slice 把圆角截成切角八边形;矮按钮 36-60 高 <2×34 由 Cocos SLICED 等比压缩边带,圆角等比缩小保持圆润)。纯净文字区 82%×62.5%,深莓文字对比 8.23:1+。
- **按钮/药丸/名牌族 v18(v1.6 二次终审整改·用户设计原则)**:用户裁决「**如果会在元素上盖字的设计,不宜出现很多线条,设计的相对简洁一些**」。据此全族改 **单一填充 + 至多一条细描边** 的 v18 极简族——`btn-{primary,secondary,tertiary,disabled}-v18` / `info-pill-v18` / `seat-nameplate-v18`,规则圆角矩形。**v17(多层描边)与 v15(异形花瓣)键与文件保留仅作回滚,产品已不消费**。capInsets 相对 trim rect:按钮 96/64、药丸 26、名牌 120/56。**结算胜/负横幅退役**:v15 燕尾缎带 alpha 掩膜中段行最窄仅 75%(异形),改用 v18 牌匾(胜=tertiary 暖金 / 负=secondary 奶油),零新图;`settlementBannerWin/LoseV15` 键保留仅作回滚。
- **盖字设计原则(v1.6 二次终审,成为常驻判据)**:凡「会被文字盖住」的底图,必须 ① 规则形状(alpha 中段行行满宽/列列满高 ≥98%)、② 中央净区零线条(线条像素占比 ≤3%)、③ 文字盒 ⊂ 实测净区、④ 字底对比 ≥ AA 4.5:1。四条均由 `coordination/scripts/s4-image-gates.py` 机检(门 B/C/D/F),配 `s4-evidence.mjs`(门 A 文字溢出、门 E icon 变形)。**新增/替换任何盖字皮或字色前,先跑这两个脚本**。
- **字色随皮走(v1.6 二次终审·自伤教训)**:v15 皮是**深底**、v18 皮是**浅底**。换皮时若不同步改字色,浅奶油/金/白字压在浅底上只剩 **1.22:1**(实测,ASCII 亮度图显示字比底还亮,近乎隐形)。**规矩:换皮 = 换字色,且必须跑门C 复验**——门C 拿「声明字色」与「截图里该文字盒的底色中位数」算对比,专为堵这一整类回归而设。
- **icon 变形通则(v1.6 二次终审整改②)**:`trimType=auto` 会削掉透明边 → **SpriteFrame rect 的长宽比不再等于原图长宽比**;SIMPLE 精灵按原图比例配框再渲染就会被拉伸。判据是「**rect 比 vs 真实显示框比**」(≤5%),不是「rect 比 vs 原图比」——SLICED 九宫格按设计就该拉伸,拿原图比例卡它是错的。已修 11 件:徽标/春天章/空态图 + 卡面/大小王/花色/牌背(改 `trimType=none`)+ 三张立绘(裁后比例各不相同,一个框喂不平 → `addSpriteContain` **等比内接**)。
- **9-slice/capInsets 通则(v1.6 两次踩坑后成文)**:凡涉 SLICED 拉伸、capInsets 取值、离线拉伸模拟,**一律以 SpriteFrame 的 trim 后有效 rect(meta `f9941.userData` 的 trimX/trimY/width/height)为坐标系**,不可用原始 PNG 绝对坐标——被 trim 掉的透明安全边不参与固定边带。S2 `flowStretch` 与 S3 capInsets 口径均曾在此处出错。
- ~~结算面板底皮肤仍为 v13~~ **已结案(v1.6 ART-V16+P-RESULT-SKIN)**:面板底/胜败横幅全套 v15(capInsets 56 实测,横幅 640×108 原生比修掉 v13 压扁 1.67× 暗伤),入场编排/彩带/星光零改动;v13 三键保留仅作回滚。
- **12 个音频键 12 个文件全部接活(v1.6 T-CUE-AUDIO 补齐三哑 cue)**:redeal/reset/landlordDecided 同配方合成接线,合成器 `coordination/scripts/v16-audio-synth.py` 可复现;死资产保持清零。
- 当前音频基线为 WAV(占位级合成),后续可再做音质重制与体积/平台优化。
- **场景 @property 绑定在冷构建后会失效(v1.6 二次终审·严重·可复现)**:`game.scene`/`lobby.scene` 里的 `background`、`cardTemplate` 是 `@property` 绑定,`onLoad` 靠它们关闭场景内的**静态旧背景**。**冷构建(清 library 后全量重导)实测两者双双变 `null`**——旧的 `game-table-bg`(绿桌)/`lobby-bg` 便盖在运行时 v13 粉桌之上,城市远景与压暗幕整个消失(截图实锤)。这与 `hideStrayPlaceholderLabels` 注释所述是**同一类缺陷**(v1.5 已在 label 上踩过一次)。**规矩:任何依赖场景 @property 绑定的隐藏/引用,一律加「按节点名兜底」**——本仓已把 `game-table-bg`/`card-template` 并入 `SCAFFOLD_NODE_NAMES`、`lobby-bg` 并入 `hideLegacyScaffold`,不再依赖场景序列化。**v1.6 审计起测试锚死(P1-1)**:`test/architecture-gates.test.ts` 给 ui/components 的 `@property` 上棘轮(基线 14,只减不增,新场景引用一律按名兜底);`test/ui/scene-structure.test.ts` 解析 `.scene` JSON 断言兜底名单节点名真实在场(Creator 里改名/删节点先撞测试;运行时创建的瞬时 HUD 名不在断言范围)。冷构建根因疑与 W3-A R3「冷导入把存量数据打回 importer 默认」同源(引擎机制层),登记不追。**冷构建后仍建议肉眼抽查首屏**——"背景整体换了张图"这类退化门与结构测试都不覆盖。
- `.scene`、`.prefab`、`.meta` 仍要求由 Cocos Creator 维护;CLI 构建三坑与 meta 冷导入注意事项见 BOARD v1.5 段运维注记。

## Release Gates

- 当前版本已具备 `web-mobile` 构建基线，启动场景为 `lobby.scene`。
- 后续界面任务仍需补充横屏视口验证与人工体验确认。

## Deferred Refactors

- `ui/components/game-scene-skeleton.ts` 与 `flow/round-runtime.ts` 体量偏大，适合在后续版本继续拆分。
- `legalFollows` 仍采用全量枚举策略，若后续 profiling 证明确有瓶颈，再做等价剪枝优化。
- `save.ts` 仍有后续整理空间，可在数据层清理时统一处理。
- `P-STRAY-LABEL`：**已结案(v1.5 W1-B)**——根因为 lobby.scene 六个 `_string:"label"` 占位 Label 依赖 @property 绑定隐藏,绑定失效即漏字;`hideLegacyScaffold` 兜底遍历隐藏,四横屏运行时探针 0 可见。
- 建议功能(V10 用户终审整改,2026-07-12):`SHOW_ADVISOR=false` 隐藏「建议开/关」dock 与叫抢建议面板,**不删除、隐藏期间不迭代**;`adviseAction`/`adviseBid` 与测试保留。提示按钮同轮恢复可见(v1.5 曾误藏,升级版 AI 最优推荐逻辑未动)。记牌器与手牌强度条仍为前端隐藏(v1.4 起)。
- 瞬时特效早剪 bug:**已结案(v1.5 P-FX-LAYER)**——常驻 fx 层豁免 render prune,特效 tween 自毁。
- ~~lobby 难度行「当前」角标被行钮右端头半遮~~ **已结案(v1.6 P-BADGE-CLIP)**:角标白底小片方案,三难度×四横屏 12 图验收,窄档折行一并消失。
- v1.6 走查登记不修(v1.7 素材):现有 9 个存量音效为占位级合成可整体重制;卡牌/头像/顶栏小徽标 v15 化。
- **教程/帮助/战绩/历史(v1.6 终审整改⑤,2026-07-13)**:用户点名"去掉教程和帮助;隐藏战绩和历史模块"——lobby 四个入口按钮**全部移除**(四横屏×4 入口=16 项运行时断言证不存在);`renderTutorialScreen/renderHelpScreen/renderStatsScreen/renderRecordsScreen` 四方法与 `screen` 状态机、对应 view-model 与测试**全部保留、隐藏期间不迭代**(与建议/记牌器同口径)。战绩数据仍在本地累积,首页概要行(局数/胜率/净分)保留。
- **文字溢出策略(v1.6 终审整改②)**:底层 `ui-helpers.addLabel/addButton` 统一 `Label.Overflow.SHRINK`——任何文字超出容器自动缩字号,**永不溢出**;按钮文字盒配 v17 纯净区(82%)放宽至 0.80。此为全局兜底,新增 UI 文字无需单独防溢出。
- **AI 节奏(v1.6 终审整改③)**:`game-scene-skeleton` thinkingDelayMs 取 `Math.max(1000, 难度均值)` —— 各档 AI 每步保底 1s(原困难档均值仅 375ms,用户点名太快);难度差异现仅体现在策略强度,不再体现为出牌速度。`difficultyConfig.thinkDelayMs` 配置保留(下限被 1000 兜底)。
- **大厅布局(v1.6 终审整改④)**:三区(战绩/难度/设置)合一为**单居中面板**;难度改**单切换按钮**(点击循环 简单→普通→困难),原难度三行描述文字随之移除(该处曾是文字溢出高发区)。
- **文字溢出策略(v1.6 二次终审加固)**:除 `SHRINK` 全局兜底外,**文字盒本身必须 ⊂ 盖字皮的实测净区**(门B)——`SHRINK` 只保证"不超出文字盒",若文字盒本身撑出净区,字仍会压到描边(用户「btn 文字和图像的线条重合」的直接成因)。大厅按钮文字盒原取按钮**全高**,已收到 0.80;药丸/名牌/倒计时同理按净区重排。
- **倒计时条(v1.6 二次终审·举一反三)**:原为全 UI 唯一的深色残留(`surfaceRaised` 48,40,58,旧深色主题遗物),且 4px 进度条**画在字脚下**、告急时暗红字压深底仅 1.6:1。改 v18 浅药丸 + **去掉进度条**(倒计时语义由数字承载,更简洁)+ 告急字加深至 6.2:1。`surfaceRaised` 仅剩强度条/记牌器/建议条三个**已隐藏**功能在用。
- **顶栏 HUD 底板(v1.6 二次终审·举一反三)**:相位/倍数/炸弹/手牌四项原直接压在灯笼彩带密布的桌景照片上(对比 3.96~4.06:1)。同屏「地主X」早有干净名牌底、一眼可读——照此给左右两组各补一块 `info-pill-v18` 净底板(尺寸由内容边界推出,随视口自适应)。
- **卡牌兜底底板(v1.6 用户追加①,2026-07-13)**:每张牌原先垫一层 `card-fill`(Graphics 的 `surface` 圆角面板 + brand 描边)作卡面图兜底。卡面图一旦带透明边,这层兜底就从边缘露出来——17 张并排即连成一整条「面板」(用户点名去掉)。**已删除 `card-fill` 与 `drawCardBase`**;卡面/王牌/牌背/花色 meta 保持紧图(`trimType=auto`),渲染统一走 `fitSpriteInBox` **等比内接**(不拉伸、不留底、不露底板)。**通则:SIMPLE 精灵一律等比内接,不要用 Graphics 兜底层垫在图下面**——图一旦有透明边就会漏底。顶部三张底牌的托盘 `bottom-cards-dock-v15` 保留(有意设计的牌托,上面不盖字)。
- **空气泡不常驻(v1.6 用户追加②)**:`deriveLastPlays` 无消息时返回 `kind=null / text='—'`,视图层原先照样铺一个空药丸常驻三席。改为 `kind===null` 直接不渲染(旧节点由 render prune 自动销毁)。**view-model 与其测试零改动**——`'—'` 仍是它的空值语义,只是视图层不再展示。
- **v15 结算横幅零产品消费(v1.6·Codex S4 审查阻断)**:换肤时只改了 `result-overlay-renderer` 的消费点,**漏了 `RUNTIME_PRELOAD_SPRITES` 预载表**——`onLoad` 仍会实际加载。已移出预载。**规矩:退役任何资产,除消费点外必须同查预载表**(`game-scene-skeleton.ts` 的 `RUNTIME_PRELOAD_SPRITES`),否则「零消费」的披露不成立。
- **机检门计数口径**:门A 是**全扫**(13 屏 323 个 Label);门C 是**有效数**(202,排除模态黑幕遮挡下的字——幕后字色被压暗,声明字色不再等于屏上字色)。两者数字不同是正常的,不要混用。
- **退役键物理隔离(v1.6 审计 P1-2)**:仅作回滚的 17 键(v15 异形按钮族/v17 描边按钮族/v15 信息条与名牌/胜负横幅 v15/结算 v13 三键/pause 专皮)已移入 `ui/asset-keys-rollback.ts`;`test/architecture-gates.test.ts` 门④断言其在产品代码零消费(含预载表)——S4 R1「预载表漏项」一类回归由门堵死,不再靠人工 grep。更老的 v1/v13 代键仍留在活跃表(部分仍被消费、部分被测试重钉),未纳入本轮隔离。
