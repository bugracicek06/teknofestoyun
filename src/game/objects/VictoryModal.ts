import Phaser from 'phaser';
import { GameButton } from './GameButton';
import { SoundFx } from '../utils/audio';

export interface VictoryStats {
  elapsedSeconds: number;
  errorCount: number;
  starCount: number; // 1, 2, or 3
  finalScore: number;
}

export class VictoryModal extends Phaser.GameObjects.Container {
  private SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  constructor(scene: Phaser.Scene, stats: VictoryStats, onReturnToMap: () => void) {
    super(scene, scene.scale.width / 2, scene.scale.height / 2);

    this.setDepth(200);

    // 1. Dark Backdrop Overlay
    const backdrop = scene.add.graphics();
    backdrop.fillStyle(0x070b19, 0.85);
    backdrop.fillRect(-scene.scale.width / 2, -scene.scale.height / 2, scene.scale.width, scene.scale.height);

    // 2. Main Stone Frame
    const width = 720;
    const height = 520;

    const modalBg = scene.add.graphics();
    modalBg.fillStyle(0x0a1128, 0.96);
    modalBg.fillRoundedRect(-width / 2, -height / 2, width, height, 24);
    modalBg.lineStyle(3, 0xffd700, 0.9);
    modalBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 24);

    // Outer Aura Glow
    const outerAura = scene.add.graphics();
    outerAura.fillStyle(0xffd700, 0.15);
    outerAura.fillRoundedRect(-width / 2 - 12, -height / 2 - 12, width + 24, height + 24, 30);

    // 3. Header Banner: "İLK DAMGANI KAZANDIN!"
    const headerText = scene.add.text(0, -height / 2 + 50, '🎉 İLK DAMGANI KAZANDIN!', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '40px',
      fontStyle: '900',
      color: '#FFD700',
      align: 'center',
      shadow: { color: '#00F2FE', blur: 15, fill: true },
      resolution: 2,
    });
    headerText.setOrigin(0.5);

    const subText = scene.add.text(0, -height / 2 + 105, 'Göbeklitepe – Taşların Sırrı Başarıyla Tamamlandı', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '22px',
      fontStyle: '600',
      color: '#00F2FE',
      align: 'center',
      resolution: 2,
    });
    subText.setOrigin(0.5);

    // 4. Star Rating Display (1 to 3 Stars)
    const starContainer = scene.add.container(0, -height / 2 + 175);
    for (let i = 0; i < 3; i++) {
      const starX = (i - 1) * 85;
      const isFilled = i < stats.starCount;

      const starLabel = scene.add.text(starX, 0, isFilled ? '⭐' : '★', {
        fontSize: isFilled ? '56px' : '48px',
        color: isFilled ? '#FFD700' : '#475569',
      });
      starLabel.setOrigin(0.5);

      if (isFilled) {
        scene.tweens.add({
          targets: starLabel,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 600 + i * 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      starContainer.add(starLabel);
    }

    // 5. Passport Stamp Icon
    if (scene.textures.exists('passport_stamp')) {
      const stampImg = scene.add.image(0, 30, 'passport_stamp');
      stampImg.setDisplaySize(90, 90);
      this.add(stampImg);
    }

    // 6. Score & Time Details
    const detailsText = scene.add.text(
      0,
      115,
      `Geçen Süre: ${stats.elapsedSeconds}sn   •   Hata: ${stats.errorCount}   •   Puan: ${stats.finalScore}`,
      {
        fontFamily: this.SYSTEM_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#E2E8F0',
        align: 'center',
        resolution: 2,
      }
    );
    detailsText.setOrigin(0.5);

    // 7. Large Return Button: "HARİTAYA DÖN ➔"
    const returnBtn = new GameButton(
      scene,
      0,
      195,
      380,
      90, // 90px height
      'HARİTAYA DÖN  ➔',
      onReturnToMap,
      0x00f2fe,
      '#070B19'
    );

    this.add([backdrop, outerAura, modalBg, headerText, subText, starContainer, detailsText, returnBtn]);

    // Scale pop-in entrance animation
    this.setScale(0.7);
    this.setAlpha(0);
    scene.tweens.add({
      targets: this,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1.0,
      duration: 350,
      ease: 'Back.easeOut',
      onStart: () => SoundFx.playVictoryFanfare(),
    });

    scene.add.existing(this);
  }

  /**
   * Helper to calculate victory stats based on conditions:
   * < 60s & <= 2 errors: 3 stars
   * < 90s & <= 5 errors: 2 stars
   * Otherwise: 1 star
   */
  public static calculateStats(elapsedSeconds: number, errorCount: number): VictoryStats {
    let starCount = 1;

    if (elapsedSeconds < 60 && errorCount <= 2) {
      starCount = 3;
    } else if (elapsedSeconds < 90 && errorCount <= 5) {
      starCount = 2;
    }

    const baseScore = 1000;
    const finalScore = Math.max(300, baseScore - elapsedSeconds * 5 - errorCount * 40);

    return {
      elapsedSeconds,
      errorCount,
      starCount,
      finalScore,
    };
  }
}
