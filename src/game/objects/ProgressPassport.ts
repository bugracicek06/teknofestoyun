import Phaser from 'phaser';
import { GAME_MODULES } from '../../data/modules';

export class ProgressPassport extends Phaser.GameObjects.Container {
  private SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  constructor(scene: Phaser.Scene, x: number, y: number, completedCount: number) {
    super(scene, x, y);

    const width = 640;
    const height = 75;

    // Header Background Frame
    const bg = scene.add.graphics();
    bg.fillStyle(0x0a1128, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(2, 0x00f2fe, 0.6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

    // Title Text: "1/6 ZAMAN YOLCULUĞU İLERLEMESİ"
    const progressText = scene.add.text(0, -height / 2 + 16, `ZAMAN YOLCULUĞU İLERLEMESİ: ${completedCount}/6`, {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFD700',
      align: 'center',
      resolution: 2,
    });
    progressText.setOrigin(0.5);

    this.add([bg, progressText]);

    // 6 Passport Stamps Badges
    const stampStartX = -width / 2 + 70;
    const stampY = 12;

    GAME_MODULES.forEach((_mod, index) => {
      const stampX = stampStartX + index * 100;
      const isStamped = index < completedCount;

      const stampBg = scene.add.graphics();
      stampBg.fillStyle(isStamped ? 0x10b981 : 0x1e293b, 0.9);
      stampBg.fillCircle(stampX, stampY, 18);
      stampBg.lineStyle(1.5, isStamped ? 0x6ee7b7 : 0x475569, 1);
      stampBg.strokeCircle(stampX, stampY, 18);

      const stampLabel = scene.add.text(stampX, stampY, isStamped ? '✓' : `${index + 1}`, {
        fontFamily: this.SYSTEM_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        color: isStamped ? '#FFFFFF' : '#94A3B8',
      });
      stampLabel.setOrigin(0.5);

      this.add([stampBg, stampLabel]);
    });

    scene.add.existing(this);
  }
}
