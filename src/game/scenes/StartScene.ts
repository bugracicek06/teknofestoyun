import { BaseScene } from './BaseScene';
import { SceneKeys } from '../../types/game';
import { GameButton } from '../objects/GameButton';
import { PusulaCharacter } from '../objects/PusulaCharacter';
import { EventBus } from '../state/EventBus';

// Safe TypeScript Asset Imports for Vite production bundler
import pusulaMascotUrl from '../../assets/svg/pusula_mascot.svg';
import islandGobeklitepeUrl from '../../assets/svg/island_gobeklitepe.svg';
import islandDemirCagiUrl from '../../assets/svg/island_demir_cagi.svg';
import islandAnadoluUrl from '../../assets/svg/island_anadolu.svg';
import islandSerinhisarUrl from '../../assets/svg/island_serinhisar.svg';
import islandMilliTeknoUrl from '../../assets/svg/island_milli_tekno.svg';
import islandUzayUrl from '../../assets/svg/island_uzay.svg';
import passportStampUrl from '../../assets/svg/passport_stamp.svg';

// Preload Göbeklitepe assets early to guarantee instant chapter 1 opening
import gobeklitepeBgUrl from '../../assets/gobeklitepe_bg.png';
import pieceTpillarUrl from '../../assets/svg/piece_tpillar.svg';
import pieceEnclosureUrl from '../../assets/svg/piece_enclosure.svg';
import reliefFoxUrl from '../../assets/svg/relief_fox.svg';
import reliefBoarUrl from '../../assets/svg/relief_boar.svg';
import reliefBirdUrl from '../../assets/svg/relief_bird.svg';

export class StartScene extends BaseScene {
  constructor() {
    super(SceneKeys.START);
  }

  preload(): void {
    // 1. World Map & Navigation SVG assets
    if (!this.textures.exists('pusula_mascot')) {
      this.load.image('pusula_mascot', pusulaMascotUrl);
      this.load.image('island_gobeklitepe', islandGobeklitepeUrl);
      this.load.image('island_demir_cagi', islandDemirCagiUrl);
      this.load.image('island_anadolu', islandAnadoluUrl);
      this.load.image('island_serinhisar', islandSerinhisarUrl);
      this.load.image('island_milli_tekno', islandMilliTeknoUrl);
      this.load.image('island_uzay', islandUzayUrl);
      this.load.image('passport_stamp', passportStampUrl);
    }

    // 2. Preload Göbeklitepe assets so Chapter 1 opens instantaneously
    if (!this.textures.exists('gobeklitepe_bg')) {
      this.load.image('gobeklitepe_bg', gobeklitepeBgUrl);
    }
    if (!this.textures.exists('piece_tpillar')) {
      this.load.image('piece_tpillar', pieceTpillarUrl);
      this.load.image('piece_enclosure', pieceEnclosureUrl);
      this.load.image('relief_fox', reliefFoxUrl);
      this.load.image('relief_boar', reliefBoarUrl);
      this.load.image('relief_bird', reliefBirdUrl);
    }
  }

  create(): void {
    // 1. Fullscreen Panoramic Time-Travel Environment (Left Ancient -> Middle Metal -> Right Space)
    this.createCinematicTimeTravelLandscape();

    // 2. Title & Subtitle Header
    const titleText = this.createText(this.GAME_WIDTH / 2, 230, 'MEDENİYETTEN MİLLÎ TEKNOLOJİYE', {
      fontSize: '62px',
      fontStyle: '900',
      color: '#FFD700',
      align: 'center',
      shadow: {
        color: '#00F2FE',
        blur: 20,
        fill: true,
      },
    });
    titleText.setOrigin(0.5);

    // Floating tween for main title
    this.tweens.add({
      targets: titleText,
      y: 222,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const subtitleText = this.createText(this.GAME_WIDTH / 2, 320, 'ZAMAN YOLCULUĞU MACERASI', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#00F2FE',
      align: 'center',
    });
    subtitleText.setOrigin(0.5);

    // 3. Pusula Mascot Companion Character
    new PusulaCharacter(
      this,
      280,
      640,
      'Geçmişin ustalığını keşfetmeye hazır mısın?\nZaman yolculuğumuz başlıyor!'
    );

    // 4. Center Main Action Button: "MACERAYA BAŞLA ➔"
    new GameButton(
      this,
      this.GAME_WIDTH / 2,
      660,
      440,
      96, // 96px touch target height
      'MACERAYA BAŞLA  ➔',
      () => this.onStartAdventureClicked(),
      0xffd700, // Gold button fill
      '#070B19'
    );

    // 5. Subtle Floating Stars & Spark Particles Background
    this.createBackgroundParticles();

    EventBus.emit('current-scene-ready', SceneKeys.START);
  }

  /**
   * Panoramic gradient landscape: Left Earthy Ancient -> Middle Fiery Metal -> Right Deep Space
   */
  private createCinematicTimeTravelLandscape(): void {
    const bg = this.add.graphics();

    // Base background dark gradient fill
    bg.fillStyle(0x070b19, 1);
    bg.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Left Sector: Ancient Göbeklitepe Earthy Glow (M.Ö. 9600)
    const leftGlow = this.add.graphics();
    leftGlow.fillStyle(0xd4af37, 0.12);
    leftGlow.fillCircle(300, 540, 550);

    // Center Sector: Metal & Forge Fiery Glow
    const centerGlow = this.add.graphics();
    centerGlow.fillStyle(0xff5722, 0.1);
    centerGlow.fillCircle(960, 540, 500);

    // Right Sector: High-Tech & Space Deep Cosmic Glow
    const rightGlow = this.add.graphics();
    rightGlow.fillStyle(0x9b59b6, 0.15);
    rightGlow.fillCircle(1620, 540, 550);

    // Horizon Distant Silhouette Mountain & City Lines
    const DistantLandscape = this.add.graphics();

    // Left Mountain Hills
    DistantLandscape.fillStyle(0x3e2723, 0.4);
    DistantLandscape.beginPath();
    DistantLandscape.moveTo(0, 1080);
    DistantLandscape.lineTo(0, 750);
    DistantLandscape.lineTo(250, 640);
    DistantLandscape.lineTo(550, 780);
    DistantLandscape.lineTo(550, 1080);
    DistantLandscape.closePath();
    DistantLandscape.fillPath();

    // Right High-Tech City Skylines
    DistantLandscape.fillStyle(0x0f172a, 0.6);
    DistantLandscape.fillRect(1350, 700, 60, 380);
    DistantLandscape.fillRect(1430, 640, 90, 440);
    DistantLandscape.fillRect(1540, 680, 75, 400);
    DistantLandscape.fillRect(1640, 620, 120, 460);

    // Glowing cyan outline on tech skyline
    DistantLandscape.lineStyle(1.5, 0x00f2fe, 0.4);
    DistantLandscape.strokeRect(1430, 640, 90, 440);
    DistantLandscape.strokeRect(1640, 620, 120, 460);
  }

  private createBackgroundParticles(): void {
    // Floating star dust particles across screen
    for (let i = 0; i < 35; i++) {
      const x = Math.floor(Math.random() * (1870 - 50 + 1)) + 50;
      const y = Math.floor(Math.random() * (1030 - 50 + 1)) + 50;
      const color = x < 600 ? 0xffd700 : x < 1300 ? 0xff5722 : 0x00f2fe;
      const radius = Math.floor(Math.random() * 3) + 2;
      const particle = this.add.circle(x, y, radius, color, 0.6);

      this.tweens.add({
        targets: particle,
        y: y - (Math.floor(Math.random() * 30) + 20),
        alpha: 0.1,
        duration: Math.floor(Math.random() * 2500) + 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private onStartAdventureClicked(): void {
    // Camera zoom out & flash transition to World Map
    this.cameras.main.zoomTo(1.15, 450, 'Quad.easeIn');
    this.cameras.main.fadeOut(450, 7, 11, 25);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SceneKeys.WORLD_MAP);
    });
  }
}
