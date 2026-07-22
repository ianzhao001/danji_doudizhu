fixture 由 `replay-analyze.ts --fixture` 从全知求解确认的 blunder 决策点生成。
schema 为 `{ logId, eventIndex, note, snapshot, history, bannedCards }`，runner 只禁止再次选择 `bannedCards`。
当修复已被更优解法取代时允许删除 fixture，但必须在对应报告中说明原因。
