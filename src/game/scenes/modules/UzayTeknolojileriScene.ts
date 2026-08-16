import Phaser from 'phaser';
import { BaseScene } from '../BaseScene';
import { SceneKeys } from '../../../types/game';
import { GameStore } from '../../state/GameStore';
import { PusulaCharacter } from '../../objects/PusulaCharacter';
import { GameButton } from '../../objects/GameButton';
import { SoundFx } from '../../utils/audio';
import { EventBus } from '../../state/EventBus';

// Safe TypeScript Asset Imports
import islandUzayUrl from '../../../assets/svg/island_uzay.svg';
import passportStampUrl from '../../../assets/svg/passport_stamp.svg';

interface CustomizationOption {
  id: string;
  name: string;
  subTitle: string;
  icon: string;
  accentColor: number;
  hexColor: string;
  specText: string;
}

interface CustomizationCategory {
  id: 'hull' | 'energy' | 'sensor' | 'livery';
  title: string;
  icon: string;
  options: CustomizationOption[];
}

export class UzayTeknolojileriScene extends BaseScene {
  // Game State
  private currentPhaseNumber = 1;
  private elapsedSeconds = 0;
  private timerEvent?: Phaser.Time.TimerEvent;
  private timerText?: Phaser.GameObjects.Text;
  private pusula?: PusulaCharacter;

  // Spacecraft Configuration State
  private selectedHull = 'shuttle';
  private selectedEnergy = 'solar';
  private selectedSensor = 'telescope';
  private selectedLivery = 'turquoise_gold';
  private activeCategory: 'hull' | 'energy' | 'sensor' | 'livery' = 'hull';

  // Customization Categories
  private readonly CATEGORIES: CustomizationCategory[] = [
    {
      id: 'hull',
      title: 'GÖVDE TİPİ',
      icon: '🚀',
      options: [
        {
          id: 'shuttle',
          name: 'Keşif Mekiği (Gökbey)',
          subTitle: 'Aerodinamik Atmosfer & Yörünge Mekiği',
          icon: '🚀',
          accentColor: 0x9b59b6,
          hexColor: '#C084FC',
          specText: 'Yüksek Hızlı Atmosferik Giriş & Kanatlı Süzülüş',
        },
        {
          id: 'probe',
          name: 'Derin Uzay Sondası (Türksat)',
          subTitle: 'Uzak Gezegen & Asteroit Gözlemcisi',
          icon: '🛰️',
          accentColor: 0x00f2fe,
          hexColor: '#38BDF8',
          specText: 'Uzun Menzilli Radyasyon Kalkanı & İtki Modülü',
        },
        {
          id: 'rover',
          name: 'Gezegen Gezgini (Ay/Mars)',
          subTitle: 'Modüler Yüzey Araştırma Aracı',
          icon: '🚜',
          accentColor: 0x10b981,
          hexColor: '#34D399',
          specText: '6x6 Bağımsız Süspansiyonlu Robotik Şasi',
        },
      ],
    },
    {
      id: 'energy',
      title: 'ENERJİ KAYNAĞI',
      icon: '⚡',
      options: [
        {
          id: 'solar',
          name: 'Güneş Paneli Dizisi',
          subTitle: 'Kristal Fotovoltaik Kanatlar',
          icon: '☀️',
          accentColor: 0x38bdf8,
          hexColor: '#38BDF8',
          specText: 'Sonsuz Güneş Işığı ile %99.2 Enerji Verimi',
        },
        {
          id: 'ion',
          name: 'İyon Çekirdeği',
          subTitle: 'Mavi Plazma & İyon İtkisi',
          icon: '⚡',
          accentColor: 0x00f2fe,
          hexColor: '#00F2FE',
          specText: 'Aşırı Düşük Yakıt Tüketimi & Sürekli İvme',
        },
        {
          id: 'fusion',
          name: 'Füzyon Bataryası',
          subTitle: 'Kompakt Nükleer-Füzyon Tüpü',
          icon: '⚛️',
          accentColor: 0xf59e0b,
          hexColor: '#FCD34D',
          specText: 'Derin Uzayda 50 Yıl Kesintisiz Yüksek Güç',
        },
      ],
    },
    {
      id: 'sensor',
      title: 'BİLİMSEL SENSÖR',
      icon: '📡',
      options: [
        {
          id: 'telescope',
          name: 'Optik Teleskop',
          subTitle: 'Derin Uzay & Yıldız Gözlemi',
          icon: '🔭',
          accentColor: 0xa855f7,
          hexColor: '#C084FC',
          specText: 'Milyonlarca Işık Yılı Uzaklığı Netleme',
        },
        {
          id: 'lidar',
          name: 'Lidar Haritalayıcı',
          subTitle: '3D Krater & Topoğrafya Lazeri',
          icon: '📡',
          accentColor: 0x00f2fe,
          hexColor: '#00F2FE',
          specText: '0.01 mm Hassasiyetle Yüzey 3D Modelleme',
        },
        {
          id: 'spectrometer',
          name: 'Atmosfer Spektrometresi',
          subTitle: 'Gaz & Kimyasal Analiz Modülü',
          icon: '🧪',
          accentColor: 0x10b981,
          hexColor: '#10B981',
          specText: 'Uzak Atmosferlerde Oksijen & Su İzi Tespiti',
        },
      ],
    },
    {
      id: 'livery',
      title: 'GÖREV KAPLAMASI',
      icon: '🎨',
      options: [
        {
          id: 'turquoise_gold',
          name: 'Turkuaz & Altın',
          subTitle: 'Gök Vatan & Medeniyet Teması',
          icon: '💎',
          accentColor: 0x00f2fe,
          hexColor: '#00F2FE',
          specText: 'Gök Vatan ve Medeniyet İmzası',
        },
        {
          id: 'red_white',
          name: 'Ay-Yıldız Kırmızı-Beyaz',
          subTitle: 'Al Bayrak & Millî Gurur',
          icon: '🇹🇷',
          accentColor: 0xef4444,
          hexColor: '#EF4444',
          specText: 'Şanlı Türk Bayrağı Isı Korumalı Seramik Kaplama',
        },
        {
          id: 'cobalt_silver',
          name: 'Kobalt Mavisi & Gümüş',
          subTitle: 'Derin Uzay & Kozmos',
          icon: '🌌',
          accentColor: 0x3b82f6,
          hexColor: '#60A5FA',
          specText: 'Kozmik Radyasyonu Yansıtan Titanyum Zırh',
        },
      ],
    },
  ];

  // Phase 1 UI Containers
  private phase1Container?: Phaser.GameObjects.Container;
  private spacecraftHangarContainer?: Phaser.GameObjects.Container;
  private spacecraftHangarGraphics?: Phaser.GameObjects.Graphics;
  private categoryTabContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private optionCardContainers: Phaser.GameObjects.Container[] = [];
  private optionsGroupContainer?: Phaser.GameObjects.Container;
  private readyToLaunchBtn?: GameButton;

  // Phase 2 UI Elements
  private phase2Container?: Phaser.GameObjects.Container;
  private countdownText?: Phaser.GameObjects.Text;
  private launchThrusterGraphics?: Phaser.GameObjects.Graphics;
  private flyingCraftContainer?: Phaser.GameObjects.Container;
  private telemetryHUDContainer?: Phaser.GameObjects.Container;
  private spaceOrbitGraphics?: Phaser.GameObjects.Graphics;
  private orbitSignalTween?: Phaser.Tweens.Tween;

  constructor() {
    super(SceneKeys.UZAY_TEKNOLOJILERI);
  }

  preload(): void {
    if (!this.textures.exists('island_uzay')) {
      this.load.image('island_uzay', islandUzayUrl);
    }
    if (!this.textures.exists('passport_stamp')) {
      this.load.image('passport_stamp', passportStampUrl);
    }
  }

  create(): void {
    // Reset state
    this.currentPhaseNumber = 1;
    this.elapsedSeconds = 0;
    this.selectedHull = 'shuttle';
    this.selectedEnergy = 'solar';
    this.selectedSensor = 'telescope';
    this.selectedLivery = 'turquoise_gold';
    this.activeCategory = 'hull';
    this.categoryTabContainers.clear();
    this.optionCardContainers = [];

    this.cameras.main.fadeIn(350, 7, 11, 25);

    // Clean up lifecycle
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUpScene, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanUpScene, this);

    // 1. Cosmic Space & Cyber Hangar Background
    this.createHangarEnvironment();

    // 2. Header UI
    this.createHeaderUI();

    // 3. Setup Phase 1: Modular Space Hangar
    this.setupPhase1Hangar();

    // 4. Pusula Companion Character
    this.pusula = new PusulaCharacter(
      this,
      210,
      820,
      'Geleceğin keşif aracını tasarlama zamanı! Gövde, enerji, sensör ve kaplama parçalarını seçerek aracını tamamla.'
    );

    // 5. Elapsed Timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.elapsedSeconds++;
        this.updateTimerUI();
      },
      loop: true,
    });

    // 6. Corner Back Button
    this.createCornerBackButton();

    EventBus.emit('current-scene-ready', SceneKeys.UZAY_TEKNOLOJILERI);
  }

  private cleanUpScene(): void {
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = undefined;
    }
    if (this.orbitSignalTween) {
      this.orbitSignalTween.stop();
      this.orbitSignalTween = undefined;
    }
    this.tweens.killAll();
  }

  // =========================================================================
  // ENVIRONMENT & HEADER
  // =========================================================================

  private createHangarEnvironment(): void {
    const bg = this.add.graphics();
    // Deep Space Cosmic Dark Blue / Violet Base
    bg.fillStyle(0x060814, 1);
    bg.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Futuristic Cyan & Purple Grid Pattern
    bg.lineStyle(1, 0x9b59b6, 0.07);
    const gridSize = 60;
    for (let x = 0; x < this.GAME_WIDTH; x += gridSize) {
      bg.lineBetween(x, 0, x, this.GAME_HEIGHT);
    }
    for (let y = 0; y < this.GAME_HEIGHT; y += gridSize) {
      bg.lineBetween(0, y, this.GAME_WIDTH, y);
    }

    // Radial Ambient Cosmic Glows
    const ambientGlow = this.add.graphics();
    ambientGlow.fillStyle(0x9b59b6, 0.08);
    ambientGlow.fillCircle(680, 500, 550);

    ambientGlow.fillStyle(0x00f2fe, 0.06);
    ambientGlow.fillCircle(1500, 300, 450);

    // Twinkling Distant Star Dust
    const starsG = this.add.graphics();
    for (let i = 0; i < 45; i++) {
      const sx = Phaser.Math.Between(20, this.GAME_WIDTH - 20);
      const sy = Phaser.Math.Between(20, this.GAME_HEIGHT - 20);
      const sRadius = Phaser.Math.FloatBetween(1, 2.5);
      const sAlpha = Phaser.Math.FloatBetween(0.2, 0.8);
      starsG.fillStyle(0xffffff, sAlpha);
      starsG.fillCircle(sx, sy, sRadius);
    }
  }

  private createHeaderUI(): void {
    const headerContainer = this.add.container(this.GAME_WIDTH / 2, 60);

    // Main Header HUD Frame
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a1128, 0.94);
    headerBg.fillRoundedRect(-650, -40, 1300, 80, 18);
    headerBg.lineStyle(2, 0x9b59b6, 0.85);
    headerBg.strokeRoundedRect(-650, -40, 1300, 80, 18);

    // Header Glow
    const headerGlow = this.add.graphics();
    headerGlow.fillStyle(0x9b59b6, 0.12);
    headerGlow.fillRoundedRect(-656, -46, 1312, 92, 22);

    // Title
    const titleText = this.createText(-610, -18, '🚀 TEKNOFEST GELECEK VE UZAY TEKNOLOJİLERİ', {
      fontSize: '24px',
      fontStyle: '900',
      color: '#C084FC',
      align: 'left',
    });
    titleText.setOrigin(0, 0.5);

    // Subtitle Badge
    const categoryBadge = this.createText(-610, 14, `AŞAMA ${this.currentPhaseNumber}/3: KENDİ KEŞİF ARACINI TASARLA`, {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FCD34D',
      align: 'left',
    });
    categoryBadge.setOrigin(0, 0.5);

    // Telemetry Box (Right side of header)
    const telemetryBox = this.add.graphics();
    telemetryBox.fillStyle(0x0f172a, 0.9);
    telemetryBox.fillRoundedRect(320, -28, 300, 56, 12);
    telemetryBox.lineStyle(1.5, 0x00f2fe, 0.7);
    telemetryBox.strokeRoundedRect(320, -28, 300, 56, 12);

    const teleDot = this.add.circle(345, 0, 6, 0x00f2fe);
    this.tweens.add({
      targets: teleDot,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.timerText = this.createText(470, 0, 'SÜRE: 00:00  •  HANGAR: AKTİF', {
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#F8FAFC',
      align: 'center',
    });
    this.timerText.setOrigin(0.5);

    headerContainer.add([headerGlow, headerBg, titleText, categoryBadge, telemetryBox, teleDot, this.timerText]);
  }

  private updateTimerUI(): void {
    if (!this.timerText) return;
    const mins = Math.floor(this.elapsedSeconds / 60);
    const secs = this.elapsedSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.timerText.setText(`SÜRE: ${timeStr}  •  HANGAR: AKTİF`);
  }

  private createCornerBackButton(): void {
    const btn = this.add.container(65, 60);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a1128, 0.9);
    bg.fillCircle(0, 0, 30);
    bg.lineStyle(2, 0x9b59b6, 0.8);
    bg.strokeCircle(0, 0, 30);

    const iconText = this.add.text(0, 0, '◄', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '24px',
      color: '#C084FC',
    });
    iconText.setOrigin(0.5);

    btn.add([bg, iconText]);

    const hitArea = new Phaser.Geom.Circle(0, 0, 30);
    btn.setInteractive(hitArea, Phaser.Geom.Circle.Contains, true);

    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 7, 11, 25);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKeys.WORLD_MAP);
      });
    });
  }

  // =========================================================================
  // AŞAMA 1 – MODÜLER UZAY HANGARI
  // =========================================================================

  private setupPhase1Hangar(): void {
    this.currentPhaseNumber = 1;
    this.phase1Container = this.add.container(0, 0);

    // 1. Central Spacecraft Assembly Stage & Turntable (x: 650, y: 510)
    this.createSpacecraftAssemblyHangar(650, 510);

    // 2. Category Navigation Tabs (Right Stage - Top: x: 1480, y: 155)
    this.createCategorySelectorTabs(1480, 155);

    // 3. Option Selection Cards Container (Right Stage - Center: x: 1480, y: 460)
    this.optionsGroupContainer = this.add.container(0, 0);
    this.renderCategoryOptionCards();

    // 4. "FIRLATMAYA HAZIR  🚀" Action Button (x: 1480, y: 880)
    this.createReadyToLaunchButton(1480, 880);

    this.phase1Container.add([
      this.spacecraftHangarContainer!,
      this.optionsGroupContainer,
      this.readyToLaunchBtn!,
    ]);
  }

  private createSpacecraftAssemblyHangar(x: number, y: number): void {
    this.spacecraftHangarContainer = this.add.container(x, y);

    // Hangar Turntable Base Graphics
    const hangarBase = this.add.graphics();

    // Outer Neon Ring
    hangarBase.lineStyle(2, 0x9b59b6, 0.4);
    hangarBase.strokeCircle(0, 0, 320);

    hangarBase.lineStyle(2, 0x00f2fe, 0.7);
    hangarBase.strokeCircle(0, 0, 260);

    // Turntable Surface Fill
    hangarBase.fillStyle(0x0a1128, 0.95);
    hangarBase.fillCircle(0, 0, 240);
    hangarBase.lineStyle(3, 0x38bdf8, 0.8);
    hangarBase.strokeCircle(0, 0, 240);

    // Turntable Laser Crosshairs
    hangarBase.lineStyle(1, 0x00f2fe, 0.3);
    hangarBase.lineBetween(-240, 0, 240, 0);
    hangarBase.lineBetween(0, -240, 0, 240);

    // Hangar Gantry Scaffolding Arms
    hangarBase.lineStyle(3, 0x475569, 0.8);
    hangarBase.beginPath();
    hangarBase.moveTo(-280, -200);
    hangarBase.lineTo(-200, -200);
    hangarBase.lineTo(-160, -160);
    hangarBase.strokePath();

    hangarBase.beginPath();
    hangarBase.moveTo(280, -200);
    hangarBase.lineTo(200, -200);
    hangarBase.lineTo(160, -160);
    hangarBase.strokePath();

    // Holographic Calibration Grid Rings
    hangarBase.lineStyle(1, 0x00f2fe, 0.15);
    hangarBase.strokeCircle(0, 0, 180);
    hangarBase.strokeCircle(0, 0, 100);

    // Craft Title HUD
    const craftTitle = this.createText(0, -265, '— T-2071 MİLLÎ UZAY KEŞİF ARACI —', {
      fontSize: '16px',
      fontStyle: '900',
      color: '#00F2FE',
    });
    craftTitle.setOrigin(0.5);

    // Dynamic Spacecraft Vector Graphics Object
    this.spacecraftHangarGraphics = this.add.graphics();
    this.renderCustomizedSpacecraft();

    this.spacecraftHangarContainer.add([hangarBase, craftTitle, this.spacecraftHangarGraphics]);
  }

  private renderCustomizedSpacecraft(): void {
    if (!this.spacecraftHangarGraphics) return;
    this.spacecraftHangarGraphics.clear();

    const g = this.spacecraftHangarGraphics;

    // Determine Livery Colors
    let primaryColor = 0x00f2fe;
    let secondaryColor = 0xffd700;
    let accentLineColor = 0xffffff;

    if (this.selectedLivery === 'red_white') {
      primaryColor = 0xe11d48;
      secondaryColor = 0xffffff;
      accentLineColor = 0xffffff;
    } else if (this.selectedLivery === 'cobalt_silver') {
      primaryColor = 0x1d4ed8;
      secondaryColor = 0x94a3b8;
      accentLineColor = 0x38bdf8;
    }

    // 1. Render Energy Source Modules (Back / Lateral)
    if (this.selectedEnergy === 'solar') {
      // Big Expanded Solar Panel Array
      g.fillStyle(0x0284c7, 0.95);
      g.lineStyle(2, 0x38bdf8, 1);
      // Left Panel
      g.fillRect(-220, -35, 110, 70);
      g.strokeRect(-220, -35, 110, 70);
      // Right Panel
      g.fillRect(110, -35, 110, 70);
      g.strokeRect(110, -35, 110, 70);

      // Solar Cell Grid Lines
      g.lineStyle(1, 0x00f2fe, 0.7);
      g.lineBetween(-165, -35, -165, 35);
      g.lineBetween(-220, 0, -110, 0);
      g.lineBetween(165, -35, 165, 35);
      g.lineBetween(110, 0, 220, 0);

      // Panel Mounting Struts
      g.lineStyle(4, 0x475569, 1);
      g.lineBetween(-110, 0, -60, 0);
      g.lineBetween(110, 0, 60, 0);
    } else if (this.selectedEnergy === 'ion') {
      // Glowing Ion Core Reactor Pods
      g.fillStyle(0x0f172a, 1);
      g.lineStyle(2.5, 0x00f2fe, 1);
      g.fillRoundedRect(-140, -40, 50, 80, 10);
      g.strokeRoundedRect(-140, -40, 50, 80, 10);
      g.fillRoundedRect(90, -40, 50, 80, 10);
      g.strokeRoundedRect(90, -40, 50, 80, 10);

      // Glowing Blue Plasma Rings
      g.fillStyle(0x00f2fe, 0.8);
      g.fillCircle(-115, 0, 16);
      g.fillCircle(115, 0, 16);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(-115, 0, 7);
      g.fillCircle(115, 0, 7);
    } else if (this.selectedEnergy === 'fusion') {
      // Compact High-Tech Fusion Power Cylinder
      g.fillStyle(0x1e293b, 1);
      g.lineStyle(2.5, 0xf59e0b, 1);
      g.fillRoundedRect(-110, 70, 220, 34, 8);
      g.strokeRoundedRect(-110, 70, 220, 34, 8);

      // Fusion Plasma Core Bars
      g.fillStyle(0xf59e0b, 0.85);
      g.fillRect(-80, 76, 160, 22);
      g.fillStyle(0xffeb3b, 1);
      g.fillRect(-40, 80, 80, 14);
    }

    // 2. Render Hull Body based on selectedHull
    if (this.selectedHull === 'shuttle') {
      // Aerodynamic Shuttle Hull
      // Main Swept Delta Wings
      g.fillStyle(secondaryColor, 0.9);
      g.lineStyle(2.5, accentLineColor, 1);
      const wings = [
        { x: 0, y: -110 },
        { x: 130, y: 60 },
        { x: 130, y: 90 },
        { x: 40, y: 100 },
        { x: 0, y: 120 },
        { x: -40, y: 100 },
        { x: -130, y: 90 },
        { x: -130, y: 60 },
      ];
      g.beginPath();
      g.moveTo(wings[0].x, wings[0].y);
      for (let i = 1; i < wings.length; i++) g.lineTo(wings[i].x, wings[i].y);
      g.closePath();
      g.fillPath();
      g.strokePath();

      // Fuselage Body
      g.fillStyle(primaryColor, 1);
      g.lineStyle(2.5, 0xffffff, 1);
      const fuselage = [
        { x: 0, y: -140 },
        { x: 34, y: -60 },
        { x: 38, y: 60 },
        { x: 20, y: 110 },
        { x: -20, y: 110 },
        { x: -38, y: 60 },
        { x: -34, y: -60 },
      ];
      g.beginPath();
      g.moveTo(fuselage[0].x, fuselage[0].y);
      for (let i = 1; i < fuselage.length; i++) g.lineTo(fuselage[i].x, fuselage[i].y);
      g.closePath();
      g.fillPath();
      g.strokePath();

      // Cockpit Canopy Glass
      g.fillStyle(0x00f2fe, 0.9);
      g.lineStyle(2, 0xffffff, 1);
      g.fillEllipse(0, -70, 36, 18);
      g.strokeEllipse(0, -70, 36, 18);
      g.fillStyle(0xffffff, 0.8);
      g.fillEllipse(-4, -73, 10, 4);

      // Rocket Thruster Nozzles
      g.fillStyle(0x334155, 1);
      g.fillRoundedRect(-24, 110, 18, 22, 4);
      g.fillRoundedRect(6, 110, 18, 22, 4);
    } else if (this.selectedHull === 'probe') {
      // Cylindrical / Octagonal Deep Space Probe Hull
      g.fillStyle(primaryColor, 1);
      g.lineStyle(3, secondaryColor, 1);
      g.fillRoundedRect(-55, -90, 110, 180, 20);
      g.strokeRoundedRect(-55, -90, 110, 180, 20);

      // Structural Reinforcement Rings
      g.fillStyle(secondaryColor, 0.9);
      g.fillRect(-55, -30, 110, 14);
      g.fillRect(-55, 30, 110, 14);

      // Main High-Gain Deep Space Dish Antenna
      g.fillStyle(0xf8fafc, 0.95);
      g.lineStyle(2.5, 0x00f2fe, 1);
      g.fillEllipse(0, -115, 75, 26);
      g.strokeEllipse(0, -115, 75, 26);
      g.fillStyle(0x00f2fe, 1);
      g.fillCircle(0, -115, 8);
    } else if (this.selectedHull === 'rover') {
      // Planetary Surface Rover Hull & 6x6 Heavy-Duty Wheels
      // 6 Wheels
      g.fillStyle(0x1e293b, 1);
      g.lineStyle(2, 0x94a3b8, 1);
      // Left 3 wheels
      g.fillRoundedRect(-85, -80, 24, 45, 6);
      g.fillRoundedRect(-85, -20, 24, 45, 6);
      g.fillRoundedRect(-85, 40, 24, 45, 6);
      // Right 3 wheels
      g.fillRoundedRect(61, -80, 24, 45, 6);
      g.fillRoundedRect(61, -20, 24, 45, 6);
      g.fillRoundedRect(61, 40, 24, 45, 6);

      // Chassis Body
      g.fillStyle(primaryColor, 1);
      g.lineStyle(2.5, secondaryColor, 1);
      g.fillRoundedRect(-55, -75, 110, 155, 16);
      g.strokeRoundedRect(-55, -75, 110, 155, 16);

      // Top Deck Plating
      g.fillStyle(secondaryColor, 0.85);
      g.fillRoundedRect(-40, -50, 80, 105, 10);
    }

    // 3. Render Scientific Sensor on Front / Mast
    if (this.selectedSensor === 'telescope') {
      // Optical Space Telescope Lens on Bow
      g.fillStyle(0x0f172a, 1);
      g.lineStyle(2, 0xa855f7, 1);
      g.fillRoundedRect(-14, -145, 28, 45, 6);
      g.strokeRoundedRect(-14, -145, 28, 45, 6);

      // Glowing Purple Optical Lens
      g.fillStyle(0xa855f7, 0.95);
      g.fillCircle(0, -145, 12);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(-3, -148, 4);
    } else if (this.selectedSensor === 'lidar') {
      // 3D Lidar Scanning Turret
      g.fillStyle(0x1e293b, 1);
      g.lineStyle(2, 0x00f2fe, 1);
      g.fillCircle(0, -135, 16);
      g.strokeCircle(0, -135, 16);

      // Dual Scanning Lasers
      g.fillStyle(0x00f2fe, 1);
      g.fillCircle(-6, -135, 4);
      g.fillCircle(6, -135, 4);
    } else if (this.selectedSensor === 'spectrometer') {
      // Atmosphere Chemical Analysis Sensor Dome
      g.fillStyle(0x064e3b, 1);
      g.lineStyle(2, 0x10b981, 1);
      g.fillCircle(0, -135, 15);
      g.strokeCircle(0, -135, 15);
      g.fillStyle(0x34d399, 1);
      g.fillCircle(0, -135, 7);
    }

    // 4. Turkish Roundel / Flag Stamp on Vehicle
    g.fillStyle(0xe11d48, 1);
    g.fillCircle(0, 15, 12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(0, 15, 5);
  }

  private createCategorySelectorTabs(x: number, y: number): void {
    const tabWidth = 180;
    const tabHeight = 65;
    const spacing = 195;

    this.CATEGORIES.forEach((category, idx) => {
      const tabX = x - (spacing * 1.5) + idx * spacing;
      const tabContainer = this.add.container(tabX, y);

      const isActive = this.activeCategory === category.id;
      const aura = this.add.graphics();
      aura.fillStyle(0x9b59b6, isActive ? 0.35 : 0.08);
      aura.fillRoundedRect(-tabWidth / 2 - 4, -tabHeight / 2 - 4, tabWidth + 8, tabHeight + 8, 14);
      aura.name = 'tabAura';

      const bg = this.add.graphics();
      bg.fillStyle(isActive ? 0x9b59b6 : 0x0f172a, 0.95);
      bg.fillRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 12);
      bg.lineStyle(2, isActive ? 0xffffff : 0x475569, 0.8);
      bg.strokeRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 12);
      bg.name = 'tabBg';

      const label = this.createText(0, 0, `${category.icon} ${category.title}`, {
        fontSize: '14px',
        fontStyle: '900',
        color: isActive ? '#FFFFFF' : '#94A3B8',
        align: 'center',
      });
      label.setOrigin(0.5);
      label.name = 'tabLabel';

      tabContainer.add([aura, bg, label]);

      const hitArea = new Phaser.Geom.Rectangle(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight);
      tabContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

      tabContainer.on('pointerdown', () => {
        SoundFx.playTelemetryBeep();
        this.selectCategory(category.id);
      });

      this.categoryTabContainers.set(category.id, tabContainer);
      if (this.phase1Container) {
        this.phase1Container.add(tabContainer);
      }
    });
  }

  private selectCategory(categoryId: 'hull' | 'energy' | 'sensor' | 'livery'): void {
    this.activeCategory = categoryId;

    // Refresh Category Tabs visual state
    this.CATEGORIES.forEach((cat) => {
      const tabCont = this.categoryTabContainers.get(cat.id);
      if (!tabCont) return;

      const isActive = cat.id === categoryId;
      const aura = tabCont.getByName('tabAura') as Phaser.GameObjects.Graphics;
      const bg = tabCont.getByName('tabBg') as Phaser.GameObjects.Graphics;
      const label = tabCont.getByName('tabLabel') as Phaser.GameObjects.Text;

      if (aura) {
        aura.clear();
        aura.fillStyle(0x9b59b6, isActive ? 0.35 : 0.08);
        aura.fillRoundedRect(-94, -36, 188, 73, 14);
      }
      if (bg) {
        bg.clear();
        bg.fillStyle(isActive ? 0x9b59b6 : 0x0f172a, 0.95);
        bg.fillRoundedRect(-90, -32, 180, 65, 12);
        bg.lineStyle(2, isActive ? 0xffffff : 0x475569, 0.8);
        bg.strokeRoundedRect(-90, -32, 180, 65, 12);
      }
      if (label) {
        label.setColor(isActive ? '#FFFFFF' : '#94A3B8');
      }
    });

    // Re-render the option cards for the newly active category
    this.renderCategoryOptionCards();
  }

  private renderCategoryOptionCards(): void {
    if (!this.optionsGroupContainer) return;
    this.optionsGroupContainer.removeAll(true);
    this.optionCardContainers = [];

    const category = this.CATEGORIES.find((c) => c.id === this.activeCategory);
    if (!category) return;

    const startX = 1480;
    const startY = 320;
    const spacing = 165;

    category.options.forEach((opt, idx) => {
      const cardY = startY + idx * spacing;
      const card = this.createOptionCard(startX, cardY, opt, category.id);
      this.optionCardContainers.push(card);
      this.optionsGroupContainer!.add(card);
    });
  }

  private createOptionCard(
    x: number,
    y: number,
    option: CustomizationOption,
    categoryId: 'hull' | 'energy' | 'sensor' | 'livery'
  ): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);
    const width = 760;
    const height = 145;

    const isSelected = this.getIsOptionSelected(categoryId, option.id);

    const aura = this.add.graphics();
    aura.fillStyle(option.accentColor, isSelected ? 0.35 : 0.1);
    aura.fillRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 16);
    aura.name = 'cardAura';

    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    bg.lineStyle(2.5, isSelected ? option.accentColor : 0x334155, isSelected ? 1 : 0.6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    bg.name = 'cardBg';

    // Icon Circle
    const iconCircle = this.add.circle(-width / 2 + 55, 0, 36, option.accentColor, 0.2);
    const iconStroke = this.add.graphics();
    iconStroke.lineStyle(2, option.accentColor, 0.9);
    iconStroke.strokeCircle(-width / 2 + 55, 0, 36);

    const iconText = this.add.text(-width / 2 + 55, 0, option.icon, {
      fontSize: '36px',
    });
    iconText.setOrigin(0.5);

    // Titles
    const titleText = this.createText(-width / 2 + 115, -34, option.name, {
      fontSize: '20px',
      fontStyle: '900',
      color: '#FFFFFF',
      align: 'left',
    });
    titleText.setOrigin(0, 0.5);

    const subText = this.createText(-width / 2 + 115, -6, option.subTitle, {
      fontSize: '14px',
      fontStyle: 'bold',
      color: option.hexColor,
      align: 'left',
    });
    subText.setOrigin(0, 0.5);

    const specText = this.createText(-width / 2 + 115, 26, `⚙️ ${option.specText}`, {
      fontSize: '13px',
      color: '#94A3B8',
      align: 'left',
    });
    specText.setOrigin(0, 0.5);

    // Selected Badge Checkmark
    const checkBadge = this.add.container(width / 2 - 45, 0);
    const checkCircle = this.add.circle(0, 0, 18, isSelected ? option.accentColor : 0x1e293b);
    checkCircle.setStrokeStyle(2, option.accentColor);
    const checkText = this.add.text(0, 0, isSelected ? '✓' : '', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    checkText.setOrigin(0.5);
    checkBadge.add([checkCircle, checkText]);
    checkBadge.name = 'checkBadge';

    card.add([aura, bg, iconCircle, iconStroke, iconText, titleText, subText, specText, checkBadge]);

    // Touch & Pointer Interaction
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    card.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    card.on('pointerover', () => {
      this.tweens.add({ targets: card, scaleX: 1.02, scaleY: 1.02, duration: 100 });
    });
    card.on('pointerout', () => {
      this.tweens.add({ targets: card, scaleX: 1.0, scaleY: 1.0, duration: 100 });
    });
    card.on('pointerdown', () => {
      this.applyOptionSelection(categoryId, option.id);
    });

    return card;
  }

  private getIsOptionSelected(categoryId: string, optionId: string): boolean {
    if (categoryId === 'hull') return this.selectedHull === optionId;
    if (categoryId === 'energy') return this.selectedEnergy === optionId;
    if (categoryId === 'sensor') return this.selectedSensor === optionId;
    if (categoryId === 'livery') return this.selectedLivery === optionId;
    return false;
  }

  private applyOptionSelection(categoryId: string, optionId: string): void {
    SoundFx.playLockSound();
    SoundFx.playTelemetryBeep();

    if (categoryId === 'hull') this.selectedHull = optionId;
    if (categoryId === 'energy') this.selectedEnergy = optionId;
    if (categoryId === 'sensor') this.selectedSensor = optionId;
    if (categoryId === 'livery') this.selectedLivery = optionId;

    // Pulse Assembly Turntable & Spacecraft
    if (this.spacecraftHangarContainer) {
      this.tweens.add({
        targets: this.spacecraftHangarContainer,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 120,
        yoyo: true,
        ease: 'Quad.easeInOut',
      });
    }

    // Re-draw customized spacecraft instantly on canvas
    this.renderCustomizedSpacecraft();

    // Refresh option cards in current tab
    this.renderCategoryOptionCards();

    // Update Pusula commentary
    const category = this.CATEGORIES.find((c) => c.id === categoryId);
    const chosenOption = category?.options.find((o) => o.id === optionId);
    if (chosenOption) {
      this.pusula?.setMessage(`Harika seçim! ${chosenOption.name} monte edildi. ${chosenOption.specText}`);
    }
  }

  private createReadyToLaunchButton(x: number, y: number): void {
    this.readyToLaunchBtn = new GameButton(
      this,
      x,
      y,
      760,
      90,
      'FIRLATMAYA HAZIR  🚀',
      () => {
        this.onReadyToLaunchClicked();
      },
      0x9b59b6,
      '#FFFFFF'
    );
  }

  private onReadyToLaunchClicked(): void {
    SoundFx.playSuccessTone();

    this.pusula?.setMessage('Tüm sistemler yeşil! Geri sayım başlatılıyor. 3, 2, 1... Ateşleme!');

    // Transition smoothly to Phase 2 (Countdown & Rocket Launch Simulation)
    this.transitionToPhase2Launch();
  }

  private transitionToPhase2Launch(): void {
    this.currentPhaseNumber = 2;

    if (this.phase1Container) {
      this.tweens.add({
        targets: this.phase1Container,
        alpha: 0,
        duration: 350,
        onComplete: () => {
          this.phase1Container?.destroy();
          this.phase1Container = undefined;
          this.setupPhase2LaunchSimulation();
        },
      });
    }
  }

  // =========================================================================
  // AŞAMA 2 – FIRLATMA VE YÖRÜNGE SİMÜLASYONU
  // =========================================================================

  private setupPhase2LaunchSimulation(): void {
    this.currentPhaseNumber = 2;
    this.phase2Container = this.add.container(0, 0);

    // 1. Launchpad Platform at bottom center
    const padGraphics = this.add.graphics();
    padGraphics.fillStyle(0x0f172a, 0.95);
    padGraphics.fillRoundedRect(this.GAME_WIDTH / 2 - 250, 880, 500, 160, 20);
    padGraphics.lineStyle(3, 0x9b59b6, 0.9);
    padGraphics.strokeRoundedRect(this.GAME_WIDTH / 2 - 250, 880, 500, 160, 20);

    // 2. Flying Spacecraft Container (Initially at launch pad: x: 960, y: 720)
    this.flyingCraftContainer = this.add.container(this.GAME_WIDTH / 2, 720);
    const craftG = this.add.graphics();
    this.spacecraftHangarGraphics = craftG;
    this.renderCustomizedSpacecraft();
    this.flyingCraftContainer.add(craftG);

    // 3. Thruster Flame Graphics (Layered beneath craft)
    this.launchThrusterGraphics = this.add.graphics();

    // 4. Space Orbit / Cosmic Canvas Layer (Initially invisible)
    this.spaceOrbitGraphics = this.add.graphics();
    this.spaceOrbitGraphics.setAlpha(0);

    // 5. Big Countdown HUD Text (Center Screen)
    this.countdownText = this.createText(this.GAME_WIDTH / 2, 400, '3', {
      fontSize: '120px',
      fontStyle: '900',
      color: '#00F2FE',
      shadow: { color: '#9B59B6', blur: 25, fill: true },
    });
    this.countdownText.setOrigin(0.5);

    this.phase2Container.add([
      padGraphics,
      this.spaceOrbitGraphics,
      this.launchThrusterGraphics,
      this.flyingCraftContainer,
      this.countdownText,
    ]);

    // Play 3... 2... 1... Countdown Sequence
    this.runCountdownSequence();
  }

  private runCountdownSequence(): void {
    SoundFx.playCountdownBeep(false);

    // Step 3
    this.tweens.add({
      targets: this.countdownText,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 500,
      yoyo: true,
      onComplete: () => {
        // Step 2
        if (!this.countdownText) return;
        this.countdownText.setText('2');
        this.countdownText.setColor('#FFD700');
        SoundFx.playCountdownBeep(false);

        this.tweens.add({
          targets: this.countdownText,
          scaleX: 1.4,
          scaleY: 1.4,
          duration: 500,
          yoyo: true,
          onComplete: () => {
            // Step 1
            if (!this.countdownText) return;
            this.countdownText.setText('1');
            this.countdownText.setColor('#FF5722');
            SoundFx.playCountdownBeep(false);

            this.tweens.add({
              targets: this.countdownText,
              scaleX: 1.4,
              scaleY: 1.4,
              duration: 500,
              yoyo: true,
              onComplete: () => {
                // IGNITION / BLAST OFF!
                if (!this.countdownText) return;
                this.countdownText.setText('🚀 ATEŞLEME!');
                this.countdownText.setColor('#34D399');
                SoundFx.playCountdownBeep(true);

                this.tweens.add({
                  targets: this.countdownText,
                  alpha: 0,
                  y: 280,
                  duration: 800,
                  onComplete: () => {
                    this.countdownText?.destroy();
                    this.countdownText = undefined;
                  },
                });

                this.launchRocketToOrbit();
              },
            });
          },
        });
      },
    });
  }

  private launchRocketToOrbit(): void {
    SoundFx.playRocketBlast();

    // Camera Shake on Thruster Ignition
    this.cameras.main.shake(1600, 0.008);

    // Animate Thruster Flames & Particles
    let flameCounter = 0;
    const flameTimer = this.time.addEvent({
      delay: 50,
      callback: () => {
        if (!this.launchThrusterGraphics || !this.flyingCraftContainer) return;
        this.launchThrusterGraphics.clear();

        flameCounter++;
        const cx = this.flyingCraftContainer.x;
        const cy = this.flyingCraftContainer.y + 110;
        const flameHeight = Phaser.Math.Between(90, 160);

        // Outer Orange Flame
        this.launchThrusterGraphics.fillStyle(0xff5722, 0.9);
        this.launchThrusterGraphics.fillTriangle(cx - 30, cy, cx + 30, cy, cx, cy + flameHeight);

        // Inner Yellow Core
        this.launchThrusterGraphics.fillStyle(0xffeb3b, 1);
        this.launchThrusterGraphics.fillTriangle(cx - 16, cy, cx + 16, cy, cx, cy + flameHeight * 0.7);

        // Center White Plasma
        this.launchThrusterGraphics.fillStyle(0xffffff, 1);
        this.launchThrusterGraphics.fillTriangle(cx - 8, cy, cx + 8, cy, cx, cy + flameHeight * 0.4);
      },
      repeat: 35,
    });

    // Spacecraft vertical blast off up into the sky
    if (this.flyingCraftContainer) {
      this.tweens.add({
        targets: this.flyingCraftContainer,
        y: -300,
        scaleX: 0.75,
        scaleY: 0.75,
        duration: 1800,
        ease: 'Quad.easeIn',
        onComplete: () => {
          flameTimer.remove();
          this.launchThrusterGraphics?.clear();

          // Transition to Deep Orbit View!
          this.enterDeepSpaceOrbit();
        },
      });
    }
  }

  private enterDeepSpaceOrbit(): void {
    SoundFx.playSpaceChime();

    // Render Deep Space Orbit Visuals (Starfield, Blue Earth Curvature, Moon)
    if (this.spaceOrbitGraphics) {
      const g = this.spaceOrbitGraphics;
      g.clear();

      // Deep Blue Earth Horizon Curvature
      g.fillStyle(0x0284c7, 0.9);
      g.fillCircle(this.GAME_WIDTH / 2, 1700, 1100);
      g.lineStyle(6, 0x38bdf8, 0.95);
      g.strokeCircle(this.GAME_WIDTH / 2, 1700, 1100);

      // Atmospheric Atmosphere Glow
      g.fillStyle(0x00f2fe, 0.15);
      g.fillCircle(this.GAME_WIDTH / 2, 1700, 1120);

      // Moon in upper right corner
      g.fillStyle(0xe2e8f0, 0.95);
      g.fillCircle(1650, 180, 60);
      g.fillStyle(0x94a3b8, 0.4);
      g.fillCircle(1635, 165, 14);
      g.fillCircle(1665, 195, 10);

      // Cosmic Star Clusters
      g.fillStyle(0xffffff, 0.9);
      for (let i = 0; i < 70; i++) {
        g.fillCircle(Phaser.Math.Between(50, this.GAME_WIDTH - 50), Phaser.Math.Between(50, 650), Phaser.Math.FloatBetween(1, 3));
      }

      this.tweens.add({
        targets: this.spaceOrbitGraphics,
        alpha: 1,
        duration: 600,
      });
    }

    // Spacecraft glides into center orbit (x: 960, y: 460) from bottom
    if (this.flyingCraftContainer) {
      this.flyingCraftContainer.setPosition(this.GAME_WIDTH / 2, 850);
      this.flyingCraftContainer.setScale(1.1);
      this.flyingCraftContainer.setAngle(0);

      this.tweens.add({
        targets: this.flyingCraftContainer,
        y: 460,
        duration: 1600,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          // Floating idle orbit animation
          this.tweens.add({
            targets: this.flyingCraftContainer,
            y: 445,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });

          // Telemetry signals emitting from vehicle
          this.startOrbitTelemetrySignals();
        },
      });
    }

    // Create Live Orbit Telemetry HUD at bottom of screen
    this.createOrbitTelemetryHUD();
  }

  private startOrbitTelemetrySignals(): void {
    const signalGraphics = this.add.graphics();
    if (this.phase2Container) {
      this.phase2Container.add(signalGraphics);
    }

    let waveRadius = 40;
    this.orbitSignalTween = this.tweens.addCounter({
      from: 40,
      to: 260,
      duration: 1800,
      repeat: -1,
      onUpdate: (tween) => {
        signalGraphics.clear();
        waveRadius = tween.getValue() || 40;
        const alpha = Math.max(0, 1 - (waveRadius / 260));

        signalGraphics.lineStyle(2.5, 0x00f2fe, alpha);
        signalGraphics.strokeCircle(this.GAME_WIDTH / 2, 460, waveRadius);
        signalGraphics.lineStyle(1.5, 0x9b59b6, alpha * 0.7);
        signalGraphics.strokeCircle(this.GAME_WIDTH / 2, 460, waveRadius * 0.7);
      },
    });

    this.pusula?.setMessage('Yörüngeye başarıyla oturuldu! Tüm bilimsel telemetri verileri yer istasyonuna aktarılıyor.');

    // Proceed to Phase 3 (Final Certificate Modal) after 4.2s
    this.time.delayedCall(4200, () => {
      this.showFinalCertificateScreen();
    });
  }

  private createOrbitTelemetryHUD(): void {
    this.telemetryHUDContainer = this.add.container(this.GAME_WIDTH / 2, 900);

    const width = 1300;
    const height = 110;

    const bg = this.add.graphics();
    bg.fillStyle(0x0a1128, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    bg.lineStyle(2, 0x00f2fe, 0.9);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);

    const telemetryText = this.createText(
      0,
      0,
      '🛰️ YÖRÜNGE İRTİFASI: 420 KM (LEO)  •  HIZ: 27,600 KM/S (YÖRÜNGE HIZI)\n📡 DURUM: TÜM BİLİMSEL SİSTEMLER AKTİF & CANLI VERİ AKTARILIYOR ✅',
      {
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#38BDF8',
        align: 'center',
        lineSpacing: 8,
      }
    );
    telemetryText.setOrigin(0.5);

    this.telemetryHUDContainer.add([bg, telemetryText]);
    this.telemetryHUDContainer.setAlpha(0);
    if (this.phase2Container) {
      this.phase2Container.add(this.telemetryHUDContainer);
    }

    this.tweens.add({
      targets: this.telemetryHUDContainer,
      alpha: 1,
      y: 890,
      duration: 500,
    });
  }

  // =========================================================================
  // AŞAMA 3 – FİNAL SERTİFİKASI & TEKNOLOJİ ELÇİSİ BELGESİ
  // =========================================================================

  private showFinalCertificateScreen(): void {
    this.currentPhaseNumber = 3;
    SoundFx.playVictoryFanfare();

    // Mark Module 6 Completed in GameStore!
    GameStore.completeModule('uzay_teknolojileri');

    const modal = this.add.container(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2);
    modal.setDepth(200);

    // 1. Dark Cosmic Backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x060814, 0.92);
    backdrop.fillRect(-this.GAME_WIDTH / 2, -this.GAME_HEIGHT / 2, this.GAME_WIDTH, this.GAME_HEIGHT);

    // 2. Grand Certificate Frame
    const width = 1000;
    const height = 720;

    const modalBg = this.add.graphics();
    modalBg.fillStyle(0x0a1128, 0.98);
    modalBg.fillRoundedRect(-width / 2, -height / 2, width, height, 26);
    modalBg.lineStyle(3.5, 0xffd700, 0.95);
    modalBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 26);

    // Outer Aura Glow
    const outerAura = this.add.graphics();
    outerAura.fillStyle(0x9b59b6, 0.2);
    outerAura.fillRoundedRect(-width / 2 - 12, -height / 2 - 12, width + 24, height + 24, 32);

    // Certificate Inner Border
    const innerBorder = this.add.graphics();
    innerBorder.lineStyle(1.5, 0x00f2fe, 0.6);
    innerBorder.strokeRoundedRect(-width / 2 + 16, -height / 2 + 16, width - 32, height - 32, 20);

    // 3. Header Banner: "MİLLÎ TEKNOLOJİ ELÇİSİ 🚀"
    const headerText = this.createText(0, -height / 2 + 65, 'MİLLÎ TEKNOLOJİ ELÇİSİ 🚀', {
      fontSize: '40px',
      fontStyle: '900',
      color: '#FFD700',
      shadow: { color: '#00F2FE', blur: 20, fill: true },
    });
    headerText.setOrigin(0.5);

    const subText = this.createText(0, -height / 2 + 120, 'Geleceğin Uzay Kâşifi Başarı Sertifikası', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#00F2FE',
    });
    subText.setOrigin(0.5);

    // 4. Passport / TEKNOFEST Gold Stamp
    if (this.textures.exists('passport_stamp')) {
      const stampImg = this.add.image(-width / 2 + 110, -height / 2 + 115, 'passport_stamp');
      stampImg.setDisplaySize(95, 95);
      modal.add(stampImg);
    }

    // 5. Epic Accomplishment Text
    const summaryText = this.createText(
      0,
      -height / 2 + 195,
      'Tebrikler Genç Mühendis!\nGöbeklitepe’nin kadim taşlarından gökyüzüne, demir çağından uzay çağına uzanan\n6 modüllük medeniyet ve millî teknoloji yolculuğunu başarıyla tamamladın.\nTasarladığın araç, geleceğin uzay keşiflerine öncülük edecek!',
      {
        fontSize: '18px',
        color: '#F8FAFC',
        align: 'center',
        lineSpacing: 8,
      }
    );
    summaryText.setOrigin(0.5);

    // 6. Custom Spacecraft Spec Sheet Box
    const specBox = this.add.graphics();
    specBox.fillStyle(0x0f172a, 0.95);
    specBox.fillRoundedRect(-width / 2 + 60, -35, width - 120, 130, 16);
    specBox.lineStyle(1.5, 0x9b59b6, 0.8);
    specBox.strokeRoundedRect(-width / 2 + 60, -35, width - 120, 130, 16);

    const hullOpt = this.CATEGORIES[0].options.find((o) => o.id === this.selectedHull);
    const energyOpt = this.CATEGORIES[1].options.find((o) => o.id === this.selectedEnergy);
    const sensorOpt = this.CATEGORIES[2].options.find((o) => o.id === this.selectedSensor);
    const liveryOpt = this.CATEGORIES[3].options.find((o) => o.id === this.selectedLivery);

    const specTitle = this.createText(0, -15, '🛰️ ÖZEL TASARIM UZAY ARACI KÜNYESİ', {
      fontSize: '16px',
      fontStyle: '900',
      color: '#FFD700',
    });
    specTitle.setOrigin(0.5);

    const specDetails = this.createText(
      0,
      40,
      `Gövde: ${hullOpt?.name || ''}   •   Enerji: ${energyOpt?.name || ''}\nSensör: ${sensorOpt?.name || ''}   •   Kaplama: ${liveryOpt?.name || ''}`,
      {
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#38BDF8',
        align: 'center',
        lineSpacing: 8,
      }
    );
    specDetails.setOrigin(0.5);

    // 7. 3 Assessment Star Categories (Gözlem, Ustalık, Mühendislik)
    const skillsContainer = this.add.container(0, 160);
    const skills = [
      { name: 'Gözlem', stars: '⭐⭐⭐' },
      { name: 'Ustalık', stars: '⭐⭐⭐' },
      { name: 'Mühendislik', stars: '⭐⭐⭐' },
    ];

    skills.forEach((skill, idx) => {
      const x = (idx - 1) * 260;
      const sBox = this.add.graphics();
      sBox.fillStyle(0x0f172a, 0.9);
      sBox.fillRoundedRect(x - 110, -32, 220, 64, 12);
      sBox.lineStyle(1.5, 0x38bdf8, 0.7);
      sBox.strokeRoundedRect(x - 110, -32, 220, 64, 12);

      const label = this.createText(x, -12, skill.name, {
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#94A3B8',
      });
      label.setOrigin(0.5);

      const stars = this.createText(x, 14, skill.stars, {
        fontSize: '20px',
      });
      stars.setOrigin(0.5);

      skillsContainer.add([sBox, label, stars]);
    });

    // 8. Dual Action Buttons: "HARİTAYA DÖN" & "BAŞA DÖN (YENİ OYUNCU)"
    const returnMapBtn = new GameButton(
      this,
      240,
      275,
      420,
      90,
      'HARİTAYA DÖN  ➔',
      () => {
        this.cameras.main.fadeOut(350, 7, 11, 25);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start(SceneKeys.WORLD_MAP);
        });
      },
      0x00f2fe,
      '#070B19'
    );

    const restartBtn = new GameButton(
      this,
      -240,
      275,
      420,
      90,
      'BAŞA DÖN (YENİ OYUNCU)  🔄',
      () => {
        GameStore.resetProgress();
        this.cameras.main.fadeOut(350, 7, 11, 25);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start(SceneKeys.START);
        });
      },
      0x9b59b6,
      '#FFFFFF'
    );

    modal.add([
      backdrop,
      outerAura,
      modalBg,
      innerBorder,
      headerText,
      subText,
      summaryText,
      specBox,
      specTitle,
      specDetails,
      skillsContainer,
      returnMapBtn,
      restartBtn,
    ]);

    // Modal Entrance Scale Animation
    modal.setScale(0.7);
    modal.setAlpha(0);
    this.tweens.add({
      targets: modal,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1.0,
      duration: 350,
      ease: 'Back.easeOut',
    });
  }
}
