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
- **当前未发布候选（2026-10-04）**：直接清手和已证明必胜路径优先；首手（总剩牌 54 张）保留原结构领出候选路径，仍可在其评分带内运行 PIMC。首次出牌后，公开牌数守恒、总剩牌 ≤53 的局面统一进入 `world-pimc`。困难档动作后 ≤16 张才尝试明牌世界求解，提示仍为 ≤15 张；HARD 48 世界/8 个出牌候选/120k 节点、HINT 160 世界/12 个出牌候选/300k 节点保持不变，跟牌另含过牌选项。扩大采样范围不是全阶段精确求解，超入口或耗尽预算仍回退 rollout，结构候选截断也可能漏掉好棋。
- 当前 rollout 增加合法整手清空、持牌 ≤8 张时的控制牌接完整余牌、领出喂可清手队友三类采样世界战术。战术读取的是采样牌，不能视为真实隐藏牌信息或真实局面必胜证明。单次排名共享最多 2,048 项手牌策略缓存，每项至多 16 个跟牌结果和 20 个余牌判断；持有独立手牌副本，满容量后重算，不跨排名持久化。
- 当前 53 张候选固定语料服务器首遍决策 p95 54.63ms/max 85.91ms、提示 max 336.30ms，通过既有门限；决策 p95 余量有限，尚无手机性能证据。独立 1000 seed / 6000 局保留集相对 `78d125d` 胜率差 +9.6333pp（95% CI [7.4667, 11.8333]），但下家 −0.2pp（[−3.6, 3.4]）不支持该位置提升或非劣；角色区间未做多重比较校正。
- 54 张开发候选的 Hard−Normal 分层差 +1.6667pp 曾未达 ≥5pp 门限；当前 53 张候选保留首手结构路径后复测 +8.3333pp，通过原门限。完整回归及整局测试时限修正后的定向重验已结束，剩余 3 项历史提示采证差异；未降低强度或决策时延门槛，整体增益已由独立保留集确认，不等于已完成发布验收。
- 当前环境未完成 Cocos Creator 3.8.8 冷构建和真实提示点击再采证；旧采证不能代表升级后的推荐，本候选尚未通过发布验收。
- 下列带版本与日期的 AI 指标记录历史配置与当时验证；其中旧 HARD{12,120k} 入口及历史性能数据不能替代上述当前候选配置与实测。
- **困难档 v2(W-AUDIT-AI,2026-07-13)**:精确拆牌引擎驱动(`ai/decompose.ts`,最少手数+最优分解,默认炸弹保护)——领出按分解组件白出、跟牌按结构代价定压/过(无安全跟法不再无脑烧炸)、必胜看破全程(≤17 张)、叫分弃「1 高牌即抢」换结构化判强(`ai/bidding-hard.ts`);农民侧用公开底牌归因(RoundState v2 `bottom`)。强度门:T-AI-2 胜率差 Hard−Normal ≥ +0.05(实测 +0.117)、Hard−Simple ≥ +0.15(实测 +0.567);重型门(100 seeds)G2 地主角色差 ≥ +0.03(实测 +0.16,历史「Hard 作地主弱于 Normal」反转已消灭)、G3 ≥ 0。**跌破门槛即强度回归,不许调低门槛消红。**
- **AI v3(W-AI,2026-07-17,用户裁决「全体上移一档」)**:三档在 v2 拆解内核上叠 权重评估核(`ai/handWeight.ts`,云城式组件 power+剩余手牌权重最大化)、确定化蒙特卡洛(`ai/pimc.ts`+`ai/rollout.ts`,PIMC:未见牌一致采样+廉价走子,HARD 48 世界/HINT 160 世界,**内部种子=快照+历史规范串→FNV-1a→mulberry32,策略 rng 形参零消费→同局面恒同决策**)、残局对抗精确解(`ai/endgameSolver.ts`,合并对手+悲观甩牌败线,仅输出 sound win,nodeBudget 60k)。叫牌三档+advisor 统一 `ai/bidding-eval.ts`(阈值 Simple 35.3/Normal 35/Hard 34.5,双控烂形三档 pass;`bidding-hard.ts`/`thresholdFor` 退役)。**强度验收=镜像换位竞技场**(`coordination/scripts/w-ai-arena.mjs`,legacy 冻结基线 `test/fixtures/legacy-ai/` sha256 防漂移):实测 hard +10.17pp(门8)/normal +8.33pp(门8)/simple +32.17pp(门10)/weights-only 消融 +6.50pp(门3);self≡0/crippled 被抓双自证。分层门 re-baseline(全体上移语义,BOARD 2026-07-17 披露):quality Hard−Simple 0.15→0.10、G1 0.4→0.25、G3 0→0.05,实测 G1 +26.67/G2 +20.0/G3 +9.67。**规矩:任何 AI 权重/预算/阈值微调必须先重跑 normal 配对**(实测仅超门 0.33pp,最紧)。性能:决策 p95 8.3ms/max 130ms(门 60/250)、提示 max 46ms(门 400)——基线为 Apple M4 Pro,不直接外推低端机;采样数固定常量(非时基),跨机决策一致。**跌破门槛即强度回归,不许调低门槛消红。**
- 提示按钮 = `adviseBestMove` 委托 `hardStrategyWithProfile(HINT_PIMC)`(与困难档同引擎、采样 160 高预算档;同信息面,不作弊),随困难档升级自动升级;`SHOW_ADVISOR` 隐藏件(对局建议 dock/叫抢建议面板)冻结未迭代;`bid-confidence.ts` 仍走 evaluateHand 旧评分(仅隐藏 dock 消费,与 bidScore 口径分歧登记未修)。
- **静态门的能力边界与运行时闭合(W-AUDIT-AI R1–R7 对抗复审结论·常驻判据)**:提示委托链(按钮→ctx 绑定→applyHint→pickHint→hard)有两层门。**静态层**=纯岛行为契约 + TypeScript AST 源码契约(真身唯一/规范体逐字/负向不变式:禁遮蔽·禁字符串访问·禁成员赋值/使能量与守卫链全锁),七轮红队注入(注释假方法抢占、barrel 别名进口、吞历史、结果覆盖、实例属性遮蔽、使能量常量化、假守卫、上游实参强制、上游中间变量改写)逐一封堵——**但静态门原理上无法穷尽一个 import `cc` 的大组件里任意一行的运行时颠覆**,只作「疏漏级改写」的拦截器。**运行时层(完备证据)**=`coordination/scripts/w-audit-hint-probe.mjs`:冷构建产物上走真实链路(大厅→难度切困难→开始新局→真实叫抢→hero 回合)后 **CDP 真点击 action-hint**,录下选中与当时快照+历史入 `coordination/reports/W-AUDIT-AI-evidence/hint-capture.json`;`test/verify/hint-runtime-capture.test.ts` 离线复算 `adviseBestMove` 逐张对照 —— **「点击 → 选中 == 困难档最优推荐」端到端闭合**。**规矩:凡改提示链路(applyHint / hint-flow / 按钮注册 / ctx 绑定 / hard 决策),冷构建收版时必须重跑该探针刷新证据**,否则运行时门守的是旧引擎。
- turn timer 仅作提示，不会超时自动代打。
- **结算「累计」为连打内存态(W-AI 口径①,用户裁决)**:结算面板每席 本局±分+累计±分,滚动作用于累计列(上局累计→新累计);「再来一局」延续,回大厅/刷新清零;不入存档不入持久层——断局恢复视为新连打首局;与大厅历史净分(`data/stats.ts` 持久)相互独立。
- **终局牌型标签放行窗(W-AI 口径②)**:终局最后一手照常弹牌型气泡,结算面板延后 `settlementReveal()`=patternBurst 三段和(600ms)放行;动效关闭=零延迟直显(旧口径)。
- **AI R2(W-AI-R2,2026-07-18,玩家打回整改)**:困难翼牌决策根治——`ai/handWeight.ts` 从字典序独裁(structure×10000)重构为**毫手量纲评分**(1 手结构=W_STRUCT 1000 锚,全整数):`structureCost×1000 + controlSpend + pressRisk + beatenGift − clamp(remaining,±REMAIN_CAP)/2`;controlSpend 弃控牌罚仅计翼/挂牌角色(王/2/A 系数×(1−P̂beat)/1024,2 叠记牌绝对顶加成),**清手豁免**、冲刺÷2;P̂beat 超几何闭式(`ai/pressure.ts`,1/1024 定点)。新增**明牌世界精确解**(`ai/worldSolver.ts`,三家两阵营极大极小+农民同盟+置换表跨采样共享+节点预算,HARD{12,120k}/HINT{15,300k},超阈值/耗尽回退 rollout)与**过牌推断加权**(`collectPassSignals` 非队友顶+`weighWorld` 免费同型可压矛盾 w=2^(4−min(p,4))+ESS<samples/4 整批退化,`passInferenceCap=0` 关断)。提示会话重构(`rankHintCandidates` 三态 ranked/passAdvice/none+`HintSession` key=deriveWorldSeed 轮换去冗/防劫持;`nextHint` 退役)。`candidates.ts` 退役删除+`module-consumption` 防僵尸门。**强度门棘轮**:镜像换位 hard 8→9(实测 +20.17pp)/normal +10.5/simple +32.17/weights-only 消融 +3.17(门3,薄余量 +0.17 已披露);self≡0/crippled 被抓。**契约债**:`PimcProfile` 扩 solverCardMax/solverNodes 遇 `pimc-decision.test.ts` 完整键集深锁,用不可枚举属性承载(低危:配置不入确定性种子/不入序列化路径;偿还路径=未来需序列化时先出 pimc-decision 修订种子改精确四字段断言再移除 enumerable:false)。全量 195 文件/1227 用例绿。**跌破门槛即强度回归,不许调低门槛消红。**
- **AI R3（2026-07-20）**：冻结 v1.9 基线，并用固定叫牌、角色分层、保留种子和配对 bootstrap 置信区间隔离评估出牌能力。PIMC 改为每候选等额独立预算，补齐四带二压力、残局清手优先、序列中继与跟牌仲裁；提示复用一次完整分析，p95 从约 201ms 降至 123ms；`legalFollows` 定向生成在 8,134 个等价性样本中保持一致，中位性能约提升 4.75 倍。保留集 ADP +0.007 且 95% 置信区间包含 0，因此本期未检出相对 v1.9 的显著差异，不宣称胜率提升；这不构成统计等价证明。全量 203 个测试文件、1262 个用例通过，2 个环境门控用例跳过，typecheck 通过。

## Save And Resume

- `RoundState` 目前重点覆盖 Playing 与 Settled 路径。
- bidding 阶段的恢复不是当前重点场景。
- 存档损坏按 data 层约定抛错或降级处理。
- **存档版本化走显式迁移链(v1.6 审计 P1-3)**:老版本经 `game/serialize.ts` 的 `MIGRATIONS` 逐级 N→N+1 升到当前版;**高于当前版本仍硬拒,只升不降**;同版本内新增可选字段经 `CURRENT_VERSION_ADDITIVE_DEFAULTS` 补默认。外层槽位信封(`data/save.ts` `SAVE_VERSION`)暂仍为版本硬拒,升信封版时需另配链。
- v1 存档格式已冻结为 golden 绊线(`test/game/fixtures/round-save.v1.golden.json`,由真实 `serializeRound` 一次性生成,**永不重新生成**):任何使 v1 存档不可加载或语义漂移的改动都会先撞 `test/game/serialize-golden-v1.test.ts`——去写迁移器,不许改 fixture。
- **存档格式通则**:改 `RoundState`/存档字段=先想迁移——新增可选字段登记默认值,其余一律升版本+写迁移器+golden 绊线转绿,禁止原地重定义既有版本字段含义。
- resume 不回传 RNG seed(v1.6 审计登记·低优先):生产 seed 默认时间戳、三档 AI 出牌不消费 rng,断局恢复后「同种子复现同局」本就不成立,与该姿态自洽;未来若需复现,把 seed 纳入 `ResumePayload` 即可。

## Assets And Audio

- **v1.7 W-VISION S4R-R4 当前混代口径**:牌面按用户裁决回滚 v1.6 的 v13 全家(牌盒仍 64×90,选中仅抬升、无选中框);全场按钮由 v21 四态接管——式样沿用用户已确认 okay 的 R3，色调/饱和度在 R4 对齐截图暖黄橙与天蓝→蓝紫双钮(v20 用户驳回并迁 rollback-only);药丸/名牌/托盘/面板与特效继续 v19,三张立绘与桌布沿用已签素材。顶栏倍数/炸弹/手牌去徽标、只留纯文字,相位文字旁保留 v19 countdown ring;`badgeMultiplierV13` / `badgeTimerV13` 已迁 rollback-only,产品零消费;地主名牌使用 `seatNameplateV19`。
- **按钮族 v17(v1.6 终审整改①)**:全场景按钮(含暂停 toggle/action)统一 **btn-{primary,secondary,tertiary,disabled}-v17 规则圆角矩形**——用户点名"不要异形形状",v15 异形花瓣端头按钮与 pause-btn-toggle/action 专皮**保留仅作回滚,产品已不消费**。capInsets **34 四向 = 统一保守留量**(**Creator 从 SpriteFrame trim 后有效 rect 算 inset**,本图 trim rect=(6,6,468,148);相对该 rect 实测圆角固定边带需求约 **23–28px**,34 覆盖四向并留余量,非硬下限。初设 28/18 时**垂直 18px 不足**致 9-slice 把圆角截成切角八边形;矮按钮 36-60 高 <2×34 由 Cocos SLICED 等比压缩边带,圆角等比缩小保持圆润)。纯净文字区 82%×62.5%,深莓文字对比 8.23:1+。
- **按钮/药丸/名牌族 v18(v1.6 二次终审整改·用户设计原则)**:用户裁决「**如果会在元素上盖字的设计,不宜出现很多线条,设计的相对简洁一些**」。据此全族改 **单一填充 + 至多一条细描边** 的 v18 极简族——`btn-{primary,secondary,tertiary,disabled}-v18` / `info-pill-v18` / `seat-nameplate-v18`,规则圆角矩形。**v17(多层描边)与 v15(异形花瓣)键与文件保留仅作回滚,产品已不消费**。capInsets 相对 trim rect:按钮 96/64、药丸 26、名牌 120/56。**结算胜/负横幅退役**:v15 燕尾缎带 alpha 掩膜中段行最窄仅 75%(异形),改用 v18 牌匾(胜=tertiary 暖金 / 负=secondary 奶油),零新图;`settlementBannerWin/LoseV15` 键保留仅作回滚。
- **按钮族 v20(W-VISION S4R-R2 用户驳回)**:奶油拟物四态虽通过当时全部机检,用户签收仍明确裁决“高级感、圆角、描金与光影不可接受，太丑”。`btn-{primary,secondary,tertiary,disabled}-v20` 四键已迁 rollback-only，产品零消费；这是“机检绿≠用户视觉签收”的直接反例。
- **按钮族 v21(W-VISION S4R-R4 临时色值·终局必修)**:全场景按钮统一 `btn-{primary,secondary,tertiary,disabled}-v21`。用户已确认厚规则圆角、顶部柔高光、下部同色底唇与投影式样 okay，但 **R4 暖黄橙/天蓝→蓝紫色值仍不满意、未签收**；按用户裁决先保留为后续页面的临时运行基线，最终视觉签收前必须再做一轮只改色的收口。当前四态 alpha 与 value 场逐像素相等于 R3，几何/光影未变；SpriteFrame trim rect=466×149,capInsets L/R64·T46·B54,meta 字节不动。五视口真档门C最低4.85:1、D/F/G/H/I/J均绿只证明工程合法，**不代表颜色审美通过**。
- **盖字设计原则(v1.6 二次终审,成为常驻判据)**:凡「会被文字盖住」的底图,必须 ① 规则形状(alpha 中段行行满宽/列列满高 ≥98%)、② 中央净区零线条(线条像素占比 ≤3%)、③ 文字盒 ⊂ 实测净区、④ 字底对比 ≥ AA 4.5:1。四条均由 `coordination/scripts/s4-image-gates.py` 机检(门 B/C/D/F),配 `s4-evidence.mjs`(门 A 文字溢出、门 E icon 变形)。**新增/替换任何盖字皮或字色前,先跑这两个脚本**。
- **字色随皮走(v1.6 二次终审·自伤教训)**:v15 皮是**深底**、v18 皮是**浅底**。换皮时若不同步改字色,浅奶油/金/白字压在浅底上只剩 **1.22:1**(实测,ASCII 亮度图显示字比底还亮,近乎隐形)。**规矩:换皮 = 换字色,且必须跑门C 复验**——门C 拿「声明字色」与「截图里该文字盒的底色中位数」算对比,专为堵这一整类回归而设。
- **icon 变形通则(v1.6 二次终审整改②)**:`trimType=auto` 会削掉透明边 → **SpriteFrame rect 的长宽比不再等于原图长宽比**;SIMPLE 精灵按原图比例配框再渲染就会被拉伸。判据是「**rect 比 vs 真实显示框比**」(≤5%),不是「rect 比 vs 原图比」——SLICED 九宫格按设计就该拉伸,拿原图比例卡它是错的。已修 11 件:徽标/春天章/空态图 + 卡面/大小王/花色/牌背(改 `trimType=none`)+ 三张立绘(裁后比例各不相同,一个框喂不平 → `addSpriteContain` **等比内接**)。
- **九宫格压溃(v1.7 W-VISION 用户打回·常驻判据)**:SLICED 皮的 capInsets 若 **L+R > 源尺度 local contentSize 宽或 T+B > local contentSize 高**,Cocos 切片重叠、圆角/描边畸变(用户点名的「异形边框」);屏上 world box 只用于追加核对 x/y 等比缩放,不可拿未缩放 capInsets 直接比较。门E 对 SLICED 豁免故旧六门拦不住,现由 `coordination/scripts/s4r-geometry-gates.py` **门H=local box 主判+两轴缩放差≤2%** 机检(同脚本门G=元素重叠运行时像素面、门I=药丸内容居中、门J=牌面角标越缘;跑门前先 `--selftest` 自证)。**规矩:小皮(药丸/名牌/按钮/牌型标签)一律走 scale-safe 九宫格——源尺度切片+等比回缩(ui-helpers `addSkinnedSprite` 单点),capInsets 用生图 manifest 原值不逐张重算;容器皮(面板/托盘)可直用。**
- **静态视觉门的能力边界(v1.7 W-VISION 打回·常驻判据)**:六门全绿+全量用例绿,构图级问题(按钮右锚/立绘钉角/文字不居中/九宫格压溃/迷你牌行叠墩牌)仍整版漏到实机——**门只能看见你让它看见的东西**。凡改可见像素的波次:机检门全绿只是送审资格,**签收页经用户过目通过才是合并资格**(BOARD 铁律「用户过目才合并」)。
- **双色大按钮体系 c2(v1.7 W-VISION-COLOR·用户签收 2026-07-16)**:大按钮**有且只有** `btn-primary-c2`(黄=推荐/主要/出牌)与 `btn-secondary-c2`(绿=次要/不叫/不要/提示)两皮;**银白 `btn-neutral-c2` 仅顶部小暂停**(系统级小按钮例外);**禁用态=角色皮 + `BUTTON_DISABLED_SKIN_ALPHA=120` 真透明压暗 + 派生深灰字 (96,92,88)**,不设第三张灰大皮(门M 锁 colorA∈[96,160]、可交互==255,数据源=运行时 interactable/colorA,禁按名推断)。中央出牌托盘已移除(空态直接露 `gameTableBgC1`,playTray 键族全退役)。字色岛 `ui/ui-text-colors.ts` 六角色为字色唯一真相源(独立 WCAG 契约锁,禁用 3.0/其余 4.5——门C 同口径,豁免逐条披露)。
- **线条门体系与量化域法理(v1.7 W-VISION-COLOR-R2d·常驻判据)**:`coordination/scripts/s4r-line-gates.py` 门K1(左右对称)/K2(复线,突出度过滤——v21 方向光高光与面板 bevel 是已签弱梯度结构)/K3(同键同尺一致)/K3b(rim 在场性:内侧像素到「底↔填充」RGB 连线段距离≥8,**不限明暗**)/L1(DPR 布局 2×)/L2(厚描边比,发丝美术下休眠)/L3(锐度+糊化)。**量化域法理:1-2 设备px 的线宽在栅格相位下不是良定义量**——按钮族宽度类子门(K1/K3/L2)显式豁免、K3b dpr1 降检测地板披露(签收页特写交用户终裁,手机 dpr≥2 不受影响;当前 6 例金钮受光侧已获用户签收接受)、K3 dpr1 中位<4.5 走边界档;dpr2 稳健域全部硬红且有真图负向证。**跑门先 `--selftest`;像素门随美术版本变更必须重校准**(c1→c2 rim 加厚曾让 c1 校准的代理指标假红 39 例)。
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
- `legalFollows` 已改为按目标牌型定向生成，并由全量枚举 oracle 持续校验集合、顺序和牌型等价性。
- `save.ts` 仍有后续整理空间，可在数据层清理时统一处理。
- `P-STRAY-LABEL`：**已结案(v1.5 W1-B)**——根因为 lobby.scene 六个 `_string:"label"` 占位 Label 依赖 @property 绑定隐藏,绑定失效即漏字;`hideLegacyScaffold` 兜底遍历隐藏,四横屏运行时探针 0 可见。
- 建议功能(V10 用户终审整改,2026-07-12):`SHOW_ADVISOR=false` 隐藏「建议开/关」dock 与叫抢建议面板,**不删除、隐藏期间不迭代**;`adviseAction`/`adviseBid` 与测试保留。提示按钮同轮恢复可见(v1.5 曾误藏,升级版 AI 最优推荐逻辑未动)。记牌器与手牌强度条仍为前端隐藏(v1.4 起)。
- 瞬时特效早剪 bug:**已结案(v1.5 P-FX-LAYER)**——常驻 fx 层豁免 render prune,特效 tween 自毁。
- ~~lobby 难度行「当前」角标被行钮右端头半遮~~ **已结案(v1.6 P-BADGE-CLIP)**:角标白底小片方案,三难度×四横屏 12 图验收,窄档折行一并消失。
- v1.6 走查登记不修(v1.7 素材):现有 9 个存量音效为占位级合成可整体重制;卡牌/头像/顶栏小徽标 v15 化。
- **教程/帮助/战绩/历史(v1.6 终审整改⑤,2026-07-13)**:用户点名"去掉教程和帮助;隐藏战绩和历史模块"——lobby 四个入口按钮**全部移除**(四横屏×4 入口=16 项运行时断言证不存在);`renderTutorialScreen/renderHelpScreen/renderStatsScreen/renderRecordsScreen` 四方法与 `screen` 状态机、对应 view-model 与测试**全部保留、隐藏期间不迭代**(与建议/记牌器同口径)。战绩数据仍在本地累积,首页概要行(局数/胜率/净分)保留。
- **文字溢出策略(v1.6 终审整改②)**:底层 `ui-helpers.addLabel/addButton` 统一 `Label.Overflow.SHRINK`——任何文字超出容器自动缩字号,**永不溢出**;按钮文字盒配当前 v21 纯净区放宽至 0.80。此为全局兜底,新增 UI 文字无需单独防溢出。
- **手牌角标越缘(v1.7 W-VISION S4R-R2 用户整改②)**:SHRINK 只约束 Label 自身盒,无法阻止整个角标盒压出所属牌面并印到左邻牌。当前角标普通13/16、王字11/13、盒38×22、中心(−9,24),门J 五视口真档越缘0。门J 的牌面归属仍须用稳定身份而非“与重叠牌面面积最大”推断:本轮真实负向发现中心−15与−20均会被邻牌误认领而假绿,到−24只剩扇面首牌红2例;在规划者修门前,**门J=0 只作当前像素证明,不可视为完整回归安全网**。
- **AI 节奏(v1.6 终审整改③)**:`game-scene-skeleton` thinkingDelayMs 取 `Math.max(1000, 难度均值)` —— 各档 AI 每步保底 1s(原困难档均值仅 375ms,用户点名太快);难度差异现仅体现在策略强度,不再体现为出牌速度。`difficultyConfig.thinkDelayMs` 配置保留(下限被 1000 兜底)。
- **大厅布局(v1.6 终审整改④)**:三区(战绩/难度/设置)合一为**单居中面板**;难度改**单切换按钮**(点击循环 简单→普通→困难),原难度三行描述文字随之移除(该处曾是文字溢出高发区)。
- **文字溢出策略(v1.6 二次终审加固)**:除 `SHRINK` 全局兜底外,**文字盒本身必须 ⊂ 盖字皮的实测净区**(门B)——`SHRINK` 只保证"不超出文字盒",若文字盒本身撑出净区,字仍会压到描边(用户「btn 文字和图像的线条重合」的直接成因)。大厅按钮文字盒原取按钮**全高**,已收到 0.80;药丸/名牌/倒计时同理按净区重排。
- **倒计时条(v1.6 二次终审·举一反三)**:原为全 UI 唯一的深色残留(`surfaceRaised` 48,40,58,旧深色主题遗物),且 4px 进度条**画在字脚下**、告急时暗红字压深底仅 1.6:1。改 v18 浅药丸 + **去掉进度条**(倒计时语义由数字承载,更简洁)+ 告急字加深至 6.2:1。`surfaceRaised` 仅剩强度条/记牌器/建议条三个**已隐藏**功能在用。
- **顶栏 HUD 底板(v1.6 二次终审·举一反三)**:相位/倍数/炸弹/手牌四项原直接压在灯笼彩带密布的桌景照片上(对比 3.96~4.06:1)。同屏「地主X」早有干净名牌底、一眼可读——照此给左右两组各补一块 `info-pill-v18` 净底板(尺寸由内容边界推出,随视口自适应)。
- **卡牌兜底底板(v1.6 用户追加①,2026-07-13)**:每张牌原先垫一层 `card-fill`(Graphics 的 `surface` 圆角面板 + brand 描边)作卡面图兜底。卡面图一旦带透明边,这层兜底就从边缘露出来——17 张并排即连成一整条「面板」(用户点名去掉)。**已删除 `card-fill` 与 `drawCardBase`**;卡面/王牌/牌背/花色 meta 保持紧图(`trimType=auto`),渲染统一走 `fitSpriteInBox` **等比内接**(不拉伸、不留底、不露底板)。**通则:SIMPLE 精灵一律等比内接,不要用 Graphics 兜底层垫在图下面**——图一旦有透明边就会漏底。顶部三张底牌的托盘 `bottom-cards-dock-v15` 保留(有意设计的牌托,上面不盖字)。
- **空气泡不常驻(v1.6 用户追加②)**:`deriveLastPlays` 无消息时返回 `kind=null / text='—'`,视图层原先照样铺一个空药丸常驻三席。改为 `kind===null` 直接不渲染(旧节点由 render prune 自动销毁)。**view-model 与其测试零改动**——`'—'` 仍是它的空值语义,只是视图层不再展示。
- **v15 结算横幅零产品消费（v1.6）**：换肤时只改了 `result-overlay-renderer` 的消费点，曾遗漏 `RUNTIME_PRELOAD_SPRITES` 预载表，现已移出预载。退役任何资产时，除消费点外必须同时检查 `game-scene-skeleton.ts` 的预载表。
- **机检门计数口径**:门A 是**全扫**(13 屏 323 个 Label);门C 是**有效数**(202,排除模态黑幕遮挡下的字——幕后字色被压暗,声明字色不再等于屏上字色)。两者数字不同是正常的,不要混用。
- **退役键物理隔离(v1.6 审计 P1-2,持续扩展)**:当前 rollback-only 共53键,含 v15/v17/v18 旧按钮与面板族、v19 卡系9键、v19 按钮4键、旧徽标与特效等;`test/architecture-gates.test.ts` 门④断言其在产品代码零消费(含预载表)——S4 R1「预载表漏项」一类回归由门堵死,不再靠人工 grep。v13 卡面8键已按用户裁决恢复活跃;更老 v1 牌面仍仅作回滚。
