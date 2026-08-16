import Phaser from 'phaser';
import { BaseScene } from '../BaseScene';
import { SceneKeys } from '../../../types/game';
import { GameStore } from '../../state/GameStore';
import { PusulaCharacter } from '../../objects/PusulaCharacter';
import { GameButton } from '../../objects/GameButton';
import { SoundFx } from '../../utils/audio';
import { EventBus } from '../../state/EventBus';

// Safe TypeScript Asset Imports
import islandMilliTeknoUrl from '../../../assets/svg/island_milli_tekno.svg';
import passportStampUrl from '../../../assets/svg/passport_stamp.svg';

interface MissionData {
  id: string;
  badge: string;
  title: string;
  targetArea: string;
  objective: string;
  requiredSensorId: 'thermal' | 'lidar' | 'multispectral';
  scanReportTitle: string;
  scanReportDetail: string;
  scanStatusBadge: string;
  educationalTip: string;
}

interface SensorData {
  id: 'thermal' | 'lidar' | 'multispectral';
  name: string;
  code: string;
  spec: string;
  icon: string;
  accentColor: number;
  hexColor: string;
  x: number;
  y: number;
}

interface RouteOption {
  id: 'A' | 'B' | 'C';
  title: string;
  code: string;
  batteryUsage: string;
  batteryPercent: number;
  windEffect: string;
  riskStatus: string;
  isCorrect: boolean;
  color: number;
  hexColor: string;
  points: Phaser.Math.Vector2[];
}

export class MilliTeknolojiScene extends BaseScene {
  // Game State
  private currentPhaseNumber = 1;
  private elapsedSeconds = 0;
  private errorCount = 0;
  private isCompleted = false;
  private timerEvent?: Phaser.Time.TimerEvent;
  private timerText?: Phaser.GameObjects.Text;
  private pusula?: PusulaCharacter;

  // Selected Mission
  private currentMission!: MissionData;
  private readonly MISSIONS: MissionData[] = [
    {
      id: 'forest_fire',
      badge: 'ÇEVRE & DOĞAL YAŞAM KORUMA',
      title: 'Orman Yangını Erken Uyarı Tespiti',
      targetArea: 'Ege & Akdeniz Orman Kuşağı (Sektör 4)',
      objective: 'Yüksek sıcaklık odaklarını ve örtülü duman kaynaklarını anlık tespit et.',
      requiredSensorId: 'thermal',
      scanReportTitle: '🔥 3 SICAK NOKTA TESPİT EDİLDİ',
      scanReportDetail: 'Yangın yayılma vektörü ve GPS koordinatları Orman Genel Müdürlüğü Harekat Merkezine aktarıldı.',
      scanStatusBadge: 'ERKEN MÜDAHALE PROTOKOLÜ BAŞLATILDI',
      educationalTip: 'Doğru faydalı yük seçimi, kritik görev başarısının ilk adımıdır.',
    },
    {
      id: 'search_rescue',
      badge: 'İNSANİ YARDIM & AFET YÖNETİMİ',
      title: 'Afet Bölgesi Arama-Kurtarma',
      targetArea: 'Afet Koordinasyon ve Tahliye Sahası',
      objective: 'Gece şartlarında hayatta kalanları, güvenli geçiş koridorlarını ve ısı izlerini haritalandır.',
      requiredSensorId: 'lidar',
      scanReportTitle: '📍 2 GÜVENLİ TAHLİYE VE ISI İZİ TESPİT EDİLDİ',
      scanReportDetail: '3D yüzey haritası ve canlı koordinatlar AFAD ve Sahra Arama-Kurtarma ekiplerine aktarıldı.',
      scanStatusBadge: 'KURTARMA EKİPLERİ YÖNLENDİRİLDİ',
      educationalTip: 'Lidar ve gece görüş sensörleri, sıfır ışıkta bile hassas 3D koordinat tespiti sağlar.',
    },
    {
      id: 'agricultural',
      badge: 'SÜRDÜRÜLEBİLİR TARIM & GIDA GÜVENLİĞİ',
      title: 'Tarımsal Alan & Bitki Sağlığı Analizi',
      targetArea: 'Konya & Çukurova Tarımsal Havzası',
      objective: 'Geniş tarım arazilerinde klorofil seviyesini, kuraklık riskini ve gübre ihtiyacını belirle.',
      requiredSensorId: 'multispectral',
      scanReportTitle: '🌱 %94 KLOROFİL SAĞLIK DÜZEYİ HARİTALANDI',
      scanReportDetail: 'Optimum sulama ve lokal gübreleme reçetesi Çiftçi Dijital Bilgi Sistemine aktarıldı.',
      scanStatusBadge: 'VERİMLİLİK RAPORU İLETİLDİ',
      educationalTip: 'Rüzgâr ve enerji optimizasyonu, İHA\'ların havada kalış süresini artırır.',
    },
  ];

  // Sensor Payload Inventory
  private readonly SENSORS: SensorData[] = [
    {
      id: 'thermal',
      name: 'Termal Kamera (FLIR)',
      code: 'SEN-TH70',
      spec: 'Kızılötesi & Isı Haritalama',
      icon: '🌡️',
      accentColor: 0xff5722,
      hexColor: '#FF5722',
      x: 520,
      y: 860,
    },
    {
      id: 'lidar',
      name: 'Lidar & Gece Görüş',
      code: 'SEN-LD99',
      spec: '3D Lazer Tarama & Gece Optiği',
      icon: '📡',
      accentColor: 0x00f2fe,
      hexColor: '#00F2FE',
      x: 960,
      y: 860,
    },
    {
      id: 'multispectral',
      name: 'Multispektral Kamera',
      code: 'SEN-MS40',
      spec: 'NDVI Klorofil & Bitki Spektrumu',
      icon: '🌱',
      accentColor: 0x10b981,
      hexColor: '#10B981',
      x: 1400,
      y: 860,
    },
  ];

  // Phase 1 UI Elements
  private phase1Container?: Phaser.GameObjects.Container;
  private sensorContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private payloadBaySocket?: Phaser.GameObjects.Container;
  private socketGlow?: Phaser.GameObjects.Graphics;
  private isPayloadInstalled = false;

  // Phase 2 UI Elements
  private phase2Container?: Phaser.GameObjects.Container;
  private routeOptions: RouteOption[] = [];
  private selectedRouteId: 'A' | 'B' | 'C' | null = null;
  private routeCardContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private routePathGraphics?: Phaser.GameObjects.Graphics;
  private windStreamGraphics?: Phaser.GameObjects.Graphics;
  private startMissionBtn?: GameButton;

  // Phase 3 UI Elements
  private phase3Container?: Phaser.GameObjects.Container;
  private uavFlightContainer?: Phaser.GameObjects.Container;
  private uavWingGlowLeft?: Phaser.GameObjects.Arc;
  private uavWingGlowRight?: Phaser.GameObjects.Arc;
  private uavStrobeBeacon?: Phaser.GameObjects.Arc;
  private radarScanGraphics?: Phaser.GameObjects.Graphics;
  private telemetryStreamContainer?: Phaser.GameObjects.Container;
  private flightPathCurve?: Phaser.Curves.Spline;
  private flightTween?: Phaser.Tweens.Tween;
  private flightProgress = { t: 0 };
  private scanningLoopTween?: Phaser.Tweens.Tween;

  constructor() {
    super(SceneKeys.MILLI_TEKNOLOJI);
  }

  preload(): void {
    if (!this.textures.exists('island_milli_tekno')) {
      this.load.image('island_milli_tekno', islandMilliTeknoUrl);
    }
    if (!this.textures.exists('passport_stamp')) {
      this.load.image('passport_stamp', passportStampUrl);
    }
  }

  create(): void {
    // Reset state
    this.currentPhaseNumber = 1;
    this.elapsedSeconds = 0;
    this.errorCount = 0;
    this.isCompleted = false;
    this.isPayloadInstalled = false;
    this.selectedRouteId = null;
    this.sensorContainers.clear();
    this.routeCardContainers.clear();

    // Select random humanitarian mission
    const randomIndex = Phaser.Math.Between(0, this.MISSIONS.length - 1);
    this.currentMission = this.MISSIONS[randomIndex];

    this.cameras.main.fadeIn(350, 7, 11, 25);

    // Lifecycle cleanup
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUpScene, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanUpScene, this);

    // 1. Futuristic Command & Control Grid Environment
    this.createCommandCenterEnvironment();

    // 2. Mission Header & Status Telemetry Bar
    this.createHeaderUI();

    // 3. Setup Phase 1: Payload (Sensor) Assembly
    this.setupPhase1PayloadAssembly();

    // 4. Pusula Companion Character (Bottom Left)
    this.pusula = new PusulaCharacter(
      this,
      220,
      820,
      `Görevin: ${this.currentMission.title}. İnsani hedefe uygun sensör modülünü İHA montaj yuvasına yerleştir!`
    );

    // 5. Elapsed Timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.isCompleted) {
          this.elapsedSeconds++;
          this.updateTimerUI();
        }
      },
      loop: true,
    });

    // 6. Corner Back Button
    this.createCornerBackButton();

    EventBus.emit('current-scene-ready', SceneKeys.MILLI_TEKNOLOJI);
  }

  private cleanUpScene(): void {
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = undefined;
    }
    if (this.flightTween) {
      this.flightTween.stop();
      this.flightTween = undefined;
    }
    if (this.scanningLoopTween) {
      this.scanningLoopTween.stop();
      this.scanningLoopTween = undefined;
    }
    this.tweens.killAll();
    this.input.off('dragstart');
    this.input.off('drag');
    this.input.off('dragend');
  }

  // =========================================================================
  // ENVIRONMENT & HEADER
  // =========================================================================

  private createCommandCenterEnvironment(): void {
    const bg = this.add.graphics();
    // Deep Space Navy Base
    bg.fillStyle(0x060913, 1);
    bg.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Tech Grid Pattern
    bg.lineStyle(1, 0x00f2fe, 0.05);
    const gridSize = 60;
    for (let x = 0; x < this.GAME_WIDTH; x += gridSize) {
      bg.lineBetween(x, 0, x, this.GAME_HEIGHT);
    }
    for (let y = 0; y < this.GAME_HEIGHT; y += gridSize) {
      bg.lineBetween(0, y, this.GAME_WIDTH, y);
    }

    // Radial Ambience Glows
    const ambientGlow = this.add.graphics();
    ambientGlow.fillStyle(0x0284c7, 0.08);
    ambientGlow.fillCircle(this.GAME_WIDTH / 2, 450, 600);

    ambientGlow.fillStyle(0x00f2fe, 0.04);
    ambientGlow.fillCircle(200, 200, 350);
    ambientGlow.fillCircle(1720, 300, 400);

    // Command Center Frame Corners
    const frameG = this.add.graphics();
    frameG.lineStyle(2, 0x00f2fe, 0.4);

    // Top-Left Corner
    frameG.beginPath();
    frameG.moveTo(30, 70);
    frameG.lineTo(30, 30);
    frameG.lineTo(70, 30);
    frameG.strokePath();

    // Top-Right Corner
    frameG.beginPath();
    frameG.moveTo(1890, 70);
    frameG.lineTo(1890, 30);
    frameG.lineTo(1850, 30);
    frameG.strokePath();

    // Bottom-Left Corner
    frameG.beginPath();
    frameG.moveTo(30, 1010);
    frameG.lineTo(30, 1050);
    frameG.lineTo(70, 1050);
    frameG.strokePath();

    // Bottom-Right Corner
    frameG.beginPath();
    frameG.moveTo(1890, 1010);
    frameG.lineTo(1890, 1050);
    frameG.lineTo(1850, 1050);
    frameG.strokePath();
  }

  private createHeaderUI(): void {
    const headerContainer = this.add.container(this.GAME_WIDTH / 2, 60);

    // Main Header HUD Frame
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a1128, 0.94);
    headerBg.fillRoundedRect(-650, -40, 1300, 80, 18);
    headerBg.lineStyle(2, 0x00f2fe, 0.8);
    headerBg.strokeRoundedRect(-650, -40, 1300, 80, 18);

    // Subtle Accent Glow
    const headerGlow = this.add.graphics();
    headerGlow.fillStyle(0x00f2fe, 0.1);
    headerGlow.fillRoundedRect(-656, -46, 1312, 92, 22);

    // System Title
    const titleText = this.createText(-610, -18, '✈️ TEKNOFEST MİLLÎ TEKNOLOJİ GÖREV PLANLAMA', {
      fontSize: '24px',
      fontStyle: '900',
      color: '#00F2FE',
      align: 'left',
    });
    titleText.setOrigin(0, 0.5);

    // Mission Category Badge
    const categoryBadge = this.createText(-610, 14, `GÖREV: ${this.currentMission.title.toUpperCase()} (AŞAMA ${this.currentPhaseNumber}/3)`, {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FCD34D',
      align: 'left',
    });
    categoryBadge.setOrigin(0, 0.5);

    // Telemetry Status Indicator (Right side of header)
    const telemetryBox = this.add.graphics();
    telemetryBox.fillStyle(0x0f172a, 0.9);
    telemetryBox.fillRoundedRect(320, -28, 300, 56, 12);
    telemetryBox.lineStyle(1.5, 0x10b981, 0.7);
    telemetryBox.strokeRoundedRect(320, -28, 300, 56, 12);

    // Pulsing Telemetry Dot
    const teleDot = this.add.circle(345, 0, 6, 0x10b981);
    this.tweens.add({
      targets: teleDot,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.timerText = this.createText(470, 0, 'SÜRE: 00:00  •  LINK: %99', {
      fontSize: '18px',
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
    this.timerText.setText(`SÜRE: ${timeStr}  •  LINK: %99`);
  }

  private createCornerBackButton(): void {
    const btn = this.add.container(65, 60);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a1128, 0.9);
    bg.fillCircle(0, 0, 30);
    bg.lineStyle(2, 0x00f2fe, 0.8);
    bg.strokeCircle(0, 0, 30);

    const iconText = this.add.text(0, 0, '◄', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '24px',
      color: '#00F2FE',
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
  // AŞAMA 1 – FAYDALI YÜK (SENSÖR) MONTAJI
  // =========================================================================

  private setupPhase1PayloadAssembly(): void {
    this.currentPhaseNumber = 1;
    this.phase1Container = this.add.container(0, 0);

    // 1. Mission Briefing HUD Card (Top Center)
    const missionCard = this.createMissionBriefingCard(this.GAME_WIDTH / 2, 185);

    // 2. UAV Fuselage Vector Drawing (Center Stage)
    const uavGraphicContainer = this.createUAVFuselageGraphic(this.GAME_WIDTH / 2, 450);

    // 3. Payload Bay Gimbal Socket (Drop Zone Target)
    this.createPayloadBaySocket(this.GAME_WIDTH / 2, 480);

    // 4. Sensor Inventory Tray & Draggable Modules (Bottom Stage)
    this.createSensorInventoryTray();

    this.phase1Container.add([missionCard, uavGraphicContainer]);
  }

  private createMissionBriefingCard(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const width = 1100;
    const height = 110;

    const bg = this.add.graphics();
    bg.fillStyle(0x0a1128, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(2, 0x38bdf8, 0.6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

    // Mission Badge Tag
    const tagBg = this.add.graphics();
    tagBg.fillStyle(0x0284c7, 0.3);
    tagBg.fillRoundedRect(-width / 2 + 20, -height / 2 + 14, 280, 28, 8);
    tagBg.lineStyle(1, 0x38bdf8, 0.8);
    tagBg.strokeRoundedRect(-width / 2 + 20, -height / 2 + 14, 280, 28, 8);

    const tagText = this.createText(-width / 2 + 160, -height / 2 + 28, `🏷️ ${this.currentMission.badge}`, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#38BDF8',
    });
    tagText.setOrigin(0.5);

    // Educational Tip Banner
    const tipText = this.createText(width / 2 - 20, -height / 2 + 28, `💡 ${this.currentMission.educationalTip}`, {
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#FCD34D',
      align: 'right',
    });
    tipText.setOrigin(1, 0.5);

    // Mission Details Text
    const descText = this.createText(
      0,
      18,
      `🎯 HEDEF SAHA: ${this.currentMission.targetArea}\n📋 GÖREV TANIMI: ${this.currentMission.objective}`,
      {
        fontSize: '18px',
        color: '#E2E8F0',
        align: 'center',
        lineSpacing: 6,
      }
    );
    descText.setOrigin(0.5);

    container.add([bg, tagBg, tagText, tipText, descText]);
    return container;
  }

  private createUAVFuselageGraphic(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const g = this.add.graphics();

    // 1. High-Tech Holographic Target Ring
    g.lineStyle(1.5, 0x00f2fe, 0.25);
    g.strokeCircle(0, 0, 220);
    g.lineStyle(1, 0x00f2fe, 0.15);
    g.strokeCircle(0, 0, 280);

    // Crosshairs
    g.lineStyle(1, 0x00f2fe, 0.3);
    g.lineBetween(-300, 0, 300, 0);
    g.lineBetween(0, -220, 0, 220);

    // 2. High-Tech Turkish UAV (Bayraktar/Aksungur/Anka Silhouette) Vector Drawing
    // Main Wing Swept Silhouette
    g.fillStyle(0x1e293b, 0.95);
    g.lineStyle(2.5, 0x38bdf8, 0.9);
    const wingPoly = [
      { x: 0, y: -90 },
      { x: 380, y: -20 },
      { x: 380, y: 15 },
      { x: 60, y: 50 },
      { x: 0, y: 140 },
      { x: -60, y: 50 },
      { x: -380, y: 15 },
      { x: -380, y: -20 },
    ];
    g.beginPath();
    g.moveTo(wingPoly[0].x, wingPoly[0].y);
    for (let i = 1; i < wingPoly.length; i++) {
      g.lineTo(wingPoly[i].x, wingPoly[i].y);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();

    // Fuselage Central Body
    g.fillStyle(0x0f172a, 1);
    g.lineStyle(2.5, 0x00f2fe, 0.95);
    const fuselagePoly = [
      { x: 0, y: -130 },
      { x: 38, y: -80 },
      { x: 42, y: 60 },
      { x: 22, y: 160 },
      { x: -22, y: 160 },
      { x: -42, y: 60 },
      { x: -38, y: -80 },
    ];
    g.beginPath();
    g.moveTo(fuselagePoly[0].x, fuselagePoly[0].y);
    for (let i = 1; i < fuselagePoly.length; i++) {
      g.lineTo(fuselagePoly[i].x, fuselagePoly[i].y);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();

    // V-Tail Twin Booms
    g.lineStyle(3, 0x475569, 1);
    g.lineBetween(-40, 50, -80, 180);
    g.lineBetween(40, 50, 80, 180);

    // V-Tail Fins
    g.fillStyle(0x0284c7, 0.9);
    g.fillTriangle(-80, 180, -95, 210, -65, 210);
    g.fillTriangle(80, 180, 95, 210, 65, 210);

    // Red Crescent & Star Roundel Badge on Wings
    g.fillStyle(0xe11d48, 1);
    g.fillCircle(-240, 0, 14);
    g.fillCircle(240, 0, 14);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-240, 0, 6);
    g.fillCircle(240, 0, 6);

    // Wingtip Navigation LED indicators
    g.fillStyle(0xef4444, 1); // Red Port LED
    g.fillCircle(-380, -2, 5);
    g.fillStyle(0x10b981, 1); // Green Starboard LED
    g.fillCircle(380, -2, 5);

    // Technical Labels on Canvas
    const labelUAV = this.createText(0, -155, 'BAYRAKTAR T-92 OTONOM İHA PLATFORMU', {
      fontSize: '15px',
      fontStyle: '900',
      color: '#38BDF8',
      align: 'center',
    });
    labelUAV.setOrigin(0.5);

    container.add([g, labelUAV]);
    return container;
  }

  private createPayloadBaySocket(x: number, y: number): void {
    this.payloadBaySocket = this.add.container(x, y);

    this.socketGlow = this.add.graphics();
    this.socketGlow.fillStyle(0x00f2fe, 0.2);
    this.socketGlow.fillCircle(0, 0, 60);

    const socketRing = this.add.graphics();
    socketRing.lineStyle(3, 0x00f2fe, 0.9);
    socketRing.strokeCircle(0, 0, 48);
    socketRing.lineStyle(1.5, 0xffffff, 0.6);
    socketRing.strokeCircle(0, 0, 40);

    // Pulsing Target Crosshair
    socketRing.lineBetween(-20, 0, 20, 0);
    socketRing.lineBetween(0, -20, 0, 20);

    const socketLabel = this.createText(0, 65, '▼ FAYDALI YÜK MONTAJ YUVASI ▼', {
      fontSize: '14px',
      fontStyle: '900',
      color: '#00F2FE',
    });
    socketLabel.setOrigin(0.5);

    // Continuous pulse tween
    this.tweens.add({
      targets: this.socketGlow,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0.4,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.payloadBaySocket.add([this.socketGlow, socketRing, socketLabel]);
    if (this.phase1Container) {
      this.phase1Container.add(this.payloadBaySocket);
    }
  }

  private createSensorInventoryTray(): void {
    const trayBg = this.add.graphics();
    trayBg.fillStyle(0x0a1128, 0.85);
    trayBg.fillRoundedRect(this.GAME_WIDTH / 2 - 620, 755, 1240, 230, 24);
    trayBg.lineStyle(2, 0x00f2fe, 0.4);
    trayBg.strokeRoundedRect(this.GAME_WIDTH / 2 - 620, 755, 1240, 230, 24);

    const trayLabel = this.createText(this.GAME_WIDTH / 2, 780, '— FAYDALI YÜK SENSÖR MODÜLÜ ENVANTERİ (SÜRÜKLE & BIRAK) —', {
      fontSize: '15px',
      fontStyle: '900',
      color: '#94A3B8',
    });
    trayLabel.setOrigin(0.5);

    if (this.phase1Container) {
      this.phase1Container.add([trayBg, trayLabel]);
    }

    // Render 3 Sensor Modules
    this.SENSORS.forEach((sensor) => {
      const card = this.createDraggableSensorCard(sensor);
      this.sensorContainers.set(sensor.id, card);
      if (this.phase1Container) {
        this.phase1Container.add(card);
      }
    });
  }

  private createDraggableSensorCard(sensor: SensorData): Phaser.GameObjects.Container {
    const card = this.add.container(sensor.x, sensor.y);
    const width = 360;
    const height = 130;

    // Outer Aura
    const aura = this.add.graphics();
    aura.fillStyle(sensor.accentColor, 0.15);
    aura.fillRoundedRect(-width / 2 - 6, -height / 2 - 6, width + 12, height + 12, 18);
    aura.name = 'aura';

    // Main Card Body
    const body = this.add.graphics();
    body.fillStyle(0x0f172a, 0.96);
    body.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    body.lineStyle(2.5, sensor.accentColor, 0.85);
    body.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);

    // Icon Circle
    const iconCircle = this.add.circle(-width / 2 + 50, 0, 34, sensor.accentColor, 0.2);
    const iconStroke = this.add.graphics();
    iconStroke.lineStyle(2, sensor.accentColor, 0.9);
    iconStroke.strokeCircle(-width / 2 + 50, 0, 34);

    const iconText = this.add.text(-width / 2 + 50, 0, sensor.icon, {
      fontSize: '34px',
    });
    iconText.setOrigin(0.5);

    // Titles
    const titleText = this.createText(-width / 2 + 105, -30, sensor.name, {
      fontSize: '18px',
      fontStyle: '900',
      color: '#FFFFFF',
      align: 'left',
    });
    titleText.setOrigin(0, 0.5);

    const codeText = this.createText(-width / 2 + 105, -6, `KOD: ${sensor.code}`, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: sensor.hexColor,
      align: 'left',
    });
    codeText.setOrigin(0, 0.5);

    const specText = this.createText(-width / 2 + 105, 24, sensor.spec, {
      fontSize: '13px',
      color: '#94A3B8',
      align: 'left',
    });
    specText.setOrigin(0, 0.5);

    card.add([aura, body, iconCircle, iconStroke, iconText, titleText, codeText, specText]);

    // Drag Interaction (Touch & Mouse)
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    card.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    this.input.setDraggable(card);

    // Handle Drag Events
    card.on('dragstart', () => {
      if (this.isPayloadInstalled) return;
      SoundFx.playTelemetryBeep();
      card.setScale(1.08);
      card.setDepth(100);
      this.tweens.add({
        targets: aura,
        alpha: 0.8,
        duration: 150,
      });
    });

    card.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.isPayloadInstalled) return;
      card.x = dragX;
      card.y = dragY;
    });

    card.on('dragend', () => {
      if (this.isPayloadInstalled) return;
      card.setScale(1.0);
      card.setDepth(10);

      // Check distance to Payload Bay Socket (Target: 960, 480)
      const targetX = this.GAME_WIDTH / 2;
      const targetY = 480;
      const dist = Phaser.Math.Distance.Between(card.x, card.y, targetX, targetY);

      if (dist < 140) {
        // Dropped inside gimbal socket! Check correctness
        if (sensor.id === this.currentMission.requiredSensorId) {
          this.onCorrectSensorInstalled(card, sensor);
        } else {
          this.onWrongSensorDropped(card, sensor);
        }
      } else {
        // Return smoothly to tray
        this.tweens.add({
          targets: card,
          x: sensor.x,
          y: sensor.y,
          duration: 250,
          ease: 'Power2',
        });
      }
    });

    return card;
  }

  private onWrongSensorDropped(card: Phaser.GameObjects.Container, sensor: SensorData): void {
    this.errorCount++;
    SoundFx.playErrorTone();

    // Shake animation
    this.tweens.add({
      targets: card,
      x: card.x + 20,
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        // Return to original tray position
        this.tweens.add({
          targets: card,
          x: sensor.x,
          y: sensor.y,
          duration: 300,
          ease: 'Back.easeOut',
        });
      },
    });

    this.pusula?.setMessage(`⚠️ Uyarı: ${sensor.name} bu görev için uygun spektrumda değil! Görev açıklamasını tekrar incele.`);

    // If 2 or more errors, highlight the correct sensor with golden aura
    if (this.errorCount >= 2) {
      const correctCard = this.sensorContainers.get(this.currentMission.requiredSensorId);
      if (correctCard) {
        const aura = correctCard.getByName('aura') as Phaser.GameObjects.Graphics;
        if (aura) {
          aura.clear();
          aura.fillStyle(0xffd700, 0.45);
          aura.fillRoundedRect(-186, -71, 372, 142, 22);

          this.tweens.add({
            targets: correctCard,
            scaleX: 1.06,
            scaleY: 1.06,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
      }
    }
  }

  private onCorrectSensorInstalled(card: Phaser.GameObjects.Container, sensor: SensorData): void {
    this.isPayloadInstalled = true;
    SoundFx.playLockSound();
    SoundFx.playSuccessTone();

    // Snap card into socket perfectly
    this.tweens.add({
      targets: card,
      x: this.GAME_WIDTH / 2,
      y: 480,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Disable dragging on all cards
    this.sensorContainers.forEach((c) => {
      this.input.setDraggable(c, false);
    });

    // Turn Payload Bay Socket Green & Flash "SİSTEM BAĞLANTISI BAŞARILI"
    if (this.socketGlow) {
      this.socketGlow.clear();
      this.socketGlow.fillStyle(0x10b981, 0.6);
      this.socketGlow.fillCircle(0, 0, 90);
    }

    const successBanner = this.add.container(this.GAME_WIDTH / 2, 360);
    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x064e3b, 0.95);
    bannerBg.fillRoundedRect(-240, -25, 480, 50, 14);
    bannerBg.lineStyle(2, 0x10b981, 1);
    bannerBg.strokeRoundedRect(-240, -25, 480, 50, 14);

    const bannerText = this.createText(0, 0, '✅ SİSTEM BAĞLANTISI BAŞARILI!', {
      fontSize: '20px',
      fontStyle: '900',
      color: '#34D399',
    });
    bannerText.setOrigin(0.5);

    successBanner.add([bannerBg, bannerText]);
    successBanner.setScale(0.5);
    successBanner.setAlpha(0);
    if (this.phase1Container) {
      this.phase1Container.add(successBanner);
    }

    this.tweens.add({
      targets: successBanner,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1.0,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.pusula?.setMessage(`Harika seçim! ${sensor.name} monte edildi ve telemetri bağlantısı kuruldu. Şimdi rota planlamasına geçiyoruz!`);

    // Transition to Phase 2 after 1.3s
    this.time.delayedCall(1300, () => {
      this.transitionToPhase2();
    });
  }

  private transitionToPhase2(): void {
    this.currentPhaseNumber = 2;

    if (this.phase1Container) {
      this.tweens.add({
        targets: this.phase1Container,
        alpha: 0,
        y: -40,
        duration: 350,
        onComplete: () => {
          this.phase1Container?.destroy();
          this.phase1Container = undefined;
          this.setupPhase2RoutePlanning();
        },
      });
    }
  }

  // =========================================================================
  // AŞAMA 2 – TAKTİK ROTA VE ENERJİ PLANLAMA
  // =========================================================================

  private setupPhase2RoutePlanning(): void {
    this.currentPhaseNumber = 2;
    this.phase2Container = this.add.container(0, 0);

    // 1. Tactical Flight Map HUD Panel (Left & Center Stage)
    this.createTacticalMapPanel();

    // 2. Wind Vector & Meteorological Compass HUD (Top Right)
    this.createWindCompassHUD();

    // 3. Alternative Flight Route Option Cards (Right Stage)
    this.createRouteOptionCards();

    // 4. "GÖREVİ BAŞLAT" Action Button (Bottom Right)
    this.createStartMissionButton();

    this.pusula?.setMessage('Meteoroloji ve batarya verilerini analiz et! Rüzgârı arkasına alan en verimli rotayı seçip onayla.');

    // Entrance Animation
    this.phase2Container.setAlpha(0);
    this.phase2Container.y = 30;
    this.tweens.add({
      targets: this.phase2Container,
      alpha: 1,
      y: 0,
      duration: 400,
      ease: 'Power2',
    });
  }

  private createTacticalMapPanel(): void {
    const mapBox = this.add.graphics();
    const mapX = 140;
    const mapY = 130;
    const mapW = 1100;
    const mapH = 650;

    // Tactical Map Surface Fill
    mapBox.fillStyle(0x0a1128, 0.95);
    mapBox.fillRoundedRect(mapX, mapY, mapW, mapH, 20);
    mapBox.lineStyle(2, 0x00f2fe, 0.7);
    mapBox.strokeRoundedRect(mapX, mapY, mapW, mapH, 20);

    // Elevation Contour Topography Curves & Grid
    mapBox.lineStyle(1, 0x0284c7, 0.2);
    for (let x = mapX + 80; x < mapX + mapW; x += 80) {
      mapBox.lineBetween(x, mapY, x, mapY + mapH);
    }
    for (let y = mapY + 80; y < mapY + mapH; y += 80) {
      mapBox.lineBetween(mapX, y, mapX + mapW, y);
    }

    // Topographic Elevation Rings (Terrain simulation)
    mapBox.lineStyle(1.5, 0x38bdf8, 0.25);
    mapBox.strokeCircle(mapX + 500, mapY + 250, 160);
    mapBox.strokeCircle(mapX + 500, mapY + 250, 110);
    mapBox.strokeCircle(mapX + 500, mapY + 250, 60);

    mapBox.strokeCircle(mapX + 820, mapY + 480, 120);
    mapBox.strokeCircle(mapX + 820, mapY + 480, 70);

    // Mountains Obstacle Label
    const mtnLabel = this.createText(mapX + 500, mapY + 250, '▲ DAĞLIK ENGEBE HATTI ▲\n(Termal Türbülans Bölgesi)', {
      fontSize: '13px',
      color: '#64748B',
      align: 'center',
    });
    mtnLabel.setOrigin(0.5);

    // Define 3 Route Geometries across map
    const takeoffPt = new Phaser.Math.Vector2(mapX + 120, mapY + 460);
    const targetPt = new Phaser.Math.Vector2(mapX + 940, mapY + 220);

    this.routeOptions = [
      {
        id: 'A',
        title: 'ROTA A: GENİŞ ÇEVRE HATTI',
        code: 'WAYPOINT-ALPHA',
        batteryUsage: '%85 Batarya Tüketimi (Yüksek Risk) ⚠️',
        batteryPercent: 85,
        windEffect: 'Yan Rüzgâr Direnci / Uzun Uçuş Mesafesi',
        riskStatus: 'Batarya rezervi yetersiz kalabilir!',
        isCorrect: false,
        color: 0xf59e0b,
        hexColor: '#F59E0B',
        points: [
          takeoffPt,
          new Phaser.Math.Vector2(mapX + 320, mapY + 580),
          new Phaser.Math.Vector2(mapX + 680, mapY + 600),
          new Phaser.Math.Vector2(mapX + 900, mapY + 450),
          targetPt,
        ],
      },
      {
        id: 'B',
        title: 'ROTA B: KARŞI RÜZGÂR KORİDORU',
        code: 'WAYPOINT-BRAVO',
        batteryUsage: '%60 Batarya Tüketimi',
        batteryPercent: 60,
        windEffect: '45 km/s Karşı Rüzgâr (Türbülans Riski) ⚠️',
        riskStatus: 'Kararsız uçuş ve sensör sapması riski!',
        isCorrect: false,
        color: 0xef4444,
        hexColor: '#EF4444',
        points: [
          takeoffPt,
          new Phaser.Math.Vector2(mapX + 420, mapY + 180),
          new Phaser.Math.Vector2(mapX + 700, mapY + 150),
          targetPt,
        ],
      },
      {
        id: 'C',
        title: 'ROTA C: OPTİMUM ENERJİ HATTI',
        code: 'WAYPOINT-CHARLIE',
        batteryUsage: '%25 Batarya Tüketimi (Optimum) ✅',
        batteryPercent: 25,
        windEffect: '+18 km/s Arka Rüzgâr Koridoru Desteği',
        riskStatus: 'İdeal hava koridoru, tam menzil güvenliği!',
        isCorrect: true,
        color: 0x10b981,
        hexColor: '#10B981',
        points: [
          takeoffPt,
          new Phaser.Math.Vector2(mapX + 460, mapY + 420),
          new Phaser.Math.Vector2(mapX + 750, mapY + 360),
          targetPt,
        ],
      },
    ];

    // Base Station & Target Waypoint Markers
    const takeoffMarker = this.createWaypointMarker(takeoffPt.x, takeoffPt.y, 'KALKIŞ ÜSSÜ', 0x10b981, '🛫');
    const targetMarker = this.createWaypointMarker(targetPt.x, targetPt.y, 'HEDEF GÖREV BÖLGESİ', 0x00f2fe, '🎯');

    // Route Spline Graphics Layer
    this.routePathGraphics = this.add.graphics();
    this.windStreamGraphics = this.add.graphics();
    this.drawTacticalWindStreams(mapX, mapY, mapH);
    this.drawRouteLines();

    if (this.phase2Container) {
      this.phase2Container.add([mapBox, mtnLabel, this.windStreamGraphics, this.routePathGraphics, takeoffMarker, targetMarker]);
    }
  }

  private createWaypointMarker(x: number, y: number, label: string, color: number, icon: string): Phaser.GameObjects.Container {
    const cont = this.add.container(x, y);

    const glow = this.add.circle(0, 0, 24, color, 0.25);
    const ring = this.add.graphics();
    ring.lineStyle(2.5, color, 1);
    ring.strokeCircle(0, 0, 16);

    const iconT = this.add.text(0, 0, icon, { fontSize: '18px' });
    iconT.setOrigin(0.5);

    const text = this.createText(0, 32, label, {
      fontSize: '13px',
      fontStyle: '900',
      color: '#FFFFFF',
      backgroundColor: '#0A1128',
      padding: { x: 6, y: 3 },
    });
    text.setOrigin(0.5);

    this.tweens.add({
      targets: glow,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    cont.add([glow, ring, iconT, text]);
    return cont;
  }

  private drawTacticalWindStreams(mapX: number, mapY: number, mapH: number): void {
    if (!this.windStreamGraphics) return;
    this.windStreamGraphics.clear();
    this.windStreamGraphics.lineStyle(1.5, 0x38bdf8, 0.3);

    // Draw animated dashed wind stream vectors flowing towards north-east (35 degrees)
    const startX = mapX + 80;
    const startY = mapY + mapH - 60;
    for (let i = 0; i < 6; i++) {
      const sx = startX + i * 140;
      const sy = startY - i * 40;
      this.windStreamGraphics.lineBetween(sx, sy, sx + 180, sy - 110);

      // Arrow head
      this.windStreamGraphics.lineBetween(sx + 180, sy - 110, sx + 165, sy - 100);
      this.windStreamGraphics.lineBetween(sx + 180, sy - 110, sx + 175, sy - 90);
    }
  }

  private drawRouteLines(): void {
    if (!this.routePathGraphics) return;
    this.routePathGraphics.clear();

    this.routeOptions.forEach((route) => {
      const isSelected = this.selectedRouteId === route.id;
      const alpha = this.selectedRouteId === null ? 0.65 : isSelected ? 1.0 : 0.25;
      const lineWidth = isSelected ? 5 : 2.5;

      const curve = new Phaser.Curves.Spline(route.points);

      this.routePathGraphics!.lineStyle(lineWidth, route.color, alpha);
      curve.draw(this.routePathGraphics!, 64);

      // Draw waypoint dot circles
      route.points.forEach((p, idx) => {
        if (idx > 0 && idx < route.points.length - 1) {
          this.routePathGraphics!.fillStyle(route.color, alpha);
          this.routePathGraphics!.fillCircle(p.x, p.y, isSelected ? 6 : 4);
        }
      });
    });
  }

  private createWindCompassHUD(): void {
    const compassCont = this.add.container(1580, 190);
    const box = this.add.graphics();
    box.fillStyle(0x0a1128, 0.92);
    box.fillRoundedRect(-220, -50, 440, 100, 16);
    box.lineStyle(2, 0x38bdf8, 0.8);
    box.strokeRoundedRect(-220, -50, 440, 100, 16);

    const icon = this.add.text(-170, 0, '🧭', { fontSize: '36px' });
    icon.setOrigin(0.5);

    const title = this.createText(-130, -22, 'METEOROLOJİ & RÜZGÂR VEKTÖRÜ', {
      fontSize: '14px',
      fontStyle: '900',
      color: '#38BDF8',
      align: 'left',
    });
    title.setOrigin(0, 0.5);

    const val = this.createText(-130, 10, 'YÖN: 035° KUZEYDOĞU  •  HIZ: 18 KM/S\n(Rota C koridorunda +18 km/s itici güç)', {
      fontSize: '13px',
      color: '#E2E8F0',
      align: 'left',
      lineSpacing: 4,
    });
    val.setOrigin(0, 0.5);

    compassCont.add([box, icon, title, val]);
    if (this.phase2Container) {
      this.phase2Container.add(compassCont);
    }
  }

  private createRouteOptionCards(): void {
    const startY = 320;
    const spacing = 155;

    this.routeOptions.forEach((route, index) => {
      const y = startY + index * spacing;
      const card = this.createRouteCard(1580, y, route);
      this.routeCardContainers.set(route.id, card);
      if (this.phase2Container) {
        this.phase2Container.add(card);
      }
    });
  }

  private createRouteCard(x: number, y: number, route: RouteOption): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);
    const width = 440;
    const height = 135;

    const aura = this.add.graphics();
    aura.fillStyle(route.color, 0.12);
    aura.fillRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 16);
    aura.name = 'cardAura';

    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    bg.lineStyle(2.5, route.color, 0.7);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    bg.name = 'cardBg';

    // Radio Checkmark Box
    const checkCircle = this.add.circle(-width / 2 + 30, -32, 12, 0x1e293b);
    checkCircle.setStrokeStyle(2, route.color);
    checkCircle.name = 'checkCircle';

    const checkDot = this.add.circle(-width / 2 + 30, -32, 6, route.color);
    checkDot.setVisible(false);
    checkDot.name = 'checkDot';

    // Title
    const title = this.createText(-width / 2 + 55, -32, route.title, {
      fontSize: '16px',
      fontStyle: '900',
      color: '#FFFFFF',
      align: 'left',
    });
    title.setOrigin(0, 0.5);

    // Battery Bar Graphic
    const batteryBarBg = this.add.graphics();
    batteryBarBg.fillStyle(0x1e293b, 1);
    batteryBarBg.fillRoundedRect(-width / 2 + 25, -6, width - 50, 12, 6);

    const batteryBarFill = this.add.graphics();
    const fillWidth = (width - 50) * (route.batteryPercent / 100);
    batteryBarFill.fillStyle(route.color, 1);
    batteryBarFill.fillRoundedRect(-width / 2 + 25, -6, fillWidth, 12, 6);

    // Battery & Wind Info Texts
    const batteryText = this.createText(-width / 2 + 25, 20, `🔋 ${route.batteryUsage}`, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: route.hexColor,
      align: 'left',
    });
    batteryText.setOrigin(0, 0.5);

    const windText = this.createText(-width / 2 + 25, 42, `💨 ${route.windEffect}`, {
      fontSize: '12px',
      color: '#94A3B8',
      align: 'left',
    });
    windText.setOrigin(0, 0.5);

    card.add([aura, bg, checkCircle, checkDot, title, batteryBarBg, batteryBarFill, batteryText, windText]);

    // Touch Interaction
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    card.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    card.on('pointerover', () => {
      this.tweens.add({ targets: card, scaleX: 1.02, scaleY: 1.02, duration: 100 });
    });
    card.on('pointerout', () => {
      if (this.selectedRouteId !== route.id) {
        this.tweens.add({ targets: card, scaleX: 1.0, scaleY: 1.0, duration: 100 });
      }
    });
    card.on('pointerdown', () => {
      this.selectRoute(route.id);
    });

    return card;
  }

  private selectRoute(routeId: 'A' | 'B' | 'C'): void {
    SoundFx.playTelemetryBeep();
    this.selectedRouteId = routeId;

    // Update Route Option Cards visual state
    this.routeOptions.forEach((r) => {
      const card = this.routeCardContainers.get(r.id);
      if (!card) return;

      const isSelected = r.id === routeId;
      const checkDot = card.getByName('checkDot') as Phaser.GameObjects.Arc;
      const aura = card.getByName('cardAura') as Phaser.GameObjects.Graphics;

      if (checkDot) checkDot.setVisible(isSelected);

      if (isSelected) {
        card.setScale(1.03);
        if (aura) {
          aura.clear();
          aura.fillStyle(r.color, 0.35);
          aura.fillRoundedRect(-224, -71, 448, 142, 18);
        }
      } else {
        card.setScale(1.0);
        if (aura) {
          aura.clear();
          aura.fillStyle(r.color, 0.12);
          aura.fillRoundedRect(-224, -71, 448, 142, 16);
        }
      }
    });

    // Redraw Tactical Spline Paths on Map
    this.drawRouteLines();

    const chosen = this.routeOptions.find((r) => r.id === routeId);
    if (chosen) {
      if (chosen.isCorrect) {
        this.pusula?.setMessage(`Harika seçim! ${chosen.title}. Rüzgârı arkasına alarak enerjiyi minimumda tutuyor. 'GÖREVİ BAŞLAT' butonuna basabilirsin!`);
      } else {
        this.pusula?.setMessage(`⚠️ Dikkat: ${chosen.title}. ${chosen.riskStatus}`);
      }
    }
  }

  private createStartMissionButton(): void {
    this.startMissionBtn = new GameButton(
      this,
      1580,
      830,
      440,
      90,
      'GÖREVİ BAŞLAT  ✈️',
      () => {
        this.onStartMissionConfirmed();
      },
      0x10b981,
      '#070B19'
    );

    if (this.phase2Container) {
      this.phase2Container.add(this.startMissionBtn);
    }
  }

  private onStartMissionConfirmed(): void {
    if (!this.selectedRouteId) {
      SoundFx.playErrorTone();
      this.pusula?.setMessage('Lütfen uçuşa başlamadan önce haritadaki 3 rotadan birini seçiniz!');
      return;
    }

    const selected = this.routeOptions.find((r) => r.id === this.selectedRouteId);
    if (!selected) return;

    if (!selected.isCorrect) {
      this.errorCount++;
      SoundFx.playErrorTone();

      // Telemetry error warning dialog
      this.pusula?.setMessage(`⚠️ TELEMETRİ UYARISI: ${selected.riskStatus} Lütfen Rota C (Optimum) planını seçiniz!`);

      // Highlight Route C with pulsing gold
      const correctCard = this.routeCardContainers.get('C');
      if (correctCard) {
        this.tweens.add({
          targets: correctCard,
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 300,
          yoyo: true,
          repeat: 2,
        });
      }
      return;
    }

    // Correct Route Selected! Transition to Phase 3
    SoundFx.playSuccessTone();
    SoundFx.playDroneHum();

    this.transitionToPhase3();
  }

  private transitionToPhase3(): void {
    this.currentPhaseNumber = 3;

    if (this.phase2Container) {
      this.tweens.add({
        targets: this.phase2Container,
        alpha: 0,
        y: -40,
        duration: 350,
        onComplete: () => {
          this.phase2Container?.destroy();
          this.phase2Container = undefined;
          this.setupPhase3AutonomousFlight();
        },
      });
    }
  }

  // =========================================================================
  // AŞAMA 3 – OTONOM UÇUŞ VE ALAN TARAMASI
  // =========================================================================

  private setupPhase3AutonomousFlight(): void {
    this.currentPhaseNumber = 3;
    this.phase3Container = this.add.container(0, 0);

    // 1. Tactical Flight Map Arena
    const mapBox = this.add.graphics();
    const mapX = 140;
    const mapY = 130;
    const mapW = 1640;
    const mapH = 680;

    mapBox.fillStyle(0x0a1128, 0.95);
    mapBox.fillRoundedRect(mapX, mapY, mapW, mapH, 20);
    mapBox.lineStyle(2, 0x00f2fe, 0.8);
    mapBox.strokeRoundedRect(mapX, mapY, mapW, mapH, 20);

    // Grid Overlay
    mapBox.lineStyle(1, 0x0284c7, 0.15);
    for (let x = mapX + 80; x < mapX + mapW; x += 80) {
      mapBox.lineBetween(x, mapY, x, mapY + mapH);
    }
    for (let y = mapY + 80; y < mapY + mapH; y += 80) {
      mapBox.lineBetween(mapX, y, mapX + mapW, y);
    }

    // Mission Flight Path (Route C Spline across wide arena)
    const takeoffPt = new Phaser.Math.Vector2(mapX + 160, mapY + 520);
    const mid1 = new Phaser.Math.Vector2(mapX + 540, mapY + 440);
    const mid2 = new Phaser.Math.Vector2(mapX + 960, mapY + 360);
    const targetPt = new Phaser.Math.Vector2(mapX + 1350, mapY + 280);

    this.flightPathCurve = new Phaser.Curves.Spline([takeoffPt, mid1, mid2, targetPt]);

    // Draw Glowing Spline Path
    const pathGraphics = this.add.graphics();
    pathGraphics.lineStyle(4, 0x10b981, 0.8);
    this.flightPathCurve.draw(pathGraphics, 64);

    // Takeoff & Target Base Visuals
    const takeoffMarker = this.createWaypointMarker(takeoffPt.x, takeoffPt.y, 'KALKIŞ ÜSSÜ (TAMAMLANDI)', 0x10b981, '🛫');
    const targetMarker = this.createWaypointMarker(targetPt.x, targetPt.y, `GÖREV SEKTÖRÜ: ${this.currentMission.title}`, 0x00f2fe, '🎯');

    // Radar Scanning Graphics Layer
    this.radarScanGraphics = this.add.graphics();

    // UAV Flight Object (Scale-sized autonomous drone with wing lights)
    this.uavFlightContainer = this.createFlyingUAVObject();
    this.uavFlightContainer.setPosition(takeoffPt.x, takeoffPt.y);

    // Telemetry Live Data Stream Box (Bottom Screen)
    this.telemetryStreamContainer = this.createLiveTelemetryHUD();

    this.phase3Container.add([
      mapBox,
      pathGraphics,
      this.radarScanGraphics,
      takeoffMarker,
      targetMarker,
      this.uavFlightContainer,
      this.telemetryStreamContainer,
    ]);

    this.pusula?.setMessage('İHA otonom uçuş koridorunda ilerliyor. Seyrüsefer ışıkları aktif, sensör taraması başlatılıyor!');

    // Start Smooth Flight Spline Tween
    this.flightProgress = { t: 0 };
    this.flightTween = this.tweens.add({
      targets: this.flightProgress,
      t: 1,
      duration: 3500,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (!this.flightPathCurve || !this.uavFlightContainer) return;
        const currentPos = this.flightPathCurve.getPoint(this.flightProgress.t);
        const tangent = this.flightPathCurve.getTangent(this.flightProgress.t);

        this.uavFlightContainer.setPosition(currentPos.x, currentPos.y);
        this.uavFlightContainer.setRotation(tangent.angle());
      },
      onComplete: () => {
        // Arrived at Target Sector! Enter Loiter Patrol & Conical Scan
        this.onUAVArrivedAtTarget(targetPt.x, targetPt.y);
      },
    });
  }

  private createFlyingUAVObject(): Phaser.GameObjects.Container {
    const cont = this.add.container(0, 0);

    const g = this.add.graphics();

    // High-Tech Swept Wing Drone (Scaled down for flight view)
    g.fillStyle(0x0f172a, 1);
    g.lineStyle(2, 0x00f2fe, 1);

    // Wings
    const wingPoly = [
      { x: 25, y: 0 },
      { x: -5, y: -45 },
      { x: -15, y: -45 },
      { x: -10, y: -10 },
      { x: -35, y: 0 },
      { x: -10, y: 10 },
      { x: -15, y: 45 },
      { x: -5, y: 45 },
    ];
    g.beginPath();
    g.moveTo(wingPoly[0].x, wingPoly[0].y);
    for (let i = 1; i < wingPoly.length; i++) {
      g.lineTo(wingPoly[i].x, wingPoly[i].y);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();

    // Fuselage
    g.fillStyle(0x1e293b, 1);
    g.fillEllipse(0, 0, 48, 16);
    g.lineStyle(1.5, 0x38bdf8, 1);
    g.strokeEllipse(0, 0, 48, 16);

    // Wingtip LEDs
    this.uavWingGlowLeft = this.add.circle(-10, -45, 4, 0xef4444); // Red Port
    this.uavWingGlowRight = this.add.circle(-10, 45, 4, 0x10b981); // Green Starboard
    this.uavStrobeBeacon = this.add.circle(0, 0, 5, 0xffffff); // White Strobe

    // Flashing Strobe Light Tween
    this.tweens.add({
      targets: this.uavStrobeBeacon,
      alpha: 0.1,
      duration: 350,
      yoyo: true,
      repeat: -1,
    });

    cont.add([g, this.uavWingGlowLeft, this.uavWingGlowRight, this.uavStrobeBeacon]);
    return cont;
  }

  private onUAVArrivedAtTarget(targetX: number, targetY: number): void {
    SoundFx.playRadarPing();

    // 1. UAV orbits around target in circular loiter pattern
    let orbitAngle = 0;
    const orbitRadius = 75;

    this.scanningLoopTween = this.tweens.addCounter({
      from: 0,
      to: 360 * 3,
      duration: 4000,
      onUpdate: (tween) => {
        const currentDeg = tween.getValue() || 0;
        orbitAngle = Phaser.Math.DegToRad(currentDeg);
        if (this.uavFlightContainer) {
          const uavX = targetX + Math.cos(orbitAngle) * orbitRadius;
          const uavY = targetY + Math.sin(orbitAngle) * orbitRadius;
          this.uavFlightContainer.setPosition(uavX, uavY);
          this.uavFlightContainer.setRotation(orbitAngle + Math.PI / 2);
        }

        // Draw Expanding Conical Radar Waves
        this.renderRadarScanningBeams(targetX, targetY, currentDeg);
      },
      onComplete: () => {
        // Complete Mission! Show live data detection text & Victory Modal
        this.showFinalMissionReport();
      },
    });

    this.pusula?.setMessage(`Hedef bölgeye ulaşıldı! ${this.currentMission.requiredSensorId.toUpperCase()} sensörüyle 360° alan taraması yapılıyor...`);
  }

  private renderRadarScanningBeams(cx: number, cy: number, currentDeg: number): void {
    if (!this.radarScanGraphics) return;
    this.radarScanGraphics.clear();

    const rad = Phaser.Math.DegToRad(currentDeg);
    const radius = 180;

    // Conical Radar Sector Arc
    this.radarScanGraphics.fillStyle(0x00f2fe, 0.15);
    this.radarScanGraphics.slice(cx, cy, radius, rad - 0.4, rad + 0.4, false);
    this.radarScanGraphics.fillPath();

    // Radar Concentric Rings
    this.radarScanGraphics.lineStyle(1.5, 0x00f2fe, 0.4);
    this.radarScanGraphics.strokeCircle(cx, cy, 60);
    this.radarScanGraphics.strokeCircle(cx, cy, 120);
    this.radarScanGraphics.strokeCircle(cx, cy, 180);

    // Target Highlight Blips popping up inside scan zone
    this.radarScanGraphics.fillStyle(0xf59e0b, 0.9);
    this.radarScanGraphics.fillCircle(cx + 40, cy - 30, 7);
    this.radarScanGraphics.fillCircle(cx - 55, cy + 35, 7);
    this.radarScanGraphics.fillCircle(cx + 70, cy + 50, 7);
  }

  private createLiveTelemetryHUD(): Phaser.GameObjects.Container {
    const container = this.add.container(this.GAME_WIDTH / 2, 920);

    const width = 1400;
    const height = 120;

    const bg = this.add.graphics();
    bg.fillStyle(0x0a1128, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    bg.lineStyle(2, 0x10b981, 0.9);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);

    // Left Telemetry Gauges
    const gaugesText = this.createText(
      -width / 2 + 30,
      0,
      'ALT: 4,500 m (İdeal İrtifa)\nHIZ: 135 km/s (TAS)\nBATARYA: %74 (Mükemmel)\nLİNK: %99.9 HQ',
      {
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#38BDF8',
        align: 'left',
        lineSpacing: 4,
      }
    );
    gaugesText.setOrigin(0, 0.5);

    // Right Real-time Detection Status
    const statusText = this.createText(
      -width / 2 + 320,
      0,
      `CANLI HAREKÂT VERİSİ:\n📡 ${this.currentMission.scanReportTitle}\n${this.currentMission.scanReportDetail}`,
      {
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#F8FAFC',
        align: 'left',
        lineSpacing: 6,
      }
    );
    statusText.setOrigin(0, 0.5);
    statusText.name = 'statusText';

    container.add([bg, gaugesText, statusText]);
    return container;
  }

  private showFinalMissionReport(): void {
    SoundFx.playVictoryFanfare();
    this.isCompleted = true;

    // Show Victory Modal
    this.time.delayedCall(800, () => {
      this.createCommandCenterVictoryModal();
    });
  }

  // =========================================================================
  // BAŞARI EKRANI (KOMUTA MERKEZİ MODALI)
  // =========================================================================

  private createCommandCenterVictoryModal(): void {
    const modal = this.add.container(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2);
    modal.setDepth(200);

    // 1. Dark Backdrop Overlay
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x070b19, 0.88);
    backdrop.fillRect(-this.GAME_WIDTH / 2, -this.GAME_HEIGHT / 2, this.GAME_WIDTH, this.GAME_HEIGHT);

    // 2. Main Glassmorphism Frame
    const width = 840;
    const height = 620;

    const modalBg = this.add.graphics();
    modalBg.fillStyle(0x0a1128, 0.98);
    modalBg.fillRoundedRect(-width / 2, -height / 2, width, height, 24);
    modalBg.lineStyle(3, 0x00f2fe, 0.9);
    modalBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 24);

    // Outer Aura Glow
    const outerAura = this.add.graphics();
    outerAura.fillStyle(0x00f2fe, 0.15);
    outerAura.fillRoundedRect(-width / 2 - 12, -height / 2 - 12, width + 24, height + 24, 30);

    // 3. Header Banner: "GÖREV BAŞARIYLA TAMAMLANDI! ✈️"
    const headerText = this.createText(0, -height / 2 + 55, 'GÖREV BAŞARIYLA TAMAMLANDI! ✈️', {
      fontSize: '36px',
      fontStyle: '900',
      color: '#00F2FE',
      shadow: { color: '#00F2FE', blur: 15, fill: true },
    });
    headerText.setOrigin(0.5);

    const subText = this.createText(0, -height / 2 + 105, 'Millî Teknoloji Görev Rozetini Kazandın!', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    subText.setOrigin(0.5);

    // 4. Mission Specific Badge & Stamp
    if (this.textures.exists('passport_stamp')) {
      const stampImg = this.add.image(0, -height / 2 + 190, 'passport_stamp');
      stampImg.setDisplaySize(95, 95);
      modal.add(stampImg);
    }

    // 5. 3 Assessment Skill Meters (Gözlem, Ustalık, Mühendislik)
    const skillsContainer = this.add.container(0, 30);
    const skills = [
      { name: 'Gözlem', stars: '⭐⭐⭐' },
      { name: 'Ustalık', stars: '⭐⭐⭐' },
      { name: 'Mühendislik', stars: '⭐⭐⭐' },
    ];

    skills.forEach((skill, idx) => {
      const x = (idx - 1) * 240;
      const box = this.add.graphics();
      box.fillStyle(0x0f172a, 0.9);
      box.fillRoundedRect(x - 105, -35, 210, 70, 14);
      box.lineStyle(1.5, 0x38bdf8, 0.7);
      box.strokeRoundedRect(x - 105, -35, 210, 70, 14);

      const label = this.createText(x, -14, skill.name, {
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#94A3B8',
      });
      label.setOrigin(0.5);

      const stars = this.createText(x, 14, skill.stars, {
        fontSize: '22px',
      });
      stars.setOrigin(0.5);

      skillsContainer.add([box, label, stars]);
    });

    // 6. Mission Telemetry Stats
    const statsText = this.createText(
      0,
      130,
      `Görev Süresi: ${this.elapsedSeconds} sn   •   Enerji Verimliliği: %98   •   Tespit Doğruluğu: %100\nHata: ${this.errorCount}`,
      {
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#E2E8F0',
        align: 'center',
        lineSpacing: 6,
      }
    );
    statsText.setOrigin(0.5);

    // 7. Large Return Button: "HARİTAYA DÖN  ➔" (Unlocks Module 6 Uzay Teknolojileri)
    const returnBtn = new GameButton(
      this,
      0,
      215,
      420,
      90,
      'HARİTAYA DÖN  ➔',
      () => {
        GameStore.completeModule('milli_teknoloji');
        this.cameras.main.fadeOut(350, 7, 11, 25);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start(SceneKeys.WORLD_MAP);
        });
      },
      0x00f2fe,
      '#070B19'
    );

    modal.add([backdrop, outerAura, modalBg, headerText, subText, skillsContainer, statsText, returnBtn]);

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
