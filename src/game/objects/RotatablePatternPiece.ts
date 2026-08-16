import Phaser from 'phaser';
import type { PatternDropZone } from './PatternDropZone';
import { SoundFx } from '../utils/audio';

export interface PatternPieceConfig {
  id: string;
  svgKey: string;
  targetZoneId: string;
  correctAngle: number; // 0, 90, 180, or 270
  origX: number;
  origY: number;
  width: number;
  height: number;
}

export class RotatablePatternPiece extends Phaser.GameObjects.Container {
  public readonly config: PatternPieceConfig;
  public currentAngle = 0; // 0, 90, 180, 270
  public isPlaced = false;

  private pointerDownTime = 0;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private isDragging = false;

  constructor(
    scene: Phaser.Scene,
    config: PatternPieceConfig,
    dropZones: PatternDropZone[],
    onCorrectPlacement: (piece: RotatablePatternPiece, zone: PatternDropZone) => void,
    onIncorrectPlacement: (piece: RotatablePatternPiece, zone?: PatternDropZone) => void
  ) {
    super(scene, config.origX, config.origY);
    this.config = config;

    const size = Math.max(config.width, 110);
    this.setSize(size, size);

    if (scene.textures.exists(config.svgKey)) {
      const img = scene.add.image(0, 0, config.svgKey);
      img.setDisplaySize(config.width, config.height);
      this.add(img);
    }

    this.setInteractive({ useHandCursor: true });
    scene.input.setDraggable(this);

    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isPlaced) return;
      this.pointerDownTime = scene.time.now;
      this.pointerDownX = pointer.x;
      this.pointerDownY = pointer.y;
      this.isDragging = false;
      this.setDepth(100);
    });

    this.on('dragstart', () => {
      if (this.isPlaced) return;
      this.isDragging = true;
    });

    this.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.isPlaced) return;
      this.x = dragX;
      this.y = dragY;
    });

    this.on('dragend', () => {
      if (this.isPlaced) return;

      const targetZone = dropZones.find((z) => z.config.id === config.targetZoneId);

      if (targetZone && !targetZone.isOccupied) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, targetZone.x, targetZone.y);

        // Check BOTH distance AND exact 90-degree angle match!
        if (dist <= 140 && this.currentAngle === config.correctAngle) {
          this.snapToZone(targetZone, onCorrectPlacement);
          return;
        }
      }

      // Incorrect angle or position
      if (targetZone) {
        targetZone.registerFailedAttempt();
      }
      SoundFx.playErrorTone();
      onIncorrectPlacement(this, targetZone);
      this.returnToTray();
    });

    // Tap to Rotate 90 Degrees (< 200ms duration & < 10px movement)
    this.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isPlaced) return;
      const duration = scene.time.now - this.pointerDownTime;
      const distMoved = Phaser.Math.Distance.Between(this.pointerDownX, this.pointerDownY, pointer.x, pointer.y);

      if (duration < 220 && distMoved < 12 && !this.isDragging) {
        this.rotatePiece90();
      }
    });

    scene.add.existing(this);
  }

  public rotatePiece90(): void {
    this.currentAngle = (this.currentAngle + 90) % 360;
    SoundFx.playSuccessTone();

    this.scene.tweens.add({
      targets: this,
      angle: this.currentAngle,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  public snapToZone(targetZone: PatternDropZone, onCorrectPlacement: (piece: RotatablePatternPiece, zone: PatternDropZone) => void): void {
    this.isPlaced = true;
    this.disableInteractive();
    targetZone.markOccupied();
    SoundFx.playSuccessTone();

    this.scene.tweens.add({
      targets: this,
      x: targetZone.x,
      y: targetZone.y,
      angle: this.config.correctAngle,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.setDepth(20);
        onCorrectPlacement(this, targetZone);
      },
    });
  }

  public returnToTray(): void {
    this.scene.tweens.add({
      targets: this,
      x: this.config.origX,
      y: this.config.origY,
      duration: 250,
      ease: 'Quad.easeOut',
      onComplete: () => this.setDepth(10),
    });
  }
}
