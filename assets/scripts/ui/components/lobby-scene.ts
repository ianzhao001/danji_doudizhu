import { _decorator, Button, Color, Component, Graphics, Label, Node, Sprite, SpriteFrame, UITransform, resources } from 'cc';
import { AiLevel } from '../../ai';
import { emptyRecords, emptyStats, loadSettings, saveSettings, type Settings } from '../../data';
import { cocosStorage } from '../../runtime/cocos-storage';
import { deriveLobbyView, deriveRecordsView, deriveSettingsView, deriveStatsView } from '../index';
import { setDifficulty, toggleSetting, type ToggleKey } from '../settings-view';
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
    this.renderSettingsControls(settings);
  }

  private renderSettingsControls(settings: Settings): void {
    if (!this.controlsRoot) return;
    this.clearNode(this.controlsRoot);

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
