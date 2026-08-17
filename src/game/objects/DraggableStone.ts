import Phaser from 'phaser';
import type { StoneDropZone } from './StoneDropZone';
import { SoundFx } from '../utils/audio';

export interface StonePieceConfig {
  id: string;
  svgKey: string;
  title: string;
  targetZoneId: string;
  origX: number;
  origY: number;
  width: number;
  height: number;
  trayScale?: number;
  motifType: 'fox' | 'boar' | 'crane';
  side: 'left' | 'right';
}

export class DraggableStone extends Phaser.GameObjects.Container {
  public readonly config: StonePieceConfig;
  public isPlaced = false;
  private contactShadow: Phaser.GameObjects.Graphics;
  private stoneImage?: Phaser.GameObjects.Image;
  private labelText?: Phaser.GameObjects.Text;
  public isSelected = false;
  private readonly defaultTrayScale: number;
  private SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  constructor(
    scene: Phaser.Scene,
    config: StonePieceConfig,
    dropZones: StoneDropZone[],
    onCorrectPlacement: (piece: DraggableStone, zone: StoneDropZone) => void,
    onIncorrectPlacement: (piece: DraggableStone, zone?: StoneDropZone) => void
  ) {
    super(scene, config.origX, config.origY);
    this.config = config;
    this.defaultTrayScale = config.trayScale ?? 0.85;

    const touchW = Math.max(config.width, 100);
    const touchH = Math.max(config.height + 30, 90);
    this.setSize(touchW, touchH);
    this.setScale(this.defaultTrayScale);
    this.setDepth(10);

    // 1. Elliptical Drop Shadow for Tray / Drag state
    this.contactShadow = scene.add.graphics();
    this.contactShadow.fillStyle(0x180c03, 0.65);
    this.contactShadow.fillEllipse(0, config.height / 2 + 4, config.width * 0.9, 18);
    this.add(this.contactShadow);

    // 2. Render Textured Megalith Relief SVG Image
    if (scene.textures.exists(config.svgKey)) {
      this.stoneImage = scene.add.image(0, 0, config.svgKey);
      this.stoneImage.setDisplaySize(config.width, config.height);
      this.add(this.stoneImage);
    } else {
      // Fallback
      const shapeBg = scene.add.graphics();
      shapeBg.fillStyle(0xc2945d, 1);
      shapeBg.fillRoundedRect(-config.width / 2, -config.height / 2, config.width, config.height, 8);
      this.add(shapeBg);
    }

    // 3. Label Text on Tray (Warm sandstone gold)
    this.labelText = scene.add.text(0, config.height / 2 + 16, config.title, {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FEF3C7',
      align: 'center',
      resolution: 2,
    });
    this.labelText.setOrigin(0.5);
    this.add(this.labelText);

    // 4. Touch Hit Area
    this.setInteractive({ useHandCursor: true });
    scene.input.setDraggable(this);

    // 5. Drag Events with Contact Shadow Dynamics & Audio
    this.on('dragstart', () => {
      if (this.isPlaced) return;
      this.setDepth(20);
      SoundFx.playStoneDrag();

      // Lift up: grow by 8% (1.08)
      scene.tweens.add({
        targets: this,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 120,
        ease: 'Back.easeOut',
      });
      // Elongate shadow when lifted
      scene.tweens.add({
        targets: this.contactShadow,
        scaleX: 1.3,
        scaleY: 1.4,
        alpha: 0.35,
        y: 24,
        duration: 120,
      });
    });

    this.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.isPlaced) return;
      this.x = dragX;
      this.y = dragY;
    });

    this.on('dragend', () => {
      if (this.isPlaced) return;

      // Find matching drop zone
      const targetZone = dropZones.find((z) => z.config.id === config.targetZoneId);

      if (targetZone && !targetZone.isOccupied) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, targetZone.x, targetZone.y);

        // Magnetic snap threshold (< 65px)
        if (dist <= 65) {
          this.snapToZone(targetZone, onCorrectPlacement);
          return;
        }
      }

      // Incorrect Placement / Dropped out of bounds
      if (targetZone) {
        targetZone.registerFailedAttempt();
      }
      SoundFx.playSandSlide();
      onIncorrectPlacement(this, targetZone);
      this.returnToTray();
    });

    // Tap/Click to Select
    this.on('pointerdown', () => {
      if (this.isPlaced) return;
      this.setSelected(!this.isSelected);
    });

    scene.add.existing(this);
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    if (selected) {
      this.setDepth(20);
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 120,
      });
    } else {
      this.setDepth(10);
      this.scene.tweens.add({
        targets: this,
        scaleX: this.defaultTrayScale,
        scaleY: this.defaultTrayScale,
        duration: 120,
      });
    }
  }

  public snapToZone(targetZone: StoneDropZone, onCorrectPlacement: (piece: DraggableStone, zone: StoneDropZone) => void): void {
    this.isPlaced = true;
    this.isSelected = false;
    this.disableInteractive();
    targetZone.markOccupied();

    if (this.labelText) {
      this.labelText.setVisible(false);
    }

    // Hide contact shadow on stone surface
    this.scene.tweens.add({
      targets: this.contactShadow,
      alpha: 0,
      duration: 150,
    });

    // Play crisp stone chisel strike sound
    SoundFx.playChiselStrike();

    // Lock seamlessly into the exact X, Y, scale: 1.0, angle: 0 at Depth 10
    this.scene.tweens.add({
      targets: this,
      x: targetZone.x,
      y: targetZone.y,
      scaleX: 1.0,
      scaleY: 1.0,
      angle: 0,
      duration: 160,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.setDepth(10);
        // Camera subtle tactile shake (100ms)
        this.scene.cameras.main.shake(100, 0.003);
        // Stone dust puff particles
        this.createStoneDustPuff(targetZone.x, targetZone.y);
        onCorrectPlacement(this, targetZone);
      },
    });
  }

  private createStoneDustPuff(x: number, y: number): void {
    for (let i = 0; i < 14; i++) {
      const dust = this.scene.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + this.config.height / 2 - 4,
        Phaser.Math.Between(2, 5),
        0xd97706,
        0.8
      );
      dust.setDepth(26);

      const angle = (Math.PI * 2 * i) / 14;
      const dist = Phaser.Math.Between(20, 45);

      this.scene.tweens.add({
        targets: dust,
        x: dust.x + Math.cos(angle) * dist,
        y: dust.y + Math.sin(angle) * dist * 0.5 - 10,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(300, 500),
        onComplete: () => dust.destroy(),
      });
    }
  }

  public returnToTray(): void {
    this.isSelected = false;
    this.scene.tweens.add({
      targets: this.contactShadow,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 0.65,
      y: this.config.height / 2 + 4,
      duration: 200,
    });

    // Spring elastic return to original tray slot
    this.scene.tweens.add({
      targets: this,
      angle: { from: -5, to: 5 },
      duration: 60,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.angle = 0;
        this.scene.tweens.add({
          targets: this,
          x: this.config.origX,
          y: this.config.origY,
          scaleX: this.defaultTrayScale,
          scaleY: this.defaultTrayScale,
          duration: 260,
          ease: 'Back.easeOut',
          onComplete: () => this.setDepth(10),
        });
      },
    });
  }
}
