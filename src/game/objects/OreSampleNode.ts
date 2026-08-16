import Phaser from 'phaser';
import { SoundFx } from '../utils/audio';

export interface OreSampleConfig {
  id: string;
  title: string;
  svgKey: string;
  isCorrect: boolean;
  explanation: string;
  x: number;
  y: number;
}

export class OreSampleNode extends Phaser.GameObjects.Container {
  public readonly config: OreSampleConfig;
  private hintGlow: Phaser.GameObjects.Graphics;
  private SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  constructor(
    scene: Phaser.Scene,
    config: OreSampleConfig,
    onSelect: (sample: OreSampleNode) => void
  ) {
    super(scene, config.x, config.y);
    this.config = config;

    const width = 180;
    const height = 180;
    this.setSize(width, height);

    // 1. Hint Pulsing Glow (Triggered on 2+ failed attempts)
    this.hintGlow = scene.add.graphics();
    this.hintGlow.fillStyle(0xffd700, 0.4);
    this.hintGlow.fillRoundedRect(-width / 2 - 8, -height / 2 - 8, width + 16, height + 16, 20);
    this.hintGlow.lineStyle(3, 0xffd700, 1);
    this.hintGlow.strokeRoundedRect(-width / 2 - 8, -height / 2 - 8, width + 16, height + 16, 20);
    this.hintGlow.setVisible(false);
    this.add(this.hintGlow);

    // 2. Physical Wooden Pedestal Base on Workbench
    const pedestal = scene.add.graphics();
    pedestal.fillStyle(0x3e2723, 0.95);
    pedestal.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    pedestal.lineStyle(2, 0xffd700, 0.6);
    pedestal.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

    // Top Specular Inset
    const inset = scene.add.graphics();
    inset.fillStyle(0x4e342e, 0.8);
    inset.fillRoundedRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 55, 12);

    // 3. SVG Material Image
    if (scene.textures.exists(config.svgKey)) {
      const img = scene.add.image(0, -18, config.svgKey);
      img.setDisplaySize(110, 110);
      this.add(img);
    }

    // 4. Label Title
    const label = scene.add.text(0, height / 2 - 24, config.title, {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFD700',
      align: 'center',
      resolution: 2,
    });
    label.setOrigin(0.5);

    this.add([pedestal, inset, label]);

    // Touch hit area (>= 90px height guaranteed)
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => {
      scene.tweens.add({
        targets: this,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 120,
        ease: 'Power1',
      });
    });

    this.on('pointerout', () => {
      scene.tweens.add({
        targets: this,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 120,
        ease: 'Power1',
      });
    });

    this.on('pointerdown', () => {
      if (config.isCorrect) {
        SoundFx.playSuccessTone();
      } else {
        SoundFx.playErrorTone();
        this.wiggle();
      }
      onSelect(this);
    });

    scene.add.existing(this);
  }

  public showHintPulse(): void {
    this.hintGlow.setVisible(true);
    this.scene.tweens.add({
      targets: this.hintGlow,
      alpha: { from: 0.2, to: 0.9 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public wiggle(): void {
    this.scene.tweens.add({
      targets: this,
      angle: { from: -6, to: 6 },
      duration: 60,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.angle = 0;
      },
    });
  }
}
