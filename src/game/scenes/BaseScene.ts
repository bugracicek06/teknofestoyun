import Phaser from 'phaser';

export abstract class BaseScene extends Phaser.Scene {
  protected readonly GAME_WIDTH = 1920;
  protected readonly GAME_HEIGHT = 1080;
  protected readonly SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  constructor(key: string) {
    super({ key });
  }

  /**
   * Render corporate cinematic background (Navy #0A1128, Turquoise #00F2FE, Gold #FFD700)
   */
  protected createCinematicBackground(): void {
    const graphics = this.add.graphics();

    // Dark navy base fill
    graphics.fillStyle(0x070b19, 1);
    graphics.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Deep Navy Radial Accent
    const radialBg = this.add.graphics();
    radialBg.fillStyle(0x0a1128, 0.8);
    radialBg.fillCircle(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2, 700);

    // Top-right Turquoise Glow
    const turquoiseGlow = this.add.graphics();
    turquoiseGlow.fillStyle(0x00f2fe, 0.08);
    turquoiseGlow.fillCircle(this.GAME_WIDTH - 200, 150, 450);

    // Bottom-left Gold Glow
    const goldGlow = this.add.graphics();
    goldGlow.fillStyle(0xffd700, 0.05);
    goldGlow.fillCircle(200, this.GAME_HEIGHT - 150, 400);

    // Grid pattern for futuristic tech aesthetic
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x00f2fe, 0.04);
    const gridSize = 80;
    for (let x = 0; x < this.GAME_WIDTH; x += gridSize) {
      gridGraphics.lineBetween(x, 0, x, this.GAME_HEIGHT);
    }
    for (let y = 0; y < this.GAME_HEIGHT; y += gridSize) {
      gridGraphics.lineBetween(0, y, this.GAME_WIDTH, y);
    }
  }

  /**
   * Helper to add Turkish UTF-8 text with robust system font rendering
   */
  protected createText(
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle = {}
  ): Phaser.GameObjects.Text {
    const defaultStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '28px',
      color: '#F8FAFC',
      align: 'center',
      resolution: 2, // High DPI / Crisp text for kiosk screens
    };

    return this.add.text(x, y, text, { ...defaultStyle, ...style });
  }

  /**
   * Helper to build touch-friendly interactive buttons with visual feedback
   */
  protected createTouchButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    callback: () => void,
    primaryColor: number = 0x00f2fe,
    textColor: string = '#070B19'
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Outer Glow Frame
    const outerGlow = this.add.graphics();
    outerGlow.fillStyle(primaryColor, 0.2);
    outerGlow.fillRoundedRect(-width / 2 - 6, -height / 2 - 6, width + 12, height + 12, 18);

    // Main Button Fill
    const btnBg = this.add.graphics();
    btnBg.fillStyle(primaryColor, 1);
    btnBg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);

    // Border line
    btnBg.lineStyle(2, 0xffffff, 0.6);
    btnBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);

    // Text Label
    const btnText = this.add.text(0, 0, label, {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '26px',
      fontStyle: 'bold',
      color: textColor,
      align: 'center',
      resolution: 2,
    });
    btnText.setOrigin(0.5);

    container.add([outerGlow, btnBg, btnText]);

    // Hit area for touch & mouse
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, true);

    // Interactive Touch & Pointer Events
    container.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Power2',
      });
    });

    container.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 150,
        ease: 'Power2',
      });
    });

    container.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          callback();
        },
      });
    });

    return container;
  }
}
