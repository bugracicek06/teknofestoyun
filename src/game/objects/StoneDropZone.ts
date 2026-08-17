import Phaser from 'phaser';

export interface DropZoneConfig {
  id: string;
  socketKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  motifType: 'fox' | 'boar' | 'crane';
  side: 'left' | 'right';
}

export class StoneDropZone extends Phaser.GameObjects.Container {
  public readonly config: DropZoneConfig;
  public isOccupied = false;
  public failedAttempts = 0;

  private socketImage?: Phaser.GameObjects.Image;
  private hintGlow: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: DropZoneConfig, onClick?: (zone: StoneDropZone) => void) {
    super(scene, config.x, config.y);
    this.config = config;

    this.setSize(config.width, config.height);
    this.setDepth(5);

    // 1. Organic Dark Chiseled Groove & Fine Golden/Beige Outline Silhouette
    if (scene.textures.exists(config.socketKey)) {
      this.socketImage = scene.add.image(0, 0, config.socketKey);
      this.socketImage.setDisplaySize(config.width, config.height);
      this.add(this.socketImage);
    }

    // 2. Hint Beacon Glow Graphics (Shown only on 2 failed attempts)
    this.hintGlow = scene.add.graphics();
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

    scene.add.existing(this);
  }

  public registerFailedAttempt(): void {
    this.failedAttempts++;
    if (this.failedAttempts >= 2) {
      this.showHintPulse();
    }
  }

  public showHintPulse(): void {
    this.hintGlow.clear();
    const w = this.config.width;
    const h = this.config.height;

    // Soft warm golden dust aura beacon
    this.hintGlow.fillStyle(0xd97706, 0.35);
    this.hintGlow.fillEllipse(0, 0, w * 1.25, h * 1.25);
    this.hintGlow.lineStyle(2.5, 0xfde68a, 0.95);
    this.hintGlow.strokeEllipse(0, 0, w * 1.25, h * 1.25);

    this.hintGlow.setVisible(true);
    this.hintGlow.setAlpha(0.2);

    this.scene.tweens.add({
      targets: this.hintGlow,
      alpha: { from: 0.2, to: 0.95 },
      scaleX: { from: 0.95, to: 1.15 },
      scaleY: { from: 0.95, to: 1.15 },
      duration: 400,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.hintGlow.setVisible(false);
        this.hintGlow.setScale(1);
      },
    });
  }

  public markOccupied(): void {
    this.isOccupied = true;
    this.disableInteractive();
    this.hintGlow.setVisible(false);
  }
}
