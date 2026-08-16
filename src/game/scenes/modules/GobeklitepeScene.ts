import { BaseScene } from '../BaseScene';
import { SceneKeys } from '../../../types/game';
import { GameStore } from '../../state/GameStore';
import { PusulaCharacter } from '../../objects/PusulaCharacter';
import { StoneDropZone } from '../../objects/StoneDropZone';
import type { DropZoneConfig } from '../../objects/StoneDropZone';
import { DraggableStone } from '../../objects/DraggableStone';
import type { StonePieceConfig } from '../../objects/DraggableStone';
import { VictoryModal } from '../../objects/VictoryModal';
import { SoundFx } from '../../utils/audio';
import { EventBus } from '../../state/EventBus';
import Phaser from 'phaser';

// Safe TypeScript Asset Imports for Vite production bundler
import gobeklitepeBgUrl from '../../../assets/gobeklitepe_bg.png';
import pieceTpillarUrl from '../../../assets/svg/piece_tpillar.svg';
import pieceEnclosureUrl from '../../../assets/svg/piece_enclosure.svg';
import reliefFoxUrl from '../../../assets/svg/relief_fox.svg';
import reliefBoarUrl from '../../../assets/svg/relief_boar.svg';
import reliefBirdUrl from '../../../assets/svg/relief_bird.svg';

export class GobeklitepeScene extends BaseScene {
  private pusula?: PusulaCharacter;
  private dropZones: StoneDropZone[] = [];
  private draggableStones: DraggableStone[] = [];

  private currentPhase = 1;
  private placedCount = 0;
  private errorCount = 0;
  private elapsedSeconds = 0;
  private timerEvent?: Phaser.Time.TimerEvent;
  private counterText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private objectiveText?: Phaser.GameObjects.Text;
  private isCompleted = false;

  private bgImage?: Phaser.GameObjects.Image;

  constructor() {
    super(SceneKeys.GOBEKLITEPE);
  }

  preload(): void {
    // 1. Mandatory Background Asset (Imported URL for Vite production bundler)
    if (!this.textures.exists('gobeklitepe_bg')) {
      this.load.image('gobeklitepe_bg', gobeklitepeBgUrl);
    }

    // 2. Realistic Limestone Vector Megalith Assets (Loaded as images for 100% reliable decoding)
    if (!this.textures.exists('piece_tpillar')) {
      this.load.image('piece_tpillar', pieceTpillarUrl);
      this.load.image('piece_enclosure', pieceEnclosureUrl);
      this.load.image('relief_fox', reliefFoxUrl);
      this.load.image('relief_boar', reliefBoarUrl);
      this.load.image('relief_bird', reliefBirdUrl);
    }
  }

  create(): void {
    // Reset state variables
    this.currentPhase = 1;
    this.placedCount = 0;
    this.errorCount = 0;
    this.elapsedSeconds = 0;
    this.isCompleted = false;
    this.dropZones = [];
    this.draggableStones = [];

    // Smooth Camera Fade-in from World Map transition
    this.cameras.main.fadeIn(350, 7, 11, 25);

    // Safely bind Scene shutdown and destroy hooks for clean memory management
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUpScene, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanUpScene, this);

    // 1. Mandatory Main Landscape Background Layer
    this.createBackgroundLayer();

    // 2. Slim, Semi-Transparent Limestone Header Strip
    this.createHeaderUI();

    // 3. Dynamic Drop Zones aligned with the background architecture
    this.setupDropZones();

    // 4. Archaeology Excavation Wooden Crate Tray & Draggable Megaliths
    this.setupDraggablePieces();

    // 5. Pusula Companion Character (Bottom Left)
    this.pusula = new PusulaCharacter(
      this,
      240,
      760,
      'Taşları dairesel yapının mimari oyuklarına yerleştirerek yapıyı tamamla!'
    );

    // 6. Elapsed Time Counter Timer (Neutral incrementing timer)
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

    // 7. Corner Back Button (Top Left)
    this.createCornerBackButton();

    EventBus.emit('current-scene-ready', SceneKeys.GOBEKLITEPE);
  }

  private cleanUpScene(): void {
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = undefined;
    }
    this.tweens.killAll();
  }

  private createBackgroundLayer(): void {
    // Ambient letterbox background fill in natural earth dirt tone
    const letterboxBg = this.add.graphics();
    letterboxBg.fillStyle(0x451a03, 1);
    letterboxBg.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
    letterboxBg.setDepth(0);

    // Mandatory Background Image Layer
    this.bgImage = this.add.image(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2, 'gobeklitepe_bg');
    this.bgImage.setDisplaySize(this.GAME_WIDTH, this.GAME_HEIGHT);
    this.bgImage.setDepth(1);
  }

  private createHeaderUI(): void {
    // Slim semi-transparent limestone header bar
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x1e1b18, 0.85);
    headerBg.fillRoundedRect(this.GAME_WIDTH / 2 - 620, 15, 1240, 64, 14);
    headerBg.lineStyle(2, 0xd97706, 0.8);
    headerBg.strokeRoundedRect(this.GAME_WIDTH / 2 - 620, 15, 1240, 64, 14);
    headerBg.setDepth(10);

    // 1. Left: Game Title (Requirement: "1. OYUN: GÖBEKLİTEPE YAPISINI TAMAMLA")
    const title = this.createText(this.GAME_WIDTH / 2 - 380, 47, '1. OYUN: GÖBEKLİTEPE YAPISINI TAMAMLA', {
      fontSize: '20px',
      fontStyle: '900',
      color: '#FDE68A',
    });
    title.setOrigin(0.5);
    title.setDepth(11);

    // 2. Center: Short Objective
    this.objectiveText = this.createText(this.GAME_WIDTH / 2 + 50, 47, 'GÖREV: Yapı Taşlarını Yerleştir', {
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#FCD34D',
    });
    this.objectiveText.setOrigin(0.5);
    this.objectiveText.setDepth(11);

    // 3. Right: Piece Progress Counter & Elapsed Time
    this.counterText = this.createText(this.GAME_WIDTH / 2 + 360, 47, 'PARÇA: 0/8', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#38BDF8',
    });
    this.counterText.setOrigin(0.5);
    this.counterText.setDepth(11);

    this.timerText = this.createText(this.GAME_WIDTH / 2 + 510, 47, '00:00', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#F8FAFC',
    });
    this.timerText.setOrigin(0.5);
    this.timerText.setDepth(11);
  }

  private updateTimerUI(): void {
    if (!this.timerText) return;
    const mins = Math.floor(this.elapsedSeconds / 60);
    const secs = this.elapsedSeconds % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.timerText.setText(formatted);
  }

  private setupDropZones(): void {
    const bgX = this.bgImage?.x ?? this.GAME_WIDTH / 2;
    const bgY = this.bgImage?.y ?? this.GAME_HEIGHT / 2;
    const bgW = this.bgImage?.displayWidth || this.GAME_WIDTH;
    const bgH = this.bgImage?.displayHeight || this.GAME_HEIGHT;

    // Dynamically calculate architectural socket coordinates relative to background dimensions
    const leftTpillarX = bgX - bgW * 0.138;
    const leftTpillarY = bgY + bgH * 0.005;

    const rightTpillarX = bgX + bgW * 0.145;
    const rightTpillarY = bgY + bgH * 0.005;

    const leftWallX = bgX - bgW * 0.285;
    const leftWallY = bgY + bgH * 0.075;

    const centerFloorX = bgX;
    const centerFloorY = bgY + bgH * 0.125;

    const rightWallX = bgX + bgW * 0.285;
    const rightWallY = bgY + bgH * 0.075;

    const zoneConfigs: DropZoneConfig[] = [
      // Phase 1: 5 Primary Structural Megaliths
      { id: 'zone_tpillar_left', pieceType: 'tpillar', phase: 1, x: leftTpillarX, y: leftTpillarY, width: 130, height: 200, label: 'SOL T-SÜTUN' },
      { id: 'zone_tpillar_right', pieceType: 'tpillar', phase: 1, x: rightTpillarX, y: rightTpillarY, width: 130, height: 200, label: 'SAĞ T-SÜTUN' },
      { id: 'zone_wall_left', pieceType: 'enclosure', phase: 1, x: leftWallX, y: leftWallY, width: 150, height: 100, label: 'SOL ÇEVRE TAŞI' },
      { id: 'zone_wall_center', pieceType: 'enclosure', phase: 1, x: centerFloorX, y: centerFloorY, width: 150, height: 100, label: 'TABAN TAŞI' },
      { id: 'zone_wall_right', pieceType: 'enclosure', phase: 1, x: rightWallX, y: rightWallY, width: 150, height: 100, label: 'SAĞ ÇEVRE TAŞI' },

      // Phase 2: 3 Animal Relief Silhouettes
      { id: 'zone_relief_fox', pieceType: 'relief', phase: 2, x: leftTpillarX, y: leftTpillarY - 40, width: 95, height: 95, label: 'TİLKİ MOTİFİ' },
      { id: 'zone_relief_boar', pieceType: 'relief', phase: 2, x: rightTpillarX, y: rightTpillarY - 40, width: 95, height: 95, label: 'YABAN DOMUZU' },
      { id: 'zone_relief_bird', pieceType: 'relief', phase: 2, x: centerFloorX, y: centerFloorY, width: 95, height: 95, label: 'KUŞ MOTİFİ' },
    ];

    zoneConfigs.forEach((cfg) => {
      const dz = new StoneDropZone(this, cfg, (zone) => this.handleZoneClicked(zone));
      dz.setDepth(15);
      this.dropZones.push(dz);
    });
  }

  private setupDraggablePieces(): void {
    // Bottom Archaeological Excavation Crate Tray
    const trayBg = this.add.graphics();
    trayBg.fillStyle(0x181008, 0.88);
    trayBg.fillRoundedRect(this.GAME_WIDTH / 2 - 680, 895, 1360, 160, 18);
    trayBg.lineStyle(2.5, 0xd97706, 0.7);
    trayBg.strokeRoundedRect(this.GAME_WIDTH / 2 - 680, 895, 1360, 160, 18);
    trayBg.setDepth(5);

    const trayLabel = this.createText(this.GAME_WIDTH / 2, 912, 'ARKEOLOJİK ÇALIŞMA TEPSİSİ', {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FDE68A',
    });
    trayLabel.setOrigin(0.5);
    trayLabel.setDepth(6);

    // 8 Piece Configurations (Positioned naturally on bottom excavation tray)
    const pieceConfigs: StonePieceConfig[] = [
      // Phase 1 Structural Stones
      { id: 'p_tpillar_left', pieceType: 'tpillar', phase: 1, svgKey: 'piece_tpillar', title: 'Sol T-Sütun', targetZoneId: 'zone_tpillar_left', origX: 420, origY: 980, width: 100, height: 155 },
      { id: 'p_wall_left', pieceType: 'enclosure', phase: 1, svgKey: 'piece_enclosure', title: 'Sol Çevre Taşı', targetZoneId: 'zone_wall_left', origX: 680, origY: 980, width: 125, height: 90 },
      { id: 'p_wall_center', pieceType: 'enclosure', phase: 1, svgKey: 'piece_enclosure', title: 'Taban Taşı', targetZoneId: 'zone_wall_center', origX: 960, origY: 980, width: 130, height: 90 },
      { id: 'p_wall_right', pieceType: 'enclosure', phase: 1, svgKey: 'piece_enclosure', title: 'Sağ Çevre Taşı', targetZoneId: 'zone_wall_right', origX: 1240, origY: 980, width: 125, height: 90 },
      { id: 'p_tpillar_right', pieceType: 'tpillar', phase: 1, svgKey: 'piece_tpillar', title: 'Sağ T-Sütun', targetZoneId: 'zone_tpillar_right', origX: 1500, origY: 980, width: 100, height: 155 },

      // Phase 2 Animal Reliefs
      { id: 'p_relief_fox', pieceType: 'relief', phase: 2, svgKey: 'relief_fox', title: 'Tilki Motifi', targetZoneId: 'zone_relief_fox', origX: 680, origY: 980, width: 85, height: 85 },
      { id: 'p_relief_boar', pieceType: 'relief', phase: 2, svgKey: 'relief_boar', title: 'Yaban Domuzu', targetZoneId: 'zone_relief_boar', origX: 960, origY: 980, width: 85, height: 85 },
      { id: 'p_relief_bird', pieceType: 'relief', phase: 2, svgKey: 'relief_bird', title: 'Kuş Motifi', targetZoneId: 'zone_relief_bird', origX: 1240, origY: 980, width: 85, height: 85 },
    ];

    pieceConfigs.forEach((cfg) => {
      const piece = new DraggableStone(
        this,
        cfg,
        this.dropZones,
        (p, z) => this.handleCorrectPlacement(p, z),
        (_p, _z) => this.handleIncorrectPlacement()
      );
      piece.setDepth(30);
      this.draggableStones.push(piece);
    });
  }

  private handleZoneClicked(zone: StoneDropZone): void {
    const selectedPiece = this.draggableStones.find((p) => p.isSelected && !p.isPlaced);

    if (selectedPiece) {
      if (selectedPiece.config.targetZoneId === zone.config.id) {
        selectedPiece.snapToZone(zone, (p, z) => this.handleCorrectPlacement(p, z));
      } else {
        zone.registerFailedAttempt();
        selectedPiece.returnToTray();
        this.handleIncorrectPlacement();
      }
    } else {
      const matchingPiece = this.draggableStones.find((p) => p.config.targetZoneId === zone.config.id && !p.isPlaced);
      if (matchingPiece && matchingPiece.active) {
        matchingPiece.snapToZone(zone, (p, z) => this.handleCorrectPlacement(p, z));
      }
    }
  }

  private handleCorrectPlacement(_piece: DraggableStone, _zone: StoneDropZone): void {
    this.placedCount++;
    if (this.counterText) {
      this.counterText.setText(`PARÇA: ${this.placedCount}/8`);
    }

    // Concise Educational Dialogue Sequences
    if (this.placedCount === 2) {
      this.pusula?.setMessage('T biçimli sütunlar Göbeklitepe’nin dikkat çekici unsurlarındandır.');
    } else if (this.placedCount === 5 && this.currentPhase === 1) {
      // 5 Structural Stones Completed! Trigger Phase 1 Celebration & Camera Reset
      this.triggerPhase1Celebration();
    } else if (this.placedCount === 7) {
      this.pusula?.setMessage('Hayvan betimlemeleri taş yüzeylerde önemli bir yer tutar.');
    } else if (this.placedCount === 8) {
      // Complete Game!
      this.pusula?.setMessage('Göbeklitepe, bilinen en eski anıtsal yapılardan biridir.');
      this.onGameCompleted();
    }
  }

  private handleIncorrectPlacement(): void {
    this.errorCount++;
  }

  private triggerPhase1Celebration(): void {
    SoundFx.playSuccessTone();

    const bgX = this.bgImage?.x ?? this.GAME_WIDTH / 2;
    const bgY = this.bgImage?.y ?? this.GAME_HEIGHT / 2;
    const bgW = this.bgImage?.displayWidth || this.GAME_WIDTH;
    const bgH = this.bgImage?.displayHeight || this.GAME_HEIGHT;

    // 1. Center Symbol Warm Sunlight Pulse
    const centerGlow = this.add.graphics();
    centerGlow.fillStyle(0xfde68a, 0.65);
    centerGlow.fillCircle(bgX, bgY + 30, 100);
    centerGlow.setDepth(20);

    this.tweens.add({
      targets: centerGlow,
      scaleX: 2.6,
      scaleY: 2.6,
      alpha: 0,
      duration: 1100,
      onComplete: () => centerGlow.destroy(),
    });

    // 2. Golden Light Ring Encircling the Architectural Wall Boundary
    const goldenCircle = this.add.graphics();
    goldenCircle.lineStyle(5.5, 0xf59e0b, 0.95);
    goldenCircle.strokeEllipse(bgX, bgY + bgH * 0.035, bgW * 0.58, bgH * 0.38);
    goldenCircle.setDepth(21);

    this.tweens.add({
      targets: goldenCircle,
      alpha: { from: 1.0, to: 0.15 },
      duration: 600,
      yoyo: true,
      repeat: 3,
      onComplete: () => goldenCircle.destroy(),
    });

    // 3. Stone Dust Particle Burst Rising Upward
    for (let i = 0; i < 35; i++) {
      const px = bgX + Phaser.Math.Between(-bgW * 0.28, bgW * 0.28);
      const py = bgY + Phaser.Math.Between(-20, bgH * 0.18);
      const dust = this.add.circle(px, py, Phaser.Math.Between(4, 9), 0xfbbf24, 0.85);
      dust.setDepth(22);

      this.tweens.add({
        targets: dust,
        y: py - Phaser.Math.Between(50, 120),
        alpha: 0,
        duration: Phaser.Math.Between(700, 1400),
        onComplete: () => dust.destroy(),
      });
    }

    // 4. Smooth Camera Zoom In for Structure Celebration
    this.cameras.main.zoomTo(1.08, 800, 'Quad.easeInOut');

    // 5. Cinematic Headline Banner: "GÖBEKLİTEPE YAPISI TAMAMLANDI"
    const bannerContainer = this.add.container(this.GAME_WIDTH / 2, 380);
    bannerContainer.setDepth(100);

    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x181008, 0.95);
    bannerBg.fillRoundedRect(-380, -38, 760, 76, 16);
    bannerBg.lineStyle(3, 0xf59e0b, 1);
    bannerBg.strokeRoundedRect(-380, -38, 760, 76, 16);

    const bannerText = this.createText(0, 0, 'GÖBEKLİTEPE YAPISI TAMAMLANDI', {
      fontSize: '28px',
      fontStyle: '900',
      color: '#FDE68A',
    });
    bannerText.setOrigin(0.5);

    bannerContainer.add([bannerBg, bannerText]);

    this.tweens.add({
      targets: bannerContainer,
      scaleX: { from: 0.5, to: 1.0 },
      scaleY: { from: 0.5, to: 1.0 },
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1600, () => {
          this.tweens.add({
            targets: bannerContainer,
            alpha: 0,
            duration: 400,
            onComplete: () => {
              bannerContainer.destroy();
              // Reset camera zoom smoothly back to 1.0 before Phase 2 begins!
              this.cameras.main.zoomTo(1.0, 600, 'Quad.easeInOut');
              this.time.delayedCall(600, () => {
                this.triggerPhase2Transition();
              });
            },
          });
        });
      },
    });
  }

  private triggerPhase2Transition(): void {
    this.currentPhase = 2;
    if (this.objectiveText) {
      this.objectiveText.setText('GÖREV: Hayvan Kabartmalarını Eşleştir');
    }
    this.pusula?.setMessage('Bu görsel eşleştirme, Göbeklitepe’de görülen hayvan betimlemelerinden esinlenmiştir.');

    // Enable Phase 2 Drop Zones & Pieces
    this.dropZones.forEach((z) => z.enablePhase2());
    this.draggableStones.forEach((p) => p.enablePhase2());
  }

  private onGameCompleted(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;

    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    // Update GameStore: Complete Gobeklitepe & Unlock Demir Cagi ONCE
    GameStore.completeModule('gobeklitepe');

    // Calculate Victory Stats
    const stats = VictoryModal.calculateStats(this.elapsedSeconds, this.errorCount);

    this.time.delayedCall(800, () => {
      new VictoryModal(this, stats, () => {
        this.cameras.main.fadeOut(350, 7, 11, 25);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start(SceneKeys.WORLD_MAP);
        });
      });
    });
  }

  private createCornerBackButton(): void {
    const btn = this.add.container(65, 47);
    btn.setDepth(50);

    const bg = this.add.graphics();
    bg.fillStyle(0x181008, 0.9);
    bg.fillCircle(0, 0, 26);
    bg.lineStyle(2, 0xf59e0b, 0.85);
    bg.strokeCircle(0, 0, 26);

    const iconText = this.add.text(0, 0, '◄', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '20px',
      color: '#FDE68A',
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
