import Phaser from 'phaser';

export interface DropZoneConfig {
  id: string;
  pieceType: string;
  phase: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export class StoneDropZone extends Phaser.GameObjects.Container {
  public readonly config: DropZoneConfig;
  public isOccupied = false;
  public failedAttempts = 0;

  private zoneGraphics: Phaser.GameObjects.Graphics;
  private hintGlow: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: DropZoneConfig, onClick?: (zone: StoneDropZone) => void) {
    super(scene, config.x, config.y);
    this.config = config;

    this.setSize(config.width, config.height);

    // 1. Subtle Architectural Stone Excavation Socket Graphics
    this.zoneGraphics = scene.add.graphics();
    this.renderSocketGraphics();
    this.add(this.zoneGraphics);

    // 2. Hint Beacon Glow Graphics (Shown ONLY after 2 failed attempts)
    this.hintGlow = scene.add.graphics();
    this.hintGlow.fillStyle(0xffd700, 0.4);
    this.hintGlow.fillRoundedRect(-config.width / 2 - 12, -config.height / 2 - 12, config.width + 24, config.height + 24, 14);
    this.hintGlow.lineStyle(3, 0xffd700, 1);
    this.hintGlow.strokeRoundedRect(-config.width / 2 - 12, -config.height / 2 - 12, config.width + 24, config.height + 24, 14);
    this.hintGlow.setVisible(false);
    this.add(this.hintGlow);

    // 3. Touch Hit Area
    this.setInteractive({ useHandCursor: true });
    if (onClick) {
      this.on('pointerdown', () => {
        if (!this.isOccupied) {
          onClick(this);
        }
      });
    }

    // Phase 2 initial visibility
    if (config.phase === 2) {
      this.setVisible(false);
      this.setActive(false);
    }

    scene.add.existing(this);
  }

  private renderSocketGraphics(): void {
    this.zoneGraphics.clear();

    // Subtle dark amber excavation depression
    this.zoneGraphics.fillStyle(0x2d1708, 0.45);
    this.zoneGraphics.fillRoundedRect(-this.config.width / 2, -this.config.height / 2, this.config.width, this.config.height, 10);

    // Soft warm limestone dashed edge highlight
    this.zoneGraphics.lineStyle(2.5, 0xfde68a, 0.7);
    this.zoneGraphics.strokeRoundedRect(-this.config.width / 2, -this.config.height / 2, this.config.width, this.config.height, 10);
  }

  public registerFailedAttempt(): void {
    this.failedAttempts++;
    if (this.failedAttempts >= 2) {
      this.showHintPulse();
    }
  }

  public showHintPulse(): void {
    this.hintGlow.setVisible(true);
    this.scene.tweens.add({
      targets: this.hintGlow,
      alpha: { from: 0.2, to: 0.9 },
      duration: 500,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.hintGlow.setVisible(false);
      },
    });
  }

  public markOccupied(): void {
    this.isOccupied = true;
    this.disableInteractive();
    this.scene.tweens.add({
      targets: this.zoneGraphics,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.zoneGraphics.setVisible(false);
      },
    });
  }

  public enablePhase2(): void {
    if (this.config.phase === 2) {
      this.setVisible(true);
      this.setActive(true);
      this.setInteractive({ useHandCursor: true });
      this.setAlpha(0);
      this.scene.tweens.add({
        targets: this,
        alpha: 1.0,
        duration: 400,
      });
    }
  }
}
