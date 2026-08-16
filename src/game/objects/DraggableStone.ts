import Phaser from 'phaser';
import type { StoneDropZone } from './StoneDropZone';
import { SoundFx } from '../utils/audio';

export interface StonePieceConfig {
  id: string;
  pieceType: string;
  phase: number;
  svgKey: string;
  title: string;
  targetZoneId: string;
  origX: number;
  origY: number;
  width: number;
  height: number;
}

export class DraggableStone extends Phaser.GameObjects.Container {
  public readonly config: StonePieceConfig;
  public isPlaced = false;
  private selectionGlow: Phaser.GameObjects.Graphics;
  private contactShadow: Phaser.GameObjects.Graphics;
  public isSelected = false;
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

    const touchW = Math.max(config.width, 100);
    const touchH = Math.max(config.height + 35, 100);
    this.setSize(touchW, touchH);

    // 1. Realistic Elliptical Contact Drop Shadow underneath the stone
    this.contactShadow = scene.add.graphics();
    this.contactShadow.fillStyle(0x1a0f05, 0.55);
    this.contactShadow.fillEllipse(0, config.height / 2 + 5, config.width * 0.9, 22);
    this.add(this.contactShadow);

    // 2. Selection Glow Graphics (Shown when tapped/selected)
    this.selectionGlow = scene.add.graphics();
    this.selectionGlow.fillStyle(0xffd700, 0.35);
    this.selectionGlow.fillRoundedRect(-config.width / 2 - 8, -config.height / 2 - 8, config.width + 16, config.height + 16, 14);
    this.selectionGlow.lineStyle(3, 0xffd700, 0.9);
    this.selectionGlow.strokeRoundedRect(-config.width / 2 - 8, -config.height / 2 - 8, config.width + 16, config.height + 16, 14);
    this.selectionGlow.setVisible(false);
    this.add(this.selectionGlow);

    // 3. Render Textured Megalith SVG Image
    if (scene.textures.exists(config.svgKey)) {
      const img = scene.add.image(0, 0, config.svgKey);
      img.setDisplaySize(config.width, config.height);
      this.add(img);
    } else {
      // Fallback procedural limestone block
      const shapeBg = scene.add.graphics();
      shapeBg.fillStyle(0xd97706, 1);
      shapeBg.fillRoundedRect(-config.width / 2, -config.height / 2, config.width, config.height, 10);
      shapeBg.lineStyle(2, 0xffd700, 1);
      shapeBg.strokeRoundedRect(-config.width / 2, -config.height / 2, config.width, config.height, 10);
      this.add(shapeBg);
    }

    // 4. Label Text on Tray (Clean warm limestone gold)
    const labelText = scene.add.text(0, config.height / 2 + 14, config.title, {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FEF3C7',
      align: 'center',
      resolution: 2,
    });
    labelText.setOrigin(0.5);
    this.add(labelText);

    // 5. Touch Hit Area (>= 100px touch target)
    this.setInteractive({ useHandCursor: true });
    scene.input.setDraggable(this);

    // 6. Drag Events with Contact Shadow Dynamics
    this.on('dragstart', () => {
      if (this.isPlaced) return;
      this.setDepth(100);
      scene.tweens.add({
        targets: this,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 100,
        ease: 'Power1',
      });
      // Elongate and soften shadow when lifted
      scene.tweens.add({
        targets: this.contactShadow,
        scaleX: 1.3,
        scaleY: 1.4,
        alpha: 0.35,
        y: 18,
        duration: 100,
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

        // Generous 160px snap threshold
        if (dist <= 160) {
          this.snapToZone(targetZone, onCorrectPlacement);
          return;
        }
      }

      // Incorrect Placement / Dropped out of bounds
      if (targetZone) {
        targetZone.registerFailedAttempt();
      }
      SoundFx.playErrorTone();
      onIncorrectPlacement(this, targetZone);
      this.returnToTray();
    });

    // Tap/Click to Select
    this.on('pointerdown', () => {
      if (this.isPlaced) return;
      this.setSelected(!this.isSelected);
    });

    // Phase 2 items initial visibility
    if (config.phase === 2) {
      this.setVisible(false);
      this.setActive(false);
    }

    scene.add.existing(this);
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.selectionGlow.setVisible(selected);
    if (selected) {
      this.setDepth(90);
    } else {
      this.setDepth(10);
    }
  }

  public snapToZone(targetZone: StoneDropZone, onCorrectPlacement: (piece: DraggableStone, zone: StoneDropZone) => void): void {
    this.isPlaced = true;
    this.setSelected(false);
    this.disableInteractive();
    targetZone.markOccupied();
    SoundFx.playSuccessTone();

    // Reset shadow position
    this.scene.tweens.add({
      targets: this.contactShadow,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 0.6,
      y: this.config.height / 2 + 5,
      duration: 150,
    });

    // Heavy thud landing snap animation + camera micro-shake + stone dust puff
    this.scene.tweens.add({
      targets: this,
      x: targetZone.x,
      y: targetZone.y,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.setDepth(20);
        // Camera subtle tactile landing shake
        this.scene.cameras.main.shake(120, 0.0035);
        // Stone dust puff particles
        this.createStoneDustPuff(targetZone.x, targetZone.y);
        onCorrectPlacement(this, targetZone);
      },
    });
  }

  private createStoneDustPuff(x: number, y: number): void {
    for (let i = 0; i < 16; i++) {
      const dust = this.scene.add.circle(
        x + Phaser.Math.Between(-30, 30),
        y + this.config.height / 2 - 10,
        Phaser.Math.Between(3, 7),
        0xd97706,
        0.8
      );
      dust.setDepth(25);

      const angle = (Math.PI * 2 * i) / 16;
      const dist = Phaser.Math.Between(25, 60);

      this.scene.tweens.add({
        targets: dust,
        x: dust.x + Math.cos(angle) * dist,
        y: dust.y + Math.sin(angle) * dist * 0.5 - 15,
        alpha: 0,
        scale: 0.3,
        duration: Phaser.Math.Between(350, 600),
        onComplete: () => dust.destroy(),
      });
    }
  }

  public returnToTray(): void {
    this.setSelected(false);
    this.scene.tweens.add({
      targets: this.contactShadow,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 0.55,
      y: this.config.height / 2 + 5,
      duration: 200,
    });

    // Wiggle animation + Smooth return tween to original tray slot
    this.scene.tweens.add({
      targets: this,
      angle: { from: -8, to: 8 },
      duration: 70,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.angle = 0;
        this.scene.tweens.add({
          targets: this,
          x: this.config.origX,
          y: this.config.origY,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 250,
          ease: 'Quad.easeOut',
          onComplete: () => this.setDepth(10),
        });
      },
    });
  }

  public enablePhase2(): void {
    if (this.config.phase === 2 && !this.isPlaced) {
      this.setVisible(true);
      this.setActive(true);
      this.setInteractive({ useHandCursor: true });
      this.scene.input.setDraggable(this);
      this.setAlpha(0);
      this.scene.tweens.add({
        targets: this,
        alpha: 1.0,
        duration: 400,
      });
    }
  }
}
