import Phaser from 'phaser';
import { BaseScene } from '../BaseScene';
import { SceneKeys } from '../../../types/game';
import { GameStore } from '../../state/GameStore';
import { PusulaCharacter } from '../../objects/PusulaCharacter';
import { GameButton } from '../../objects/GameButton';
import { SoundFx } from '../../utils/audio';
import { EventBus } from '../../state/EventBus';

interface SocketConfig {
  id: string;
  name: string;
  subLabel: string;
  x: number;
  y: number;
  radius: number;
  acceptedGearId: string;
  hintColor: number;
}

interface GearItem {
  id: string;
  title: string;
  subTitle: string;
  radius: number;
  teeth: number;
  mainColor: number;
  rimColor: number;
  spokeColor: number;
  trayX: number;
  trayY: number;
  targetSocketId: string;
  gearRatioLabel: string;
  rotationSpeedMultiplier: number; // e.g., +1.0, -1.41, +2.18
}

export class SanayilesmeScene extends BaseScene {
  private pusula?: PusulaCharacter;
  private elapsedSeconds = 0;
  private errorCount = 0;
  private timerEvent?: Phaser.Time.TimerEvent;
  private timerText?: Phaser.GameObjects.Text;
  private instructionBannerText?: Phaser.GameObjects.Text;
  private isMechanismRunning = false;
  private isCompleted = false;

  // Sockets
  private socketConfigs: SocketConfig[] = [];
  private socketContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private socketHintTweens: Map<string, Phaser.Tweens.Tween> = new Map();

  // Gears
  private gearConfigs: GearItem[] = [];
  private gearContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private gearGraphicsMap: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private placedGears: Set<string> = new Set();
  private gearErrorCounts: Map<string, number> = new Map();

  // Power Lever
  private leverContainer?: Phaser.GameObjects.Container;
  private leverHandle?: Phaser.GameObjects.Container;
  private leverGlow?: Phaser.GameObjects.Graphics;
  private leverStatusText?: Phaser.GameObjects.Text;
  private isLeverActive = false;
  private isLeverPulled = false;

  // Tachometer / Output Dynamo Gauge
  private tachometerNeedle?: Phaser.GameObjects.Graphics;
  private tachometerText?: Phaser.GameObjects.Text;
  private dynamoTurbine?: Phaser.GameObjects.Graphics;

  constructor() {
    super(SceneKeys.SANAYILESME);
  }

  create(): void {
    // Reset state variables
    this.elapsedSeconds = 0;
    this.errorCount = 0;
    this.isMechanismRunning = false;
    this.isCompleted = false;
    this.isLeverActive = false;
    this.isLeverPulled = false;
    this.placedGears.clear();
    this.gearErrorCounts.clear();
    this.socketContainers.clear();
    this.socketHintTweens.clear();
    this.gearContainers.clear();
    this.gearGraphicsMap.clear();

    // Fade in transition
    this.cameras.main.fadeIn(350, 7, 11, 25);

    // Lifecycle cleanup hooks
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUpScene, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanUpScene, this);

    // 1. Technical Engineering Chassis Background (Blueprint Grid + Navy Anthracite)
    this.createTechnicalChassisEnvironment();

    // 2. Header UI with Title, Objective, Timer
    this.createHeaderUI();

    // 3. Chassis Sockets (Merkez Milleri - Giriş, Aktarma, Çıkış)
    this.setupAxleSockets();

    // 4. Output Dynamo & RPM Tachometer Unit
    this.setupDynamoAndTachometer();

    // 5. Component Tray & 3 Draggable Industrial Gears
    this.setupComponentTrayAndGears();

    // 6. Mechanical Power Lever (Sağ Güç Kolu / Şalter)
    this.setupPowerLever();

    // 7. Pusula Companion Character
    this.pusula = new PusulaCharacter(
      this,
      210,
      760,
      'Büyükten küçüğe dişlileri doğru millere yerleştirerek aktarım hattını kur!'
    );

    // 8. Neutral Elapsed Timer
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

    // 9. Corner Back Button
    this.createCornerBackButton();

    EventBus.emit('current-scene-ready', SceneKeys.SANAYILESME);
  }

  update(_time: number, delta: number): void {
    // Continuous rotation when power lever is activated
    if (this.isMechanismRunning) {
      const baseSpeed = (delta / 1000) * 120; // degrees per second base

      this.gearConfigs.forEach((gearCfg) => {
        const gearCont = this.gearContainers.get(gearCfg.id);
        if (gearCont) {
          gearCont.angle += baseSpeed * gearCfg.rotationSpeedMultiplier;
        }
      });

      // Dynamo turbine spins at high output speed
      if (this.dynamoTurbine) {
        this.dynamoTurbine.angle += baseSpeed * 3.5;
      }
    }
  }

  private cleanUpScene(): void {
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = undefined;
    }
    this.socketHintTweens.forEach((t) => t.remove());
    this.socketHintTweens.clear();
    this.tweens.killAll();
    this.input.off('pointermove');
    this.input.off('pointerup');
  }

  // =========================================================================
  // ENVIRONMENT & BACKGROUND BLUEPRINT
  // =========================================================================

  private createTechnicalChassisEnvironment(): void {
    const bg = this.add.graphics();

    // Dark Navy Base (#070B19)
    bg.fillStyle(0x070b19, 1);
    bg.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Tech blueprint grid (Navy #0A1128 & Cyan 0x00F2FE 4% opacity)
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x00f2fe, 0.05);
    const gridSize = 40;
    for (let x = 0; x < this.GAME_WIDTH; x += gridSize) {
      grid.lineBetween(x, 0, x, this.GAME_HEIGHT);
    }
    for (let y = 0; y < this.GAME_HEIGHT; y += gridSize) {
      grid.lineBetween(0, y, this.GAME_WIDTH, y);
    }

    // Heavy blueprint subdivision grid (every 200px)
    grid.lineStyle(1.5, 0x00f2fe, 0.12);
    for (let x = 0; x < this.GAME_WIDTH; x += 200) {
      grid.lineBetween(x, 0, x, this.GAME_HEIGHT);
    }
    for (let y = 0; y < this.GAME_HEIGHT; y += 200) {
      grid.lineBetween(0, y, this.GAME_WIDTH, y);
    }

    // Mechanical Workstation Chassis Frame (Center Industrial Board)
    const chassis = this.add.graphics();
    const chassisX = 350;
    const chassisY = 170;
    const chassisW = 970;
    const chassisH = 590;

    // Outer Carbon/Steel Plate
    chassis.fillStyle(0x0a1128, 0.95);
    chassis.fillRoundedRect(chassisX, chassisY, chassisW, chassisH, 24);
    chassis.lineStyle(3, 0x00f2fe, 0.6);
    chassis.strokeRoundedRect(chassisX, chassisY, chassisW, chassisH, 24);

    // Inner Chassis Plate with Technical Chamfers
    chassis.fillStyle(0x0f172a, 0.9);
    chassis.fillRoundedRect(chassisX + 16, chassisY + 16, chassisW - 32, chassisH - 32, 16);
    chassis.lineStyle(1.5, 0x334155, 0.8);
    chassis.strokeRoundedRect(chassisX + 16, chassisY + 16, chassisW - 32, chassisH - 32, 16);

    // Bolted Chassis Corners
    const cornerOffsets = [
      { x: chassisX + 28, y: chassisY + 28 },
      { x: chassisX + chassisW - 28, y: chassisY + 28 },
      { x: chassisX + 28, y: chassisY + chassisH - 28 },
      { x: chassisX + chassisW - 28, y: chassisY + chassisH - 28 },
    ];
    cornerOffsets.forEach((pt) => {
      chassis.fillStyle(0x475569, 1);
      chassis.fillCircle(pt.x, pt.y, 8);
      chassis.lineStyle(1, 0x94a3b8, 1);
      chassis.strokeCircle(pt.x, pt.y, 8);
    });

    // Technical Axis Guides & Centerlines
    const guides = this.add.graphics();
    guides.lineStyle(1.5, 0x00f2fe, 0.25);
    // Centerline connecting all 3 axles
    guides.lineBetween(chassisX + 60, 470, chassisX + chassisW - 60, 470);

    // Title on Chassis Frame
    const chassisTitle = this.createText(chassisX + 30, chassisY + 32, '⚙️ DİŞLİ AKTARIM VE TORK DÖNÜŞÜM ŞASİSİ [REV-4]', {
      fontSize: '15px',
      fontStyle: '900',
      color: '#00F2FE',
    });
    chassisTitle.setOrigin(0, 0.5);

    // Ambient radial glow behind the main mechanism
    const mechGlow = this.add.graphics();
    mechGlow.fillStyle(0x00f2fe, 0.06);
    mechGlow.fillCircle(750, 470, 360);
  }

  // =========================================================================
  // HEADER UI
  // =========================================================================

  private createHeaderUI(): void {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a1128, 0.94);
    headerBg.fillRoundedRect(this.GAME_WIDTH / 2 - 620, 16, 1240, 68, 16);
    headerBg.lineStyle(2, 0x00f2fe, 0.85);
    headerBg.strokeRoundedRect(this.GAME_WIDTH / 2 - 620, 16, 1240, 68, 16);

    // 1. Left: Game Title
    const title = this.createText(this.GAME_WIDTH / 2 - 380, 50, '4. OYUN: BİLİM VE SANAYİLEŞME', {
      fontSize: '22px',
      fontStyle: '900',
      color: '#FFD700',
      shadow: { color: '#00F2FE', blur: 8, fill: true },
    });
    title.setOrigin(0.5);

    // 2. Center: Dynamic Instructional Guidance
    this.instructionBannerText = this.createText(
      this.GAME_WIDTH / 2 + 50,
      50,
      'Büyükten küçüğe: Dişli oranlarını kurarak aktarım hattını tamamla!',
      {
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#38BDF8',
      }
    );
    this.instructionBannerText.setOrigin(0.5);

    // 3. Right: Elapsed Timer
    this.timerText = this.createText(this.GAME_WIDTH / 2 + 520, 50, 'SÜRE: 00:00', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#F8FAFC',
    });
    this.timerText.setOrigin(0.5);
  }

  private updateTimerUI(): void {
    if (!this.timerText) return;
    const mins = Math.floor(this.elapsedSeconds / 60);
    const secs = this.elapsedSeconds % 60;
    this.timerText.setText(`SÜRE: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
  }

  // =========================================================================
  // AXLE SOCKETS (MERKEZ MİLLERİ)
  // =========================================================================

  private setupAxleSockets(): void {
    // 3 Mathematically aligned Axles:
    // Large R=120, Medium R=85, Small R=55
    // Distance 1-2 = 120 + 85 = 205 -> X1=530, X2=735
    // Distance 2-3 = 85 + 55 = 140 -> X2=735, X3=875
    this.socketConfigs = [
      {
        id: 'socket_input',
        name: '1. GİRİŞ YUVASI',
        subLabel: 'Büyük Dişli (Güç Kaynağı - 1.0x)',
        x: 530,
        y: 470,
        radius: 120,
        acceptedGearId: 'gear_large',
        hintColor: 0xffd700,
      },
      {
        id: 'socket_trans',
        name: '2. AKTARMA YUVASI',
        subLabel: 'Orta Dişli (Hız/Yön - 1.41x)',
        x: 735,
        y: 470,
        radius: 85,
        acceptedGearId: 'gear_medium',
        hintColor: 0x38bdf8,
      },
      {
        id: 'socket_output',
        name: '3. ÇIKIŞ YUVASI',
        subLabel: 'Küçük Dişli (Yüksek Devir - 2.18x)',
        x: 875,
        y: 470,
        radius: 55,
        acceptedGearId: 'gear_small',
        hintColor: 0x00f2fe,
      },
    ];

    this.socketConfigs.forEach((cfg) => {
      const container = this.add.container(cfg.x, cfg.y);

      // Blueprint Outer Dashed Boundary Ring
      const dashedRing = this.add.graphics();
      dashedRing.lineStyle(2, cfg.hintColor, 0.4);
      dashedRing.strokeCircle(0, 0, cfg.radius);

      // Technical crosshair marks on ring
      dashedRing.lineStyle(1.5, cfg.hintColor, 0.6);
      dashedRing.lineBetween(-cfg.radius - 8, 0, -cfg.radius + 8, 0);
      dashedRing.lineBetween(cfg.radius - 8, 0, cfg.radius + 8, 0);
      dashedRing.lineBetween(0, -cfg.radius - 8, 0, -cfg.radius + 8);
      dashedRing.lineBetween(0, cfg.radius - 8, 0, cfg.radius + 8);

      // Axle Hub Base (Steel Bearing Seat)
      const hubBase = this.add.graphics();
      hubBase.fillStyle(0x1e293b, 0.9);
      hubBase.fillCircle(0, 0, 24);
      hubBase.lineStyle(2, 0x64748b, 1);
      hubBase.strokeCircle(0, 0, 24);

      // Central Steel Axle Shaft Pin
      hubBase.fillStyle(0x0284c7, 1);
      hubBase.fillCircle(0, 0, 10);
      hubBase.fillStyle(0xffffff, 0.9);
      hubBase.fillCircle(0, 0, 4);

      // Socket Label Below
      const labelY = cfg.radius + 18;
      const label = this.createText(0, labelY, cfg.name, {
        fontSize: '14px',
        fontStyle: '900',
        color: cfg.id === 'socket_input' ? '#FFD700' : cfg.id === 'socket_trans' ? '#38BDF8' : '#00F2FE',
      });
      label.setOrigin(0.5);

      const subLabel = this.createText(0, labelY + 16, cfg.subLabel, {
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#94A3B8',
      });
      subLabel.setOrigin(0.5);

      // Pedagogical Hint Glow Aura (Hidden initially, pulses if player makes 2 errors)
      const hintAura = this.add.graphics();
      hintAura.name = 'hint_aura';
      hintAura.fillStyle(cfg.hintColor, 0.25);
      hintAura.fillCircle(0, 0, cfg.radius + 16);
      hintAura.setAlpha(0);

      container.add([hintAura, dashedRing, hubBase, label, subLabel]);
      this.socketContainers.set(cfg.id, container);
    });
  }

  // =========================================================================
  // DYNAMO & TACHOMETER UNIT
  // =========================================================================

  private setupDynamoAndTachometer(): void {
    const dynamoX = 1070;
    const dynamoY = 470;

    const dynamoCont = this.add.container(dynamoX, dynamoY);

    // Dynamo Housing Body
    const body = this.add.graphics();
    body.fillStyle(0x1e293b, 0.95);
    body.fillRoundedRect(-90, -110, 180, 220, 16);
    body.lineStyle(2.5, 0x00f2fe, 0.8);
    body.strokeRoundedRect(-90, -110, 180, 220, 16);

    // Header Label
    const header = this.createText(0, -90, 'YÜKSEK DEVİRLİ\nJENERATÖR', {
      fontSize: '12px',
      fontStyle: '900',
      color: '#00F2FE',
      align: 'center',
    });
    header.setOrigin(0.5);

    // Tachometer Gauge Dial Frame (Round dial)
    const dial = this.add.graphics();
    dial.fillStyle(0x0a1128, 1);
    dial.fillCircle(0, -15, 45);
    dial.lineStyle(2, 0x38bdf8, 0.8);
    dial.strokeCircle(0, -15, 45);

    // Gauge Tick Marks
    dial.lineStyle(1.5, 0xffffff, 0.7);
    for (let a = -140; a <= 40; a += 30) {
      const rad = Phaser.Math.DegToRad(a);
      dial.lineBetween(Math.cos(rad) * 32, -15 + Math.sin(rad) * 32, Math.cos(rad) * 40, -15 + Math.sin(rad) * 40);
    }

    // Needle Graphics
    this.tachometerNeedle = this.add.graphics();
    this.tachometerNeedle.lineStyle(2.5, 0xef4444, 1);
    this.tachometerNeedle.lineBetween(0, -15, Math.cos(Phaser.Math.DegToRad(-140)) * 34, -15 + Math.sin(Phaser.Math.DegToRad(-140)) * 34);

    // Digital RPM Readout
    this.tachometerText = this.createText(0, 42, '0 RPM', {
      fontSize: '15px',
      fontStyle: '900',
      color: '#F8FAFC',
    });
    this.tachometerText.setOrigin(0.5);

    // Turbine Rotor Indicator at Bottom
    this.dynamoTurbine = this.add.graphics();
    this.dynamoTurbine.setPosition(0, 75);
    this.dynamoTurbine.fillStyle(0x00f2fe, 0.8);
    for (let b = 0; b < 6; b++) {
      const a = (b * Math.PI) / 3;
      this.dynamoTurbine.fillTriangle(0, 0, Math.cos(a) * 16, Math.sin(a) * 16, Math.cos(a + 0.3) * 16, Math.sin(a + 0.3) * 16);
    }

    dynamoCont.add([body, header, dial, this.tachometerNeedle, this.tachometerText, this.dynamoTurbine]);

    // Mechanical Connection Shaft from Small Gear Socket (875) to Dynamo (980)
    const connShaft = this.add.graphics();
    connShaft.fillStyle(0x475569, 0.9);
    connShaft.fillRect(875 + 55, 465, 50, 10);
    connShaft.lineStyle(1.5, 0x94a3b8, 1);
    connShaft.strokeRect(875 + 55, 465, 50, 10);
  }

  // =========================================================================
  // COMPONENT TRAY & DRAGGABLE INDUSTRIAL GEARS
  // =========================================================================

  private setupComponentTrayAndGears(): void {
    // Bottom Component Tray Container
    const trayY = 945;
    const trayW = 1200;
    const trayH = 175;

    const trayBg = this.add.graphics();
    trayBg.fillStyle(0x0a1128, 0.95);
    trayBg.fillRoundedRect(this.GAME_WIDTH / 2 - trayW / 2, trayY - trayH / 2, trayW, trayH, 20);
    trayBg.lineStyle(2.5, 0x00f2fe, 0.7);
    trayBg.strokeRoundedRect(this.GAME_WIDTH / 2 - trayW / 2, trayY - trayH / 2, trayW, trayH, 20);

    const trayLabel = this.createText(this.GAME_WIDTH / 2, trayY - trayH / 2 + 16, 'MEKANİK BİLEŞEN TEPSİSİ — DİŞLİ ELEMANLARI', {
      fontSize: '14px',
      fontStyle: '900',
      color: '#38BDF8',
    });
    trayLabel.setOrigin(0.5);

    // 3 Gear Configurations
    this.gearConfigs = [
      {
        id: 'gear_large',
        title: 'BÜYÜK DİŞLİ',
        subTitle: 'Güç Girişi (1.0x)',
        radius: 120,
        teeth: 20,
        mainColor: 0xf59e0b, // Gold
        rimColor: 0x78350f,
        spokeColor: 0xffd700,
        trayX: 520,
        trayY: trayY + 6,
        targetSocketId: 'socket_input',
        gearRatioLabel: 'Z=20 • 1.0x Tork',
        rotationSpeedMultiplier: 1.0, // Clockwise
      },
      {
        id: 'gear_medium',
        title: 'ORTA DİŞLİ',
        subTitle: 'Aktarma (1.41x)',
        radius: 85,
        teeth: 14,
        mainColor: 0x0284c7, // Sky Blue
        rimColor: 0x0c4a6e,
        spokeColor: 0x38bdf8,
        trayX: 860,
        trayY: trayY + 6,
        targetSocketId: 'socket_trans',
        gearRatioLabel: 'Z=14 • 1.41x Hız',
        rotationSpeedMultiplier: -1.41, // Counter-Clockwise
      },
      {
        id: 'gear_small',
        title: 'KÜÇÜK DİŞLİ',
        subTitle: 'Çıkış (2.18x)',
        radius: 55,
        teeth: 9,
        mainColor: 0x00f2fe, // Turquoise
        rimColor: 0x115e59,
        spokeColor: 0x2dd4bf,
        trayX: 1160,
        trayY: trayY + 6,
        targetSocketId: 'socket_output',
        gearRatioLabel: 'Z=9 • 2.18x Devir',
        rotationSpeedMultiplier: 2.18, // Clockwise
      },
    ];

    this.gearConfigs.forEach((cfg) => {
      this.createProceduralDraggableGear(cfg);
    });
  }

  private createProceduralDraggableGear(cfg: GearItem): void {
    const container = this.add.container(cfg.trayX, cfg.trayY);
    container.setDepth(20);

    // 1. Dynamic Drop Shadow (Dark ellipse underneath)
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillCircle(0, 8, cfg.radius * 0.95);
    shadow.name = 'gear_shadow';

    // 2. Procedural Teeth & Gear Body Graphics
    const gearGraphics = this.add.graphics();
    this.renderProceduralGearShape(gearGraphics, cfg);
    this.gearGraphicsMap.set(cfg.id, gearGraphics);

    // 3. Central Ratio / Info Badge
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0x0f172a, 0.9);
    badgeBg.fillCircle(0, 0, Math.max(22, cfg.radius * 0.32));
    badgeBg.lineStyle(1.5, cfg.spokeColor, 0.9);
    badgeBg.strokeCircle(0, 0, Math.max(22, cfg.radius * 0.32));

    const badgeText = this.createText(0, 0, `${cfg.teeth}T`, {
      fontSize: cfg.radius > 80 ? '16px' : '12px',
      fontStyle: '900',
      color: '#FFFFFF',
    });
    badgeText.setOrigin(0.5);

    container.add([shadow, gearGraphics, badgeBg, badgeText]);
    this.gearContainers.set(cfg.id, container);

    // Touch Interactive Setup
    const hitRadius = cfg.radius + 10;
    const hitArea = new Phaser.Geom.Circle(0, 0, hitRadius);
    container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    this.input.setDraggable(container);

    // --- Drag & Drop Event Listeners ---

    container.on('dragstart', () => {
      if (this.placedGears.has(cfg.id) || this.isMechanismRunning) return;

      container.setDepth(60);

      // Scale up 10% on pickup and expand shadow
      this.tweens.add({
        targets: container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 120,
        ease: 'Quad.easeOut',
      });

      this.tweens.add({
        targets: shadow,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.6,
        y: 18,
        duration: 120,
      });
    });

    container.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.placedGears.has(cfg.id) || this.isMechanismRunning) return;
      container.setPosition(dragX, dragY);
    });

    container.on('dragend', () => {
      if (this.placedGears.has(cfg.id) || this.isMechanismRunning) return;
      this.evaluateGearDrop(cfg, container);
    });
  }

  private renderProceduralGearShape(g: Phaser.GameObjects.Graphics, cfg: GearItem): void {
    const toothDepth = cfg.radius * 0.16;
    const outerR = cfg.radius;
    const innerR = cfg.radius - toothDepth;

    g.clear();

    // 1. Teeth Path
    g.fillStyle(cfg.mainColor, 1);
    g.beginPath();
    const totalPoints = cfg.teeth * 2;
    const step = (Math.PI * 2) / totalPoints;

    for (let i = 0; i < totalPoints; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * step;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;

      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();

    // 2. Outer Edge Highlight Line
    g.lineStyle(2.5, 0xffffff, 0.75);
    g.strokePath();

    // 3. Inner Rim Groove
    g.fillStyle(cfg.rimColor, 0.95);
    g.fillCircle(0, 0, innerR * 0.85);
    g.lineStyle(2, 0x000000, 0.6);
    g.strokeCircle(0, 0, innerR * 0.85);

    // 4. Cutout Windows (Weight Reduction Holes)
    const holeCount = cfg.radius > 100 ? 5 : cfg.radius > 70 ? 4 : 3;
    const holeR = innerR * 0.22;
    const holeDist = innerR * 0.52;

    g.fillStyle(0x070b19, 0.9);
    for (let h = 0; h < holeCount; h++) {
      const ha = (h * Math.PI * 2) / holeCount;
      const hx = Math.cos(ha) * holeDist;
      const hy = Math.sin(ha) * holeDist;
      g.fillCircle(hx, hy, holeR);
      g.lineStyle(1.5, cfg.spokeColor, 0.8);
      g.strokeCircle(hx, hy, holeR);
    }

    // 5. Axle Hub
    g.fillStyle(0x334155, 1);
    g.fillCircle(0, 0, innerR * 0.35);
    g.lineStyle(2, 0x94a3b8, 1);
    g.strokeCircle(0, 0, innerR * 0.35);
  }

  private evaluateGearDrop(cfg: GearItem, container: Phaser.GameObjects.Container): void {
    const targetSocket = this.socketConfigs.find((s) => s.id === cfg.targetSocketId);
    if (!targetSocket) return;

    // Check distance to target socket
    const distToTarget = Phaser.Math.Distance.Between(container.x, container.y, targetSocket.x, targetSocket.y);

    // Check if dropped near any wrong socket (< 80px)
    const droppedOnWrongSocket = this.socketConfigs.find(
      (s) => s.id !== cfg.targetSocketId && Phaser.Math.Distance.Between(container.x, container.y, s.x, s.y) < 90
    );

    if (distToTarget < 90) {
      // ✅ SUCCESSFUL SNAP TO CORRECT SOCKET
      this.handleGearSnapped(cfg, targetSocket, container);
    } else {
      // ❌ INCORRECT OR OUT-OF-BOUNDS DROP
      this.handleGearMissed(cfg, container, !!droppedOnWrongSocket);
    }
  }

  private handleGearSnapped(cfg: GearItem, socket: SocketConfig, container: Phaser.GameObjects.Container): void {
    this.placedGears.add(cfg.id);
    container.disableInteractive();

    // Snap to socket center
    this.tweens.add({
      targets: container,
      x: socket.x,
      y: socket.y,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 180,
      ease: 'Back.easeOut',
    });

    // Reset shadow
    const shadow = container.getByName('gear_shadow') as Phaser.GameObjects.Graphics;
    if (shadow) {
      this.tweens.add({
        targets: shadow,
        scaleX: 1.0,
        scaleY: 1.0,
        alpha: 0.3,
        y: 6,
        duration: 180,
      });
    }

    // Stop any active hint pulse on this socket
    const activeHint = this.socketHintTweens.get(socket.id);
    if (activeHint) {
      activeHint.stop();
      const sCont = this.socketContainers.get(socket.id);
      const hintAura = sCont?.getByName('hint_aura') as Phaser.GameObjects.Graphics;
      if (hintAura) hintAura.setAlpha(0);
    }

    // Sound: Metallic snap sound
    SoundFx.playGearSnap();

    // Camera feedback: Light camera shake
    this.cameras.main.shake(120, 0.0035);

    // Visual feedback: Axle lock spark flash ring
    const flashRing = this.add.graphics();
    flashRing.lineStyle(4, cfg.spokeColor, 0.9);
    flashRing.strokeCircle(socket.x, socket.y, cfg.radius);
    flashRing.setDepth(70);

    this.tweens.add({
      targets: flashRing,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0,
      duration: 400,
      onComplete: () => flashRing.destroy(),
    });

    // Feedback speech
    if (this.placedGears.size === 1) {
      this.pusula?.setMessage('Harika bir başlangıç! Diğer dişlileri de aktarım hattına ekle.');
    } else if (this.placedGears.size === 2) {
      this.pusula?.setMessage('Çok iyi gidiyorsun! Son dişli yüksek devirli çıkış milini tamamlayacak.');
    } else if (this.placedGears.size === 3) {
      // ALL 3 GEARS PLACED!
      this.onAllGearsInstalled();
    }
  }

  private handleGearMissed(cfg: GearItem, container: Phaser.GameObjects.Container, isWrongSocket: boolean): void {
    if (isWrongSocket) {
      this.errorCount++;
      const currentGearErrors = (this.gearErrorCounts.get(cfg.id) || 0) + 1;
      this.gearErrorCounts.set(cfg.id, currentGearErrors);

      SoundFx.playErrorTone();

      // If 2 errors made on this gear, trigger pedagogical pulse on correct socket
      if (currentGearErrors >= 2) {
        this.triggerSocketHint(cfg.targetSocketId);
        this.pusula?.setMessage('İpucu: Parlayan mavi yuvaya yerleştirmeyi dene!');
      } else {
        this.pusula?.setMessage('Dişli oranı bu yuvaya uymadı. Dişlinin boyutuna dikkat et!');
      }
    }

    // Spring back to original tray slot with Back.easeOut
    this.tweens.add({
      targets: container,
      x: cfg.trayX,
      y: cfg.trayY,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 420,
      ease: 'Back.easeOut',
    });

    const shadow = container.getByName('gear_shadow') as Phaser.GameObjects.Graphics;
    if (shadow) {
      this.tweens.add({
        targets: shadow,
        scaleX: 1.0,
        scaleY: 1.0,
        alpha: 0.4,
        y: 8,
        duration: 420,
      });
    }
  }

  private triggerSocketHint(socketId: string): void {
    const sCont = this.socketContainers.get(socketId);
    if (!sCont) return;

    const hintAura = sCont.getByName('hint_aura') as Phaser.GameObjects.Graphics;
    if (!hintAura) return;

    if (!this.socketHintTweens.has(socketId)) {
      const tween = this.tweens.add({
        targets: hintAura,
        alpha: { from: 0.1, to: 0.8 },
        scaleX: { from: 0.95, to: 1.15 },
        scaleY: { from: 0.95, to: 1.15 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.socketHintTweens.set(socketId, tween);
    }
  }

  // =========================================================================
  // POWER LEVER (GÜÇ KOLU / ŞALTER)
  // =========================================================================

  private setupPowerLever(): void {
    const leverBaseX = 1480;
    const leverBaseY = 470;

    this.leverContainer = this.add.container(leverBaseX, leverBaseY);

    // 1. Lever Housing Frame (Industrial Switch Box)
    const box = this.add.graphics();
    box.fillStyle(0x0f172a, 0.98);
    box.fillRoundedRect(-70, -180, 140, 360, 20);
    box.lineStyle(3, 0x475569, 0.9);
    box.strokeRoundedRect(-70, -180, 140, 360, 20);

    // Vertical Lever Track Slot
    box.fillStyle(0x020617, 1);
    box.fillRoundedRect(-18, -120, 36, 240, 14);
    box.lineStyle(2, 0x1e293b, 1);
    box.strokeRoundedRect(-18, -120, 36, 240, 14);

    // Inactive Red Glow (Switches to vibrant cyan/green when active)
    this.leverGlow = this.add.graphics();
    this.leverGlow.fillStyle(0xef4444, 0.2);
    this.leverGlow.fillRoundedRect(-76, -186, 152, 372, 24);

    // Box Header Label
    const boxHeader = this.createText(0, -145, 'ANA GÜÇ KOLU', {
      fontSize: '13px',
      fontStyle: '900',
      color: '#94A3B8',
    });
    boxHeader.setOrigin(0.5);

    // 2. Movable Lever Handle (Initial state: at bottom Y=75)
    this.leverHandle = this.add.container(0, 75);

    // Heavy Metal Shaft
    const handleShaft = this.add.graphics();
    handleShaft.fillStyle(0x94a3b8, 1);
    handleShaft.fillRoundedRect(-12, -25, 24, 50, 6);
    handleShaft.lineStyle(1.5, 0xffffff, 0.8);
    handleShaft.strokeRoundedRect(-12, -25, 24, 50, 6);

    // Solid Knob Grip (Inactive Red #EF4444)
    const knob = this.add.graphics();
    knob.fillStyle(0xef4444, 1);
    knob.fillCircle(0, 0, 32);
    knob.lineStyle(3, 0xffffff, 0.9);
    knob.strokeCircle(0, 0, 32);

    const knobIcon = this.createText(0, -1, '⚡', {
      fontSize: '24px',
    });
    knobIcon.setOrigin(0.5);

    this.leverHandle.add([handleShaft, knob, knobIcon]);

    // Status Text below lever
    this.leverStatusText = this.createText(0, 145, 'KİLİTLİ', {
      fontSize: '14px',
      fontStyle: '900',
      color: '#EF4444',
    });
    this.leverStatusText.setOrigin(0.5);

    this.leverContainer.add([this.leverGlow, box, boxHeader, this.leverHandle, this.leverStatusText]);

    // Mechanical Conduit Cable connecting Lever Box to Chassis
    const conduit = this.add.graphics();
    conduit.lineStyle(6, 0x1e293b, 1);
    conduit.lineBetween(leverBaseX - 70, leverBaseY, 1320, leverBaseY);
    conduit.lineStyle(2, 0x00f2fe, 0.3);
    conduit.lineBetween(leverBaseX - 70, leverBaseY, 1320, leverBaseY);
  }

  private onAllGearsInstalled(): void {
    this.isLeverActive = true;

    // Update Header guidance
    if (this.instructionBannerText) {
      this.instructionBannerText.setText('Mekanizma hazır! Sağdaki güç kolunu çekerek hareketi başlat.');
      this.instructionBannerText.setColor('#10B981');
    }

    this.pusula?.setMessage('Harika! Mekanizma tamamlandı. Sağdaki güç kolunu yukarı çekerek hareketi başlat!');

    // Activate Lever Visuals (Red -> Neon Green / Cyan Pulse)
    if (this.leverGlow) {
      this.leverGlow.clear();
      this.leverGlow.fillStyle(0x10b981, 0.35);
      this.leverGlow.fillRoundedRect(-76, -186, 152, 372, 24);

      this.tweens.add({
        targets: this.leverGlow,
        alpha: { from: 0.3, to: 0.9 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    if (this.leverStatusText) {
      this.leverStatusText.setText('ÇEK & ÇALIŞTIR');
      this.leverStatusText.setColor('#10B981');
    }

    // Update Handle Knob Color to Vibrant Green
    if (this.leverHandle) {
      const knob = this.leverHandle.list[1] as Phaser.GameObjects.Graphics;
      if (knob) {
        knob.clear();
        knob.fillStyle(0x10b981, 1);
        knob.fillCircle(0, 0, 32);
        knob.lineStyle(3, 0xffffff, 0.9);
        knob.strokeCircle(0, 0, 32);
      }

      // Make Lever Handle Interactive
      const hitArea = new Phaser.Geom.Circle(0, 0, 45);
      this.leverHandle.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

      this.leverHandle.on('pointerdown', () => {
        this.engagePowerMechanism();
      });
    }
  }

  private engagePowerMechanism(): void {
    if (!this.isLeverActive || this.isLeverPulled) return;
    this.isLeverPulled = true;

    if (this.leverHandle) {
      this.leverHandle.disableInteractive();

      // Lever slides upwards with mechanical movement
      this.tweens.add({
        targets: this.leverHandle,
        y: -75,
        duration: 250,
        ease: 'Back.easeOut',
      });
    }

    // Play Lever Sound
    SoundFx.playLeverPull();

    // Change status text
    if (this.leverStatusText) {
      this.leverStatusText.setText('GÜÇ AKTARILIYOR');
      this.leverStatusText.setColor('#00F2FE');
    }

    // Update Header Text
    if (this.instructionBannerText) {
      this.instructionBannerText.setText('El işçiliğinden sanayileşmeye: Dişliler potansiyel enerjiyi kesintisiz harekete dönüştürür.');
      this.instructionBannerText.setColor('#00F2FE');
    }

    this.pusula?.setMessage('Mekanik tork küçük dişliye aktarılarak yüksek devir ve hız elde edildi!');

    // Start Gear Rotation
    this.isMechanismRunning = true;
    SoundFx.playGearSpin();

    // Animate RPM Gauge Needle to 1500 RPM
    if (this.tachometerNeedle) {
      const needle = this.tachometerNeedle;
      const rpmObj = { val: 0, angle: -140 };

      this.tweens.add({
        targets: rpmObj,
        val: 1500,
        angle: 40,
        duration: 1400,
        ease: 'Quad.easeOut',
        onUpdate: () => {
          needle.clear();
          needle.lineStyle(2.5, 0xef4444, 1);
          const rad = Phaser.Math.DegToRad(rpmObj.angle);
          needle.lineBetween(0, -15, Math.cos(rad) * 34, -15 + Math.sin(rad) * 34);

          if (this.tachometerText) {
            this.tachometerText.setText(`${Math.round(rpmObj.val)} RPM`);
            this.tachometerText.setColor(rpmObj.val > 1000 ? '#00F2FE' : '#F8FAFC');
          }
        },
      });
    }

    // Emit Kinetic Energy Spark Particles from Mesh Points
    this.createKineticEnergyParticleSparks();

    // After 2.2 seconds of glorious motion, open Victory Modal
    this.time.delayedCall(2200, () => {
      this.onGameCompleted();
    });
  }

  private createKineticEnergyParticleSparks(): void {
    // Contact mesh points between Gear 1 and 2 (632, 470) and Gear 2 and 3 (805, 470)
    const meshPoints = [
      { x: 632, y: 470, color: 0xffd700 },
      { x: 805, y: 470, color: 0x00f2fe },
      { x: 930, y: 470, color: 0x38bdf8 },
    ];

    meshPoints.forEach((pt) => {
      for (let i = 0; i < 20; i++) {
        const spark = this.add.circle(pt.x, pt.y, Phaser.Math.Between(2, 5), pt.color, 0.9);
        spark.setDepth(80);

        this.tweens.add({
          targets: spark,
          x: pt.x + Phaser.Math.Between(-35, 35),
          y: pt.y + Phaser.Math.Between(-40, 40),
          alpha: 0,
          scale: 0.2,
          duration: Phaser.Math.Between(400, 900),
          repeat: 3,
          onComplete: () => spark.destroy(),
        });
      }
    });
  }

  // =========================================================================
  // VICTORY SCREEN & MODAL PROGRESSION
  // =========================================================================

  private onGameCompleted(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;

    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    // Play Victory Fanfare
    SoundFx.playVictoryFanfare();

    // Build In-Canvas Victory Modal Container
    this.createEngineeringVictoryModal();
  }

  private createEngineeringVictoryModal(): void {
    const modalCont = this.add.container(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2);
    modalCont.setDepth(200);

    // 1. Dark Backdrop Overlay
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x070b19, 0.88);
    backdrop.fillRect(-this.GAME_WIDTH / 2, -this.GAME_HEIGHT / 2, this.GAME_WIDTH, this.GAME_HEIGHT);

    // 2. Modal Frame
    const width = 760;
    const height = 560;

    const modalBg = this.add.graphics();
    modalBg.fillStyle(0x0a1128, 0.97);
    modalBg.fillRoundedRect(-width / 2, -height / 2, width, height, 24);
    modalBg.lineStyle(3, 0x00f2fe, 0.9);
    modalBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 24);

    // Outer Aura Glow
    const outerAura = this.add.graphics();
    outerAura.fillStyle(0x00f2fe, 0.15);
    outerAura.fillRoundedRect(-width / 2 - 12, -height / 2 - 12, width + 24, height + 24, 30);

    // 3. Header: "MEKANİK ENERJİ AKTARILDI! ⚙️"
    const headerText = this.createText(0, -height / 2 + 55, '⚙️ MEKANİK ENERJİ AKTARILDI!', {
      fontSize: '36px',
      fontStyle: '900',
      color: '#FFD700',
      align: 'center',
      shadow: { color: '#00F2FE', blur: 15, fill: true },
    });
    headerText.setOrigin(0.5);

    // Subtitle: "Mühendislik Damgasını Kazandın!"
    const subText = this.createText(0, -height / 2 + 105, 'Mühendislik Damgasını Kazandın!', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#00F2FE',
      align: 'center',
    });
    subText.setOrigin(0.5);

    // 4. Metric Ratings Display (Gözlem, Ustalık, Mühendislik)
    const metricsCont = this.add.container(0, -height / 2 + 200);

    const metrics = [
      { label: 'GÖZLEM', stars: '⭐⭐⭐', color: '#38BDF8' },
      { label: 'USTALIK', stars: '⭐⭐⭐', color: '#FFD700' },
      { label: 'MÜHENDİSLİK', stars: '⭐⭐⭐', color: '#00F2FE' },
    ];

    metrics.forEach((m, idx) => {
      const itemX = (idx - 1) * 220;

      // Card frame
      const card = this.add.graphics();
      card.fillStyle(0x0f172a, 0.9);
      card.fillRoundedRect(itemX - 95, -45, 190, 90, 14);
      card.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(m.color).color, 0.8);
      card.strokeRoundedRect(itemX - 95, -45, 190, 90, 14);

      const label = this.createText(itemX, -22, m.label, {
        fontSize: '15px',
        fontStyle: '900',
        color: m.color,
      });
      label.setOrigin(0.5);

      const starText = this.createText(itemX, 15, m.stars, {
        fontSize: '22px',
      });
      starText.setOrigin(0.5);

      metricsCont.add([card, label, starText]);
    });

    // 5. Score & Stats Summary
    const finalScore = Math.max(500, 1000 - this.elapsedSeconds * 4 - this.errorCount * 30);
    const detailsText = this.createText(
      0,
      130,
      `Süre: ${this.elapsedSeconds}sn   •   Hatalı Deneme: ${this.errorCount}   •   Mühendislik Puanı: ${finalScore}`,
      {
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#E2E8F0',
        align: 'center',
      }
    );
    detailsText.setOrigin(0.5);

    // 6. Action Button: "HARİTAYA DÖN"
    const returnBtn = new GameButton(
      this,
      0,
      205,
      380,
      86,
      'HARİTAYA DÖN  ➔',
      () => {
        // Update GameStore: Complete Sanayilesme and auto-unlock Milli Teknoloji
        GameStore.completeModule('sanayilesme');

        this.cameras.main.fadeOut(350, 7, 11, 25);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start(SceneKeys.WORLD_MAP);
        });
      },
      0x00f2fe,
      '#070B19'
    );

    modalCont.add([backdrop, outerAura, modalBg, headerText, subText, metricsCont, detailsText, returnBtn]);

    // Scale pop-in entrance animation
    modalCont.setScale(0.7);
    modalCont.setAlpha(0);
    this.tweens.add({
      targets: modalCont,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1.0,
      duration: 350,
      ease: 'Back.easeOut',
    });
  }

  // =========================================================================
  // CORNER BACK BUTTON
  // =========================================================================

  private createCornerBackButton(): void {
    const btn = this.add.container(65, 50);
    btn.setDepth(50);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a1128, 0.9);
    bg.fillCircle(0, 0, 26);
    bg.lineStyle(2, 0x00f2fe, 0.85);
    bg.strokeCircle(0, 0, 26);

    const iconText = this.add.text(0, 0, '◄', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '20px',
      color: '#00F2FE',
    });
    iconText.setOrigin(0.5);

    btn.add([bg, iconText]);

    const hitArea = new Phaser.Geom.Circle(0, 0, 26);
    btn.setInteractive(hitArea, Phaser.Geom.Circle.Contains, true);

    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 7, 11, 25);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKeys.WORLD_MAP);
      });
    });
  }
}
