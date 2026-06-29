export const STRINGS: Readonly<Record<string, string>> = Object.freeze({
  'lobby.newGame': '新局',
  'lobby.continue': '续局',
  'lobby.stats': '战绩',
  'lobby.records': '历史',
  'lobby.settings': '设置',
  'lobby.tutorial': '教程',
  'action.play': '出牌',
  'action.pass': '不要',
  'action.hint': '提示',
  'bid.call': '叫地主',
  'bid.grab': '抢地主',
  'bid.pass': '不叫',
  'bid.noGrab': '不抢',
  'result.win': '胜利',
  'result.lose': '失败',
  'result.restart': '再来一局',
  'result.backLobby': '返回大厅',
  'cue.bomb': '炸弹',
  'cue.rocket': '火箭',
  'cue.spring': '春天',
  'settings.sound': '音效',
  'settings.vibration': '震动',
  'settings.animation': '动效',
  'settings.difficulty': '难度',
});

export function t(key: string, fallback?: string): string {
  return STRINGS[key] ?? fallback ?? key;
}
