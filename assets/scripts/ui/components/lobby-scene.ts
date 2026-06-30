import { _decorator, Button, Color, Component, Graphics, Label, Node, Sprite, SpriteFrame, UITransform, resources } from 'cc';
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
import { RESOURCE_PATHS } from '../asset-keys';

const { ccclass, property } = _decorator;
const SETTINGS_KEY = 'doudizhu.settings';
const STATS_KEY = 'doudizhu.stats';
const RECORDS_KEY = 'doudizhu.records';

const TOGGLE_LABELS: Record<ToggleKey, string> = {
  sound: '音效',
  vibration: '震动',
  animation: '动效',
};

interface HelpRow {
  text: string;
  kind: 'title' | 'body' | 'spacer';
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
    this.loadSprite(RESOURCE_PATHS.lobbyBg, this.background);
    this.controlsRoot = this.ensureNode('settings-controls-runtime', this.node);
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

    this.setText(this.continueLabel, lobby.continueLabel);
    this.setText(this.roundsLabel, `局数 ${statsView.rounds}`);
    this.setText(this.winRateLabel, `胜率 ${statsView.winRatePct}%`);
    this.setText(this.netScoreLabel, `净分 ${statsView.netScoreLabel}`);
    this.setText(this.difficultyLabel, `难度 ${difficulty?.label ?? '普通'}`);
    this.setText(this.latestRecordLabel, recordRows[0]?.scoreLabel ?? '暂无战绩');
    this.renderRuntimeControls(settings);
  }

  private renderRuntimeControls(settings: Settings): void {
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
    this.renderSettingsControls(settings);
    this.renderLobbyEntries();
  }

  private renderSettingsControls(settings: Settings): void {
    if (!this.controlsRoot) return;
    const settingsView = deriveSettingsView(settings);
    this.renderDifficultyPanel(settingsView.difficulty);

    settingsView.toggles.forEach((toggle, index) => {
      this.addButton(
        `${TOGGLE_LABELS[toggle.key]} ${toggle.on ? '开' : '关'}`,
        -112 + index * 112,
        -244,
        96,
        36,
        true,
        () => this.persist(toggleSetting(loadSettings(cocosStorage(), SETTINGS_KEY), toggle.key)),
        this.controlsRoot!,
      );
    });
  }

  private renderDifficultyPanel(current: AiLevel): void {
    if (!this.controlsRoot) return;
    const panelWidth = 336;
    const panelHeight = 210;
    const panel = this.ensureNode('difficulty-picker-panel', this.controlsRoot);
    panel.setPosition(0, -296, 0);
    this.addUiTransform(panel, panelWidth, panelHeight);
    this.drawPanel(panel, panelWidth, panelHeight, new Color(36, 42, 58, 214));

    const picker = deriveDifficultyPicker(current);
    picker.options.forEach((option, index) => {
      const y = 6 - index * 38;
      this.addButton(
        '',
        0,
        y,
        panelWidth - 18,
        32,
        true,
        () => this.persist(setDifficulty(loadSettings(cocosStorage(), SETTINGS_KEY), option.level)),
        panel,
        option.selected,
      );
      const title = this.addLabel(
        option.label,
        -124,
        y,
        15,
        panel,
        54,
        24,
        `difficulty-label-${option.level}`,
        option.selected ? new Color(255, 236, 197, 255) : new Color(255, 255, 255, 238),
      );
      title.lineHeight = 18;
      const lines = wrapText(option.description, 13).slice(0, 2);
      const single = lines.length === 1;
      lines.forEach((line, lineIndex) => {
        this.addLabel(
          line,
          -6,
          y + (single ? 0 : 6 - lineIndex * 14),
          12,
          panel,
          194,
          16,
          `difficulty-desc-${option.level}-${lineIndex}`,
          new Color(255, 255, 255, 215),
        );
      });
      if (option.selected) {
        this.addLabel(
          '当前',
          130,
          y,
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

  private renderLobbyEntries(): void {
    if (!this.controlsRoot) return;
    this.addButton('教程', -126, -218, 72, 34, true, () => {
      this.screen = 'tutorial';
      this.tutorialIndex = 0;
      this.render();
    }, this.controlsRoot);
    this.addButton('帮助', -42, -218, 72, 34, true, () => {
      this.screen = 'help';
      this.helpScrollIndex = 0;
      this.render();
    }, this.controlsRoot);
    this.addButton('战绩', 42, -218, 72, 34, true, () => {
      this.screen = 'stats';
      this.render();
    }, this.controlsRoot);
    this.addButton('历史', 126, -218, 72, 34, true, () => {
      this.screen = 'records';
      this.render();
    }, this.controlsRoot);
  }

  private renderTutorialScreen(): void {
    if (!this.controlsRoot) return;
    const steps = tutorialSteps();
    const currentIndex = Math.max(0, Math.min(this.tutorialIndex, steps.length - 1));
    const current = steps[currentIndex];
    if (!current) {
      this.screen = 'home';
      this.render();
      return;
    }

    const panel = this.ensureNode('tutorial-panel', this.controlsRoot);
    panel.setPosition(0, -120, 0);
    this.addUiTransform(panel, 318, 360);
    this.drawPanel(panel, 318, 360, new Color(42, 44, 58, 222));
    this.addLabel('新手教程', 0, 138, 22, panel, 240, 34, 'tutorial-heading');
    this.addLabel(`${currentIndex + 1}/${steps.length}`, 118, 138, 13, panel, 54, 24, 'tutorial-progress');
    this.addLabel(current.title, 0, 92, 24, panel, 250, 42, 'tutorial-title');
    wrapText(current.body, 16).forEach((line, index) => {
      this.addLabel(line, 0, 38 - index * 24, 16, panel, 252, 24, `tutorial-body-${index}`);
    });
    if (current.highlight) this.addLabel(`重点：${highlightLabel(current)}`, 0, -42, 14, panel, 220, 28, 'tutorial-highlight');

    this.addButton('上一步', -96, -132, 78, 36, this.tutorialIndex > 0, () => {
      this.tutorialIndex = Math.max(0, this.tutorialIndex - 1);
      this.render();
    }, panel);
    this.addButton(this.tutorialIndex >= steps.length - 1 ? '完成' : '下一步', 0, -132, 78, 36, true, () => {
      if (this.tutorialIndex >= steps.length - 1) {
        this.screen = 'home';
      } else {
        this.tutorialIndex = nextStep(steps, this.tutorialIndex);
      }
      this.render();
    }, panel);
    this.addButton('跳过', 96, -132, 78, 36, true, () => {
      this.screen = 'home';
      this.render();
    }, panel);
  }

  private renderHelpScreen(): void {
    if (!this.controlsRoot) return;
    const rows = this.helpRows();
    const visibleRows = 12;
    const maxStart = Math.max(0, rows.length - visibleRows);
    const start = Math.max(0, Math.min(this.helpScrollIndex, maxStart));
    const visible = rows.slice(start, start + visibleRows);

    const panel = this.ensureNode('help-panel', this.controlsRoot);
    panel.setPosition(0, -96, 0);
    this.addUiTransform(panel, 330, 500);
    this.drawPanel(panel, 330, 500, new Color(36, 42, 58, 228));
    this.addLabel('帮助', 0, 210, 22, panel, 220, 34, 'help-heading');
    this.addLabel(`${start + 1}-${Math.min(rows.length, start + visibleRows)}/${rows.length}`, 112, 210, 12, panel, 72, 22, 'help-progress', new Color(255, 255, 255, 210));

    visible.forEach((row, index) => {
      const y = 166 - index * 24;
      if (row.kind === 'spacer') return;
      this.addLabel(
        row.text,
        0,
        y,
        row.kind === 'title' ? 17 : 13,
        panel,
        282,
        24,
        `help-row-${index}`,
        row.kind === 'title' ? new Color(255, 236, 197, 255) : new Color(255, 255, 255, 238),
      );
    });

    this.addButton('上滚', -98, -214, 78, 36, start > 0, () => {
      this.helpScrollIndex = Math.max(0, start - 5);
      this.render();
    }, panel);
    this.addButton('下滚', 0, -214, 78, 36, start < maxStart, () => {
      this.helpScrollIndex = Math.min(maxStart, start + 5);
      this.render();
    }, panel);
    this.addButton('返回', 98, -214, 78, 36, true, () => {
      this.screen = 'home';
      this.render();
    }, panel);
  }

  private renderStatsScreen(): void {
    if (!this.controlsRoot) return;
    const view = deriveStatsDetailView(digestRecords(this.loadRecords()));
    const panel = this.ensureNode('stats-panel', this.controlsRoot);
    panel.setPosition(0, -96, 0);
    this.addUiTransform(panel, 330, 500);
    this.drawPanel(panel, 330, 500, new Color(36, 42, 58, 232));
    this.addLabel('战绩', 0, 210, 22, panel, 220, 34, 'stats-heading');
    if (view.empty) {
      this.addLabel('暂无完成对局', 0, 174, 13, panel, 150, 24, 'stats-empty', new Color(255, 255, 255, 190));
    }

    view.rows.forEach((row, index) => {
      const y = 160 - index * 26;
      this.addLabel(row.label, -78, y, 13, panel, 126, 22, `stats-label-${index}`, new Color(255, 255, 255, 216));
      this.addLabel(row.value, 82, y, 14, panel, 130, 22, `stats-value-${index}`, new Color(255, 246, 213, 250));
    });

    this.addButton('历史', -72, -214, 96, 36, true, () => {
      this.screen = 'records';
      this.render();
    }, panel);
    this.addButton('返回', 72, -214, 96, 36, true, () => {
      this.screen = 'home';
      this.render();
    }, panel);
  }

  private renderRecordsScreen(): void {
    if (!this.controlsRoot) return;
    const records = this.loadRecords();
    const query = { ...this.recordQuery, limit: 5 };
    const view = deriveRecordsDetailView(records, query);
    const panel = this.ensureNode('records-panel', this.controlsRoot);
    panel.setPosition(0, -96, 0);
    this.addUiTransform(panel, 330, 500);
    this.drawPanel(panel, 330, 500, new Color(36, 42, 58, 232));
    this.addLabel('历史', 0, 210, 22, panel, 220, 34, 'records-heading');

    this.renderFilterGroup(
      panel,
      156,
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
    );
    this.renderFilterGroup(
      panel,
      118,
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
    );
    this.renderFilterGroup(
      panel,
      80,
      [
        { label: '最新', value: 'newest' },
        { label: '最早', value: 'oldest' },
      ],
      this.recordQuery.order,
      (value) => {
        this.recordQuery = { ...this.recordQuery, order: value };
        this.render();
      },
    );

    this.addLabel(view.filterLabel, 0, 48, 13, panel, 240, 22, 'records-filter-label', new Color(255, 255, 255, 205));
    if (view.empty) {
      this.addLabel('暂无匹配历史', 0, 4, 16, panel, 180, 30, 'records-empty', new Color(255, 255, 255, 205));
    } else {
      view.rows.forEach((row, index) => {
        const y = 12 - index * 30;
        const tags = row.tags.length > 0 ? ` ${row.tags.join(' ')}` : '';
        this.addLabel(
          `${row.outcomeLabel} ${row.roleLabel} ${row.scoreLabel} ${row.multiplierLabel}${tags}`,
          0,
          y,
          13,
          panel,
          280,
          22,
          `records-row-${index}`,
          row.outcomeLabel === '胜' ? new Color(228, 255, 219, 245) : new Color(255, 225, 225, 245),
        );
      });
    }

    this.addButton('战绩', -72, -214, 96, 36, true, () => {
      this.screen = 'stats';
      this.render();
    }, panel);
    this.addButton('返回', 72, -214, 96, 36, true, () => {
      this.screen = 'home';
      this.render();
    }, panel);
  }

  private renderFilterGroup<T extends string>(
    panel: Node,
    y: number,
    options: { label: string; value: T }[],
    current: T,
    select: (value: T) => void,
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
    const node = this.ensureNode(name, parent);
    node.setPosition(x, y, 0);
    this.addUiTransform(node, width, height);
    const label = node.getComponent(Label) ?? node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.color = color;
    return label;
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
  ): Label {
    const node = this.ensureNode(`button-${text}-${x}-${y}`, parent);
    node.setPosition(x, y, 0);
    this.addUiTransform(node, width, height);
    const button = node.addComponent(Button);
    button.target = this.drawButtonBackground(node, width, height, enabled, selected);
    button.transition = Button.Transition.COLOR;
    button.interactable = enabled;
    button.normalColor = selected ? new Color(255, 224, 232, 150) : new Color(255, 255, 255, 70);
    button.pressedColor = new Color(255, 214, 226, 170);
    button.hoverColor = new Color(255, 255, 255, 100);
    button.disabledColor = new Color(255, 255, 255, 24);
    node.on(Button.EventType.CLICK, cb, this);

    const labelNode = this.ensureNode('button-label', node);
    this.addUiTransform(labelNode, width, height);
    const label = labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = 16;
    label.lineHeight = 20;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.color = enabled ? new Color(255, 255, 255, 255) : new Color(255, 255, 255, 120);
    return label;
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

  private drawButtonBackground(parent: Node, width: number, height: number, enabled: boolean, selected: boolean): Node {
    const node = this.ensureNode('button-bg', parent);
    this.addUiTransform(node, width, height);
    const graphics = node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = selected
      ? new Color(255, 224, 232, 150)
      : enabled
        ? new Color(255, 255, 255, 70)
        : new Color(255, 255, 255, 30);
    graphics.roundRect(-width / 2, -height / 2, width, height, 8);
    graphics.fill();
    return node;
  }

  private drawPanel(parent: Node, width: number, height: number, fill: Color): void {
    const graphics = parent.getComponent(Graphics) ?? parent.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = fill;
    graphics.roundRect(-width / 2, -height / 2, width, height, 8);
    graphics.fill();
  }

  private addUiTransform(node: Node, width: number, height: number): UITransform {
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return transform;
  }

  private loadSprite(path: string, sprite: Sprite | null): void {
    if (!sprite) return;
    resources.load(path, SpriteFrame, (error, frame) => {
      if (!error && frame) sprite.spriteFrame = frame;
    });
  }
}
