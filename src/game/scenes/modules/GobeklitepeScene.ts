import { calculateResult } from '../../systems/scoring';
import Phaser from 'phaser';
import { BaseScene } from '../BaseScene';
import { SceneKeys } from '../../../types/game';
import { GameStore } from '../../state/GameStore';
import { PusulaCharacter } from '../../objects/PusulaCharacter';
import { StoneDropZone } from '../../objects/StoneDropZone';
import type { DropZoneConfig } from '../../objects/StoneDropZone';
import { DraggableStone } from '../../objects/DraggableStone';
import type { StonePieceConfig } from '../../objects/DraggableStone';
import { EventBus } from '../../state/EventBus';
import { SoundFx } from '../../utils/audio';

// Safe TypeScript Asset Imports for Vite production bundler
import gobeklitepeBgUrl from '../../../assets/gobeklitepe_bg.webp';
import reliefFoxLeftUrl from '../../../assets/svg/relief_fox_left.svg';
import reliefBoarLeftUrl from '../../../assets/svg/relief_boar_left.svg';
import reliefCraneLeftUrl from '../../../assets/svg/relief_crane_left.svg';
import reliefFoxRightUrl from '../../../assets/svg/relief_snake.svg';
import reliefBoarRightUrl from '../../../assets/svg/relief_bull.svg';
import reliefCraneRightUrl from '../../../assets/svg/relief_scorpion.svg';

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
  private isCompleted = false;

  private bgImage?: Phaser.GameObjects.Image;

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

    // 2. Exact Organic Silhouette Sockets directly on the clean stone columns (Depth 5)
    this.setupDropZones();

    // 3. Restoration Crate Tray & 6 Draggable Animal Reliefs (Depth 10 / 20)
    this.setupDraggablePieces();

    // 4. Pusula Companion Character (Bottom Left - Depth 100)
    this.pusula = new PusulaCharacter(
      this,
      210,
      760,
      'Önce bir hayvana, sonra taş üzerindeki yerine dokun.'
    );

    // 5. Elapsed Time Counter Timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.isCompleted) {
          this.elapsedSeconds++;
        }
      },
      loop: true,
    });

    // 6. Listen for piece selection events and React UI interaction
    this.events.on('gobeklitepe-stone-selection-changed', () => this.emitProgress());
    EventBus.on('gobeklitepe-select-piece', this.handleSelectPieceFromUI);
    EventBus.on('gobeklitepe-drag-start', this.handleDragStartFromUI);
    EventBus.on('gobeklitepe-drag-move', this.handleDragMoveFromUI);
    EventBus.on('gobeklitepe-drag-end', this.handleDragEndFromUI);

    // Initial broadcast to React UI
    this.emitProgress();

    EventBus.emit('current-scene-ready', SceneKeys.GOBEKLITEPE);
  }

  private clientToGameCoords(clientX: number, clientY: number): { x: number; y: number } {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = this.GAME_WIDTH / rect.width;
    const scaleY = this.GAME_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  private handleDragStartFromUI = (data: { pieceId: string; clientX: number; clientY: number }): void => {
    const piece = this.draggableStones.find((p) => p.config.id === data.pieceId);
    if (piece && !piece.isPlaced) {
      this.draggableStones.forEach((p) => {
        if (p !== piece && p.isSelected) p.setSelected(false);
      });
      piece.setSelected(true);
      const coords = this.clientToGameCoords(data.clientX, data.clientY);
      piece.startExternalDrag(coords.x, coords.y);
    }
  };

  private handleDragMoveFromUI = (data: { pieceId: string; clientX: number; clientY: number }): void => {
    const piece = this.draggableStones.find((p) => p.config.id === data.pieceId);
    if (piece && !piece.isPlaced) {
      const coords = this.clientToGameCoords(data.clientX, data.clientY);
      piece.updateExternalDrag(coords.x, coords.y);
    }
  };

  private handleDragEndFromUI = (data: { pieceId: string; clientX: number; clientY: number }): void => {
    const piece = this.draggableStones.find((p) => p.config.id === data.pieceId);
    if (!piece || piece.isPlaced) return;

    const coords = this.clientToGameCoords(data.clientX, data.clientY);
    const targetZone = this.dropZones.find((z) => z.config.id === piece.config.targetZoneId);

    if (targetZone && !targetZone.isOccupied) {
      const dist = Phaser.Math.Distance.Between(coords.x, coords.y, targetZone.x, targetZone.y);
      if (dist <= 130) {
        piece.snapToZone(targetZone, (p, z) => this.handleCorrectPlacement(p, z));
        return;
      }
    }

    // Check if dropped near a wrong zone
    const nearbyWrongZone = this.dropZones.find((z) => {
      if (z.isOccupied) return false;
      const d = Phaser.Math.Distance.Between(coords.x, coords.y, z.x, z.y);
      return d <= 130;
    });

    if (nearbyWrongZone) {
      nearbyWrongZone.registerFailedAttempt();
      SoundFx.playSandSlide();
      this.handleIncorrectPlacement();
    } else {
      // Released in neutral space: slide back smoothly to tray without penalizing error count
      SoundFx.playSandSlide();
    }
    piece.returnToTray();
    this.emitProgress();
  };

  private handleSelectPieceFromUI = (pieceId: string): void => {
    const piece = this.draggableStones.find((p) => p.config.id === pieceId);
    if (piece && !piece.isPlaced) {
      const willBeSelected = !piece.isSelected;
      this.draggableStones.forEach((p) => {
        if (p.isSelected) p.setSelected(false);
      });
      piece.setSelected(willBeSelected);
      this.emitProgress();
    }
  };

  private emitProgress(): void {
    const placedIds = this.draggableStones.filter((p) => p.isPlaced).map((p) => p.config.id);
    const selected = this.draggableStones.find((p) => p.isSelected && !p.isPlaced);
    EventBus.emit('gobeklitepe-progress', this.placedCount, placedIds, selected?.config.id || null);
  }

  private cleanUpScene(): void {
    this.events.off(Phaser.Scenes.Events.DESTROY, this.cleanUpScene, this);
    this.events.off('gobeklitepe-stone-selection-changed');
    EventBus.off('gobeklitepe-select-piece', this.handleSelectPieceFromUI);
    EventBus.off('gobeklitepe-drag-start', this.handleDragStartFromUI);
    EventBus.off('gobeklitepe-drag-move', this.handleDragMoveFromUI);
    EventBus.off('gobeklitepe-drag-end', this.handleDragEndFromUI);
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
        label: 'Tilki Yuvası',
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
        label: 'Yaban Domuzu Yuvası',
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
        label: 'Turna Yuvası',
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
        label: 'Yılan Yuvası',
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
        label: 'Boğa Yuvası',
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
        label: 'Akrep Yuvası',
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
    // 6 Animal Relief Configurations matching the socket silhouettes
    const pieceConfigs: StonePieceConfig[] = [
      // 1. Sol Sütun Üst: Tilki (130x75)
      {
        id: 'p_fox_left',
        svgKey: 'relief_fox_left',
        title: 'Tilki',
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
        title: 'Domuz',
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
        title: 'Turna',
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
        title: 'Yılan',
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
        title: 'Boğa',
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
        title: 'Akrep',
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
        this.emitProgress();
      }
    } else {
      this.pusula?.setMessage('Önce tepsiden bir hayvan seç.');
    }
  }

  private handleCorrectPlacement(_piece: DraggableStone, _zone: StoneDropZone): void {
    this.placedCount++;
    this.emitProgress();

    if (this.placedCount === 1) {
      this.pusula?.setMessage('Taşlarda hayvan betimlemeleri bulunur; anlamları kesin bilinmiyor.');
    } else if (this.placedCount === 3) {
      this.pusula?.setMessage('Sol sütunun kabartmaları tamamlandı! Şimdi sağ sütuna geçelim.');
    } else if (this.placedCount === 5) {
      this.pusula?.setMessage('Kuşların uzun bacaklarına ve gagalarına dikkat et.');
    } else if (this.placedCount === 6) {
      // All 6 Pieces Complete!
      this.pusula?.setMessage('Tebrikler! Taşın hafızasını çözdün ve ilk ustalık damganı kazandın!');
      this.onGameCompleted();
    }
  }

  private handleIncorrectPlacement(): void {
    this.errorCount++;
    this.pusula?.setMessage('Hayvanın biçimine ve yönüne bak; tekrar dene.');
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
    const result = calculateResult(this.elapsedSeconds, this.errorCount);
    GameStore.saveResult('gobeklitepe', result);
    EventBus.emit('mission-result', 'gobeklitepe');
  }
}
