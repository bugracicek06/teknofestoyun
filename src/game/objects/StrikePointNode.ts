import Phaser from 'phaser';
import { SoundFx } from '../utils/audio';

export interface StrikePointConfig {
  id: number; // 1 to 6
  x: number;
  y: number;
}

export class StrikePointNode extends Phaser.GameObjects.Container {
  public readonly pointId: number;
  public isActive = false;
  public isStruck = false;
  private glowRing: Phaser.GameObjects.Graphics;
  private numText: Phaser.GameObjects.Text;
  private SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  constructor(
    scene: Phaser.Scene,
    config: StrikePointConfig,
    onStrike: (node: StrikePointNode) => void
  ) {
    super(scene, config.x, config.y);
    this.pointId = config.id;

    this.setSize(75, 75);

    // Outer Glowing Ring
    this.glowRing = scene.add.graphics();
    this.glowRing.fillStyle(0xffd700, 0.4);
    this.glowRing.fillCircle(0, 0, 36);
    this.glowRing.lineStyle(3, 0xffd700, 1);
    this.glowRing.strokeCircle(0, 0, 36);

    // Central Core Target
    const core = scene.add.graphics();
    core.fillStyle(0xff5722, 0.9);
    core.fillCircle(0, 0, 24);
    core.lineStyle(2, 0xffffff, 1);
    core.strokeCircle(0, 0, 24);

    // Point Number Text
    this.numText = scene.add.text(0, 0, `${config.id}`, {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '20px',
      fontStyle: '900',
      color: '#FFFFFF',
      align: 'center',
    });
    this.numText.setOrigin(0.5);

    this.add([this.glowRing, core, this.numText]);

    // Initial state: inactive
    this.setAlpha(0.25);
    this.setVisible(false);

    // Touch interactivity
    this.setInteractive({ useHandCursor: true });

    this.on('pointerdown', () => {
      if (this.isActive && !this.isStruck) {
        SoundFx.playSuccessTone();
        onStrike(this);
      }
    });

    scene.add.existing(this);
  }

  public activatePoint(): void {
    this.isActive = true;
    this.setVisible(true);
    this.setAlpha(1.0);

    // Pulsing Ring Animation
    this.scene.tweens.add({
      targets: this.glowRing,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0.9,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public markStruck(): void {
    this.isStruck = true;
    this.isActive = false;
    this.disableInteractive();

    // Spark Burst Effect
    this.createSparkBurst();

    // Done state badge
    this.glowRing.clear();
    this.glowRing.fillStyle(0x10b981, 1);
    this.glowRing.fillCircle(0, 0, 26);
    this.numText.setText('✓');

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 120,
      yoyo: true,
    });
  }

  private createSparkBurst(): void {
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const dist = Phaser.Math.Between(50, 120);
      const spark = this.scene.add.circle(this.x, this.y, Phaser.Math.Between(3, 7), 0xffd700);

      this.scene.tweens.add({
        targets: spark,
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 350,
        onComplete: () => spark.destroy(),
      });
    }
  }
}
