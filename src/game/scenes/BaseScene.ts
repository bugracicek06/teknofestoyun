import Phaser from 'phaser';

export abstract class BaseScene extends Phaser.Scene {
  protected readonly GAME_WIDTH = 1920;
  protected readonly GAME_HEIGHT = 1080;
  protected readonly SYSTEM_FONT = "'Outfit', 'Rajdhani', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

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

  /**
   * Minimalist Transparent Corporate Kiosk Header (1920x70px)
   * Displays PAU (110,38), Teknokent (230,38), TEKNOFEST (1800,38), and Fullscreen HUD (1680,38)
   */
  protected createCorporateKioskHeader(centerTitle?: string): Phaser.GameObjects.Container {
    const headerContainer = this.add.container(0, 0);
    headerContainer.setDepth(150);

    // 1. Subtle, ultra-clean floating glass bar
    const barBg = this.add.graphics();
    barBg.fillStyle(0x0f172a, 0.4);
    barBg.fillRect(0, 0, this.GAME_WIDTH, 70);
    barBg.lineStyle(1, 0xffffff, 0.1);
    barBg.lineBetween(0, 70, this.GAME_WIDTH, 70);
    headerContainer.add(barBg);

    // 2. PAU Circular Logo (X: 110, Y: 35)
    if (this.textures.exists('pau_logo')) {
      const pauLogo = this.add.image(110, 35, 'pau_logo');
      pauLogo.setDisplaySize(52, 52);
      headerContainer.add(pauLogo);
    }

    // 3. Teknokent Logo (X: 230, Y: 35)
    if (this.textures.exists('teknokent_logo')) {
      const teknoLogo = this.add.image(230, 35, 'teknokent_logo');
      teknoLogo.setDisplaySize(90, 42);
      headerContainer.add(teknoLogo);
    }

    // 4. Center Title (Optional, subtle 16px)
    if (centerTitle) {
      const title = this.add.text(this.GAME_WIDTH / 2, 35, centerTitle, {
        fontFamily: this.SYSTEM_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#E2E8F0',
        shadow: { color: 'rgba(0,0,0,0.5)', blur: 4, fill: true },
      });
      title.setOrigin(0.5, 0.5);
      headerContainer.add(title);
    }

    // 5. Fullscreen Toggle HUD Button (X: 1680, Y: 35)
    const fsBtn = this.add.container(1680, 35);
    const fsBg = this.add.graphics();
    fsBg.fillStyle(0x0f172a, 0.6);
    fsBg.fillRoundedRect(-55, -16, 110, 32, 8);
    fsBg.lineStyle(1, 0xffffff, 0.3);
    fsBg.strokeRoundedRect(-55, -16, 110, 32, 8);

    const fsText = this.add.text(0, 0, '⛶ TAM EKRAN', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '11.5px',
      fontStyle: 'bold',
      color: '#E2E8F0',
    });
    fsText.setOrigin(0.5, 0.5);

    fsBtn.add([fsBg, fsText]);
    fsBtn.setSize(110, 32);
    fsBtn.setInteractive({ useHandCursor: true });

    fsBtn.on('pointerover', () => {
      fsBtn.setScale(1.04);
      fsBg.clear();
      fsBg.fillStyle(0x0284c7, 0.8);
      fsBg.fillRoundedRect(-55, -16, 110, 32, 8);
      fsText.setColor('#FFFFFF');
    });

    fsBtn.on('pointerout', () => {
      fsBtn.setScale(1.0);
      fsBg.clear();
      fsBg.fillStyle(0x0f172a, 0.6);
      fsBg.fillRoundedRect(-55, -16, 110, 32, 8);
      fsBg.lineStyle(1, 0xffffff, 0.3);
      fsBg.strokeRoundedRect(-55, -16, 110, 32, 8);
      fsText.setColor('#E2E8F0');
    });

    fsBtn.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    headerContainer.add(fsBtn);

    // 6. TEKNOFEST Official Logo (X: 1810, Y: 35)
    if (this.textures.exists('teknofest_logo')) {
      const tfLogo = this.add.image(1810, 35, 'teknofest_logo');
      tfLogo.setDisplaySize(115, 48);
      headerContainer.add(tfLogo);
    }

    return headerContainer;
  }
}

