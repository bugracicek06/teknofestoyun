import Phaser from 'phaser';
import type { GameModuleInfo } from '../../types/game';

export class LandmarkNode extends Phaser.GameObjects.Container {
  private auraRing: Phaser.GameObjects.Graphics;
  public readonly moduleInfo: GameModuleInfo;
  public readonly isUnlocked: boolean;
  public readonly isCompleted: boolean;
  private SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    moduleInfo: GameModuleInfo,
    isUnlocked: boolean,
    isCompleted: boolean,
    onClick: (moduleInfo: GameModuleInfo) => void
  ) {
    super(scene, x, y);
    this.moduleInfo = moduleInfo;
    this.isUnlocked = isUnlocked;
    this.isCompleted = isCompleted;

    // 1. Glowing Aura Ring around Island Platform
    this.auraRing = scene.add.graphics();
    const auraColor = isUnlocked ? moduleInfo.accentColor : 0x475569;
    this.auraRing.fillStyle(auraColor, isUnlocked ? 0.35 : 0.15);
    this.auraRing.fillCircle(0, 0, 105);
    this.auraRing.lineStyle(3, auraColor, isUnlocked ? 0.9 : 0.3);
    this.auraRing.strokeCircle(0, 0, 105);
    this.add(this.auraRing);

    // 2. Island Texture / Image (or SVG key)
    const svgKey = `island_${moduleInfo.id}`;
    if (scene.textures.exists(svgKey)) {
      const islandImg = scene.add.image(0, 0, svgKey);
      islandImg.setDisplaySize(190, 190);
      if (!isUnlocked) {
        islandImg.setTint(0x475569);
      }
      this.add(islandImg);
    } else {
      // Fallback procedural circular island graphics
      const circleBg = scene.add.graphics();
      circleBg.fillStyle(isUnlocked ? moduleInfo.accentColor : 0x1e293b, 0.9);
      circleBg.fillCircle(0, 0, 85);
      circleBg.lineStyle(3, 0xffffff, 0.6);
      circleBg.strokeCircle(0, 0, 85);
      this.add(circleBg);
    }

    // 3. Title Banner Pill below Island
    const bannerBg = scene.add.graphics();
    bannerBg.fillStyle(0x0a1128, 0.92);
    bannerBg.fillRoundedRect(-110, 80, 220, 48, 12);
    bannerBg.lineStyle(2, auraColor, isUnlocked ? 0.9 : 0.3);
    bannerBg.strokeRoundedRect(-110, 80, 220, 48, 12);

    const titleText = scene.add.text(0, 104, moduleInfo.title, {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '20px',
      fontStyle: 'bold',
      color: isUnlocked ? '#F8FAFC' : '#94A3B8',
      align: 'center',
      resolution: 2,
    });
    titleText.setOrigin(0.5);

    this.add([bannerBg, titleText]);

    // 4. Lock Icon or Completion Star Badge
    if (!isUnlocked) {
      const lockBg = scene.add.graphics();
      lockBg.fillStyle(0x070b19, 0.85);
      lockBg.fillCircle(0, -10, 36);
      lockBg.lineStyle(2, 0x64748b, 0.8);
      lockBg.strokeCircle(0, -10, 36);

      const lockIcon = scene.add.text(0, -10, '🔒', {
        fontSize: '32px',
        align: 'center',
      });
      lockIcon.setOrigin(0.5);
      this.add([lockBg, lockIcon]);
    } else if (isCompleted) {
      const starBg = scene.add.graphics();
      starBg.fillStyle(0x10b981, 1);
      starBg.fillCircle(70, -70, 24);
      starBg.lineStyle(2, 0xffffff, 1);
      starBg.strokeCircle(70, -70, 24);

      const checkText = scene.add.text(70, -70, '✓', {
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      });
      checkText.setOrigin(0.5);
      this.add([starBg, checkText]);
    }

    // 5. Interactivity & Touch Feedback
    if (isUnlocked) {
      const hitArea = new Phaser.Geom.Circle(0, 0, 95);
      this.setInteractive(hitArea, Phaser.Geom.Circle.Contains, true);

      // Pulse Tween for Unlocked Node
      scene.tweens.add({
        targets: this.auraRing,
        scaleX: 1.08,
        scaleY: 1.08,
        alpha: 0.9,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.on('pointerover', () => {
        scene.tweens.add({
          targets: this,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 150,
          ease: 'Power2',
        });
      });

      this.on('pointerout', () => {
        scene.tweens.add({
          targets: this,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 150,
          ease: 'Power2',
        });
      });

      this.on('pointerdown', () => {
        scene.tweens.add({
          targets: this,
          scaleX: 0.92,
          scaleY: 0.92,
          duration: 90,
          yoyo: true,
          onComplete: () => onClick(moduleInfo),
        });
      });
    }

    scene.add.existing(this);
  }
}
