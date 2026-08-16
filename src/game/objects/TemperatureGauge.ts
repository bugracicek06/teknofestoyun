import Phaser from 'phaser';

export class TemperatureGauge extends Phaser.GameObjects.Container {
  private tempNeedle: Phaser.GameObjects.Graphics;
  private idealProgressBar: Phaser.GameObjects.Graphics;
  private statusText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;

  public currentTemp = 200; // Degrees C (0 to 1200)
  public idealSecondsAccumulated = 0;
  public readonly targetSeconds = 8;
  public isCompleted = false;

  private SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const width = 360;
    const height = 90;

    // Gauge Frame
    const bg = scene.add.graphics();
    bg.fillStyle(0x0a1128, 0.94);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(2, 0xffd700, 0.8);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

    // Temperature Zone Track Bar
    const trackWidth = 320;
    const trackHeight = 22;
    const trackX = -trackWidth / 2;
    const trackY = -12;

    const track = scene.add.graphics();
    // 1. Low Temp Zone (0 to 400 -> 33% width)
    track.fillStyle(0x1e293b, 1);
    track.fillRect(trackX, trackY, trackWidth * 0.33, trackHeight);

    // 2. Ideal Forging Zone (400 to 850 -> 42% width)
    track.fillStyle(0x00f2fe, 0.9);
    track.fillRect(trackX + trackWidth * 0.33, trackY, trackWidth * 0.42, trackHeight);

    // Gold Border around Ideal Zone
    track.lineStyle(2, 0xffd700, 1);
    track.strokeRect(trackX + trackWidth * 0.33, trackY, trackWidth * 0.42, trackHeight);

    // 3. Overheated Zone (850 to 1200 -> 25% width)
    track.fillStyle(0xef4444, 1);
    track.fillRect(trackX + trackWidth * 0.75, trackY, trackWidth * 0.25, trackHeight);

    // Needle Pointer
    this.tempNeedle = scene.add.graphics();
    this.updateNeedlePosition();

    // Accumulated Ideal Time Progress Bar (Bottom)
    this.idealProgressBar = scene.add.graphics();
    this.updateProgressBar();

    // Status Label
    this.statusText = scene.add.text(0, -32, 'FIRIN SICAKLIĞI DENGESİ', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FFD700',
      align: 'center',
    });
    this.statusText.setOrigin(0.5);

    // Timer Progress Label
    this.timerText = scene.add.text(0, height / 2 - 12, 'İDEAL SICAKLIK: 0 / 8 sn', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#00F2FE',
      align: 'center',
    });
    this.timerText.setOrigin(0.5);

    this.add([bg, track, this.tempNeedle, this.idealProgressBar, this.statusText, this.timerText]);

    scene.add.existing(this);
  }

  public pumpBellows(): void {
    // Add heat boost when bellows is pumped
    this.currentTemp = Math.min(1200, this.currentTemp + 130);
    this.updateNeedlePosition();
  }

  public updateGauge(deltaMs: number, onIdealComplete: () => void): void {
    if (this.isCompleted) return;

    // Natural heat dissipation (temperature drops over time)
    const decay = (deltaMs / 1000) * 110;
    this.currentTemp = Math.max(100, this.currentTemp - decay);
    this.updateNeedlePosition();

    // Check if in Ideal Zone (400 to 850)
    if (this.currentTemp >= 400 && this.currentTemp <= 850) {
      this.idealSecondsAccumulated += deltaMs / 1000;
      this.updateProgressBar();

      if (this.idealSecondsAccumulated >= this.targetSeconds) {
        this.isCompleted = true;
        onIdealComplete();
      }
    }
  }

  public getZoneState(): 'low' | 'ideal' | 'high' {
    if (this.currentTemp < 400) return 'low';
    if (this.currentTemp > 850) return 'high';
    return 'ideal';
  }

  private updateNeedlePosition(): void {
    this.tempNeedle.clear();
    const trackWidth = 320;
    const trackX = -trackWidth / 2;
    const ratio = Math.min(1, Math.max(0, this.currentTemp / 1200));
    const needleX = trackX + ratio * trackWidth;

    // Pointer Needle Line
    this.tempNeedle.fillStyle(0xffffff, 1);
    this.tempNeedle.fillTriangle(needleX, -16, needleX - 6, -26, needleX + 6, -26);
    this.tempNeedle.lineStyle(3, 0x070b19, 1);
    this.tempNeedle.strokeTriangle(needleX, -16, needleX - 6, -26, needleX + 6, -26);
  }

  private updateProgressBar(): void {
    this.idealProgressBar.clear();
    const width = 320;
    const progressRatio = Math.min(1, this.idealSecondsAccumulated / this.targetSeconds);

    this.idealProgressBar.fillStyle(0x10b981, 0.85);
    this.idealProgressBar.fillRoundedRect(-width / 2, 22, width * progressRatio, 6, 3);

    const seconds = Math.floor(this.idealSecondsAccumulated);
    if (this.timerText) {
      this.timerText.setText(`İDEAL SICAKLIK HEDEFİ: ${seconds} / ${this.targetSeconds} sn`);
    }
  }
}
