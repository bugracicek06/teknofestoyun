import Phaser from 'phaser';
import { BaseScene } from '../BaseScene';
import { SceneKeys } from '../../../types/game';
import { GameStore } from '../../state/GameStore';
import { PusulaCharacter } from '../../objects/PusulaCharacter';
import { StoneDropZone } from '../../objects/StoneDropZone';
import type { DropZoneConfig } from '../../objects/StoneDropZone';
import { DraggableStone } from '../../objects/DraggableStone';
import type { StonePieceConfig } from '../../objects/DraggableStone';
import { SoundFx } from '../../utils/audio';
import { EventBus } from '../../state/EventBus';

// Safe TypeScript Asset Imports for Vite production bundler
import gobeklitepeBgUrl from '../../../assets/gobeklitepe_bg.png';
import reliefFoxLeftUrl from '../../../assets/svg/relief_fox_left.svg';
import reliefBoarLeftUrl from '../../../assets/svg/relief_boar_left.svg';
import reliefCraneLeftUrl from '../../../assets/svg/relief_crane_left.svg';
import reliefFoxRightUrl from '../../../assets/svg/relief_fox_right.svg';
import reliefBoarRightUrl from '../../../assets/svg/relief_boar_right.svg';
import reliefCraneRightUrl from '../../../assets/svg/relief_crane_right.svg';

import socketFoxLeftUrl from '../../../assets/svg/socket_fox_left.svg';
import socketBoarLeftUrl from '../../../assets/svg/socket_boar_left.svg';
import socketCraneLeftUrl from '../../../assets/svg/socket_crane_left.svg';
import socketFoxRightUrl from '../../../assets/svg/socket_fox_right.svg';
import socketBoarRightUrl from '../../../assets/svg/socket_boar_right.svg';
import socketCraneRightUrl from '../../../assets/svg/socket_crane_right.svg';

import passportStampUrl from '../../../assets/svg/passport_stamp.svg';

export class GobeklitepeScene extends BaseScene {
  private pusula?: PusulaCharacter;
  private dropZones: StoneDropZone[] = [];
  private draggableStones: DraggableStone[] = [];

  private placedCount = 0;
  private errorCount = 0;
  private elapsedSeconds = 0;
  private timerEvent?: Phaser.Time.TimerEvent;
  private counterText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private objectiveText?: Phaser.GameObjects.Text;
  private isCompleted = false;

  private bgImage?: Phaser.GameObjects.Image;
  private ANCIENT_FONT = '"Cinzel", "Trajan Pro", "Times New Roman", "Georgia", serif';

  constructor() {
    super(SceneKeys.GOBEKLITEPE);
  }

  preload(): void {
    if (!this.textures.exists('gobeklitepe_bg')) {
      this.load.image('gobeklitepe_bg', gobeklitepeBgUrl);
    }
    // Relief Piece Textures
    if (!this.textures.exists('relief_fox_left')) {
      this.load.image('relief_fox_left', reliefFoxLeftUrl);
      this.load.image('relief_boar_left', reliefBoarLeftUrl);
      this.load.image('relief_crane_left', reliefCraneLeftUrl);
      this.load.image('relief_fox_right', reliefFoxRightUrl);
      this.load.image('relief_boar_right', reliefBoarRightUrl);
      this.load.image('relief_crane_right', reliefCraneRightUrl);
    }
    // Silhouette Socket Textures
    if (!this.textures.exists('socket_fox_left')) {
      this.load.image('socket_fox_left', socketFoxLeftUrl);
      this.load.image('socket_boar_left', socketBoarLeftUrl);
      this.load.image('socket_crane_left', socketCraneLeftUrl);
      this.load.image('socket_fox_right', socketFoxRightUrl);
      this.load.image('socket_boar_right', socketBoarRightUrl);
      this.load.image('socket_crane_right', socketCraneRightUrl);
    }
    if (!this.textures.exists('passport_stamp')) {
      this.load.image('passport_stamp', passportStampUrl);
    }
  }

  create(): void {
    // Reset state variables
    this.placedCount = 0;
    this.errorCount = 0;
    this.elapsedSeconds = 0;
    this.isCompleted = false;
    this.dropZones = [];
    this.draggableStones = [];

    // Smooth Camera Fade-in from World Map transition
    this.cameras.main.fadeIn(350, 7, 11, 25);

    // Lifecycle cleanup hooks
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUpScene, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanUpScene, this);

    // 1. Pristine Clean Excavation Landscape Background Layer (Depth 0)
    this.createBackgroundLayer();

    // 2. Slim Limestone Archaeology Header (Depth 100)
    this.createHeaderUI();

    // 3. Exact Organic Silhouette Sockets directly on the clean stone columns (Depth 5)
    this.setupDropZones();

    // 4. Restoration Crate Tray & 6 Draggable Animal Reliefs (Depth 10 / 20)
    this.setupDraggablePieces();

    // 5. Pusula Companion Character (Bottom Left - Depth 100)
    this.pusula = new PusulaCharacter(
      this,
      210,
      760,
      'Hoş geldin genç kâşif! Sütunların üzerindeki 6 kadim hayvan kabartmasını orijinal yuvalarına kazıyalım.'
    );

    // 6. Elapsed Time Counter Timer
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

    // 7. Corner Back Button (Top Left - Depth 100)
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
    letterboxBg.fillStyle(0x1a0f05, 1);
    letterboxBg.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
    letterboxBg.setDepth(0);

    // Main Excavation Background Image Layer (1920x1080)
    this.bgImage = this.add.image(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2, 'gobeklitepe_bg');
    this.bgImage.setDisplaySize(this.GAME_WIDTH, this.GAME_HEIGHT);
    this.bgImage.setDepth(0);
  }

  private createHeaderUI(): void {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x1a0f05, 0.92);
    headerBg.fillRoundedRect(this.GAME_WIDTH / 2 - 620, 15, 1240, 64, 14);
    headerBg.lineStyle(2, 0xd97706, 0.85);
    headerBg.strokeRoundedRect(this.GAME_WIDTH / 2 - 620, 15, 1240, 64, 14);
    headerBg.setDepth(100);

    // 1. Left: Game Title
    const title = this.createText(this.GAME_WIDTH / 2 - 360, 47, '1. OYUN: GÖBEKLİTEPE KABARTMA RESTORASYONU', {
      fontSize: '19px',
      fontStyle: '900',
      color: '#FDE68A',
    });
    title.setOrigin(0.5);
    title.setDepth(101);

    // 2. Center: Objective & Story Caption
    this.objectiveText = this.createText(this.GAME_WIDTH / 2 + 80, 47, 'GÖREV: 6 Kadim Hayvan Sembolünü Sütunlara İşle', {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FCD34D',
    });
    this.objectiveText.setOrigin(0.5);
    this.objectiveText.setDepth(101);

    // 3. Right: Piece Progress Counter & Elapsed Time
    this.counterText = this.createText(this.GAME_WIDTH / 2 + 370, 47, 'KABARTMA: 0/6', {
      fontSize: '19px',
      fontStyle: 'bold',
      color: '#38BDF8',
    });
    this.counterText.setOrigin(0.5);
    this.counterText.setDepth(101);

    this.timerText = this.createText(this.GAME_WIDTH / 2 + 510, 47, '00:00', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#F8FAFC',
    });
    this.timerText.setOrigin(0.5);
    this.timerText.setDepth(101);
  }

  private updateTimerUI(): void {
    if (!this.timerText) return;
    const mins = Math.floor(this.elapsedSeconds / 60);
    const secs = this.elapsedSeconds % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.timerText.setText(formatted);
  }

  private setupDropZones(): void {
    const zoneConfigs: DropZoneConfig[] = [
      // Sol Sütun Yuvaları (X Ekseni: 746)
      {
        id: 'zone_fox_left',
        socketKey: 'socket_fox_left',
        x: 746,
        y: 415,
        width: 130,
        height: 75,
        label: 'Tilki Yuvası (Sol Üst)',
        motifType: 'fox',
        side: 'left',
      },
      {
        id: 'zone_boar_left',
        socketKey: 'socket_boar_left',
        x: 746,
        y: 525,
        width: 130,
        height: 70,
        label: 'Yaban Domuzu Yuvası (Sol Orta)',
        motifType: 'boar',
        side: 'left',
      },
      {
        id: 'zone_crane_left',
        socketKey: 'socket_crane_left',
        x: 746,
        y: 660,
        width: 110,
        height: 135,
        label: 'Turna Yuvası (Sol Alt)',
        motifType: 'crane',
        side: 'left',
      },

      // Sağ Sütun Yuvaları (X Ekseni: 1174)
      {
        id: 'zone_fox_right',
        socketKey: 'socket_fox_right',
        x: 1174,
        y: 415,
        width: 130,
        height: 75,
        label: 'Tilki Yuvası (Sağ Üst)',
        motifType: 'fox',
        side: 'right',
      },
      {
        id: 'zone_boar_right',
        socketKey: 'socket_boar_right',
        x: 1174,
        y: 525,
        width: 130,
        height: 70,
        label: 'Yaban Domuzu Yuvası (Sağ Orta)',
        motifType: 'boar',
        side: 'right',
      },
      {
        id: 'zone_crane_right',
        socketKey: 'socket_crane_right',
        x: 1174,
        y: 660,
        width: 110,
        height: 135,
        label: 'Turna Yuvası (Sağ Alt)',
        motifType: 'crane',
        side: 'right',
      },
    ];

    zoneConfigs.forEach((cfg) => {
      const dz = new StoneDropZone(this, cfg, (zone) => this.handleZoneClicked(zone));
      this.dropZones.push(dz);
    });
  }

  private setupDraggablePieces(): void {
    // Archaeological Excavation Restoration Crate Tray
    const trayBg = this.add.graphics();
    trayBg.fillStyle(0x140c04, 0.94);
    trayBg.fillRoundedRect(this.GAME_WIDTH / 2 - 780, 875, 1560, 180, 18);
    trayBg.lineStyle(2.5, 0xd97706, 0.85);
    trayBg.strokeRoundedRect(this.GAME_WIDTH / 2 - 780, 875, 1560, 180, 18);
    trayBg.setDepth(8);

    const trayLabel = this.createText(this.GAME_WIDTH / 2, 894, 'KADİM RÖLYEF VE KABARTMA RESTORASYON TEPSİSİ', {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FDE68A',
    });
    trayLabel.setOrigin(0.5);
    trayLabel.setDepth(9);

    // 6 Animal Relief Configurations matching the socket silhouettes
    const pieceConfigs: StonePieceConfig[] = [
      // 1. Sol Sütun Üst: Tilki (130x75)
      {
        id: 'p_fox_left',
        svgKey: 'relief_fox_left',
        title: 'Tilki (Sol Üst)',
        targetZoneId: 'zone_fox_left',
        origX: 290,
        origY: 965,
        width: 130,
        height: 75,
        trayScale: 0.85,
        motifType: 'fox',
        side: 'left',
      },
      // 2. Sol Sütun Orta: Yaban Domuzu (130x70)
      {
        id: 'p_boar_left',
        svgKey: 'relief_boar_left',
        title: 'Domuz (Sol Orta)',
        targetZoneId: 'zone_boar_left',
        origX: 560,
        origY: 965,
        width: 130,
        height: 70,
        trayScale: 0.85,
        motifType: 'boar',
        side: 'left',
      },
      // 3. Sol Sütun Alt: Turna Kuşu (110x135)
      {
        id: 'p_crane_left',
        svgKey: 'relief_crane_left',
        title: 'Turna (Sol Alt)',
        targetZoneId: 'zone_crane_left',
        origX: 830,
        origY: 965,
        width: 110,
        height: 135,
        trayScale: 0.72,
        motifType: 'crane',
        side: 'left',
      },
      // 4. Sağ Sütun Üst: Çöl Tilkisi (130x75)
      {
        id: 'p_fox_right',
        svgKey: 'relief_fox_right',
        title: 'Tilki (Sağ Üst)',
        targetZoneId: 'zone_fox_right',
        origX: 1090,
        origY: 965,
        width: 130,
        height: 75,
        trayScale: 0.85,
        motifType: 'fox',
        side: 'right',
      },
      // 5. Sağ Sütun Orta: Yaban Domuzu (130x70)
      {
        id: 'p_boar_right',
        svgKey: 'relief_boar_right',
        title: 'Domuz (Sağ Orta)',
        targetZoneId: 'zone_boar_right',
        origX: 1360,
        origY: 965,
        width: 130,
        height: 70,
        trayScale: 0.85,
        motifType: 'boar',
        side: 'right',
      },
      // 6. Sağ Sütun Alt: Turna Kuşu (110x135)
      {
        id: 'p_crane_right',
        svgKey: 'relief_crane_right',
        title: 'Turna (Sağ Alt)',
        targetZoneId: 'zone_crane_right',
        origX: 1630,
        origY: 965,
        width: 110,
        height: 135,
        trayScale: 0.72,
        motifType: 'crane',
        side: 'right',
      },
    ];

    pieceConfigs.forEach((cfg) => {
      const piece = new DraggableStone(
        this,
        cfg,
        this.dropZones,
        (p, z) => this.handleCorrectPlacement(p, z),
        (_p, _z) => this.handleIncorrectPlacement()
      );
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
      this.counterText.setText(`KABARTMA: ${this.placedCount}/6`);
    }

    if (this.placedCount === 1) {
      this.pusula?.setMessage('Harika bir keski darbesi! Tilki motifi kurnazlık ve çevikliği simgeler.');
    } else if (this.placedCount === 3) {
      this.pusula?.setMessage('Sol sütunun kabartmaları tamamlandı! Şimdi sağ sütuna geçelim.');
    } else if (this.placedCount === 5) {
      this.pusula?.setMessage('Turna kuşları gökyüzü ile yeryüzü arasındaki kadim bağı temsil eder.');
    } else if (this.placedCount === 6) {
      // All 6 Pieces Complete!
      this.pusula?.setMessage('Tebrikler! Taşın hafızasını çözdün ve ilk ustalık damganı kazandın!');
      this.onGameCompleted();
    }
  }

  private handleIncorrectPlacement(): void {
    this.errorCount++;
  }

  private onGameCompleted(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;

    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    // Mark Module 1 Completed in GameStore
    GameStore.completeModule('gobeklitepe');

    this.time.delayedCall(600, () => {
      this.createMonumentalSteleVictoryModal();
    });
  }

  /**
   * Monumental Ancient Stone Stele Victory Modal
   * Size: 1040x600 px, Center: (X: 960, Y: 530), Serif Antiqua Typography
   * Homogeneously distributed vertical rhythm with zero dead space.
   */
  private createMonumentalSteleVictoryModal(): void {
    SoundFx.playVictoryFanfare();

    const modal = this.add.container(this.GAME_WIDTH / 2, 530);
    modal.setDepth(200);

    const steleW = 1040;
    const steleH = 600;

    // 1. Dark Backdrop Overlay (Dim & Focus: 0.72)
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x050302, 0.72);
    backdrop.fillRect(-this.GAME_WIDTH / 2, -530, this.GAME_WIDTH, this.GAME_HEIGHT);
    modal.add(backdrop);

    // 2. Outer Soft Ambient Depth Glow
    const outerAura = this.add.graphics();
    outerAura.fillStyle(0xf59e0b, 0.15);
    outerAura.fillRoundedRect(-steleW / 2 - 12, -steleH / 2 - 12, steleW + 24, steleH + 24, 26);
    modal.add(outerAura);

    // 3. Dark Basalt / Anthracite Monumental Slab
    const steleSlab = this.add.graphics();
    steleSlab.fillStyle(0x120e0a, 0.96);
    steleSlab.fillRoundedRect(-steleW / 2, -steleH / 2, steleW, steleH, 20);

    // Outer Thick Weathered Stone Stroke (3px)
    steleSlab.lineStyle(3, 0x92400e, 0.95);
    steleSlab.strokeRoundedRect(-steleW / 2, -steleH / 2, steleW, steleH, 20);

    // Inner Chiseled Inscription Antique Gold Border (1.5px)
    steleSlab.lineStyle(1.5, 0xf59e0b, 0.75);
    steleSlab.strokeRoundedRect(-steleW / 2 + 10, -steleH / 2 + 10, steleW - 20, steleH - 20, 14);

    // Antique Chiseled Corner Brackets
    const bLen = 24;
    steleSlab.lineStyle(3, 0xfde047, 0.95);
    // Top-Left
    steleSlab.lineBetween(-steleW / 2 + 18, -steleH / 2 + 18 + bLen, -steleW / 2 + 18, -steleH / 2 + 18);
    steleSlab.lineBetween(-steleW / 2 + 18, -steleH / 2 + 18, -steleW / 2 + 18 + bLen, -steleH / 2 + 18);
    // Top-Right
    steleSlab.lineBetween(steleW / 2 - 18 - bLen, -steleH / 2 + 18, steleW / 2 - 18, -steleH / 2 + 18);
    steleSlab.lineBetween(steleW / 2 - 18, -steleH / 2 + 18, steleW / 2 - 18, -steleH / 2 + 18 + bLen);
    // Bottom-Left
    steleSlab.lineBetween(-steleW / 2 + 18, steleH / 2 - 18 - bLen, -steleW / 2 + 18, -steleH / 2 - 18);
    steleSlab.lineBetween(-steleW / 2 + 18, steleH / 2 - 18, -steleW / 2 + 18 + bLen, -steleH / 2 - 18);
    // Bottom-Right
    steleSlab.lineBetween(steleW / 2 - 18 - bLen, steleH / 2 - 18, steleW / 2 - 18, -steleH / 2 - 18);
    steleSlab.lineBetween(steleW / 2 - 18, steleH / 2 - 18 - bLen, steleW / 2 - 18, -steleH / 2 - 18);

    modal.add(steleSlab);

    // 4. Header Section: Monumental Gold Leaf Title with 🏛️ Icon (Y: -238, -188)
    const iconHeader = this.add.text(0, -238, '🏛️', {
      fontSize: '44px',
    });
    iconHeader.setOrigin(0.5, 0.5);

    const titleText = this.add.text(0, -188, 'GÖBEKLİTEPE RESTORASYONU TAMAMLANDI', {
      fontFamily: this.ANCIENT_FONT,
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#FEF08A',
      shadow: { color: '#B45309', blur: 14, fill: true },
    });
    titleText.setOrigin(0.5, 0.5);
    modal.add([iconHeader, titleText]);

    // 5. Archaeological Discovery Note (Y: -118, 22px, 880px width, 2-line spread)
    const discoveryNote = this.add.text(
      0,
      -118,
      '12.000 yıl önce inşa edilen Göbeklitepe; mimari dehası, astronomik hizalaması ve kadim hayvan sembolleriyle tarihin sıfır noktasıdır.',
      {
        fontFamily: this.ANCIENT_FONT,
        fontSize: '22px',
        fontStyle: 'italic',
        color: '#FFFBEB',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 880 },
      }
    );
    discoveryNote.setOrigin(0.5, 0.5);
    modal.add(discoveryNote);

    // 6. Enlarged 3 Skill Assessment Meters (Y: -20, 26px, spacing: 320px)
    const badgeRowY = -20;
    const badgeItems = [
      { text: '👁️ GÖZLEM: ⭐⭐⭐', x: -320 },
      { text: '⚒️ USTALIK: ⭐⭐⭐', x: 0 },
      { text: '📐 MİMARLIK: ⭐⭐⭐', x: 320 },
    ];

    badgeItems.forEach((item) => {
      const bText = this.add.text(item.x, badgeRowY, item.text, {
        fontFamily: this.ANCIENT_FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#FACC15',
        shadow: { color: '#78350F', blur: 8, fill: true },
      });
      bText.setOrigin(0.5, 0.5);
      modal.add(bText);
    });

    // 7. Performance Stats Line (Y: +65, 20px Bold Serif)
    const statsText = this.add.text(
      0,
      65,
      `⏱️ Süre: ${this.elapsedSeconds} sn    •    🎯 Hata: ${this.errorCount}    •    🏆 Ustalık: %100`,
      {
        fontFamily: this.ANCIENT_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#E5E7EB',
      }
    );
    statsText.setOrigin(0.5, 0.5);
    modal.add(statsText);

    // 8. Monumental Golden Age Button: "SONRAKİ ÇAĞA GEÇ ➔" (Y: +185, 520x70 px, 26px font)
    const btnW = 520;
    const btnH = 70;
    const btnY = 185;

    const btnContainer = this.add.container(0, btnY);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xd97706, 1);
    btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);
    btnBg.lineStyle(2.5, 0xfde047, 0.95);
    btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);

    const btnText = this.add.text(0, 0, 'SONRAKİ ÇAĞA GEÇ ➔', {
      fontFamily: this.ANCIENT_FONT,
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#180D04',
    });
    btnText.setOrigin(0.5, 0.5);

    btnContainer.add([btnBg, btnText]);
    btnContainer.setSize(btnW, btnH);
    btnContainer.setInteractive({ useHandCursor: true });

    btnContainer.on('pointerover', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 100,
      });
      btnBg.clear();
      btnBg.fillStyle(0xf59e0b, 1);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);
      btnBg.lineStyle(2.5, 0xffffff, 1);
      btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);
    });

    btnContainer.on('pointerout', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 100,
      });
      btnBg.clear();
      btnBg.fillStyle(0xd97706, 1);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);
      btnBg.lineStyle(2.5, 0xfde047, 0.95);
      btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);
    });

    btnContainer.on('pointerdown', () => {
      this.cameras.main.fadeOut(350, 7, 11, 25);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKeys.WORLD_MAP);
      });
    });

    modal.add(btnContainer);

    // 9. Smooth Upward Monumental Entrance Animation
    modal.setScale(0.92);
    modal.setY(550);
    modal.setAlpha(0);

    this.tweens.add({
      targets: modal,
      scaleX: 1.0,
      scaleY: 1.0,
      y: 530,
      alpha: 1.0,
      duration: 320,
      ease: 'Back.easeOut',
    });

    this.createDiscoverySparks(this.GAME_WIDTH / 2, 530);
  }

  private createDiscoverySparks(x: number, y: number): void {
    for (let i = 0; i < 18; i++) {
      const spark = this.add.circle(
        x + Phaser.Math.Between(-320, 320),
        y + Phaser.Math.Between(-180, 180),
        Phaser.Math.Between(2, 5),
        0xffd700,
        1
      );
      spark.setDepth(205);

      this.tweens.add({
        targets: spark,
        y: spark.y - Phaser.Math.Between(30, 75),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(550, 950),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  private createCornerBackButton(): void {
    const btn = this.add.container(65, 47);
    btn.setDepth(100);

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
