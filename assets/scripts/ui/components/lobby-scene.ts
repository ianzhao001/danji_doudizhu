import { _decorator, AudioClip, AudioSource, Color, Component, Graphics, Label, Node, Sprite, SpriteFrame, UIOpacity, UITransform, Vec3, resources, tween } from 'cc';
import { AiLevel } from '../../ai';
import {
  deserializeStats,
  digestRecords,
  emptyRecords,
  emptyStats,
  loadSave,
  loadSettings,
  migrateRecords,
  saveSettings,
  type RecordOutcome,
  type RecordRole,
  type RecordsState,
  type Settings,
} from '../../data';
import { STORAGE_KEYS } from '../../data/storage-keys';
import { loadMatchLog } from '../../data/match-log';
import { cocosStorage } from '../../runtime/cocos-storage';
import { exportJsonFile } from '../../runtime/export-file';
import {
  deriveLobbyView,
  deriveRecordsDetailView,
  deriveRecordsView,
  deriveSettingsView,
  deriveStatsDetailView,
  deriveStatsView,
} from '../index';
import { deriveDifficultyPicker } from '../difficulty-picker-view';
import { helpSections } from '../help-content';
import { setDifficulty, toggleSetting, type ToggleKey } from '../settings-view';
import { nextStep, tutorialSteps, type TutorialStep } from '../tutorial-steps';
import { buttonRipple } from '../animation-params';
import { RESOURCE_PATHS, spriteFrameResourcePath, type ResourcePath } from '../asset-keys';
import { t } from '../strings';
import type { TypographyRole } from '../theme';
import { UI_TEXT_COLORS } from '../ui-text-colors';
import { ensureSceneFont } from './game-scene/font-loader';
import { fadeInOnLoad, fadeThenLoad } from './scene-transition';
import {
  THEME,
  addLabel as addUiLabel,
  addSkinnedButton,
  addSkinnedSprite,
  addUiTransform,
  drawPanel,
  drawPanelSkin as drawUiPanelSkin,
  loadSprite,
  toColor,
} from './ui-helpers';

const { ccclass, property } = _decorator;
const SETTINGS_KEY = STORAGE_KEYS.settings;
const SAVE_KEY = STORAGE_KEYS.save;
const STATS_KEY = STORAGE_KEYS.stats;
const RECORDS_KEY = STORAGE_KEYS.records;
const LANDSCAPE_CANVAS = { width: 844, height: 390 };
// V8 用户签收意见⑤（2026-07-11）：大厅与游戏画面视觉统一——背景改用牌桌同源
// gameTableBgC1（纵横比随之取 game 侧 1688/780），面板浮于半透明 scrim 之上。
const LOBBY_BACKGROUND_ASPECT = 1688 / 780;
const LOBBY_PRELOAD_SLICED_SPRITES: readonly ResourcePath[] = [
  RESOURCE_PATHS.btnPrimaryC2,
  RESOURCE_PATHS.btnSecondaryC2,
  RESOURCE_PATHS.panelPopupV19,
];
const LEGACY_LABEL_NODE_NAMES = [
  'title-label',
  'start-label',
  'settings-label',
  'records-label',
];
const PANEL_TEXT = toColor(THEME.palette.brandDark);
// ART-V19 panel 的粉色底上旧 secondary 只余 4.54:1；推荐深莓保留 AA 余量。
const PANEL_MUTED = toColor(THEME.palette.brandDark);
const PANEL_ACCENT = toColor(THEME.palette.brand);
const PANEL_GOOD = toColor(THEME.palette.success);
const PANEL_BAD = toColor(THEME.palette.danger);
// W-VISION-COLOR:大厅按钮与对局共用单一字色真相源。
const BUTTON_PRIMARY_TEXT = toColor(UI_TEXT_COLORS.bidCall);
const BUTTON_SECONDARY_TEXT = toColor(UI_TEXT_COLORS.bidPass);
const BUTTON_DISABLED_TEXT = toColor({
  r: Math.max(0, UI_TEXT_COLORS.disabledButton.r - THEME.alpha.disabled),
  g: Math.max(0, UI_TEXT_COLORS.disabledButton.g - THEME.alpha.disabled),
  b: Math.max(0, UI_TEXT_COLORS.disabledButton.b - THEME.alpha.disabled),
  a: UI_TEXT_COLORS.disabledButton.a,
});
// v1.6 P-BADGE-CLIP:「当前」角标白底小片(置于行钮端头饰上仍可读)。
const CURRENT_CHIP_BG = toColor(THEME.palette.textOnAccent);

const TOGGLE_LABELS: Record<ToggleKey, string> = {
  sound: t('settings.sound'),
  vibration: t('settings.vibration'),
  animation: t('settings.animation'),
};

const LOBBY_TEXT = {
  title: t('lobby.title'),
  startNewGame: t('lobby.startNewGame'),
  continueGame: t('lobby.continueGame'),
  noSave: t('lobby.noSave'),
  tutorialHeading: t('tutorial.heading'),
  focusPrefix: t('tutorial.focusPrefix'),
  playerHand: t('tutorial.playerHand'),
  biddingPanel: t('tutorial.biddingPanel'),
  playArea: t('tutorial.playArea'),
  actionButtons: t('tutorial.actionButtons'),
  scorePanel: t('tutorial.scorePanel'),
  currentStep: t('tutorial.currentStep'),
  previous: t('common.previous'),
  next: t('common.next'),
  finish: t('common.finish'),
  skip: t('common.skip'),
  help: t('lobby.help'),
  upScroll: t('common.upScroll'),
  downScroll: t('common.downScroll'),
  back: t('common.back'),
  stats: t('lobby.stats'),
  records: t('lobby.records'),
  noCompletedRecords: t('stats.empty'),
  all: t('common.all'),
  win: t('common.win'),
  loss: t('common.loss'),
  landlord: t('common.landlord'),
  farmer: t('common.farmer'),
  newest: t('common.newest'),
  oldest: t('common.oldest'),
  noMatchedRecords: t('records.empty'),
  current: t('common.current'),
  on: t('common.on'),
  off: t('common.off'),
  rounds: t('stats.rounds'),
  winRate: t('stats.winRate'),
  netScore: t('stats.netScore'),
  noRecord: t('records.none'),
  difficulty: t('settings.difficulty'),
  normalDifficulty: t('difficulty.normal'),
};

interface HelpRow {
  text: string;
  kind: 'title' | 'body' | 'spacer';
}

interface HomeViewData {
  hasSavedGame: boolean;
  rounds: string;
  winRate: string;
  netScore: string;
  latestRecord: string;
}

type LobbyScreen = 'home' | 'tutorial' | 'help' | 'stats' | 'records';

function highlightLabel(step: TutorialStep): string {
  switch (step.highlight) {
    case 'playerHand':
      return LOBBY_TEXT.playerHand;
    case 'biddingPanel':
      return LOBBY_TEXT.biddingPanel;
    case 'playArea':
      return LOBBY_TEXT.playArea;
    case 'actionButtons':
      return LOBBY_TEXT.actionButtons;
    case 'scorePanel':
      return LOBBY_TEXT.scorePanel;
    default:
      return LOBBY_TEXT.currentStep;
  }
}

function toggleText(on: boolean): string {
  return on ? LOBBY_TEXT.on : LOBBY_TEXT.off;
}

function summaryText(label: string, value: string | number): string {
  return `${label} ${value}`;
}

function wrapText(text: string, charsPerLine: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const char of Array.from(text)) {
    line += char;
    if (line.length >= charsPerLine) {
      lines.push(line.trimEnd());
      line = '';
    }
  }
  if (line) lines.push(line.trimEnd());
  return lines;
}

@ccclass('LobbyScene')
export class LobbyScene extends Component {
  @property(Sprite)
  background: Sprite | null = null;

  @property(Label)
  continueLabel: Label | null = null;

  @property(Label)
  roundsLabel: Label | null = null;

  @property(Label)
  winRateLabel: Label | null = null;

  @property(Label)
  netScoreLabel: Label | null = null;

  @property(Label)
  difficultyLabel: Label | null = null;

  @property(Label)
  latestRecordLabel: Label | null = null;

  private controlsRoot: Node | null = null;
  private screen: LobbyScreen = 'home';
  private tutorialIndex = 0;
  private helpScrollIndex = 0;
  private recordQuery: { outcome: RecordOutcome; role: RecordRole; order: 'newest' | 'oldest' } = {
    outcome: 'all',
    role: 'all',
    order: 'newest',
  };
  private readonly spriteFrames = new Map<string, SpriteFrame>();
  private matchLogExportLabel = '导出对局记录';

  async onLoad(): Promise<void> {
    // 字体加载期间只保留编辑器内的静态背景：既避免最长 2 秒空白，也不暴露场景占位文字。
    this.setHomeLabelsVisible(false);
    this.hideStrayPlaceholderLabels();
    await Promise.all([
      ensureSceneFont(this.node),
      this.preloadSlicedSprites(),
    ]);
    if (!this.node.isValid) return;
    if (this.background) this.background.node.active = false;
    this.hideLegacyScaffold();
    this.controlsRoot = this.ensureNode('lobby-runtime-root', this.node);
    this.render();
    // v1.5 P-SCENE-FADE:入场自黑幕淡出(动效关闭时不铺幕)。
    fadeInOnLoad(this.node, loadSettings(cocosStorage(), SETTINGS_KEY).animation);
  }

  private async preloadSlicedSprites(): Promise<void> {
    await Promise.all(LOBBY_PRELOAD_SLICED_SPRITES.map((path) => new Promise<void>((resolve) => {
      const cached = this.spriteFrames.get(path);
      if (cached) {
        resolve();
        return;
      }
      resources.load(spriteFrameResourcePath(path), SpriteFrame, (error, frame) => {
        if (!error && frame) this.spriteFrames.set(path, frame);
        resolve();
      });
    })));
  }

  private render(): void {
    const settings = loadSettings(cocosStorage(), SETTINGS_KEY);
    const stats = this.loadStats();
    const records = this.loadRecords();
    const savedSlot = this.loadSavedSlot();
    const lobby = deriveLobbyView({ savedSlot, stats });
    const statsView = deriveStatsView(stats);
    const settingsView = deriveSettingsView(settings);
    const recordRows = deriveRecordsView(records, 1);
    const difficulty = deriveDifficultyPicker(settingsView.difficulty).options.find((option) => option.selected);
    const canvas = this.canvasSize();
    this.renderPlaceholderBackground(canvas);

    this.setText(this.continueLabel, lobby.continueLabel);
    this.setText(this.roundsLabel, summaryText(LOBBY_TEXT.rounds, statsView.rounds));
    this.setText(this.winRateLabel, `${summaryText(LOBBY_TEXT.winRate, statsView.winRatePct)}%`);
    this.setText(this.netScoreLabel, summaryText(LOBBY_TEXT.netScore, statsView.netScoreLabel));
    this.setText(this.difficultyLabel, summaryText(LOBBY_TEXT.difficulty, difficulty?.label ?? LOBBY_TEXT.normalDifficulty));
    this.setText(this.latestRecordLabel, recordRows[0]?.scoreLabel ?? LOBBY_TEXT.noRecord);
    this.setHomeLabelsVisible(false);
    this.renderRuntimeControls(settings, {
      hasSavedGame: lobby.hasSavedGame,
      rounds: summaryText(LOBBY_TEXT.rounds, statsView.rounds),
      winRate: `${summaryText(LOBBY_TEXT.winRate, statsView.winRatePct)}%`,
      netScore: summaryText(LOBBY_TEXT.netScore, statsView.netScoreLabel),
      latestRecord: recordRows[0]?.scoreLabel ?? LOBBY_TEXT.noRecord,
    });
  }

  private renderRuntimeControls(settings: Settings, home: HomeViewData): void {
    if (!this.controlsRoot) return;
    this.clearNode(this.controlsRoot);
    if (this.screen === 'tutorial') {
      this.renderTutorialScreen();
      return;
    }
    if (this.screen === 'help') {
      this.renderHelpScreen();
      return;
    }
    if (this.screen === 'stats') {
      this.renderStatsScreen();
      return;
    }
    if (this.screen === 'records') {
      this.renderRecordsScreen();
      return;
    }
    this.renderHomeScreen(settings, home);
  }

  private openGameScene(options: { forceNew?: boolean; requireSave?: boolean } = {}): void {
    const storage = cocosStorage();
    if (options.requireSave && this.loadSavedSlot() === null) {
      this.render();
      return;
    }
    if (options.forceNew) storage.removeItem(SAVE_KEY);
    const runtime = globalThis as typeof globalThis & {
      cc?: { director?: { loadScene(sceneName: string): void } };
    };
    // v1.5 P-SCENE-FADE:黑幕淡入后再切场景(动效关闭时直切)。
    const animated = loadSettings(storage, SETTINGS_KEY).animation;
    fadeThenLoad(this.node, animated, () => {
      runtime.cc?.director?.loadScene('game');
    });
  }

  private async exportMatchLogState(): Promise<void> {
    const state = loadMatchLog(cocosStorage());
    const result = await exportJsonFile('ddz-match-logs.json', JSON.stringify(state));
    this.matchLogExportLabel = result === 'download'
      ? '导出对局记录 · 已导出'
      : result === 'clipboard'
        ? '导出对局记录 · 已复制'
        : '导出对局记录 · 失败';
    this.render();
  }

  // v1.6 终审整改④⑤:大厅三区(战绩/难度/设置)合一为单居中面板——
  // 难度改单切换按钮(点击循环 简单→普通→困难);去教程/帮助入口;隐藏战绩/历史入口(渲染方法保留不迭代)。
  private renderHomeScreen(settings: Settings, home: HomeViewData): void {
    if (!this.controlsRoot) return;
    const settingsView = deriveSettingsView(settings);
    const canvas = this.canvasSize();
    const panelWidth = Math.min(380, canvas.width - 72);
    const panelHeight = Math.min(338, canvas.height - 32);
    const half = panelHeight / 2;
    const btnWidth = Math.min(248, panelWidth - 76);
    const titleHeight = THEME.typography.display.lineHeight;
    const summaryHeight = THEME.typography.meta.lineHeight;
    const startHeight = 44;
    const secondaryButtonHeight = 40;
    const toggleHeight = 32;
    const titleY = half - THEME.spacing.safe - titleHeight / 2;
    const summaryY = titleY - titleHeight / 2 - THEME.spacing.default - summaryHeight / 2;
    const startY = summaryY - summaryHeight / 2 - THEME.spacing.section - startHeight / 2;
    const continueY = startY - startHeight / 2 - THEME.spacing.default - secondaryButtonHeight / 2;
    const difficultyY = continueY - secondaryButtonHeight - THEME.spacing.default;
    const togglesY = difficultyY - secondaryButtonHeight / 2 - THEME.spacing.section - toggleHeight / 2;
    const exportY = togglesY - toggleHeight / 2 - THEME.spacing.default - toggleHeight / 2;

    const panel = this.ensureNode('home-panel', this.controlsRoot);
    panel.setPosition(0, 0, 0);
    addUiTransform(panel, panelWidth, panelHeight);
    this.drawPanelSkin(panel, panelWidth, panelHeight);

    this.addLabel(LOBBY_TEXT.title, 0, titleY, 'display', panel, panelWidth - 60, titleHeight, 'home-title');
    this.addLabel(
      `${home.rounds}    ${home.winRate}    ${home.netScore}`,
      0,
      summaryY,
      'meta',
      panel,
      panelWidth - 44,
      summaryHeight,
      'home-summary-line',
      PANEL_MUTED,
    );

    this.addButton(
      LOBBY_TEXT.startNewGame,
      0,
      startY,
      btnWidth,
      startHeight,
      true,
      () => this.openGameScene({ forceNew: true }),
      panel,
      false,
      'home-start-button',
    );
    this.addButton(
      home.hasSavedGame ? LOBBY_TEXT.continueGame : LOBBY_TEXT.noSave,
      0,
      continueY,
      btnWidth,
      secondaryButtonHeight,
      home.hasSavedGame,
      () => this.openGameScene({ requireSave: true }),
      panel,
      false,
      'home-continue-button',
    );

    // 难度单切换按钮:显示当前档,点击切到下一档(循环)。
    const levels: AiLevel[] = [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard];
    const curLabel = deriveDifficultyPicker(settingsView.difficulty).options.find((o) => o.selected)?.label
      ?? LOBBY_TEXT.normalDifficulty;
    const nextLevel = levels[(levels.indexOf(settingsView.difficulty) + 1) % levels.length];
    this.addButton(
      `${LOBBY_TEXT.difficulty} ${curLabel}`,
      0,
      difficultyY,
      btnWidth,
      secondaryButtonHeight,
      true,
      () => this.persist(setDifficulty(loadSettings(cocosStorage(), SETTINGS_KEY), nextLevel)),
      panel,
      false,
      'home-difficulty-toggle',
    );

    // 音效/动效/震动 三开关一行。
    const toggleWidth = Math.min(112, Math.floor((panelWidth - THEME.spacing.safe * 2) / 3) - 6);
    const toggleStep = toggleWidth + THEME.spacing.default;
    settingsView.toggles.forEach((toggle, index) => {
      this.addButton(
        `${TOGGLE_LABELS[toggle.key]}${toggleText(toggle.on)}`,
        (index - 1) * toggleStep,
        togglesY,
        toggleWidth,
        toggleHeight,
        true,
        () => this.persist(toggleSetting(loadSettings(cocosStorage(), SETTINGS_KEY), toggle.key)),
        panel,
        toggle.on,
        `home-toggle-${toggle.key}`,
      );
    });
    this.addButton(
      this.matchLogExportLabel,
      0,
      exportY,
      btnWidth,
      toggleHeight,
      true,
      () => { void this.exportMatchLogState(); },
      panel,
      false,
      'home-export-match-log',
    );
  }

  private renderDifficultyPanel(current: AiLevel, x: number, y: number, panelWidth: number, panelHeight: number): void {
    if (!this.controlsRoot) return;
    const panel = this.ensureNode('difficulty-picker-panel', this.controlsRoot);
    panel.setPosition(x, y, 0);
    addUiTransform(panel, panelWidth, panelHeight);
    this.drawPanelSkin(panel, panelWidth, panelHeight);
    this.addLabel(LOBBY_TEXT.difficulty, 0, panelHeight / 2 - 34, 'sectionTitle', panel, panelWidth - 34, 34, 'difficulty-title');

    // V8 用户签收意见②（2026-07-11）文字重合修复：描述两行原溢出胶囊上下缘、
    // 「当前」与描述同行紧贴压缘、标签压左端花纹——加高胶囊/收字号/错行放置。
    const rowWidth = panelWidth - 18;
    const rowPadding = THEME.spacing.card;
    const titleWidth = 44;
    const currentWidth = 36;
    const gap = THEME.spacing.default;
    const rowHeight = 50;
    const rowStep = 58;
    const descWidth = Math.max(96, rowWidth - rowPadding * 2 - titleWidth - currentWidth - gap * 3);
    const titleX = -rowWidth / 2 + rowPadding + titleWidth / 2 + 5;
    const descX = titleX + titleWidth / 2 + gap + descWidth / 2;
    const currentX = rowWidth / 2 - rowPadding - currentWidth / 2 - 2;
    const picker = deriveDifficultyPicker(current);
    picker.options.forEach((option, index) => {
      const rowY = panelHeight / 2 - 84 - index * rowStep;
      this.addButton(
        '',
        0,
        rowY,
        panelWidth - 18,
        rowHeight,
        true,
        () => this.persist(setDifficulty(loadSettings(cocosStorage(), SETTINGS_KEY), option.level)),
        panel,
        option.selected,
        `difficulty-option-${option.level}`,
      );
      this.addLabel(
        option.label,
        titleX,
        rowY,
        'action',
        panel,
        titleWidth,
        24,
        `difficulty-label-${option.level}`,
        option.selected ? BUTTON_PRIMARY_TEXT : BUTTON_SECONDARY_TEXT,
      );
      const lines = wrapText(option.description, Math.max(8, Math.floor(descWidth / 11))).slice(0, 2);
      const single = lines.length === 1;
      lines.forEach((line, lineIndex) => {
        this.addLabel(
          line,
          descX,
          rowY + (single ? 0 : 8 - lineIndex * 14),
          'assistive',
          panel,
          descWidth,
          14,
          `difficulty-desc-${option.level}-${lineIndex}`,
          option.selected ? BUTTON_PRIMARY_TEXT : BUTTON_SECONDARY_TEXT,
        );
      });
      if (option.selected) {
        // v1.6 P-BADGE-CLIP:v15 行钮端头饰画进中央拉伸区,窄按钮上会盖住右缘角标——
        // 角标自带白底小片垫底,任意视口保持完整可读;descWidth 不动,描述两行零回流。
        const chipWidth = currentWidth + THEME.spacing.default;
        const chip = this.ensureNode(`difficulty-current-chip-${option.level}`, panel);
        chip.setPosition(currentX - 1, rowY, 0);
        addUiTransform(chip, chipWidth, 20);
        drawPanel(chip, chipWidth, 20, CURRENT_CHIP_BG);
        this.addLabel(
          LOBBY_TEXT.current,
          currentX - 1,
          rowY,
          'assistive',
          panel,
          currentWidth,
          16,
          `difficulty-current-${option.level}`,
          PANEL_ACCENT,
        );
      }
    });
  }

  private renderLobbyEntries(parent: Node, panelWidth: number, panelHeight: number): void {
    const buttonWidth = Math.max(76, Math.floor((panelWidth - 54) / 2));
    const leftX = -buttonWidth / 2 - 6;
    const rightX = buttonWidth / 2 + 6;
    const rowOneY = -panelHeight / 2 + 72;
    const rowTwoY = -panelHeight / 2 + 28;
    this.addButton(t('lobby.tutorial'), leftX, rowOneY, buttonWidth, 34, true, () => {
      this.screen = 'tutorial';
      this.tutorialIndex = 0;
      this.render();
    }, parent, false, 'entry-tutorial-button');
    this.addButton(LOBBY_TEXT.help, rightX, rowOneY, buttonWidth, 34, true, () => {
      this.screen = 'help';
      this.helpScrollIndex = 0;
      this.render();
    }, parent, false, 'entry-help-button');
    this.addButton(LOBBY_TEXT.stats, leftX, rowTwoY, buttonWidth, 34, true, () => {
      this.screen = 'stats';
      this.render();
    }, parent, false, 'entry-stats-button');
    this.addButton(LOBBY_TEXT.records, rightX, rowTwoY, buttonWidth, 34, true, () => {
      this.screen = 'records';
      this.render();
    }, parent, false, 'entry-records-button');
  }

  private renderTutorialScreen(): void {
    if (!this.controlsRoot) return;
    const canvas = this.canvasSize();
    const panelWidth = Math.min(650, canvas.width - 72);
    const panelHeight = Math.min(310, canvas.height - 64);
    const steps = tutorialSteps();
    const currentIndex = Math.max(0, Math.min(this.tutorialIndex, steps.length - 1));
    const current = steps[currentIndex];
    if (!current) {
      this.screen = 'home';
      this.render();
      return;
    }

    const panel = this.ensureNode('tutorial-panel', this.controlsRoot);
    panel.setPosition(0, 0, 0);
    addUiTransform(panel, panelWidth, panelHeight);
    this.drawPanelSkin(panel, panelWidth, panelHeight);
    this.addLabel(LOBBY_TEXT.tutorialHeading, 0, panelHeight / 2 - 34, 'sectionTitle', panel, 240, 34, 'tutorial-heading');
    // v1.6 PL-04:页码内收,脱离右上角饰。
    this.addLabel(`${currentIndex + 1}/${steps.length}`, panelWidth / 2 - 84, panelHeight / 2 - 34, 'meta', panel, 54, 24, 'tutorial-progress', PANEL_MUTED);
    this.addLabel(current.title, 0, panelHeight / 2 - 80, 'hero', panel, panelWidth - 96, 42, 'tutorial-title');
    wrapText(current.body, Math.max(18, Math.floor((panelWidth - 132) / 16))).slice(0, 3).forEach((line, index) => {
      this.addLabel(line, 0, 42 - index * 25, 'action', panel, panelWidth - 128, 24, `tutorial-body-${index}`);
    });
    if (current.highlight) this.addLabel(`${LOBBY_TEXT.focusPrefix}${highlightLabel(current)}`, 0, -42, 'body', panel, panelWidth - 160, 28, 'tutorial-highlight');

    // v1.6 PL-03:78 宽下 v15 端头饰吞三字钮首字——加宽到 100(78 为拉伸模拟下限,三字钮需更多中央区)。
    this.addButton(LOBBY_TEXT.previous, -110, -panelHeight / 2 + 34, 100, 36, this.tutorialIndex > 0, () => {
      this.tutorialIndex = Math.max(0, this.tutorialIndex - 1);
      this.render();
    }, panel, false, 'tutorial-prev-button');
    this.addButton(this.tutorialIndex >= steps.length - 1 ? LOBBY_TEXT.finish : LOBBY_TEXT.next, 0, -panelHeight / 2 + 34, 100, 36, true, () => {
      if (this.tutorialIndex >= steps.length - 1) {
        this.screen = 'home';
      } else {
        this.tutorialIndex = nextStep(steps, this.tutorialIndex);
      }
      this.render();
    }, panel, false, 'tutorial-next-button');
    this.addButton(LOBBY_TEXT.skip, 110, -panelHeight / 2 + 34, 100, 36, true, () => {
      this.screen = 'home';
      this.render();
    }, panel, false, 'tutorial-skip-button');
  }

  private renderHelpScreen(): void {
    if (!this.controlsRoot) return;
    const canvas = this.canvasSize();
    const panelWidth = Math.min(700, canvas.width - 72);
    const panelHeight = Math.min(318, canvas.height - 58);
    const rows = this.helpRows();
    const visibleRows = Math.max(7, Math.min(9, Math.floor((panelHeight - 108) / 24)));
    const maxStart = Math.max(0, rows.length - visibleRows);
    const start = Math.max(0, Math.min(this.helpScrollIndex, maxStart));
    const visible = rows.slice(start, start + visibleRows);

    const panel = this.ensureNode('help-panel', this.controlsRoot);
    panel.setPosition(0, 0, 0);
    addUiTransform(panel, panelWidth, panelHeight);
    this.drawPanelSkin(panel, panelWidth, panelHeight);
    this.addLabel(LOBBY_TEXT.help, 0, panelHeight / 2 - 34, 'sectionTitle', panel, 220, 34, 'help-heading');
    // v1.6 PL-04:页码内收,脱离右上角饰。
    this.addLabel(`${start + 1}-${Math.min(rows.length, start + visibleRows)}/${rows.length}`, panelWidth / 2 - 92, panelHeight / 2 - 34, 'secondary', panel, 72, 22, 'help-progress', PANEL_MUTED);

    visible.forEach((row, index) => {
      const y = panelHeight / 2 - 72 - index * 24;
      if (row.kind === 'spacer') return;
      this.addLabel(
        row.text,
        0,
        y,
        row.kind === 'title' ? 'prominentAction' : 'meta',
        panel,
        panelWidth - 96,
        24,
        `help-row-${index}`,
        row.kind === 'title' ? PANEL_ACCENT : PANEL_TEXT,
      );
    });

    // v1.6 PL-03:同教程页——78 宽端头吞字,加宽到 100。
    this.addButton(LOBBY_TEXT.upScroll, -110, -panelHeight / 2 + 34, 100, 36, start > 0, () => {
      this.helpScrollIndex = Math.max(0, start - 5);
      this.render();
    }, panel, false, 'help-scroll-up-button');
    this.addButton(LOBBY_TEXT.downScroll, 0, -panelHeight / 2 + 34, 100, 36, start < maxStart, () => {
      this.helpScrollIndex = Math.min(maxStart, start + 5);
      this.render();
    }, panel, false, 'help-scroll-down-button');
    this.addButton(LOBBY_TEXT.back, 110, -panelHeight / 2 + 34, 100, 36, true, () => {
      this.screen = 'home';
      this.render();
    }, panel, false, 'help-back-button');
  }

  private renderStatsScreen(): void {
    if (!this.controlsRoot) return;
    const canvas = this.canvasSize();
    const panelWidth = Math.min(620, canvas.width - 80);
    const panelHeight = Math.min(318, canvas.height - 58);
    const view = deriveStatsDetailView(digestRecords(this.loadRecords()));
    const panel = this.ensureNode('stats-panel', this.controlsRoot);
    panel.setPosition(0, 0, 0);
    addUiTransform(panel, panelWidth, panelHeight);
    this.drawPanelSkin(panel, panelWidth, panelHeight);
    this.addLabel(LOBBY_TEXT.stats, 0, panelHeight / 2 - 34, 'sectionTitle', panel, 220, 34, 'stats-heading');
    // v1.6 PL-02:空态与数据行互斥(原双重渲染互相叠压);12 行改双列 6+6,
    // 行带收进 y∈[77,-53],不再穿底部按钮线(-107)也不溢出面板。
    if (view.empty) {
      this.addSprite(RESOURCE_PATHS.emptyRecords, 0, 26, 72, 72, panel, 'stats-empty-art');
      this.addLabel(LOBBY_TEXT.noCompletedRecords, 0, -34, 'body', panel, 220, 24, 'stats-empty', PANEL_MUTED);
    } else {
      view.rows.forEach((row, index) => {
        const column = index < 6 ? 0 : 1;
        const rowInCol = index % 6;
        const y = panelHeight / 2 - 82 - rowInCol * 26;
        const labelX = column === 0 ? -212 : 58;
        const valueX = column === 0 ? -92 : 208;
        this.addLabel(row.label, labelX, y, 'meta', panel, 132, 22, `stats-label-${index}`, PANEL_TEXT);
        this.addLabel(row.value, valueX, y, 'meta', panel, 128, 22, `stats-value-${index}`, PANEL_ACCENT);
      });
    }

    this.addButton(LOBBY_TEXT.records, -72, -panelHeight / 2 + 34, 96, 36, true, () => {
      this.screen = 'records';
      this.render();
    }, panel, false, 'stats-records-button');
    this.addButton(LOBBY_TEXT.back, 72, -panelHeight / 2 + 34, 96, 36, true, () => {
      this.screen = 'home';
      this.render();
    }, panel, false, 'stats-back-button');
  }

  private renderRecordsScreen(): void {
    if (!this.controlsRoot) return;
    const canvas = this.canvasSize();
    const panelWidth = Math.min(700, canvas.width - 72);
    const panelHeight = Math.min(318, canvas.height - 58);
    const records = this.loadRecords();
    const query = { ...this.recordQuery, limit: 4 };
    const view = deriveRecordsDetailView(records, query);
    const panel = this.ensureNode('records-panel', this.controlsRoot);
    panel.setPosition(0, 0, 0);
    addUiTransform(panel, panelWidth, panelHeight);
    this.drawPanelSkin(panel, panelWidth, panelHeight);
    this.addLabel(LOBBY_TEXT.records, 0, panelHeight / 2 - 34, 'sectionTitle', panel, 220, 34, 'records-heading');

    this.renderFilterGroup(
      panel,
      panelHeight / 2 - 74,
      [
        { label: LOBBY_TEXT.all, value: 'all' },
        { label: LOBBY_TEXT.win, value: 'win' },
        { label: LOBBY_TEXT.loss, value: 'loss' },
      ],
      this.recordQuery.outcome,
      (value) => {
        this.recordQuery = { ...this.recordQuery, outcome: value };
        this.render();
      },
      'records-outcome',
      t('records.filterOutcome'),
    );
    this.renderFilterGroup(
      panel,
      panelHeight / 2 - 110,
      [
        { label: LOBBY_TEXT.all, value: 'all' },
        { label: LOBBY_TEXT.landlord, value: 'landlord' },
        { label: LOBBY_TEXT.farmer, value: 'farmer' },
      ],
      this.recordQuery.role,
      (value) => {
        this.recordQuery = { ...this.recordQuery, role: value };
        this.render();
      },
      'records-role',
      t('records.filterRole'),
    );
    this.renderFilterGroup(
      panel,
      panelHeight / 2 - 146,
      [
        { label: LOBBY_TEXT.newest, value: 'newest' },
        { label: LOBBY_TEXT.oldest, value: 'oldest' },
      ],
      this.recordQuery.order,
      (value) => {
        this.recordQuery = { ...this.recordQuery, order: value };
        this.render();
      },
      'records-order',
      t('records.filterOrder'),
    );

    // v1.6 PL-02(同类扩展披露):历史屏第 4 行(y=-128)原也穿底部按钮(顶缘 -107)——
    // 行带上移收紧 + 按钮下移,4 行与按钮零交叠。
    this.addLabel(view.filterLabel, 0, -12, 'meta', panel, 260, 22, 'records-filter-label', PANEL_MUTED);
    if (view.empty) {
      this.addSprite(RESOURCE_PATHS.emptyRecords, 0, -40, 68, 68, panel, 'records-empty-art');
      this.addLabel(LOBBY_TEXT.noMatchedRecords, 0, -92, 'action', panel, 180, 30, 'records-empty', PANEL_MUTED);
    } else {
      view.rows.forEach((row, index) => {
        const y = -38 - index * 21;
        const tags = row.tags.length > 0 ? ` ${row.tags.join(' ')}` : '';
        this.addLabel(
          `${row.outcomeLabel} ${row.roleLabel} ${row.scoreLabel} ${row.multiplierLabel}${tags}`,
          0,
          y,
          'meta',
          panel,
          panelWidth - 122,
          22,
          `records-row-${index}`,
          row.outcomeLabel === LOBBY_TEXT.win ? PANEL_GOOD : PANEL_BAD,
        );
      });
    }

    this.addButton(LOBBY_TEXT.stats, -72, -panelHeight / 2 + 26, 96, 36, true, () => {
      this.screen = 'stats';
      this.render();
    }, panel, false, 'records-stats-button');
    this.addButton(LOBBY_TEXT.back, 72, -panelHeight / 2 + 26, 96, 36, true, () => {
      this.screen = 'home';
      this.render();
    }, panel, false, 'records-back-button');
  }

  private renderFilterGroup<T extends string>(
    panel: Node,
    y: number,
    options: { label: string; value: T }[],
    current: T,
    select: (value: T) => void,
    name: string,
    caption?: string,
  ): void {
    // v1.6 PL-05:行首加分组小标(结果/身份/排序),两个「全部」不再歧义;
    // v1.6 PL-03:chip 66/78→78/86 宽,给 v15 端头饰留中央区。
    if (caption) {
      this.addLabel(caption, -170, y, 'secondary', panel, 44, 20, `${name}-caption`, PANEL_MUTED);
    }
    const spacing = options.length === 2 ? 96 : 88;
    const startX = -((options.length - 1) * spacing) / 2;
    options.forEach((option, index) => {
      const selected = option.value === current;
      this.addButton(
        option.label,
        startX + index * spacing,
        y,
        options.length === 2 ? 86 : 78,
        30,
        true,
        () => select(option.value),
        panel,
        selected,
        `${name}-${option.value}`,
      );
    });
  }

  private helpRows(): HelpRow[] {
    const rows: HelpRow[] = [];
    helpSections().forEach((section, sectionIndex) => {
      if (sectionIndex > 0) rows.push({ text: '', kind: 'spacer' });
      rows.push({ text: section.title, kind: 'title' });
      section.lines.forEach((line) => {
        // v1.6 PL-06:预折行 20→30 字符——700 宽面板正文列宽约 390px,行长更接近阅读习惯。
        wrapText(line, 30).forEach((text) => rows.push({ text: text.trim(), kind: 'body' }));
      });
    });
    return rows;
  }

  private persist(next: Settings): void {
    try {
      saveSettings(cocosStorage(), SETTINGS_KEY, next);
    } catch (error) {
      console.warn('saveSettings failed', error);
    }
    this.render();
  }

  private loadStats(): ReturnType<typeof emptyStats> {
    const raw = cocosStorage().getItem(STATS_KEY);
    return raw === null ? emptyStats() : deserializeStats(raw);
  }

  private loadRecords(): RecordsState {
    const raw = cocosStorage().getItem(RECORDS_KEY);
    if (raw === null) return emptyRecords();
    try {
      return migrateRecords(JSON.parse(raw));
    } catch (error) {
      console.warn('loadRecords failed', error);
      return emptyRecords();
    }
  }

  private loadSavedSlot(): ReturnType<typeof loadSave> {
    try {
      return loadSave(cocosStorage(), SAVE_KEY);
    } catch (error) {
      console.warn('loadSave failed', error);
      return null;
    }
  }

  private setText(label: Label | null, text: string): void {
    if (label) label.string = text;
  }

  /** v1.5 P-BTN-FEEL:大厅按钮点击音(经 sound 开关;AudioSource 惰性挂载)。 */
  private spawnRipple(worldPos: Vec3, sizeBase: number): void {
    const params = buttonRipple();
    const local = this.node.getComponent(UITransform)?.convertToNodeSpaceAR(worldPos) ?? new Vec3(0, 0, 0);
    const dia = sizeBase * params.sizeRatio;
    const node = this.addSprite(RESOURCE_PATHS.fxRingV19, local.x, local.y, dia, dia, this.node, `fx-ripple-${Date.now()}`);
    node.setScale(params.scaleFrom, params.scaleFrom, 1);
    const opacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    opacity.opacity = params.alphaFrom;
    tween(node).to(params.ms / 1000, { scale: new Vec3(params.scaleTo, params.scaleTo, 1) }, { easing: 'quadOut' }).start();
    tween(opacity)
      .to(params.ms / 1000, { opacity: 0 })
      .call(() => {
        node.removeFromParent();
        node.destroy();
      })
      .start();
  }

  private playButtonSound(): void {
    if (!loadSettings(cocosStorage(), STORAGE_KEYS.settings).sound) return;
    const source = this.node.getComponent(AudioSource) ?? this.node.addComponent(AudioSource);
    resources.load(RESOURCE_PATHS.audioButton, AudioClip, (error, clip) => {
      if (!error && clip && source.isValid) source.playOneShot(clip);
    });
  }

  private setHomeLabelsVisible(visible: boolean): void {
    this.setLabelVisible(this.continueLabel, visible);
    this.setLabelVisible(this.roundsLabel, visible);
    this.setLabelVisible(this.winRateLabel, visible);
    this.setLabelVisible(this.netScoreLabel, visible);
    this.setLabelVisible(this.latestRecordLabel, false);
    this.setLabelVisible(this.difficultyLabel, false);
  }

  private setLabelVisible(label: Label | null, visible: boolean): void {
    if (label) label.node.active = visible;
  }

  private hideLegacyScaffold(): void {
    for (const child of this.node.children) {
      if (LEGACY_LABEL_NODE_NAMES.some((name) => child.name.startsWith(name))) {
        child.active = false;
      }
    }
    // v1.6 二次终审:静态背景 lobby-bg 原只靠 @property(background) 在 onLoad 关闭——与
    // hideStrayPlaceholderLabels 所述同一类「场景 @property 绑定失效」缺陷。冷构建(rm -rf library
    // 后全量重导)实测 background 变 null,旧 lobby-bg 便盖在运行时 v13 桌景+压暗幕之上(截图实锤:
    // 城市远景整个消失)。按名兜底,不依赖场景序列化——任何人冷构建都能得到一致画面。
    const staticBg = this.node.getChildByName('lobby-bg');
    if (staticBg) staticBg.active = false;
    this.setHomeLabelsVisible(false);
    this.hideStrayPlaceholderLabels();
  }

  /**
   * v1.5 P-STRAY-LABEL2:lobby.scene 内含 6 个 `string:"label"` 占位 Label(经 @property 绑定隐藏),
   * 绑定失效/时序缝隙时会在底缘漏出游离「label」字样(V8 帧即存在的存量缺陷)。
   * 兜底:遍历场景子树,凡 Label 组件文本为占位值一律隐藏其节点;不动 .scene。
   * 真实文案(按钮/标题/战绩数字)均非字面 "label",不会误伤。
   */
  private hideStrayPlaceholderLabels(): void {
    const stack: Node[] = [this.node];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const label = current.getComponent(Label);
      if (label && /^label$/i.test(label.string.trim())) current.active = false;
      for (const child of current.children) stack.push(child);
    }
  }

  private renderPlaceholderBackground(canvas: { width: number; height: number }): void {
    if (this.background) this.background.node.active = false;
    const node = this.ensureNode('lobby-background-runtime', this.node);
    node.setSiblingIndex(0);
    node.setPosition(0, 0, 0);
    const width = Math.max(canvas.width, canvas.height * LOBBY_BACKGROUND_ASPECT);
    const height = Math.max(canvas.height, canvas.width / LOBBY_BACKGROUND_ASPECT);
    addUiTransform(node, width, height);
    node.getComponent(Graphics)?.clear();
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.type = Sprite.Type.SIMPLE;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    loadSprite(RESOURCE_PATHS.gameTableBgC1, sprite, this.spriteFrames);

    // 半透明 scrim：压暗桌景使三面板文字对比达标，同时保留与游戏内一致的场景氛围。
    const scrim = this.ensureNode('lobby-background-scrim', this.node);
    scrim.setSiblingIndex(1);
    scrim.setPosition(0, 0, 0);
    addUiTransform(scrim, width, height);
    const scrimGraphics = scrim.getComponent(Graphics) ?? scrim.addComponent(Graphics);
    scrimGraphics.clear();
    scrimGraphics.fillColor = toColor(THEME.palette.overlayScrim, 96);
    scrimGraphics.rect(-width / 2, -height / 2, width, height);
    scrimGraphics.fill();
  }

  private canvasSize(): { width: number; height: number } {
    const size = this.node.getComponent(UITransform)?.contentSize;
    return {
      width: Math.max(1, size?.width ?? LANDSCAPE_CANVAS.width),
      height: Math.max(1, size?.height ?? LANDSCAPE_CANVAS.height),
    };
  }

  private addLabel(
    text: string,
    x: number,
    y: number,
    role: TypographyRole,
    parent: Node,
    width: number,
    height: number,
    name: string,
    color = PANEL_TEXT,
  ): Label {
    return addUiLabel(this.ensureNode.bind(this), {
      text,
      x,
      y,
      role,
      parent,
      width,
      height,
      name,
      color,
    });
  }

  private addButton(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    enabled: boolean,
    cb: () => void,
    parent: Node,
    selected = false,
    name?: string,
  ): Label {
    const nodeName = name ?? `button-${text}-${x}-${y}`;
    return addSkinnedButton(this.ensureNode.bind(this), this.loadSprite.bind(this), {
      text,
      x,
      y,
      width,
      height,
      enabled,
      cb,
      parent,
      name: nodeName,
      owner: this,
      selected,
      feel: {
        animated: loadSettings(cocosStorage(), STORAGE_KEYS.settings).animation,
        onClickSound: () => this.playButtonSound(),
        // W3-B P-BTN-FEEL-B:lobby 无 render 剪枝循环,涟漪直接挂场景根。
        rippleAt: (worldPos, sizeBase) => this.spawnRipple(worldPos, sizeBase),
      },
      skinPath: (buttonName, isEnabled, isSelected) => this.buttonSkinPath(buttonName, isEnabled, isSelected),
      textColor: (buttonName, isEnabled, isSelected) => this.buttonTextColor(buttonName, isEnabled, isSelected),
      iconPath: (buttonName) => this.buttonIconPath(buttonName),
      layout: ({ iconPath: buttonIconPath, width: buttonWidth, height: buttonHeight }) => {
        const showIcon = Boolean(buttonIconPath) && buttonWidth >= 72;
        // v1.6 二次终审:v18 按钮实测净区 94.6%×83.8%(s4-image-gates.py 门B)。文字盒宽 0.85 早已达标,
        // 但高度一直取按钮全高 → 撑出净区、字脚压到描边线(用户「btn文字和图像的线条重合」)。改 0.80。
        // v21 底唇比 v20 厚，三个 107×32 设置按钮仍用 action 16/20 会压净区；
        // 将紧凑阈值收进 112px，走 body 14/18，文字中心位置不变。
        const compact = buttonWidth <= 112;
        return {
          renderHeight: buttonHeight,
          label: {
            x: showIcon ? THEME.spacing.default : 0,
            y: 0,
            width: showIcon ? buttonWidth - 28 : Math.round(buttonWidth * 0.85),
            height: Math.max(22, Math.round(buttonHeight * 0.80)),
            role: compact ? 'body' : 'action',
          },
          icon: showIcon
            ? {
                x: -buttonWidth / 2 + 20,
                y: 0,
                size: Math.min(21, Math.max(16, buttonHeight - 14)),
              }
            : undefined,
        };
      },
    });
  }

  private buttonSkinPath(name: string, enabled: boolean, selected: boolean): ResourcePath {
    // W-VISION-COLOR-R2:大厅大按钮同样只有黄/绿两张角色皮；
    // 禁用态保留角色皮，由 addSkinnedButton 统一压暗。
    void enabled;
    if (selected || name === 'home-start-button' || name === 'home-continue-button') return RESOURCE_PATHS.btnPrimaryC2;
    return RESOURCE_PATHS.btnSecondaryC2;
  }

  private buttonTextColor(name: string, enabled: boolean, selected: boolean): Color {
    if (!enabled) return BUTTON_DISABLED_TEXT;
    return selected || name === 'home-start-button' || name === 'home-continue-button'
      ? BUTTON_PRIMARY_TEXT
      : BUTTON_SECONDARY_TEXT;
  }

  private buttonIconPath(name: string): ResourcePath | null {
    if (name.endsWith('-back-button')) return RESOURCE_PATHS.iconBack;
    return null;
  }

  private addSprite(
    path: ResourcePath,
    x: number,
    y: number,
    width: number,
    height: number,
    parent: Node,
    name: string,
    sliced = false,
  ): Node {
    return addSkinnedSprite(this.ensureNode.bind(this), this.loadSprite.bind(this), {
      path,
      x,
      y,
      width,
      height,
      parent,
      name,
      sliced,
    });
  }

  private drawPanelSkin(parent: Node, width: number, height: number, name = 'panel-skin'): Node {
    // W-VISION S4:两场景弹窗面板统一 v19 皮肤。
    return drawUiPanelSkin(this.ensureNode.bind(this), this.loadSprite.bind(this), {
      path: RESOURCE_PATHS.panelPopupV19,
      parent,
      width,
      height,
      name,
    });
  }

  private loadSprite(path: ResourcePath, sprite: Sprite | null): SpriteFrame | null {
    return loadSprite(path, sprite, this.spriteFrames);
  }

  private ensureNode(name: string, parent: Node): Node {
    const existing = parent.getChildByName(name);
    if (existing) {
      existing.active = true;
      existing.layer = parent.layer;
      existing.setSiblingIndex(parent.children.length - 1);
      return existing;
    }
    const node = new Node(name);
    node.parent = parent;
    node.layer = parent.layer;
    node.active = true;
    node.setSiblingIndex(parent.children.length - 1);
    return node;
  }

  private clearNode(node: Node): void {
    for (const child of node.children.slice()) {
      child.removeFromParent();
      child.destroy();
    }
  }

}
