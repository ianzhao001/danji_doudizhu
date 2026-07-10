import { _decorator, Color, Component, Graphics, Label, Node, Sprite, SpriteFrame, UITransform } from 'cc';
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
import { cocosStorage } from '../../runtime/cocos-storage';
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
import { RESOURCE_PATHS, type ResourcePath } from '../asset-keys';
import { t } from '../strings';
import {
  THEME,
  addLabel as addUiLabel,
  addSkinnedButton,
  addSkinnedSprite,
  addUiTransform,
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
const LOBBY_BACKGROUND_ASPECT = 1846 / 852;
const LEGACY_LABEL_NODE_NAMES = [
  'title-label',
  'start-label',
  'settings-label',
  'records-label',
];
const PANEL_TEXT = toColor(THEME.palette.brandDark);
const PANEL_MUTED = toColor(THEME.palette.textSecondary);
const PANEL_ACCENT = toColor(THEME.palette.brand);
const PANEL_GOOD = toColor(THEME.palette.success);
const PANEL_BAD = toColor(THEME.palette.danger);
const BUTTON_PRIMARY_TEXT = toColor(THEME.palette.brandDark);
const BUTTON_SECONDARY_TEXT = toColor(THEME.palette.brandDark);
const BUTTON_DISABLED_TEXT = toColor(THEME.palette.textDisabled);

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

  onLoad(): void {
    if (this.background) this.background.node.active = false;
    this.hideLegacyScaffold();
    this.controlsRoot = this.ensureNode('lobby-runtime-root', this.node);
    this.render();
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
    runtime.cc?.director?.loadScene('game');
  }

  private renderHomeScreen(settings: Settings, home: HomeViewData): void {
    if (!this.controlsRoot) return;
    const settingsView = deriveSettingsView(settings);
    const canvas = this.canvasSize();
    const contentWidth = Math.min(canvas.width - 40, 804);
    const panelHeight = Math.min(292, canvas.height - 66);
    const summaryWidth = Math.min(232, Math.max(214, contentWidth * 0.29));
    const difficultyWidth = Math.min(292, Math.max(258, contentWidth * 0.34));
    const settingsWidth = summaryWidth;
    const leftX = -contentWidth * 0.335;
    const centerX = 0;
    const rightX = contentWidth * 0.335;

    const summary = this.ensureNode('home-summary-panel', this.controlsRoot);
    summary.setPosition(leftX, 0, 0);
    addUiTransform(summary, summaryWidth, panelHeight);
    this.drawPanelSkin(summary, summaryWidth, panelHeight);
    this.addLabel(
      LOBBY_TEXT.title,
      0,
      panelHeight / 2 - 38,
      THEME.typography.display,
      summary,
      summaryWidth - 34,
      40,
      'home-title',
    );
    this.addButton(
      LOBBY_TEXT.startNewGame,
      0,
      panelHeight / 2 - 88,
      summaryWidth - 38,
      40,
      true,
      () => this.openGameScene({ forceNew: true }),
      summary,
      false,
      'home-start-button',
    );
    this.addButton(
      home.hasSavedGame ? LOBBY_TEXT.continueGame : LOBBY_TEXT.noSave,
      0,
      panelHeight / 2 - 138,
      summaryWidth - 38,
      40,
      home.hasSavedGame,
      () => this.openGameScene({ requireSave: true }),
      summary,
      false,
      'home-continue-button',
    );
    this.addLabel(home.rounds, -42, -36, 14, summary, 96, 24, 'home-rounds', PANEL_MUTED);
    this.addLabel(home.winRate, 48, -36, 14, summary, 100, 24, 'home-win-rate', PANEL_MUTED);
    this.addLabel(home.netScore, 0, -68, 15, summary, summaryWidth - 40, 26, 'home-net-score', PANEL_ACCENT);
    this.addLabel(home.latestRecord, 0, -102, 13, summary, summaryWidth - 40, 24, 'home-latest-record', PANEL_MUTED);

    this.renderDifficultyPanel(settingsView.difficulty, centerX, 0, difficultyWidth, panelHeight);

    const settingsPanel = this.ensureNode('home-settings-panel', this.controlsRoot);
    settingsPanel.setPosition(rightX, 0, 0);
    addUiTransform(settingsPanel, settingsWidth, panelHeight);
    this.drawPanelSkin(settingsPanel, settingsWidth, panelHeight);
    this.addSprite(RESOURCE_PATHS.iconSettings, -settingsWidth / 2 + 34, panelHeight / 2 - 34, 24, 24, settingsPanel, 'home-settings-icon');
    this.addLabel(t('lobby.settings'), 0, panelHeight / 2 - 34, 22, settingsPanel, settingsWidth - 34, 34, 'home-settings-title');
    settingsView.toggles.forEach((toggle, index) => {
      this.addButton(
        `${TOGGLE_LABELS[toggle.key]} ${toggleText(toggle.on)}`,
        0,
        panelHeight / 2 - 82 - index * 40,
        settingsWidth - 46,
        36,
        true,
        () => this.persist(toggleSetting(loadSettings(cocosStorage(), SETTINGS_KEY), toggle.key)),
        settingsPanel,
        toggle.on,
        `home-toggle-${toggle.key}`,
      );
    });
    this.renderLobbyEntries(settingsPanel, settingsWidth, panelHeight);
  }

  private renderDifficultyPanel(current: AiLevel, x: number, y: number, panelWidth: number, panelHeight: number): void {
    if (!this.controlsRoot) return;
    const panel = this.ensureNode('difficulty-picker-panel', this.controlsRoot);
    panel.setPosition(x, y, 0);
    addUiTransform(panel, panelWidth, panelHeight);
    this.drawPanelSkin(panel, panelWidth, panelHeight);
    this.addLabel(LOBBY_TEXT.difficulty, 0, panelHeight / 2 - 34, 22, panel, panelWidth - 34, 34, 'difficulty-title');

    const rowWidth = panelWidth - 18;
    const rowPadding = 10;
    const titleWidth = 44;
    const currentWidth = 40;
    const gap = 8;
    const descWidth = Math.max(104, rowWidth - rowPadding * 2 - titleWidth - currentWidth - gap * 2);
    const titleX = -rowWidth / 2 + rowPadding + titleWidth / 2;
    const descX = titleX + titleWidth / 2 + gap + descWidth / 2;
    const currentX = rowWidth / 2 - rowPadding - currentWidth / 2;
    const picker = deriveDifficultyPicker(current);
    picker.options.forEach((option, index) => {
      const rowY = panelHeight / 2 - 84 - index * 54;
      this.addButton(
        '',
        0,
        rowY,
        panelWidth - 18,
        44,
        true,
        () => this.persist(setDifficulty(loadSettings(cocosStorage(), SETTINGS_KEY), option.level)),
        panel,
        option.selected,
        `difficulty-option-${option.level}`,
      );
      const title = this.addLabel(
        option.label,
        titleX,
        rowY,
        15,
        panel,
        titleWidth,
        24,
        `difficulty-label-${option.level}`,
        option.selected ? BUTTON_PRIMARY_TEXT : BUTTON_SECONDARY_TEXT,
      );
      title.lineHeight = 18;
      const lines = wrapText(option.description, Math.max(8, Math.floor(descWidth / 12))).slice(0, 2);
      const single = lines.length === 1;
      lines.forEach((line, lineIndex) => {
        this.addLabel(
          line,
          descX,
          rowY + (single ? 0 : 7 - lineIndex * 15),
          12,
          panel,
          descWidth,
          16,
          `difficulty-desc-${option.level}-${lineIndex}`,
          option.selected ? BUTTON_PRIMARY_TEXT : BUTTON_SECONDARY_TEXT,
        );
      });
      if (option.selected) {
        this.addLabel(
          LOBBY_TEXT.current,
          currentX,
          rowY,
          12,
          panel,
          currentWidth,
          20,
          `difficulty-current-${option.level}`,
          BUTTON_PRIMARY_TEXT,
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
    this.addLabel(LOBBY_TEXT.tutorialHeading, 0, panelHeight / 2 - 34, 22, panel, 240, 34, 'tutorial-heading');
    this.addLabel(`${currentIndex + 1}/${steps.length}`, panelWidth / 2 - 58, panelHeight / 2 - 34, 13, panel, 54, 24, 'tutorial-progress');
    this.addLabel(current.title, 0, panelHeight / 2 - 80, 24, panel, panelWidth - 96, 42, 'tutorial-title');
    wrapText(current.body, Math.max(18, Math.floor((panelWidth - 132) / 16))).slice(0, 3).forEach((line, index) => {
      this.addLabel(line, 0, 42 - index * 25, 16, panel, panelWidth - 128, 24, `tutorial-body-${index}`);
    });
    if (current.highlight) this.addLabel(`${LOBBY_TEXT.focusPrefix}${highlightLabel(current)}`, 0, -42, 14, panel, panelWidth - 160, 28, 'tutorial-highlight');

    this.addButton(LOBBY_TEXT.previous, -96, -panelHeight / 2 + 34, 78, 36, this.tutorialIndex > 0, () => {
      this.tutorialIndex = Math.max(0, this.tutorialIndex - 1);
      this.render();
    }, panel, false, 'tutorial-prev-button');
    this.addButton(this.tutorialIndex >= steps.length - 1 ? LOBBY_TEXT.finish : LOBBY_TEXT.next, 0, -panelHeight / 2 + 34, 78, 36, true, () => {
      if (this.tutorialIndex >= steps.length - 1) {
        this.screen = 'home';
      } else {
        this.tutorialIndex = nextStep(steps, this.tutorialIndex);
      }
      this.render();
    }, panel, false, 'tutorial-next-button');
    this.addButton(LOBBY_TEXT.skip, 96, -panelHeight / 2 + 34, 78, 36, true, () => {
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
    this.addLabel(LOBBY_TEXT.help, 0, panelHeight / 2 - 34, 22, panel, 220, 34, 'help-heading');
    this.addLabel(`${start + 1}-${Math.min(rows.length, start + visibleRows)}/${rows.length}`, panelWidth / 2 - 64, panelHeight / 2 - 34, 12, panel, 72, 22, 'help-progress', PANEL_MUTED);

    visible.forEach((row, index) => {
      const y = panelHeight / 2 - 72 - index * 24;
      if (row.kind === 'spacer') return;
      this.addLabel(
        row.text,
        0,
        y,
        row.kind === 'title' ? 17 : 13,
        panel,
        panelWidth - 96,
        24,
        `help-row-${index}`,
        row.kind === 'title' ? PANEL_ACCENT : PANEL_TEXT,
      );
    });

    this.addButton(LOBBY_TEXT.upScroll, -98, -panelHeight / 2 + 34, 78, 36, start > 0, () => {
      this.helpScrollIndex = Math.max(0, start - 5);
      this.render();
    }, panel, false, 'help-scroll-up-button');
    this.addButton(LOBBY_TEXT.downScroll, 0, -panelHeight / 2 + 34, 78, 36, start < maxStart, () => {
      this.helpScrollIndex = Math.min(maxStart, start + 5);
      this.render();
    }, panel, false, 'help-scroll-down-button');
    this.addButton(LOBBY_TEXT.back, 98, -panelHeight / 2 + 34, 78, 36, true, () => {
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
    this.addLabel(LOBBY_TEXT.stats, 0, panelHeight / 2 - 34, 22, panel, 220, 34, 'stats-heading');
    if (view.empty) {
      this.addSprite(RESOURCE_PATHS.emptyRecords, 0, 22, 72, 72, panel, 'stats-empty-art');
      this.addLabel(LOBBY_TEXT.noCompletedRecords, 0, -34, 13, panel, 150, 24, 'stats-empty', PANEL_MUTED);
    }

    view.rows.forEach((row, index) => {
      const y = panelHeight / 2 - 78 - index * 28;
      this.addLabel(row.label, -86, y, 13, panel, 140, 22, `stats-label-${index}`, PANEL_TEXT);
      this.addLabel(row.value, 92, y, 14, panel, 150, 22, `stats-value-${index}`, PANEL_ACCENT);
    });

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
    this.addLabel(LOBBY_TEXT.records, 0, panelHeight / 2 - 34, 22, panel, 220, 34, 'records-heading');

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
    );

    this.addLabel(view.filterLabel, 0, -14, 13, panel, 260, 22, 'records-filter-label', PANEL_MUTED);
    if (view.empty) {
      this.addSprite(RESOURCE_PATHS.emptyRecords, 0, -34, 68, 68, panel, 'records-empty-art');
      this.addLabel(LOBBY_TEXT.noMatchedRecords, 0, -88, 16, panel, 180, 30, 'records-empty', PANEL_MUTED);
    } else {
      view.rows.forEach((row, index) => {
        const y = -50 - index * 26;
        const tags = row.tags.length > 0 ? ` ${row.tags.join(' ')}` : '';
        this.addLabel(
          `${row.outcomeLabel} ${row.roleLabel} ${row.scoreLabel} ${row.multiplierLabel}${tags}`,
          0,
          y,
          13,
          panel,
          panelWidth - 122,
          22,
          `records-row-${index}`,
          row.outcomeLabel === LOBBY_TEXT.win ? PANEL_GOOD : PANEL_BAD,
        );
      });
    }

    this.addButton(LOBBY_TEXT.stats, -72, -panelHeight / 2 + 34, 96, 36, true, () => {
      this.screen = 'stats';
      this.render();
    }, panel, false, 'records-stats-button');
    this.addButton(LOBBY_TEXT.back, 72, -panelHeight / 2 + 34, 96, 36, true, () => {
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
  ): void {
    const spacing = options.length === 2 ? 86 : 76;
    const startX = -((options.length - 1) * spacing) / 2;
    options.forEach((option, index) => {
      const selected = option.value === current;
      this.addButton(
        option.label,
        startX + index * spacing,
        y,
        options.length === 2 ? 78 : 66,
        30,
        true,
        () => select(option.value),
        panel,
        selected,
        `${name}-${option.value}`,
      ).fontSize = 14;
    });
  }

  private helpRows(): HelpRow[] {
    const rows: HelpRow[] = [];
    helpSections().forEach((section, sectionIndex) => {
      if (sectionIndex > 0) rows.push({ text: '', kind: 'spacer' });
      rows.push({ text: section.title, kind: 'title' });
      section.lines.forEach((line) => {
        wrapText(line, 20).forEach((text) => rows.push({ text: text.trim(), kind: 'body' }));
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
    this.setHomeLabelsVisible(false);
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
    loadSprite(RESOURCE_PATHS.lobbyBg, sprite, this.spriteFrames);
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
    fontSize: number,
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
      fontSize,
      parent,
      width,
      height,
      name,
      color,
      lineHeightOffset: 6,
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
      skinPath: (buttonName, isEnabled, isSelected) => this.buttonSkinPath(buttonName, isEnabled, isSelected),
      textColor: (buttonName, isEnabled, isSelected) => this.buttonTextColor(buttonName, isEnabled, isSelected),
      iconPath: (buttonName) => this.buttonIconPath(buttonName),
      layout: ({ iconPath: buttonIconPath, width: buttonWidth, height: buttonHeight }) => {
        const showIcon = Boolean(buttonIconPath) && buttonWidth >= 72;
        return {
          renderHeight: buttonHeight,
          label: {
            x: showIcon ? 8 : 0,
            y: 0,
            width: showIcon ? buttonWidth - 32 : buttonWidth,
            height: buttonHeight,
            fontSize: THEME.typography.md,
            lineHeight: THEME.typography.lg,
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
    if (!enabled) return RESOURCE_PATHS.buttonDisabled;
    if (selected || name === 'home-start-button' || name === 'home-continue-button') return RESOURCE_PATHS.buttonPrimary;
    return RESOURCE_PATHS.buttonSecondary;
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
    return drawUiPanelSkin(this.ensureNode.bind(this), this.loadSprite.bind(this), {
      path: RESOURCE_PATHS.panelPopup,
      parent,
      width,
      height,
      name,
    });
  }

  private loadSprite(path: ResourcePath, sprite: Sprite | null): void {
    loadSprite(path, sprite, this.spriteFrames);
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
