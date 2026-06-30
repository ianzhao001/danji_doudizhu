import { _decorator, Button, Color, Component, Graphics, Label, Node, Sprite, SpriteFrame, UITransform, resources } from 'cc';
import { AiLevel } from '../../ai';
import { emptyRecords, emptyStats, loadSettings, saveSettings, type Settings } from '../../data';
import { cocosStorage } from '../../runtime/cocos-storage';
import { deriveLobbyView, deriveRecordsView, deriveSettingsView, deriveStatsView } from '../index';
import { setDifficulty, toggleSetting, type ToggleKey } from '../settings-view';
import { nextStep, tutorialSteps, type TutorialStep } from '../tutorial-steps';
import { RESOURCE_PATHS } from '../asset-keys';

const { ccclass, property } = _decorator;
const SETTINGS_KEY = 'doudizhu.settings';

const TOGGLE_LABELS: Record<ToggleKey, string> = {
  sound: '音效',
  vibration: '震动',
  animation: '动效',
};

const DIFFICULTY_LABELS: Record<AiLevel, string> = {
  [AiLevel.Simple]: '简单',
  [AiLevel.Normal]: '普通',
  [AiLevel.Hard]: '困难',
};

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
  private screen: 'home' | 'tutorial' = 'home';
  private tutorialIndex = 0;

  onLoad(): void {
    this.loadSprite(RESOURCE_PATHS.lobbyBg, this.background);
    this.controlsRoot = this.ensureNode('settings-controls-runtime', this.node);
    this.render();
  }

  private render(): void {
    const settings = loadSettings(cocosStorage(), SETTINGS_KEY);
    const stats = emptyStats();
    const records = emptyRecords();
    const lobby = deriveLobbyView({ savedSlot: null, stats });
    const statsView = deriveStatsView(stats);
    const settingsView = deriveSettingsView(settings);
    const recordRows = deriveRecordsView(records, 1);

    this.setText(this.continueLabel, lobby.continueLabel);
    this.setText(this.roundsLabel, `局数 ${statsView.rounds}`);
    this.setText(this.winRateLabel, `胜率 ${statsView.winRatePct}%`);
    this.setText(this.netScoreLabel, `净分 ${statsView.netScoreLabel}`);
    this.setText(this.difficultyLabel, `难度 ${DIFFICULTY_LABELS[settingsView.difficulty]}`);
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
    this.renderSettingsControls(settings);
    this.renderLobbyEntries();
  }

  private renderSettingsControls(settings: Settings): void {
    if (!this.controlsRoot) return;
    const settingsView = deriveSettingsView(settings);
    settingsView.toggles.forEach((toggle, index) => {
      this.addButton(
        `${TOGGLE_LABELS[toggle.key]} ${toggle.on ? '开' : '关'}`,
        -112 + index * 112,
        -304,
        96,
        36,
        true,
        () => this.persist(toggleSetting(loadSettings(cocosStorage(), SETTINGS_KEY), toggle.key)),
        this.controlsRoot!,
      );
    });

    const levels = [AiLevel.Simple, AiLevel.Normal, AiLevel.Hard] as const;
    levels.forEach((level, index) => {
      const selected = settingsView.difficulty === level;
      this.addButton(
        `${selected ? '当前' : ''}${DIFFICULTY_LABELS[level]}`,
        -112 + index * 112,
        -354,
        96,
        36,
        true,
        () => this.persist(setDifficulty(loadSettings(cocosStorage(), SETTINGS_KEY), level)),
        this.controlsRoot!,
        selected,
      );
    });
  }

  private renderLobbyEntries(): void {
    if (!this.controlsRoot) return;
    this.addButton('教程', -116, -248, 92, 34, true, () => {
      this.screen = 'tutorial';
      this.tutorialIndex = 0;
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

  private persist(next: Settings): void {
    try {
      saveSettings(cocosStorage(), SETTINGS_KEY, next);
    } catch (error) {
      console.warn('saveSettings failed', error);
    }
    this.render();
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
    label.color = new Color(255, 255, 255, 255);
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
