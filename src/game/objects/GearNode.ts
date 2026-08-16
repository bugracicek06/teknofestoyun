import Phaser from 'phaser';

export interface GearConfig {
  id: string;
  sizeType: 'small' | 'medium' | 'large' | 'giant';
  radius: number; // 45, 80, 100, 120
  svgKey: string;
  targetAxleId: string;
  origX: number;
  origY: number;
}

export class GearNode extends Phaser.GameObjects.Container {
  public readonly config: GearConfig;
  public isPlaced = false;
  public currentAxleId?: string;
  public rotationDirection = 1; // 1 for clockwise, -1 for counter-clockwise
  private hintGlow: Phaser.GameObjects.Graphics;
  public failedAttemptsCount = 0;

  constructor(
    scene: Phaser.Scene,
    config: GearConfig,
    onGearPlaced: (gear: GearNode, axleId: string) => void
  ) {
    super(scene, config.origX, config.origY);
    this.config = config;

    const diameter = config.radius * 2;
    this.setSize(diameter, diameter);

    // 1. Temporary Hint Glow Graphics (Shown ONLY after 2 failed attempts)
    this.hintGlow = scene.add.graphics();
    this.hintGlow.fillStyle(0xffd700, 0.4);
    this.hintGlow.fillCircle(0, 0, config.radius + 8);
    this.hintGlow.lineStyle(3, 0xffd700, 1);
    this.hintGlow.strokeCircle(0, 0, config.radius + 8);
    this.hintGlow.setVisible(false);
    this.add(this.hintGlow);

    // 2. Render Texture / Image
    if (scene.textures.exists(config.svgKey)) {
      const img = scene.add.image(0, 0, config.svgKey);
      img.setDisplaySize(diameter, diameter);
      this.add(img);
    }

    this.setInteractive({ useHandCursor: true });
    scene.input.setDraggable(this);

    this.on('dragstart', () => {
      if (this.isPlaced) return;
      this.setDepth(100);
    });

    this.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.isPlaced) return;
      this.x = dragX;
      this.y = dragY;
    });

    this.on('dragend', () => {
      if (this.isPlaced) return;
      onGearPlaced(this, this.config.targetAxleId);
    });

    scene.add.existing(this);
  }

  public registerFailedAttempt(): void {
    this.failedAttemptsCount++;
    if (this.failedAttemptsCount >= 2) {
      this.showHintGlow();
    }
  }

  public showHintGlow(): void {
    this.hintGlow.setVisible(true);
    this.scene.tweens.add({
      targets: this.hintGlow,
      alpha: { from: 0.2, to: 0.9 },
      duration: 500,
      yoyo: true,
      repeat: 3,
      onComplete: () => this.hintGlow.setVisible(false),
    });
  }

  public returnToTray(): void {
    this.scene.tweens.add({
      targets: this,
      x: this.config.origX,
      y: this.config.origY,
      duration: 250,
      ease: 'Quad.easeOut',
      onComplete: () => this.setDepth(10),
    });
  }

  public rotateGear(baseSpeed: number, deltaMs: number): void {
    // Angular velocity is INVERSELY proportional to gear radius!
    // Small gear rotates faster, large gear rotates slower.
    const speed = (baseSpeed * (80 / this.config.radius)) * this.rotationDirection;
    this.angle += (speed * deltaMs) / 1000;
  }
}
