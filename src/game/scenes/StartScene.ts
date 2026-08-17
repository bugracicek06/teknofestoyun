import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SceneKeys } from '../../types/game';
import { EventBus } from '../state/EventBus';
import { SoundFx } from '../utils/audio';

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
  private fsBtnText?: Phaser.GameObjects.Text;

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
    // 1. 16:9 Sinematik Arka Plan (Antik Göbeklitepe & Futuristik Uzay Laboratuvarı)
    this.createStaticBackground();

    // 2. Sağ Üst Şık "TAM EKRAN" Butonu
    this.createFullscreenButton();

    // 3. Merkezde Güçlü AAA Oyun Başlığı & Alt Başlık (Dengeli ve hafif aşağıda)
    this.createCinematicTitle();

    // 4. Profesyonel Oyun Menüsü Başlat Butonu (Başlığa yakın ve dengeli dikey boşlukta)
    this.createCinematicCTAButton();

    EventBus.emit('current-scene-ready', SceneKeys.START);
  }

  /**
   * 16:9 Tam Ekran Sinematik Arka Plan
   */
  private createStaticBackground(): void {
    const bgFill = this.add.graphics();
    bgFill.fillStyle(0x070b19, 1);
    bgFill.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
    bgFill.setDepth(0);

    this.bgImage = this.add.image(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2, 'landing_hero_bg');
    this.bgImage.setDisplaySize(this.GAME_WIDTH, this.GAME_HEIGHT);
    this.bgImage.setDepth(1);
  }

  /**
   * Sağ Üst Köşe: Küçük ve şık "⛶ TAM EKRAN" Butonu
   */
  private createFullscreenButton(): void {
    const fsX = 1800;
    const fsY = 45;
    const fsW = 146;
    const fsH = 38;

    const fsContainer = this.add.container(fsX, fsY);
    fsContainer.setDepth(30);

    const fsBg = this.add.graphics();
    const drawFsBg = (hover: boolean) => {
      fsBg.clear();
      if (hover) {
        fsBg.fillStyle(0x0284c7, 0.85);
        fsBg.fillRoundedRect(-fsW / 2, -fsH / 2, fsW, fsH, 8);
        fsBg.lineStyle(1.5, 0x00f2fe, 1.0);
        fsBg.strokeRoundedRect(-fsW / 2, -fsH / 2, fsW, fsH, 8);
      } else {
        fsBg.fillStyle(0x081329, 0.7);
        fsBg.fillRoundedRect(-fsW / 2, -fsH / 2, fsW, fsH, 8);
        fsBg.lineStyle(1, 0x38bdf8, 0.6);
        fsBg.strokeRoundedRect(-fsW / 2, -fsH / 2, fsW, fsH, 8);
      }
    };
    drawFsBg(false);

    this.fsBtnText = this.add.text(0, 0, '⛶ TAM EKRAN', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '13px',
      fontStyle: '700',
      color: '#E2E8F0',
      letterSpacing: 1,
      align: 'center',
    });
    this.fsBtnText.setOrigin(0.5, 0.5);

    fsContainer.add([fsBg, this.fsBtnText]);
    fsContainer.setSize(fsW, fsH);
    fsContainer.setInteractive({ useHandCursor: true });

    fsContainer.on('pointerover', () => drawFsBg(true));
    fsContainer.on('pointerout', () => drawFsBg(false));

    fsContainer.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
        if (this.fsBtnText) this.fsBtnText.setText('⛶ TAM EKRAN');
      } else {
        this.scale.startFullscreen();
        if (this.fsBtnText) this.fsBtnText.setText('↙ ÇIKIŞ');
      }
    });

    this.scale.on('fullscreenunsupported', () => {
      // Fallback for HTML Fullscreen if scale manager not supported
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        if (this.fsBtnText) this.fsBtnText.setText('↙ ÇIKIŞ');
      } else {
        document.exitFullscreen().catch(() => {});
        if (this.fsBtnText) this.fsBtnText.setText('⛶ TAM EKRAN');
      }
    });
  }

  /**
   * Merkezde Güçlü AAA Oyun Başlığı & Alt Başlık
   * Dengeli ve hafif aşağıda konumlandırılmış
   */
  private createCinematicTitle(): void {
    const titleGroup = this.add.container(this.GAME_WIDTH / 2, 400);
    titleGroup.setDepth(20);

    // Üst Dekoratif Çizgi & Elmas İkonu
    const topDivider = this.add.graphics();
    topDivider.lineStyle(1.5, 0xd4af37, 0.65);
    topDivider.lineBetween(-170, -84, -20, -84);
    topDivider.lineBetween(20, -84, 170, -84);

    // Küçük elmas noktası
    topDivider.fillStyle(0xffd700, 0.9);
    topDivider.beginPath();
    topDivider.moveTo(0, -90);
    topDivider.lineTo(6, -84);
    topDivider.lineTo(0, -78);
    topDivider.lineTo(-6, -84);
    topDivider.closePath();
    topDivider.fillPath();
    titleGroup.add(topDivider);

    // 1. Satır: "MEDENİYETTEN" (Gümüş-Beyaz Metalik)
    const titleLine1 = this.add.text(0, -44, 'MEDENİYETTEN', {
      fontFamily: `'Montserrat', 'Cinzel', 'Outfit', ${this.SYSTEM_FONT}`,
      fontSize: '50px',
      fontStyle: '900',
      color: '#FFFFFF',
      letterSpacing: 6,
      align: 'center',
    });
    titleLine1.setOrigin(0.5, 0.5);
    titleLine1.setShadow(0, 4, 'rgba(0, 0, 0, 0.9)', 14, true, true);
    titleGroup.add(titleLine1);

    // 2. Satır: "MİLLİ TEKNOLOJİYE" (Altın-Amber Metalik Vurgu)
    const titleLine2 = this.add.text(0, 20, 'MİLLİ TEKNOLOJİYE', {
      fontFamily: `'Montserrat', 'Cinzel', 'Outfit', ${this.SYSTEM_FONT}`,
      fontSize: '56px',
      fontStyle: '900',
      color: '#F59E0B',
      letterSpacing: 5,
      align: 'center',
    });
    titleLine2.setOrigin(0.5, 0.5);
    titleLine2.setShadow(0, 5, 'rgba(0, 0, 0, 0.95)', 16, true, true);
    titleGroup.add(titleLine2);

    // Alt Dekoratif İnce Çizgi
    const bottomDivider = this.add.graphics();
    bottomDivider.lineStyle(1, 0xffd700, 0.45);
    bottomDivider.lineBetween(-130, 62, 130, 62);
    titleGroup.add(bottomDivider);

    // Alt Başlık: "Göbeklitepe’den Türkiye Yüzyılı’na Zaman Yolculuğu"
    const subtitleText = this.add.text(0, 92, "Göbeklitepe'den Türkiye Yüzyılı'na Zaman Yolculuğu", {
      fontFamily: `'Outfit', 'Rajdhani', ${this.SYSTEM_FONT}`,
      fontSize: '19.5px',
      fontStyle: '600',
      color: '#E2E8F0',
      letterSpacing: 2.5,
      align: 'center',
    });
    subtitleText.setOrigin(0.5, 0.5);
    subtitleText.setShadow(0, 2, 'rgba(0, 0, 0, 0.85)', 10, true, true);
    titleGroup.add(subtitleText);
  }

  /**
   * Profesyonel Oyun Menüsü Başlat Butonu: "ZAMAN YOLCULUĞUNA BAŞLA →"
   * Başlık grubuyla dengeli aralıkta yukarı alınmış
   */
  private createCinematicCTAButton(): void {
    const btnW = 430;
    const btnH = 66;
    const btnX = this.GAME_WIDTH / 2;
    const btnY = 675;

    const btnContainer = this.add.container(btnX, btnY);
    btnContainer.setDepth(25);

    // Kesik köşeli (chamfered) profesyonel oyun menüsü butonu çizimi
    const btnBg = this.add.graphics();

    const drawGameButton = (isHover: boolean) => {
      btnBg.clear();
      const cut = 14;
      const hw = btnW / 2;
      const hh = btnH / 2;

      const drawButtonPolygon = () => {
        btnBg.beginPath();
        btnBg.moveTo(-hw + cut, -hh);
        btnBg.lineTo(hw - cut, -hh);
        btnBg.lineTo(hw, -hh + cut);
        btnBg.lineTo(hw, hh - cut);
        btnBg.lineTo(hw - cut, hh);
        btnBg.lineTo(-hw + cut, hh);
        btnBg.lineTo(-hw, hh - cut);
        btnBg.lineTo(-hw, -hh + cut);
        btnBg.closePath();
      };

      if (isHover) {
        // Hover: Canlı derin mavi/cyan çekirdek & altın/cyan ışık çerçevesi
        btnBg.fillStyle(0x0369a1, 0.95);
        drawButtonPolygon();
        btnBg.fillPath();

        // İnce üst parlama
        btnBg.fillStyle(0xffffff, 0.2);
        btnBg.fillRect(-hw + cut + 10, -hh + 3, btnW - 2 * (cut + 10), hh - 6);

        // Canlı altın/cyan vurgulu çift kenarlık
        btnBg.lineStyle(2.5, 0x00f2fe, 1.0);
        drawButtonPolygon();
        btnBg.strokePath();
      } else {
        // Normal: Koyu obsidyen cam çekirdek & altın-cyan zarif metalik çerçeve
        btnBg.fillStyle(0x081329, 0.88);
        drawButtonPolygon();
        btnBg.fillPath();

        // İnce üst cam parıltısı
        btnBg.fillStyle(0xffffff, 0.08);
        btnBg.fillRect(-hw + cut + 10, -hh + 3, btnW - 2 * (cut + 10), hh - 8);

        // Zarif altın & cyan geçişli kenarlık
        btnBg.lineStyle(2, 0xd4af37, 0.85);
        drawButtonPolygon();
        btnBg.strokePath();
      }
    };

    drawGameButton(false);

    // Buton Metni: "ZAMAN YOLCULUĞUNA BAŞLA →"
    const btnText = this.add.text(0, 0, 'ZAMAN YOLCULUĞUNA BAŞLA →', {
      fontFamily: `'Montserrat', 'Outfit', ${this.SYSTEM_FONT}`,
      fontSize: '18px',
      fontStyle: '800',
      color: '#F8FAFC',
      letterSpacing: 2.5,
      align: 'center',
    });
    btnText.setOrigin(0.5, 0.5);
    btnText.setShadow(0, 2, 'rgba(0, 0, 0, 0.8)', 8, true, true);

    btnContainer.add([btnBg, btnText]);
    btnContainer.setSize(btnW, btnH);
    btnContainer.setInteractive({ useHandCursor: true });

    // Hover Etkileşimi
    btnContainer.on('pointerover', () => {
      drawGameButton(true);
      btnText.setColor('#FBBF24');
    });

    btnContainer.on('pointerout', () => {
      drawGameButton(false);
      btnText.setColor('#F8FAFC');
    });

    // Tıklama Etkileşimi
    btnContainer.on('pointerdown', () => {
      SoundFx.playTelemetryBeep();
      this.cameras.main.fadeOut(300, 7, 11, 25);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKeys.WORLD_MAP);
      });
    });
  }
}

