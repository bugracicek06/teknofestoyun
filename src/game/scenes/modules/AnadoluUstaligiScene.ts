import { BaseScene } from '../BaseScene';
import { SceneKeys } from '../../../types/game';
import { GameStore } from '../../state/GameStore';
import { PusulaCharacter } from '../../objects/PusulaCharacter';
import { RotatablePatternPiece } from '../../objects/RotatablePatternPiece';
import type { PatternPieceConfig } from '../../objects/RotatablePatternPiece';
import { PatternDropZone } from '../../objects/PatternDropZone';
import type { PatternZoneConfig } from '../../objects/PatternDropZone';
import { TracePath } from '../../objects/TracePath';
import type { PathSegment } from '../../objects/TracePath';
import { GearNode } from '../../objects/GearNode';
import type { GearConfig } from '../../objects/GearNode';
import { MechanismController } from '../../objects/MechanismController';
import type { AxleConfig } from '../../objects/MechanismController';
import { VictoryModal } from '../../objects/VictoryModal';
import { EventBus } from '../../state/EventBus';
import Phaser from 'phaser';

// Safe TypeScript Asset Imports for Vite production bundler
import patternPiece1Url from '../../../assets/svg/pattern_piece_1.svg';
import patternPiece2Url from '../../../assets/svg/pattern_piece_2.svg';
import patternPiece3Url from '../../../assets/svg/pattern_piece_3.svg';
import patternPiece4Url from '../../../assets/svg/pattern_piece_4.svg';
import patternPiece5Url from '../../../assets/svg/pattern_piece_5.svg';
import patternPiece6Url from '../../../assets/svg/pattern_piece_6.svg';
import copperPlateUrl from '../../../assets/svg/copper_plate.svg';
import gearSmallUrl from '../../../assets/svg/gear_small.svg';
import gearMediumUrl from '../../../assets/svg/gear_medium.svg';
import gearLargeUrl from '../../../assets/svg/gear_large.svg';
import gearGiantUrl from '../../../assets/svg/gear_giant.svg';
import crankHandleUrl from '../../../assets/svg/crank_handle.svg';

export class AnadoluUstaligiScene extends BaseScene {
  private pusula?: PusulaCharacter;
  private currentPhase = 1;
  private placedPatternCount = 0;
  private totalErrors = 0;
  private elapsedSeconds = 0;

  private timerEvent?: Phaser.Time.TimerEvent;
  private timerText?: Phaser.GameObjects.Text;
  private phaseTitleText?: Phaser.GameObjects.Text;
  private isCompleted = false;

  // Phase 1 Objects
  private patternDropZones: PatternDropZone[] = [];
  private patternPieces: RotatablePatternPiece[] = [];

  // Phase 2 Objects
  private copperPlateImage?: Phaser.GameObjects.Image;
  private tracePathObj?: TracePath;

  // Phase 3 Objects
  private mechanismController?: MechanismController;
  private gearNodes: GearNode[] = [];

  constructor() {
    super(SceneKeys.ANADOLU_USTALIGI);
  }

  preload(): void {
    if (!this.textures.exists('pattern_piece_1')) {
      this.load.image('pattern_piece_1', patternPiece1Url);
      this.load.image('pattern_piece_2', patternPiece2Url);
      this.load.image('pattern_piece_3', patternPiece3Url);
      this.load.image('pattern_piece_4', patternPiece4Url);
      this.load.image('pattern_piece_5', patternPiece5Url);
      this.load.image('pattern_piece_6', patternPiece6Url);
      this.load.image('copper_plate', copperPlateUrl);
      this.load.image('gear_small', gearSmallUrl);
      this.load.image('gear_medium', gearMediumUrl);
      this.load.image('gear_large', gearLargeUrl);
      this.load.image('gear_giant', gearGiantUrl);
      this.load.image('crank_handle', crankHandleUrl);
    }
  }

  create(): void {
    this.currentPhase = 1;
    this.placedPatternCount = 0;
    this.totalErrors = 0;
    this.elapsedSeconds = 0;
    this.isCompleted = false;
    this.patternDropZones = [];
    this.patternPieces = [];
    this.gearNodes = [];

    this.cameras.main.fadeIn(350, 7, 11, 25);

    // Safely bind Scene shutdown and destroy hooks for clean memory management
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUpScene, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanUpScene, this);

    // 1. Workshop Environment Background
    this.createWorkshopEnvironment();

    // 2. Header UI Panel
    this.createHeaderUI();

    // 3. Setup Phase 1: Geometric Motif Pattern Assembly
    this.setupPhase1Pattern();

    // 4. Pusula Companion Character
    this.pusula = new PusulaCharacter(
      this,
      240,
      760,
      'Ustanın yarım kalan geometrik desenini tamamla! Parçalara dokunarak döndürebilirsin.'
    );

    // 5. Neutral Elapsed Timer
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

    EventBus.emit('current-scene-ready', SceneKeys.ANADOLU_USTALIGI);
  }

  private cleanUpScene(): void {
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = undefined;
    }
    if (this.tracePathObj) {
      this.tracePathObj.destroy();
      this.tracePathObj = undefined;
    }
    if (this.mechanismController) {
      this.mechanismController.destroy();
      this.mechanismController = undefined;
    }
    this.tweens.killAll();
    this.input.off('pointermove');
    this.input.off('pointerup');
  }

  private createWorkshopEnvironment(): void {
    const bg = this.add.graphics();

    // Deep Anatolian Turquoise & Terracotta Atmosphere
    bg.fillStyle(0x0f172a, 1);
    bg.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Ambient Lighting Rays (Top-Center)
    const lightGlow = this.add.graphics();
    lightGlow.fillStyle(0x00f2fe, 0.15);
    lightGlow.fillCircle(this.GAME_WIDTH / 2, 300, 520);

    // Craft Workshop Wall Tiles & Wooden Racks
    const wallRacks = this.add.graphics();
    wallRacks.fillStyle(0x1e293b, 0.9);
    wallRacks.fillRect(0, 0, 320, 1080);
    wallRacks.fillRect(1600, 0, 320, 1080);

    // Floating Golden Dust Particle Stars
    for (let i = 0; i < 20; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(340, 1580),
        Phaser.Math.Between(150, 950),
        Phaser.Math.Between(2, 5),
        0xffd700,
        0.5
      );
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        y: star.y - 40,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private createHeaderUI(): void {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a1128, 0.92);
    headerBg.fillRoundedRect(this.GAME_WIDTH / 2 - 500, 20, 1000, 70, 16);
    headerBg.lineStyle(2, 0x00f2fe, 0.8);
    headerBg.strokeRoundedRect(this.GAME_WIDTH / 2 - 500, 20, 1000, 70, 16);

    this.phaseTitleText = this.createText(this.GAME_WIDTH / 2 - 260, 55, 'AŞAMA 1: DESENİ TAMAMLA', {
      fontSize: '24px',
      fontStyle: '900',
      color: '#00F2FE',
    });
    this.phaseTitleText.setOrigin(0.5);

    this.timerText = this.createText(this.GAME_WIDTH / 2 + 340, 55, 'SÜRE: 00:00', {
      fontSize: '22px',
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
  // AŞAMA 1 – DESENİ TAMAMLA
  // =========================================================================

  private setupPhase1Pattern(): void {
    // 6 Octagonal Motif Target Drop Zones (Center Grid)
    const zoneConfigs: PatternZoneConfig[] = [
      { id: 'zone_1', x: 760, y: 400, width: 110, height: 110, label: '1' },
      { id: 'zone_2', x: 960, y: 400, width: 110, height: 110, label: '2' },
      { id: 'zone_3', x: 1160, y: 400, width: 110, height: 110, label: '3' },
      { id: 'zone_4', x: 760, y: 600, width: 110, height: 110, label: '4' },
      { id: 'zone_5', x: 960, y: 600, width: 110, height: 110, label: '5' },
      { id: 'zone_6', x: 1160, y: 600, width: 110, height: 110, label: '6' },
    ];

    zoneConfigs.forEach((cfg) => {
      const zone = new PatternDropZone(this, cfg, (z) => this.handleZoneClicked(z));
      this.patternDropZones.push(zone);
    });

    // 6 Rotatable Pattern Pieces (Positioned on bottom tray)
    const pieceConfigs: PatternPieceConfig[] = [
      { id: 'p_1', svgKey: 'pattern_piece_1', targetZoneId: 'zone_1', correctAngle: 0, origX: 420, origY: 960, width: 100, height: 100 },
      { id: 'p_2', svgKey: 'pattern_piece_2', targetZoneId: 'zone_2', correctAngle: 90, origX: 640, origY: 960, width: 100, height: 100 },
      { id: 'p_3', svgKey: 'pattern_piece_3', targetZoneId: 'zone_3', correctAngle: 0, origX: 860, origY: 960, width: 100, height: 100 },
      { id: 'p_4', svgKey: 'pattern_piece_4', targetZoneId: 'zone_4', correctAngle: 180, origX: 1080, origY: 960, width: 100, height: 100 },
      { id: 'p_5', svgKey: 'pattern_piece_5', targetZoneId: 'zone_5', correctAngle: 270, origX: 1300, origY: 960, width: 100, height: 100 },
      { id: 'p_6', svgKey: 'pattern_piece_6', targetZoneId: 'zone_6', correctAngle: 0, origX: 1520, origY: 960, width: 100, height: 100 },
    ];

    pieceConfigs.forEach((cfg) => {
      const piece = new RotatablePatternPiece(
        this,
        cfg,
        this.patternDropZones,
        (p, z) => this.handlePatternPlaced(p, z),
        (_p, _z) => this.handlePatternError()
      );
      this.patternPieces.push(piece);
    });
  }

  private handleZoneClicked(zone: PatternDropZone): void {
    const selectedPiece = this.patternPieces.find((p) => !p.isPlaced && p.config.targetZoneId === zone.config.id);

    if (selectedPiece) {
      if (selectedPiece.currentAngle === selectedPiece.config.correctAngle) {
        selectedPiece.snapToZone(zone, (p, z) => this.handlePatternPlaced(p, z));
      } else {
        zone.registerFailedAttempt();
        selectedPiece.returnToTray();
        this.handlePatternError();
      }
    }
  }

  private handlePatternPlaced(_piece: RotatablePatternPiece, _zone: PatternDropZone): void {
    this.placedPatternCount++;

    if (this.placedPatternCount === 6) {
      // Phase 1 Complete! Motif animates with color wave!
      this.pusula?.setMessage('Geometrik desenlerde düzen, tekrar ve ölçü birlikte kullanılır.');

      const flashGlow = this.add.graphics();
      flashGlow.fillStyle(0xffd700, 0.4);
      flashGlow.fillCircle(960, 500, 260);

      this.tweens.add({
        targets: flashGlow,
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          flashGlow.destroy();
          this.time.delayedCall(600, () => this.startPhase2());
        },
      });
    }
  }

  private handlePatternError(): void {
    this.totalErrors++;
  }

  // =========================================================================
  // AŞAMA 2 – BAKIRA İZ BIRAK
  // =========================================================================

  private startPhase2(): void {
    this.currentPhase = 2;
    if (this.phaseTitleText) {
      this.phaseTitleText.setText('AŞAMA 2: BAKIRA İZ BIRAK (ÇİZGİLERİ SIRAYLA TAKİP ET)');
    }

    // Hide Phase 1 pattern objects
    this.patternPieces.forEach((p) => p.setVisible(false));
    this.patternDropZones.forEach((z) => z.setVisible(false));

    // Render Polished Copper Plate in Center
    if (this.textures.exists('copper_plate')) {
      this.copperPlateImage = this.add.image(this.GAME_WIDTH / 2, 500, 'copper_plate');
      this.copperPlateImage.setDisplaySize(680, 440);
    }

    // 3 Tracing Path Segments across the copper plate
    const traceSegments: PathSegment[] = [
      { id: 1, startX: 680, startY: 340, endX: 1240, endY: 340 },
      { id: 2, startX: 1240, startY: 340, endX: 680, endY: 660 },
      { id: 3, startX: 680, startY: 660, endX: 1240, endY: 660 },
    ];

    this.tracePathObj = new TracePath(this, 0, 0, traceSegments, () => this.onPhase2Complete());

    this.pusula?.setMessage('Bakır, Anadolu’da kaplardan süs eşyalarına kadar pek çok üründe işlenmiştir. Deseni takip et!');
  }

  private onPhase2Complete(): void {
    if (this.currentPhase !== 2) return;
    this.currentPhase = 3;

    // Copper Plate rotates smoothly under warm light
    if (this.copperPlateImage) {
      this.tweens.add({
        targets: this.copperPlateImage,
        angle: 360,
        duration: 900,
        ease: 'Quad.easeInOut',
      });
    }

    this.pusula?.setMessage('Harika! Bakır eser ışık altında pırıl pırıl parlıyor.');

    this.time.delayedCall(900, () => this.startPhase3());
  }

  // =========================================================================
  // AŞAMA 3 – MEKANİZMAYI ÇALIŞTIR
  // =========================================================================

  private startPhase3(): void {
    if (this.phaseTitleText) {
      this.phaseTitleText.setText('AŞAMA 3: MEKANİZMAYI ÇALIŞTIR (DİŞLİLERİ DİZ VE KRANKI ÇEVİR)');
    }

    if (this.copperPlateImage) this.copperPlateImage.setVisible(false);
    if (this.tracePathObj) this.tracePathObj.setVisible(false);

    // 3 Axle Configurations on Mechanism Board (Physically aligned for tooth mesh: 640 -> 765 -> 945)
    const axleConfigs: AxleConfig[] = [
      { id: 'axle_1', x: 640, y: 540, acceptedSizeType: 'small' },
      { id: 'axle_2', x: 765, y: 540, acceptedSizeType: 'medium' },
      { id: 'axle_3', x: 945, y: 540, acceptedSizeType: 'large' },
    ];

    this.mechanismController = new MechanismController(this, axleConfigs, () => this.onGameCompleted());

    // 4 Gear Configs (Small r=45, Medium r=80, Large r=100, Giant r=120)
    const gearConfigs: GearConfig[] = [
      { id: 'g_small', sizeType: 'small', radius: 45, svgKey: 'gear_small', targetAxleId: 'axle_1', origX: 420, origY: 960 },
      { id: 'g_medium', sizeType: 'medium', radius: 80, svgKey: 'gear_medium', targetAxleId: 'axle_2', origX: 740, origY: 960 },
      { id: 'g_large', sizeType: 'large', radius: 100, svgKey: 'gear_large', targetAxleId: 'axle_3', origX: 1100, origY: 960 },
      { id: 'g_giant', sizeType: 'giant', radius: 120, svgKey: 'gear_giant', targetAxleId: 'none', origX: 1460, origY: 960 },
    ];

    gearConfigs.forEach((cfg) => {
      const gear = new GearNode(
        this,
        cfg,
        (g, axleId) => {
          if (this.mechanismController) {
            const isCorrect = this.mechanismController.checkGearPlacement(g, axleId);
            if (!isCorrect) this.totalErrors++;
          }
        }
      );
      this.gearNodes.push(gear);
      if (this.mechanismController) {
        this.mechanismController.registerGear(gear);
      }
    });

    this.pusula?.setMessage('Dişliler, hareketin yönünü ve hızını değiştirebilir. Dişlileri doğru millere diz!');
  }

  private onGameCompleted(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;

    if (this.timerEvent) this.timerEvent.remove();

    this.pusula?.setMessage('Ahilik geleneği; meslek ahlakı, dayanışma ve kaliteli üretime önem verir. Ustalık; bilgi, sabır, ölçü ve deneyimin birleşimidir.');

    // Workshop Light Mechanism Illumination Animation
    const wallLights = this.add.graphics();
    wallLights.fillStyle(0xffd700, 0.5);
    wallLights.fillCircle(1210, 550, 180);

    this.tweens.add({
      targets: wallLights,
      alpha: { from: 0.9, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: 3,
    });

    // Update GameStore: Complete Anadolu Ustaligi ONCE
    GameStore.completeModule('anadolu_ustaligi');

    // Calculate Victory Stats
    const stats = VictoryModal.calculateStats(this.elapsedSeconds, this.totalErrors);

    this.time.delayedCall(1200, () => {
      new VictoryModal(this, stats, () => {
        this.cameras.main.fadeOut(350, 7, 11, 25);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start(SceneKeys.WORLD_MAP);
        });
      });
    });
  }

  private createCornerBackButton(): void {
    const btn = this.add.container(65, 55);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a1128, 0.9);
    bg.fillCircle(0, 0, 28);
    bg.lineStyle(2, 0x00f2fe, 0.8);
    bg.strokeCircle(0, 0, 28);

    const iconText = this.add.text(0, 0, '◄', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '22px',
      color: '#00F2FE',
    });
    iconText.setOrigin(0.5);

    btn.add([bg, iconText]);

    const hitArea = new Phaser.Geom.Circle(0, 0, 28);
    btn.setInteractive(hitArea, Phaser.Geom.Circle.Contains, true);

    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 7, 11, 25);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKeys.WORLD_MAP);
      });
    });
  }
}
