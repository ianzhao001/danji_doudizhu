import { _decorator, Component, Label, Sprite, SpriteFrame, resources } from 'cc';
import { defaultSettings, emptyRecords, emptyStats } from '../../data';
import { deriveLobbyView, deriveRecordsView, deriveSettingsView, deriveStatsView } from '../index';
import { RESOURCE_PATHS } from '../asset-keys';

const { ccclass, property } = _decorator;

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

  onLoad(): void {
    this.loadSprite(RESOURCE_PATHS.lobbyBg, this.background);

    const settings = defaultSettings();
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
    this.setText(this.difficultyLabel, `难度 ${settingsView.difficulty}`);
    this.setText(this.latestRecordLabel, recordRows[0]?.scoreLabel ?? '暂无战绩');
  }

  private setText(label: Label | null, text: string): void {
    if (label) label.string = text;
  }

  private loadSprite(path: string, sprite: Sprite | null): void {
    if (!sprite) return;
    resources.load(path, SpriteFrame, (error, frame) => {
      if (!error && frame) sprite.spriteFrame = frame;
    });
  }
}
