import Phaser from 'phaser';
import { CopperEmbossEffect } from './CopperEmbossEffect';
import { SoundFx } from '../utils/audio';

export interface PathSegment {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export class TracePath extends Phaser.GameObjects.Container {
  private segments: PathSegment[];
  public currentSegmentIndex = 0;
  public completedSegments: boolean[] = [false, false, false];

  private isTracing = false;
  private activeGraphics: Phaser.GameObjects.Graphics;
  private guideGraphics: Phaser.GameObjects.Graphics;
  private pointerMoveListener?: (pointer: Phaser.Input.Pointer) => void;
  private pointerUpListener?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    segments: PathSegment[],
    onPathComplete: () => void
  ) {
    super(scene, x, y);
    this.segments = segments;

    // Guide dashed lines background
    this.guideGraphics = scene.add.graphics();
    this.renderGuideLines();

    // Active embossed lines graphics
    this.activeGraphics = scene.add.graphics();

    this.add([this.guideGraphics, this.activeGraphics]);

    // Touch pointer listeners
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.currentSegmentIndex >= this.segments.length) return;
      const seg = this.segments[this.currentSegmentIndex];
      const distToStart = Phaser.Math.Distance.Between(pointer.x, pointer.y, seg.startX, seg.startY);

      // Must start tracing at segment start point (within 65px)
      if (distToStart <= 65) {
        this.isTracing = true;
        SoundFx.playSuccessTone();
      }
    });

    this.pointerMoveListener = (pointer: Phaser.Input.Pointer) => {
      if (!this.isTracing || this.currentSegmentIndex >= this.segments.length) return;
      const seg = this.segments[this.currentSegmentIndex];

      // Check distance to line segment
      const distToLine = this.distanceToSegment(pointer.x, pointer.y, seg.startX, seg.startY, seg.endX, seg.endY);

      if (distToLine > 65) {
        // Strayed off track: Reset ONLY active segment, keep completed ones!
        this.isTracing = false;
        SoundFx.playErrorTone();
        return;
      }

      // Check distance to end point
      const distToEnd = Phaser.Math.Distance.Between(pointer.x, pointer.y, seg.endX, seg.endY);
      if (distToEnd <= 45) {
        // Segment Completed!
        this.completedSegments[this.currentSegmentIndex] = true;
        CopperEmbossEffect.renderEmbossLine(this.scene, seg.startX, seg.startY, seg.endX, seg.endY);
        SoundFx.playSuccessTone();

        this.currentSegmentIndex++;
        this.isTracing = false;

        if (this.currentSegmentIndex >= this.segments.length) {
          onPathComplete();
        }
      }
    };

    this.pointerUpListener = () => {
      this.isTracing = false;
    };

    scene.input.on('pointermove', this.pointerMoveListener);
    scene.input.on('pointerup', this.pointerUpListener);

    scene.add.existing(this);
  }

  private renderGuideLines(): void {
    this.guideGraphics.clear();
    this.segments.forEach((seg) => {
      this.guideGraphics.lineStyle(4, 0x00f2fe, 0.4);
      this.guideGraphics.beginPath();
      this.guideGraphics.moveTo(seg.startX, seg.startY);
      this.guideGraphics.lineTo(seg.endX, seg.endY);
      this.guideGraphics.strokePath();

      // Start / End Circles
      this.guideGraphics.fillStyle(0xffd700, 0.8);
      this.guideGraphics.fillCircle(seg.startX, seg.startY, 12);
      this.guideGraphics.fillCircle(seg.endX, seg.endY, 10);
    });
  }

  private distanceToSegment(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Phaser.Math.Distance.Between(px, py, x1, y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Phaser.Math.Distance.Between(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
  }

  public destroy(fromScene?: boolean): void {
    if (this.pointerMoveListener) {
      this.scene?.input?.off('pointermove', this.pointerMoveListener);
    }
    if (this.pointerUpListener) {
      this.scene?.input?.off('pointerup', this.pointerUpListener);
    }
    super.destroy(fromScene);
  }
}
