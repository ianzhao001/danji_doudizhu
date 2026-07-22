# badcase 收件箱

游戏里遇到 AI 臭手：结算页点「导出对局」（B3 交付后可用），把下载的 `ddz-<logId>.json` 丢进本目录，并口头描述问题（第几手、哪个座位、你觉得该怎么打）。

规划者（Claude）用以下命令离线复盘：

```
npm --prefix test exec tsx -- coordination/scripts/replay-analyze.ts coordination/badcases/inbox/<file>.json
```

产出：`coordination/reports/sota2-r4/replays/<logId>.md` 复盘表（事后全知标记 blunder / 低票距决策点）；确认的 badcase 用 `--fixture` 固化为 `test/ai/badcase/fixtures/*.json` 回归测试，修一个锁一个。
