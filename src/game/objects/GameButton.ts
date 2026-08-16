import Phaser from 'phaser';

export class GameButton extends Phaser.GameObjects.Container {
  private outerGlow: Phaser.GameObjects.Graphics;
  private btnBg: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text;
  private isPressed = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number, // Guaranteed >= 90px for high-touch targets
    label: string,
    callback: () => void,
    primaryColor: number = 0xffd700,
    textColor: string = '#070B19'
  ) {
    super(scene, x, y);

    const SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

    // 1. Outer Glowing Aura Frame
    this.outerGlow = scene.add.graphics();
    this.outerGlow.fillStyle(primaryColor, 0.3);
    this.outerGlow.fillRoundedRect(-width / 2 - 10, -height / 2 - 10, width + 20, height + 20, 24);

    // 2. Main Button Fill (Pill / Rounded shape)
    this.btnBg = scene.add.graphics();
    this.btnBg.fillStyle(primaryColor, 1);
    this.btnBg.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    this.btnBg.lineStyle(3, 0xffffff, 0.8);
    this.btnBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);

    // Inner Specular Reflection Line
    const reflection = scene.add.graphics();
    reflection.fillStyle(0xffffff, 0.4);
    reflection.fillRoundedRect(-width / 2 + 10, -height / 2 + 6, width - 20, 12, 6);

    // 3. Label Text
    this.labelText = scene.add.text(0, 2, label, {
      fontFamily: SYSTEM_FONT,
      fontSize: '32px',
      fontStyle: '900',
      color: textColor,
      align: 'center',
      resolution: 2,
    });
    this.labelText.setOrigin(0.5);

    this.add([this.outerGlow, this.btnBg, reflection, this.labelText]);

    // Set Interactive Hit Area (enforcing >= 90px touch height)
    const touchHeight = Math.max(height, 90);
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -touchHeight / 2, width, touchHeight);
    this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, true);

    // Pulsing Idle Tween
    scene.tweens.add({
      targets: this.outerGlow,
      alpha: 0.8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.tweens.add({
      targets: this,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut',
    });

    // Touch & Pointer Feedback
    this.on('pointerover', () => {
      scene.tweens.add({
        targets: this,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 120,
        ease: 'Power2',
      });
    });

    this.on('pointerout', () => {
      scene.tweens.add({
        targets: this,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 120,
        ease: 'Power2',
      });
    });

    this.on('pointerdown', () => {
      if (this.isPressed) return;
      this.isPressed = true;

      // Particle explosion on button click
      this.createClickParticles(scene, x, y, primaryColor);

      scene.tweens.add({
        targets: this,
        scaleX: 0.92,
        scaleY: 0.92,
        duration: 90,
        yoyo: true,
        onComplete: () => {
          this.isPressed = false;
          callback();
        },
      });
    });

    scene.add.existing(this);
  }

  private createClickParticles(scene: Phaser.Scene, x: number, y: number, colorHex: number) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const speed = Math.floor(Math.random() * 100) + 80;
      const radius = Math.floor(Math.random() * 5) + 4;
      const particle = scene.add.circle(x, y, radius, colorHex);

      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: 450,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }
}
