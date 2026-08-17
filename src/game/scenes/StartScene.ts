import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SceneKeys } from '../../types/game';
import { EventBus } from '../state/EventBus';

// Safe TypeScript Asset Imports for Vite production bundler
import pauLogoUrl from '../../assets/logos/pau_logo.png';
import teknokentLogoUrl from '../../assets/logos/teknokent_logo.png';
import teknofestLogoUrl from '../../assets/logos/teknofest_logo.png';

import pusulaMascotUrl from '../../assets/svg/pusula_mascot.svg';
import islandGobeklitepeUrl from '../../assets/svg/island_gobeklitepe.svg';
import islandDemirCagiUrl from '../../assets/svg/island_demir_cagi.svg';
import islandAnadoluUrl from '../../assets/svg/island_anadolu.svg';
import islandSerinhisarUrl from '../../assets/svg/island_serinhisar.svg';
import islandMilliTeknoUrl from '../../assets/svg/island_milli_tekno.svg';
import islandUzayUrl from '../../assets/svg/island_uzay.svg';
import passportStampUrl from '../../assets/svg/passport_stamp.svg';

// Preload Göbeklitepe assets
import gobeklitepeBgUrl from '../../assets/gobeklitepe_bg.png';
import reliefFoxLeftUrl from '../../assets/svg/relief_fox_left.svg';
import reliefBoarLeftUrl from '../../assets/svg/relief_boar_left.svg';
import reliefCraneLeftUrl from '../../assets/svg/relief_crane_left.svg';
import reliefFoxRightUrl from '../../assets/svg/relief_fox_right.svg';
import reliefBoarRightUrl from '../../assets/svg/relief_boar_right.svg';
import reliefCraneRightUrl from '../../assets/svg/relief_crane_right.svg';

import socketFoxLeftUrl from '../../assets/svg/socket_fox_left.svg';
import socketBoarLeftUrl from '../../assets/svg/socket_boar_left.svg';
import socketCraneLeftUrl from '../../assets/svg/socket_crane_left.svg';
import socketFoxRightUrl from '../../assets/svg/socket_fox_right.svg';
import socketBoarRightUrl from '../../assets/svg/socket_boar_right.svg';
import socketCraneRightUrl from '../../assets/svg/socket_crane_right.svg';

// Preload Landing Hero & World Map Background Images
import landingHeroBgUrl from '../../assets/landing_hero_bg.jpg';
import worldMapBgUrl from '../../assets/world_map_bg.jpg';

// Preload Demir Çağı / Serinhisar 4-Stage Cinematic assets early
import ironStage1BgUrl from '../../assets/iron_stage1_furnace.jpg';
import ironStage2BgUrl from '../../assets/iron_stage2_anvil.jpg';
import ironStage3BgUrl from '../../assets/iron_stage3_quench.jpg';
import ironStage4BgUrl from '../../assets/iron_stage4_showcase.jpg';

import oreIronRedUrl from '../../assets/svg/ore_iron_red.svg';
import oreCharcoalUrl from '../../assets/svg/ore_charcoal.svg';
import serinhisarHotRodUrl from '../../assets/svg/serinhisar_hot_rod.svg';
import serinhisarBladeForgingUrl from '../../assets/svg/serinhisar_blade_forging.svg';
import serinhisarBladeHotUrl from '../../assets/svg/serinhisar_blade_hot.svg';
import serinhisarBladeSteelUrl from '../../assets/svg/serinhisar_blade_steel.svg';
import serinhisarSheathUrl from '../../assets/svg/serinhisar_sheath.svg';
import smithHammerUrl from '../../assets/svg/smith_hammer.svg';

export class StartScene extends BaseScene {
  private bgImage?: Phaser.GameObjects.Image;

  constructor() {
    super(SceneKeys.START);
  }

  preload(): void {
    // 1. Landing Hero & World Map Backgrounds
    if (!this.textures.exists('landing_hero_bg')) {
      this.load.image('landing_hero_bg', landingHeroBgUrl);
      this.load.image('world_map_bg', worldMapBgUrl);
    }

    // 2. Corporate Logos
    if (!this.textures.exists('pau_logo')) {
      this.load.image('pau_logo', pauLogoUrl);
      this.load.image('teknokent_logo', teknokentLogoUrl);
      this.load.image('teknofest_logo', teknofestLogoUrl);
    }

    // 3. World Map & Navigation SVG assets
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

    // 4. Preload Göbeklitepe assets
    if (!this.textures.exists('gobeklitepe_bg')) {
      this.load.image('gobeklitepe_bg', gobeklitepeBgUrl);
    }
    if (!this.textures.exists('relief_fox_left')) {
      this.load.image('relief_fox_left', reliefFoxLeftUrl);
      this.load.image('relief_boar_left', reliefBoarLeftUrl);
      this.load.image('relief_crane_left', reliefCraneLeftUrl);
      this.load.image('relief_fox_right', reliefFoxRightUrl);
      this.load.image('relief_boar_right', reliefBoarRightUrl);
      this.load.image('relief_crane_right', reliefCraneRightUrl);
    }
    if (!this.textures.exists('socket_fox_left')) {
      this.load.image('socket_fox_left', socketFoxLeftUrl);
      this.load.image('socket_boar_left', socketBoarLeftUrl);
      this.load.image('socket_crane_left', socketCraneLeftUrl);
      this.load.image('socket_fox_right', socketFoxRightUrl);
      this.load.image('socket_boar_right', socketBoarRightUrl);
      this.load.image('socket_crane_right', socketCraneRightUrl);
    }

    // 5. Preload Demir Çağı / Serinhisar assets
    if (!this.textures.exists('iron_stage1_furnace')) {
      this.load.image('iron_stage1_furnace', ironStage1BgUrl);
      this.load.image('iron_stage2_anvil', ironStage2BgUrl);
      this.load.image('iron_stage3_quench', ironStage3BgUrl);
      this.load.image('iron_stage4_showcase', ironStage4BgUrl);

      this.load.image('ore_iron_red', oreIronRedUrl);
      this.load.image('ore_charcoal', oreCharcoalUrl);
      this.load.image('serinhisar_hot_rod', serinhisarHotRodUrl);
      this.load.image('serinhisar_blade_forging', serinhisarBladeForgingUrl);
      this.load.image('serinhisar_blade_hot', serinhisarBladeHotUrl);
      this.load.image('serinhisar_blade_steel', serinhisarBladeSteelUrl);
      this.load.image('serinhisar_sheath', serinhisarSheathUrl);
      this.load.image('smith_hammer', smithHammerUrl);
    }
  }

  create(): void {
    // 1. High-Resolution Pure Minimalist Background (1920x1080)
    this.createCleanBackground();

    // 2. Ultra-clean Minimalist Floating Header
    this.createCorporateKioskHeader();

    // 3. Subtle & Elegant Minimalist Typography (Centered in High Negative Space)
    this.createMinimalistTitle();

    // 4. Minimalist Glass Pill Button: "ZAMAN YOLCULUĞUNA BAŞLA ➔"
    this.createMinimalistStartButton();

    EventBus.emit('current-scene-ready', SceneKeys.START);
  }

  private createCleanBackground(): void {
    // Base Canvas Background
    const bgFill = this.add.graphics();
    bgFill.fillStyle(0x0a0f1d, 1);
    bgFill.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
    bgFill.setDepth(0);

    // Pure 16:9 Landing Hero Background Artwork
    this.bgImage = this.add.image(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2, 'landing_hero_bg');
    this.bgImage.setDisplaySize(this.GAME_WIDTH, this.GAME_HEIGHT);
    this.bgImage.setDepth(0);
  }

  private createMinimalistTitle(): void {
    const titleGroup = this.add.container(this.GAME_WIDTH / 2, 280);
    titleGroup.setDepth(100);

    // Elegant, Subtle Main Title (No heavy boxes, pure modern typography)
    const titleText = this.add.text(0, 0, 'MEDENİYETTEN MİLLÎ TEKNOLOJİYE', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '36px',
      fontStyle: '800',
      color: '#FFFFFF',
      letterSpacing: 2,
    });
    titleText.setOrigin(0.5, 0.5);
    titleText.setShadow(0, 3, 'rgba(0, 0, 0, 0.65)', 8, true, true);
    titleGroup.add(titleText);

    // Clean Subtitle
    const subtitleText = this.add.text(0, 48, "Göbeklitepe'den Türkiye Yüzyılı'na Zaman Yolculuğu", {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '18px',
      fontStyle: '500',
      color: '#CBD5E1',
      letterSpacing: 1,
    });
    subtitleText.setOrigin(0.5, 0.5);
    subtitleText.setShadow(0, 2, 'rgba(0, 0, 0, 0.55)', 6, true, true);
    titleGroup.add(subtitleText);

    // Subtle floating breathing tween
    this.tweens.add({
      targets: titleGroup,
      y: 275,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createMinimalistStartButton(): void {
    const btnW = 340;
    const btnH = 58;
    const btnX = this.GAME_WIDTH / 2;
    const btnY = 640;

    const btnContainer = this.add.container(btnX, btnY);
    btnContainer.setDepth(120);

    // Subtle Ambient Glow
    const glow = this.add.graphics();
    glow.fillStyle(0xe11d48, 0.25);
    glow.fillRoundedRect(-btnW / 2 - 6, -btnH / 2 - 6, btnW + 12, btnH + 12, 32);

    // Minimalist Pill Glass Button (#E11D48 with subtle 1.5px white outline)
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xe11d48, 0.95);
    btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 29);
    btnBg.lineStyle(1.5, 0xffffff, 0.85);
    btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 29);

    const btnText = this.add.text(0, 0, 'ZAMAN YOLCULUĞUNA BAŞLA ➔', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    btnText.setOrigin(0.5, 0.5);
    btnText.setShadow(0, 2, 'rgba(0,0,0,0.5)', 4, true, true);

    btnContainer.add([glow, btnBg, btnText]);
    btnContainer.setSize(btnW, btnH);
    btnContainer.setInteractive({ useHandCursor: true });

    btnContainer.on('pointerover', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 120,
      });
      btnBg.clear();
      btnBg.fillStyle(0xf43f5e, 1.0);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 29);
      btnBg.lineStyle(2, 0xffffff, 1.0);
      btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 29);
    });

    btnContainer.on('pointerout', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 120,
      });
      btnBg.clear();
      btnBg.fillStyle(0xe11d48, 0.95);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 29);
      btnBg.lineStyle(1.5, 0xffffff, 0.85);
      btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 29);
    });

    btnContainer.on('pointerdown', () => {
      this.cameras.main.zoomTo(1.08, 320, 'Quad.easeIn');
      this.cameras.main.fadeOut(320, 10, 15, 29);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKeys.WORLD_MAP);
      });
    });
  }
}
