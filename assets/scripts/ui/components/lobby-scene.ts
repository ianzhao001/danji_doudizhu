import { _decorator, Color, Component, Graphics, Label, Node, Sprite, UITransform } from 'cc';
import { AiLevel } from '../../ai';
import {
  deserializeStats,
  digestRecords,
  emptyRecords,
  emptyStats,
  loadSettings,
  migrateRecords,
  saveSettings,
  type RecordOutcome,
  type RecordRole,
  type RecordsState,
  type Settings,
} from '../../data';
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
import { addButton as addUiButton, addLabel as addUiLabel, addUiTransform, drawPanel } from './ui-helpers';

const { ccclass, property } = _decorator;
const SETTINGS_KEY = 'doudizhu.settings';
const STATS_KEY = 'doudizhu.stats';
const RECORDS_KEY = 'doudizhu.records';
const LANDSCAPE_CANVAS = { width: 844, height: 390 };
const LEGACY_LABEL_NODE_NAMES = [
  'title-label',
  'start-label',
  'settings-label',
  'records-label',
];

const TOGGLE_LABELS: Record<ToggleKey, string> = {
  sound: '音效',
  vibration: '震动',
  animation: '动效',
};

interface HelpRow {
  text: string;
  kind: 'title' | 'body' | 'spacer';
}

interface HomeViewData {
  rounds: string;
  winRate: string;
  netScore: string;
  latestRecord: string;
}

type LobbyScreen = 'home' | 'tutorial' | 'help' | 'stats' | 'records';

function highlightLabel(step: TutorialStep): string {
  switch (step.highlight) {
    case 'playerHand':
      return '玩家手牌';
    case 'biddingPanel':
      return '叫抢区域';
    case 'playArea':
      return '出牌区';
    case 'actionButtons':
      return '操作按钮';
    case 'scorePanel':
      return '结算面板';
    default:
      return '当前步骤';
  }
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
    const lobby = deriveLobbyView({ savedSlot: null, stats });
    const statsView = deriveStatsView(stats);
    const settingsView = deriveSettingsView(settings);
    const recordRows = deriveRecordsView(records, 1);
    const difficulty = deriveDifficultyPicker(settingsView.difficulty).options.find((option) => option.selected);
    const canvas = this.canvasSize();
    this.renderPlaceholderBackground(canvas);

    this.setText(this.continueLabel, lobby.continueLabel);
    this.setText(this.roundsLabel, `局数 ${statsView.rounds}`);
    this.setText(this.winRateLabel, `胜率 ${statsView.winRatePct}%`);
    this.setText(this.netScoreLabel, `净分 ${statsView.netScoreLabel}`);
    this.setText(this.difficultyLabel, `难度 ${difficulty?.label ?? '普通'}`);
    this.setText(this.latestRecordLabel, recordRows[0]?.scoreLabel ?? '暂无战绩');
    this.setHomeLabelsVisible(false);
    this.renderRuntimeControls(settings, {
      rounds: `局数 ${statsView.rounds}`,
      winRate: `胜率 ${statsView.winRatePct}%`,
      netScore: `净分 ${statsView.netScoreLabel}`,
      latestRecord: recordRows[0]?.scoreLabel ?? '暂无战绩',
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

  private openGameScene(): void {
    const runtime = globalThis as typeof globalThis & {
      cc?: { director?: { loadScene(sceneName: string): void } };
    };
    runtime.cc?.director?.loadScene('game');
  }

  private renderHomeScreen(settings: Settings, home: HomeViewData): void {
    if (!this.controlsRoot) return;
    const settingsView = deriveSettingsView(settings);
    const canvas = this.canvasSize();
    const contentWidth = Math.min(canvas.width - 44, 796);
    const panelHeight = Math.min(286, canvas.height - 72);
    const summaryWidth = Math.min(232, Math.max(214, contentWidth * 0.29));
    const difficultyWidth = Math.min(292, Math.max(258, contentWidth * 0.34));
    const settingsWidth = summaryWidth;
    const leftX = -contentWidth * 0.335;
    const centerX = 0;
    const rightX = contentWidth * 0.335;

    const summary = this.ensureNode('home-summary-panel', this.controlsRoot);
    summary.setPosition(leftX, 0, 0);
    addUiTransform(summary, summaryWidth, panelHeight);
    drawPanel(summary, summaryWidth, panelHeight, new Color(34, 43, 58, 228));
    this.addLabel('斗地主', 0, panelHeight / 2 - 38, 28, summary, summaryWidth - 34, 40, 'home-title');
    this.addButton('开始新局', 0, panelHeight / 2 - 88, summaryWidth - 42, 40, true, () => this.openGameScene(), summary, false, 'home-start-button');
    this.addButton('继续游戏', 0, panelHeight / 2 - 136, summaryWidth - 42, 40, true, () => this.openGameScene(), summary, false, 'home-continue-button');
    this.addLabel(home.rounds, -42, -26, 14, summary, 96, 24, 'home-rounds', new Color(255, 255, 255, 225));
    this.addLabel(home.winRate, 48, -26, 14, summary, 100, 24, 'home-win-rate', new Color(255, 255, 255, 225));
    this.addLabel(home.netScore, 0, -58, 15, summary, summaryWidth - 40, 26, 'home-net-score', new Color(255, 246, 213, 248));
    this.addLabel(home.latestRecord, 0, -92, 13, summary, summaryWidth - 40, 24, 'home-latest-record', new Color(225, 235, 255, 210));

    this.renderDifficultyPanel(settingsView.difficulty, centerX, 0, difficultyWidth, panelHeight);

    const settingsPanel = this.ensureNode('home-settings-panel', this.controlsRoot);
    settingsPanel.setPosition(rightX, 0, 0);
    addUiTransform(settingsPanel, settingsWidth, panelHeight);
    drawPanel(settingsPanel, settingsWidth, panelHeight, new Color(34, 43, 58, 220));
    this.addLabel('设置', 0, panelHeight / 2 - 34, 22, settingsPanel, settingsWidth - 34, 34, 'home-settings-title');
    settingsView.toggles.forEach((toggle, index) => {
      this.addButton(
        `${TOGGLE_LABELS[toggle.key]} ${toggle.on ? '开' : '关'}`,
        0,
        panelHeight / 2 - 82 - index * 40,
        settingsWidth - 46,
        36,
        true,
        () => this.persist(toggleSetting(loadSettings(cocosStorage(), SETTINGS_KEY), toggle.key)),
        settingsPanel,
        false,
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
    drawPanel(panel, panelWidth, panelHeight, new Color(36, 42, 58, 232));
    this.addLabel('难度', 0, panelHeight / 2 - 34, 22, panel, panelWidth - 34, 34, 'difficulty-title');

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
        -panelWidth / 2 + 54,
        rowY,
        15,
        panel,
        54,
        24,
        `difficulty-label-${option.level}`,
        option.selected ? new Color(255, 236, 197, 255) : new Color(255, 255, 255, 238),
      );
      title.lineHeight = 18;
      const lines = wrapText(option.description, 14).slice(0, 2);
      const single = lines.length === 1;
      lines.forEach((line, lineIndex) => {
        this.addLabel(
          line,
          6,
          rowY + (single ? 0 : 7 - lineIndex * 15),
          12,
          panel,
          panelWidth - 112,
          16,
          `difficulty-desc-${option.level}-${lineIndex}`,
          new Color(255, 255, 255, 215),
        );
      });
      if (option.selected) {
        this.addLabel(
          '当前',
          panelWidth / 2 - 36,
          rowY,
          12,
          panel,
          42,
          20,
          `difficulty-current-${option.level}`,
          new Color(255, 236, 197, 255),
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
    this.addButton('教程', leftX, rowOneY, buttonWidth, 34, true, () => {
      this.screen = 'tutorial';
      this.tutorialIndex = 0;
      this.render();
    }, parent, false, 'entry-tutorial-button');
    this.addButton('帮助', rightX, rowOneY, buttonWidth, 34, true, () => {
      this.screen = 'help';
      this.helpScrollIndex = 0;
      this.render();
    }, parent, false, 'entry-help-button');
    this.addButton('战绩', leftX, rowTwoY, buttonWidth, 34, true, () => {
      this.screen = 'stats';
      this.render();
    }, parent, false, 'entry-stats-button');
    this.addButton('历史', rightX, rowTwoY, buttonWidth, 34, true, () => {
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
    drawPanel(panel, panelWidth, panelHeight, new Color(42, 44, 58, 245));
    this.addLabel('新手教程', 0, panelHeight / 2 - 34, 22, panel, 240, 34, 'tutorial-heading');
    this.addLabel(`${currentIndex + 1}/${steps.length}`, panelWidth / 2 - 58, panelHeight / 2 - 34, 13, panel, 54, 24, 'tutorial-progress');
    this.addLabel(current.title, 0, panelHeight / 2 - 80, 24, panel, panelWidth - 96, 42, 'tutorial-title');
    wrapText(current.body, Math.max(18, Math.floor((panelWidth - 132) / 16))).slice(0, 3).forEach((line, index) => {
      this.addLabel(line, 0, 42 - index * 25, 16, panel, panelWidth - 128, 24, `tutorial-body-${index}`);
    });
    if (current.highlight) this.addLabel(`重点：${highlightLabel(current)}`, 0, -42, 14, panel, panelWidth - 160, 28, 'tutorial-highlight');

    this.addButton('上一步', -96, -panelHeight / 2 + 34, 78, 36, this.tutorialIndex > 0, () => {
      this.tutorialIndex = Math.max(0, this.tutorialIndex - 1);
      this.render();
    }, panel, false, 'tutorial-prev-button');
    this.addButton(this.tutorialIndex >= steps.length - 1 ? '完成' : '下一步', 0, -panelHeight / 2 + 34, 78, 36, true, () => {
      if (this.tutorialIndex >= steps.length - 1) {
        this.screen = 'home';
      } else {
        this.tutorialIndex = nextStep(steps, this.tutorialIndex);
      }
      this.render();
    }, panel, false, 'tutorial-next-button');
    this.addButton('跳过', 96, -panelHeight / 2 + 34, 78, 36, true, () => {
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
    drawPanel(panel, panelWidth, panelHeight, new Color(36, 42, 58, 245));
    this.addLabel('帮助', 0, panelHeight / 2 - 34, 22, panel, 220, 34, 'help-heading');
    this.addLabel(`${start + 1}-${Math.min(rows.length, start + visibleRows)}/${rows.length}`, panelWidth / 2 - 64, panelHeight / 2 - 34, 12, panel, 72, 22, 'help-progress', new Color(255, 255, 255, 210));

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
        row.kind === 'title' ? new Color(255, 236, 197, 255) : new Color(255, 255, 255, 238),
      );
    });

    this.addButton('上滚', -98, -panelHeight / 2 + 34, 78, 36, start > 0, () => {
      this.helpScrollIndex = Math.max(0, start - 5);
      this.render();
    }, panel, false, 'help-scroll-up-button');
    this.addButton('下滚', 0, -panelHeight / 2 + 34, 78, 36, start < maxStart, () => {
      this.helpScrollIndex = Math.min(maxStart, start + 5);
      this.render();
    }, panel, false, 'help-scroll-down-button');
    this.addButton('返回', 98, -panelHeight / 2 + 34, 78, 36, true, () => {
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
    drawPanel(panel, panelWidth, panelHeight, new Color(36, 42, 58, 245));
    this.addLabel('战绩', 0, panelHeight / 2 - 34, 22, panel, 220, 34, 'stats-heading');
    if (view.empty) {
      this.addLabel('暂无完成对局', 0, panelHeight / 2 - 72, 13, panel, 150, 24, 'stats-empty', new Color(255, 255, 255, 190));
    }

    view.rows.forEach((row, index) => {
      const y = panelHeight / 2 - 78 - index * 28;
      this.addLabel(row.label, -86, y, 13, panel, 140, 22, `stats-label-${index}`, new Color(255, 255, 255, 216));
      this.addLabel(row.value, 92, y, 14, panel, 150, 22, `stats-value-${index}`, new Color(255, 246, 213, 250));
    });

    this.addButton('历史', -72, -panelHeight / 2 + 34, 96, 36, true, () => {
      this.screen = 'records';
      this.render();
    }, panel, false, 'stats-records-button');
    this.addButton('返回', 72, -panelHeight / 2 + 34, 96, 36, true, () => {
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
    drawPanel(panel, panelWidth, panelHeight, new Color(36, 42, 58, 245));
    this.addLabel('历史', 0, panelHeight / 2 - 34, 22, panel, 220, 34, 'records-heading');

    this.renderFilterGroup(
      panel,
      panelHeight / 2 - 74,
      [
        { label: '全部', value: 'all' },
        { label: '胜', value: 'win' },
        { label: '负', value: 'loss' },
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
        { label: '全部', value: 'all' },
        { label: '地主', value: 'landlord' },
        { label: '农民', value: 'farmer' },
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
        { label: '最新', value: 'newest' },
        { label: '最早', value: 'oldest' },
      ],
      this.recordQuery.order,
      (value) => {
        this.recordQuery = { ...this.recordQuery, order: value };
        this.render();
      },
      'records-order',
    );

    this.addLabel(view.filterLabel, 0, -14, 13, panel, 260, 22, 'records-filter-label', new Color(255, 255, 255, 205));
    if (view.empty) {
      this.addLabel('暂无匹配历史', 0, -50, 16, panel, 180, 30, 'records-empty', new Color(255, 255, 255, 205));
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
          row.outcomeLabel === '胜' ? new Color(228, 255, 219, 245) : new Color(255, 225, 225, 245),
        );
      });
    }

    this.addButton('战绩', -72, -panelHeight / 2 + 34, 96, 36, true, () => {
      this.screen = 'stats';
      this.render();
    }, panel, false, 'records-stats-button');
    this.addButton('返回', 72, -panelHeight / 2 + 34, 96, 36, true, () => {
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
    for (const name of LEGACY_LABEL_NODE_NAMES) {
      const child = this.node.children.find((node) => node.name === name || node.name.startsWith(`${name}-`));
      if (child) child.active = false;
    }
    this.setHomeLabelsVisible(false);
  }

  private renderPlaceholderBackground(canvas: { width: number; height: number }): void {
    if (this.background) this.background.node.active = false;
    const node = this.ensureNode('lobby-placeholder-background', this.node);
    node.setSiblingIndex(0);
    node.setPosition(0, 0, 0);
    addUiTransform(node, canvas.width, canvas.height);
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(32, 48, 64, 255);
    graphics.rect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    graphics.fill();
    graphics.fillColor = new Color(42, 76, 86, 210);
    graphics.rect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height * 0.48);
    graphics.fill();
    graphics.fillColor = new Color(255, 255, 255, 18);
    graphics.roundRect(-canvas.width * 0.42, canvas.height * 0.3, canvas.width * 0.84, 12, 6);
    graphics.fill();
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
    color = new Color(255, 255, 255, 255),
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
    return addUiButton(this.ensureNode.bind(this), {
      text,
      x,
      y,
      width,
      height,
      enabled,
      cb,
      parent,
      name: name ?? `button-${text}-${x}-${y}`,
      selected,
      fontSize: 16,
      lineHeight: 20,
      owner: this,
    });
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
