import Phaser from 'phaser';
import type { GearNode } from './GearNode';
import { SoundFx } from '../utils/audio';

export interface AxleConfig {
  id: string;
  x: number;
  y: number;
  acceptedSizeType: string;
}

export class MechanismController extends Phaser.GameObjects.Container {
  private axles: AxleConfig[];
  private gears: GearNode[] = [];
  public placedGearsCount = 0;

  public isMechanismActive = false;
  public isCompleted = false;

  private crankContainer?: Phaser.GameObjects.Container;
  private crankCenter = { x: 450, y: 540 };
  private isGrabbingCrank = false;
  private lastCrankAngle = 0;
  private accumulatedRotationAngle = 0;

  private indicatorNeedle?: Phaser.GameObjects.Graphics;
  private pointerMoveListener?: (pointer: Phaser.Input.Pointer) => void;
  private pointerUpListener?: () => void;

  constructor(
    scene: Phaser.Scene,
    axles: AxleConfig[],
    onMechanismComplete: () => void
  ) {
    super(scene, 0, 0);
    this.axles = axles;

    // Render Mechanism Wooden Mounting Board & Connecting Shafts
    this.renderBoardAndShafts();

    // Render Axle Pins on Wall
    this.renderAxlesOnWall();

    // Render Indicator Gauge (Right Side)
    this.renderRightIndicator();

    // Pointer listeners for circular crank dragging
    this.pointerMoveListener = (pointer: Phaser.Input.Pointer) => {
      if (!this.isGrabbingCrank || !this.isMechanismActive || this.isCompleted) return;

      const currentAngle = Math.atan2(pointer.y - this.crankCenter.y, pointer.x - this.crankCenter.x);
      let deltaAngle = currentAngle - this.lastCrankAngle;

      // Normalize across -PI to +PI boundary
      if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
      if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

      // Enforce continuous unidirectional clockwise rotation (ignore reverse or random shaking)
      if (deltaAngle > 0.01 && deltaAngle < 1.2) {
        this.accumulatedRotationAngle += deltaAngle;
        if (this.crankContainer) {
          this.crankContainer.angle = Phaser.Math.RadToDeg(currentAngle);
        }

        // Rotate meshed gears in counter-rotating directions with inverse-radius speeds!
        const baseSpeed = 180;
        this.gears.forEach((gear, index) => {
          if (gear.isPlaced) {
            // Meshed neighbor gears counter-rotate in opposite directions!
            gear.rotationDirection = index % 2 === 0 ? 1 : -1;
            gear.rotateGear(baseSpeed, deltaAngle * 100);
          }
        });

        // Move right indicator needle
        this.updateIndicatorNeedle(this.accumulatedRotationAngle / (2 * Math.PI));

        // Complete when full 360-degree (2*PI) continuous turn is reached!
        if (this.accumulatedRotationAngle >= Math.PI * 2 * 0.95) {
          this.isCompleted = true;
          this.isGrabbingCrank = false;
          SoundFx.playSuccessTone();
          onMechanismComplete();
        }
      }

      this.lastCrankAngle = currentAngle;
    };

    this.pointerUpListener = () => {
      this.isGrabbingCrank = false;
    };

    scene.input.on('pointermove', this.pointerMoveListener);
    scene.input.on('pointerup', this.pointerUpListener);

    scene.add.existing(this);
  }

  private renderBoardAndShafts(): void {
    const board = this.scene.add.graphics();
    board.fillStyle(0x1e293b, 0.94);
    board.fillRoundedRect(350, 420, 940, 240, 24);
    board.lineStyle(3, 0xffd700, 0.7);
    board.strokeRoundedRect(350, 420, 940, 240, 24);

    // Connecting drive shaft bar
    const shaft = this.scene.add.graphics();
    shaft.fillStyle(0x475569, 1);
    shaft.fillRect(450, 532, 750, 16);

    this.add([board, shaft]);
  }

  private renderAxlesOnWall(): void {
    this.axles.forEach((axle) => {
      const pin = this.scene.add.graphics();
      pin.fillStyle(0x0a1128, 1);
      pin.fillCircle(axle.x, axle.y, 18);
      pin.lineStyle(3, 0x00f2fe, 0.9);
      pin.strokeCircle(axle.x, axle.y, 18);

      const centerDot = this.scene.add.circle(axle.x, axle.y, 6, 0xffd700);
      this.add([pin, centerDot]);
    });
  }

  private renderRightIndicator(): void {
    const gauge = this.scene.add.graphics();
    gauge.fillStyle(0x0a1128, 0.95);
    gauge.fillRoundedRect(1140, 460, 140, 160, 16);
    gauge.lineStyle(2.5, 0x00f2fe, 0.9);
    gauge.strokeRoundedRect(1140, 460, 140, 160, 16);

    const arc = this.scene.add.graphics();
    arc.lineStyle(5, 0x10b981, 0.9);
    arc.beginPath();
    arc.arc(1210, 550, 48, Math.PI, 0, false);
    arc.strokePath();

    this.indicatorNeedle = this.scene.add.graphics();
    this.updateIndicatorNeedle(0);

    this.add([gauge, arc, this.indicatorNeedle]);
  }

  private updateIndicatorNeedle(ratio: number): void {
    if (!this.indicatorNeedle) return;
    this.indicatorNeedle.clear();
    const clampedRatio = Math.min(1, Math.max(0, ratio));
    const angle = Math.PI + clampedRatio * Math.PI;

    const needleLength = 42;
    const endX = 1210 + Math.cos(angle) * needleLength;
    const endY = 550 + Math.sin(angle) * needleLength;

    this.indicatorNeedle.lineStyle(4, 0xffd700, 1);
    this.indicatorNeedle.beginPath();
    this.indicatorNeedle.moveTo(1210, 550);
    this.indicatorNeedle.lineTo(endX, endY);
    this.indicatorNeedle.strokePath();

    this.indicatorNeedle.fillStyle(0xffffff, 1);
    this.indicatorNeedle.fillCircle(1210, 550, 7);
  }

  public registerGear(gear: GearNode): void {
    this.gears.push(gear);
  }

  public checkGearPlacement(gear: GearNode, targetAxleId: string): boolean {
    const axle = this.axles.find((a) => a.id === targetAxleId);
    if (!axle) return false;

    const dist = Phaser.Math.Distance.Between(gear.x, gear.y, axle.x, axle.y);

    if (dist <= 90 && gear.config.sizeType === axle.acceptedSizeType) {
      gear.isPlaced = true;
      gear.x = axle.x;
      gear.y = axle.y;
      gear.disableInteractive();
      SoundFx.playSuccessTone();

      this.placedGearsCount++;

      if (this.placedGearsCount >= 3) {
        this.activateCrankMechanism();
      }
      return true;
    }

    gear.registerFailedAttempt();
    SoundFx.playErrorTone();
    gear.returnToTray();
    return false;
  }

  private activateCrankMechanism(): void {
    this.isMechanismActive = true;

    // Render Rotary Crank Handle on Left Drive Shaft
    this.crankContainer = this.scene.add.container(this.crankCenter.x, this.crankCenter.y);

    if (this.scene.textures.exists('crank_handle')) {
      const crankImg = this.scene.add.image(0, 0, 'crank_handle');
      crankImg.setDisplaySize(140, 140);
      this.crankContainer.add(crankImg);
    }

    const crankLabel = this.scene.add.text(0, 75, 'KRANK KOLUNU DÖNDÜR ↻', {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: '15px',
      fontStyle: '900',
      color: '#FFD700',
    });
    crankLabel.setOrigin(0.5);
    this.crankContainer.add(crankLabel);

    // Touch hit area for crank handle knob
    const hitArea = new Phaser.Geom.Circle(0, 0, 75);
    this.crankContainer.setInteractive(hitArea, Phaser.Geom.Circle.Contains, true);

    this.crankContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isGrabbingCrank = true;
      this.lastCrankAngle = Math.atan2(pointer.y - this.crankCenter.y, pointer.x - this.crankCenter.x);
    });

    this.add(this.crankContainer);
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
