import Phaser from 'phaser';

export class PusulaCharacter extends Phaser.GameObjects.Container {
  private mascotSprite?: Phaser.GameObjects.Image;
  private fallbackGraphics?: Phaser.GameObjects.Graphics;
  private bubbleContainer?: Phaser.GameObjects.Container;
  private bubbleText?: Phaser.GameObjects.Text;
  private SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  constructor(scene: Phaser.Scene, x: number, y: number, initialMessage?: string) {
    super(scene, x, y);

    // 1. Render Mascot Body (SVG Texture if available, or procedural graphics)
    if (scene.textures.exists('pusula_mascot')) {
      this.mascotSprite = scene.add.image(0, 0, 'pusula_mascot');
      this.mascotSprite.setDisplaySize(120, 120);
      this.add(this.mascotSprite);
    } else {
      this.renderProceduralPusula(scene);
    }

    // 2. Floating Bobbing Idle Animation
    scene.tweens.add({
      targets: this,
      y: y - 14,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. Speech Bubble setup
    this.setupSpeechBubble(scene);

    if (initialMessage) {
      this.setMessage(initialMessage);
    }

    scene.add.existing(this);
  }

  private renderProceduralPusula(scene: Phaser.Scene) {
    this.fallbackGraphics = scene.add.graphics();

    // Outer Aura Glow
    this.fallbackGraphics.fillStyle(0x00f2fe, 0.4);
    this.fallbackGraphics.fillCircle(0, 0, 50);

    // Orbital Ring
    this.fallbackGraphics.lineStyle(3, 0xffd700, 0.8);
    this.fallbackGraphics.strokeEllipse(0, 0, 60, 22);

    // Core Sphere
    this.fallbackGraphics.fillStyle(0x00f2fe, 1);
    this.fallbackGraphics.fillCircle(0, 0, 36);
    this.fallbackGraphics.lineStyle(2, 0xffffff, 1);
    this.fallbackGraphics.strokeCircle(0, 0, 36);

    // Eyes
    this.fallbackGraphics.fillStyle(0x070b19, 1);
    this.fallbackGraphics.fillCircle(-10, -4, 5);
    this.fallbackGraphics.fillCircle(10, -4, 5);
    this.fallbackGraphics.fillStyle(0xffffff, 1);
    this.fallbackGraphics.fillCircle(-12, -6, 2);
    this.fallbackGraphics.fillCircle(8, -6, 2);

    // Smile
    this.fallbackGraphics.lineStyle(2.5, 0x070b19, 1);
    this.fallbackGraphics.beginPath();
    this.fallbackGraphics.arc(0, 4, 8, 0.1 * Math.PI, 0.9 * Math.PI, false);
    this.fallbackGraphics.strokePath();

    this.add(this.fallbackGraphics);
  }

  private setupSpeechBubble(scene: Phaser.Scene) {
    this.bubbleContainer = scene.add.container(80, -70);

    // Speech Bubble Background Frame
    const bg = scene.add.graphics();
    bg.fillStyle(0x0a1128, 0.92);
    bg.fillRoundedRect(0, 0, 380, 75, 14);
    bg.lineStyle(2, 0x00f2fe, 0.8);
    bg.strokeRoundedRect(0, 0, 380, 75, 14);

    // Pointer Tail
    bg.fillStyle(0x0a1128, 0.92);
    bg.fillTriangle(-12, 40, 0, 30, 0, 50);

    // Text Label
    this.bubbleText = scene.add.text(18, 14, '', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '18px',
      fontStyle: '600',
      color: '#F8FAFC',
      wordWrap: { width: 344 },
      resolution: 2,
    });

    this.bubbleContainer.add([bg, this.bubbleText]);
    this.add(this.bubbleContainer);
  }

  public setMessage(text: string): void {
    if (this.bubbleText) {
      this.bubbleText.setText(text);
    }

    // Pulse animation when speaking new message
    if (this.bubbleContainer) {
      this.scene.tweens.add({
        targets: this.bubbleContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }
  }
}
