import Phaser from 'phaser';

export interface PatternZoneConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export class PatternDropZone extends Phaser.GameObjects.Container {
  public readonly config: PatternZoneConfig;
  public isOccupied = false;
  public attemptsCount = 0;

  private shadowGraphics: Phaser.GameObjects.Graphics;
  private hintGlowGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: PatternZoneConfig, onZoneClicked?: (zone: PatternDropZone) => void) {
    super(scene, config.x, config.y);
    this.config = config;

    this.setSize(config.width, config.height);

    // 1. Hint Pulsing Glow (Shown ONLY on 2+ failed attempts)
    this.hintGlowGraphics = scene.add.graphics();
    this.hintGlowGraphics.fillStyle(0xffd700, 0.4);
    this.hintGlowGraphics.fillRoundedRect(-config.width / 2 - 8, -config.height / 2 - 8, config.width + 16, config.height + 16, 14);
    this.hintGlowGraphics.setVisible(false);
    this.add(this.hintGlowGraphics);

    // 2. Silhouette Target Frame
    this.shadowGraphics = scene.add.graphics();
    this.shadowGraphics.fillStyle(0x0a1128, 0.85);
    this.shadowGraphics.fillRoundedRect(-config.width / 2, -config.height / 2, config.width, config.height, 10);
    this.shadowGraphics.lineStyle(2, 0x00f2fe, 0.5);
    this.shadowGraphics.strokeRoundedRect(-config.width / 2, -config.height / 2, config.width, config.height, 10);

    this.add(this.shadowGraphics);

    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => {
      if (!this.isOccupied && onZoneClicked) {
        onZoneClicked(this);
      }
    });

    scene.add.existing(this);
  }

  public registerFailedAttempt(): void {
    this.attemptsCount++;
    if (this.attemptsCount >= 2 && !this.isOccupied) {
      this.showHintPulse();
    }
  }

  public showHintPulse(): void {
    this.hintGlowGraphics.setVisible(true);
    this.scene.tweens.add({
      targets: this.hintGlowGraphics,
      alpha: { from: 0.2, to: 0.9 },
      duration: 500,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.hintGlowGraphics.setVisible(false);
      },
    });
  }

  public markOccupied(): void {
    this.isOccupied = true;
    this.hintGlowGraphics.setVisible(false);
    this.disableInteractive();

    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffd700, 0.8);
    flash.fillRoundedRect(this.x - this.config.width / 2, this.y - this.config.height / 2, this.config.width, this.config.height, 10);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });
  }
}
