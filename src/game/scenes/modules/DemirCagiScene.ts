/**
 * DemirCagiScene - Demir Çağı (Bölüm 2 / 6)
 *
 * Comprehensive Iron Age module featuring:
 * - Stage 1: Furnace bellows & temperature balance control
 * - Stage 2: Precision hammer forging timing on glowing billet
 * - Stage 3: Water quench cooling & hardening
 * - Stage 4: Authentic Ottoman sword assembly (Kılıcı Tamamla) with robust drag & drop
 *
 * Build & Gameplay Version: 2.1.0 (Improved drag & drop hitboxes, top-level drag layer, dual-check drop)
 */
import { calculateResult } from '../../systems/scoring';
import Phaser from 'phaser';
import { BaseScene } from '../BaseScene';
import { SceneKeys } from '../../../types/game';
import { GameStore } from '../../state/GameStore';
import { PusulaCharacter } from '../../objects/PusulaCharacter';
import { SoundFx } from '../../utils/audio';
import { EventBus } from '../../state/EventBus';

// Stage Background Images
import ironStage1BgUrl from '../../../assets/iron_stage1_furnace.webp';
import ironStage2BgUrl from '../../../assets/iron_stage2_anvil.webp';
import ironStage4BgUrl from '../../../assets/iron_stage4_showcase.webp';

// Physical In-Scene Workshop Materials & Mechanism Parts
import oreIronRedUrl from '../../../assets/svg/ore_iron_red.svg';
import oreCharcoalUrl from '../../../assets/svg/ore_charcoal.svg';
import oreCopperUrl from '../../../assets/svg/ore_copper.svg';
import oreStoneUrl from '../../../assets/svg/ore_stone.svg';
import bellowsToolUrl from '../../../assets/svg/bellows_tool.svg';
import ironGlowingIngotUrl from '../../../assets/svg/iron_glowing_ingot.svg';
import smithHammerUrl from '../../../assets/svg/smith_hammer.svg';
import swordBladeUrl from '../../../assets/svg/sword_blade.svg';
import swordGuardUrl from '../../../assets/svg/sword_guard.svg';
import swordGripUrl from '../../../assets/svg/sword_grip.svg';
import swordPommelUrl from '../../../assets/svg/sword_pommel.svg';
import type {
  SwordPartDef,
  SwordSlotDef,
  TrayCardSlot,
} from '../../systems/swordAssembly';
import {
  SWORD_PART_DEFS,
  SWORD_SLOT_DEFS,
  SWORD_BASELINE_Y,
  TRAY_CARD_SLOTS,
  shuffleSwordParts,
  evaluateSwordDrop,
  isPointInsideSlotRect,
} from '../../systems/swordAssembly';

interface DragMaterial {
  container: Phaser.GameObjects.Container;
  id: string;
  isCorrect: boolean;
  origX: number;
  origY: number;
  isPlaced: boolean;
}

interface SwordPartItem {
  def: SwordPartDef;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Graphics;
  cardSlot: TrayCardSlot;
  cardBg: Phaser.GameObjects.Graphics;
  placedBadge: Phaser.GameObjects.Container;
  titleTag: Phaser.GameObjects.Graphics;
  titleText: Phaser.GameObjects.Text;
  isPlaced: boolean;
}

interface SwordSlotItem {
  def: SwordSlotDef;
  outline: Phaser.GameObjects.Graphics;
  badge: Phaser.GameObjects.Container;
  isFilled: boolean;
}

export interface StrikeEvaluationResult {
  isSuccess: boolean;
  feedback: 'EARLY' | 'PERFECT' | 'LATE';
  strikeProgress: number;
}

/**
 * Pure evaluation function for anvil hammer strike timing.
 * Evaluates whether normalized needleProgress falls strictly within [successStart, successEnd].
 */
export function evaluateHammerStrike(
  strikeProgress: number,
  successStart = 0.40,
  successEnd = 0.60
): StrikeEvaluationResult {
  const isSuccess = strikeProgress >= successStart && strikeProgress <= successEnd;
  let feedback: 'EARLY' | 'PERFECT' | 'LATE' = 'PERFECT';
  if (strikeProgress < successStart) {
    feedback = 'EARLY';
  } else if (strikeProgress > successEnd) {
    feedback = 'LATE';
  }
  return { isSuccess, feedback, strikeProgress };
}

export class DemirCagiScene extends BaseScene {
  private pusula?: PusulaCharacter;
  private currentStage: 1 | 2 | 3 | 4 = 1;
  private elapsedSeconds = 0;
  private totalErrors = 0;
  private timerEvent?: Phaser.Time.TimerEvent;
  private isCompleted = false;

  // Header UI
  private phaseTitleText?: Phaser.GameObjects.Text;
  private objectiveText?: Phaser.GameObjects.Text;
  private counterText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;

  // Background Image Display
  private bgImage?: Phaser.GameObjects.Image;

  // Stage 1: Malzemeyi Seç (Raw Ore Selection & Drag-and-Drop)
  private stage1Container?: Phaser.GameObjects.Container;
  private stage1Materials: DragMaterial[] = [];
  private fedMaterialsCount = 0;
  private hearthFlameGlow?: Phaser.GameObjects.Graphics;

  // Stage 2: Ocağı Yönet (Physical Blacksmith Bellows, Live Fire & Dynamic Ingot Smelting)
  private stage2Container?: Phaser.GameObjects.Container;
  private currentHeat = 22; // 0 - 100
  private heatingProgress = 0; // 0 - 100%
  private stage2Active = false;

  // Physical Bellows components
  private bellowsLeatherGraphics?: Phaser.GameObjects.Graphics;
  private bellowsArmGraphics?: Phaser.GameObjects.Graphics;
  private bellowsLeverHandle?: Phaser.GameObjects.Container;
  private bellowsAngle = 26; // degrees (28 open, 6 closed)
  private bellowsHandleY = 520;
  private bellowsMinY = 460;
  private bellowsMaxY = 660;
  private isHandleDragging = false;
  private lastBellowsSoundTime = 0;
  private lastSparkSoundTime = 0;
  private lastWarningSoundTime = 0;
  private lastIdealHumTime = 0;

  // Live Fire, Embers, Metal and Effects
  private hearthFireGraphics?: Phaser.GameObjects.Graphics;
  private hearthEmbersGraphics?: Phaser.GameObjects.Graphics;
  private hearthBilletGraphics?: Phaser.GameObjects.Graphics;
  private hearthBilletAura?: Phaser.GameObjects.Graphics;
  private airWisps: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; alpha: number; line: Phaser.GameObjects.Graphics }> = [];
  private smokeWisps: Array<{ x: number; y: number; vx: number; vy: number; alpha: number; scale: number; arc: Phaser.GameObjects.Arc }> = [];

  // Master Hearth Hararet & Tav Kıvamı Panel
  private hearthGaugePanel?: Phaser.GameObjects.Container;
  private hearthPyrometerNeedle?: Phaser.GameObjects.Graphics;
  private hearthProgressRing?: Phaser.GameObjects.Graphics;
  private hearthStatusText?: Phaser.GameObjects.Text;
  private hearthProgressLabel?: Phaser.GameObjects.Text;
  private needleSmoothedAngle = 180;

  // Stage 3: Üretimi Yönet (Timed Rhythmic Forging on Anvil)
  private stage3Container?: Phaser.GameObjects.Container;
  private anvilWorkpiece?: Phaser.GameObjects.Container;
  private workpieceSprite?: Phaser.GameObjects.Image;
  private workpiecePlateGraphics?: Phaser.GameObjects.Graphics;
  private hammerContainer?: Phaser.GameObjects.Container;
  private timingSliderGraphics?: Phaser.GameObjects.Graphics;
  private strikeCounterBadgeText?: Phaser.GameObjects.Text;
  private hitFeedbackText?: Phaser.GameObjects.Text;
  private feedbackTween?: Phaser.Tweens.Tween;
  private hammerIdleTween?: Phaser.Tweens.Tween;
  private stage3PointerHandler?: (pointer: Phaser.Input.Pointer) => void;
  private hammerSafetyTimer?: Phaser.Time.TimerEvent;

  // Normalized Timing Engine (0.0 to 1.0)
  public needleProgress = 0.5;
  public readonly successStart = 0.40;
  public readonly successEnd = 0.60;
  public readonly targetStrikes = 3;
  private timingOscillator = 0;
  private oscillatorSpeed = 2.5; // rad/sec
  private stage3Active = false;
  private hammerStrikes = 0;
  private isHammerStriking = false;

  // Stage 4: Eseri Tamamla (Osmanlı Kılıcı Montajı)
  private stage4Container?: Phaser.GameObjects.Container;
  private stage4DragLayer?: Phaser.GameObjects.Container;
  private swordParts: SwordPartItem[] = [];
  private swordSlots: SwordSlotItem[] = [];
  private swordAssembledCount = 0;
  private isSwordCompleted = false;


  constructor() {
    super(SceneKeys.DEMIR_CAGI);
  }

  init(data?: { stage?: number }): void {
    super.init();
    if (data?.stage && (data.stage === 1 || data.stage === 2 || data.stage === 3 || data.stage === 4)) {
      this.currentStage = data.stage;
    } else {
      this.currentStage = 1;
    }
  }

  preload(): void {
    if (!this.textures.exists('iron_stage1_furnace')) this.load.image('iron_stage1_furnace', ironStage1BgUrl);
    if (!this.textures.exists('iron_stage2_anvil')) this.load.image('iron_stage2_anvil', ironStage2BgUrl);
    if (!this.textures.exists('iron_stage4_showcase')) this.load.image('iron_stage4_showcase', ironStage4BgUrl);
    if (!this.textures.exists('ore_iron_red')) this.load.image('ore_iron_red', oreIronRedUrl);
    if (!this.textures.exists('ore_charcoal')) this.load.image('ore_charcoal', oreCharcoalUrl);
    if (!this.textures.exists('ore_copper')) this.load.image('ore_copper', oreCopperUrl);
    if (!this.textures.exists('ore_stone')) this.load.image('ore_stone', oreStoneUrl);
    if (!this.textures.exists('bellows_tool')) this.load.image('bellows_tool', bellowsToolUrl);
    if (!this.textures.exists('iron_glowing_ingot')) this.load.image('iron_glowing_ingot', ironGlowingIngotUrl);
    if (!this.textures.exists('smith_hammer')) this.load.image('smith_hammer', smithHammerUrl);
    if (!this.textures.exists('sword_blade')) this.load.image('sword_blade', swordBladeUrl);
    if (!this.textures.exists('sword_guard')) this.load.image('sword_guard', swordGuardUrl);
    if (!this.textures.exists('sword_grip')) this.load.image('sword_grip', swordGripUrl);
    if (!this.textures.exists('sword_pommel')) this.load.image('sword_pommel', swordPommelUrl);
  }

  create(): void {
    // Reset state variables
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const stageQuery = urlParams?.get('stage');
    this.currentStage = stageQuery === '4' || this.currentStage === 4 ? 4 : 1;
    this.elapsedSeconds = 0;
    this.totalErrors = 0;
    this.isCompleted = false;
    this.fedMaterialsCount = 0;
    this.currentHeat = 20;
    this.heatingProgress = 0;
    this.stage2Active = false;
    this.hammerStrikes = 0;
    this.stage3Active = false;
    this.isHammerStriking = false;
    this.swordAssembledCount = 0;
    this.isSwordCompleted = false;
    this.stage1Materials = [];
    this.swordParts = [];
    this.swordSlots = [];

    // Smooth Camera Fade-in from World Map transition
    this.cameras.main.fadeIn(350, 7, 11, 25);

    // Lifecycle cleanup hooks
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUpScene, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanUpScene, this);

    // 1. Dynamic Stage Background
    this.createBackgroundLayer();

    // 2. Slim Blacksmith Archaeology Header (Depth 100)
    this.createHeaderUI();

    // 3. Pusula Companion Character (Bottom Left - Depth 100)
    this.pusula = new PusulaCharacter(
      this,
      210,
      860,
      'Demirci ocağına hoş geldin! Kızıl demir cevheri ve meşe kömürünü ocağa sürükle.'
    );

    // 4. Start Active Stage
    if (this.currentStage === 4) {
      this.bgImage?.setTexture('iron_stage4_showcase');
      this.setupStage4();
    } else {
      this.setupStage1();
    }

    // Dev stage navigation hotkeys
    this.input.keyboard?.on('keydown-FOUR', () => this.transitionToStage(4));
    this.input.keyboard?.on('keydown-NUMPAD_FOUR', () => this.transitionToStage(4));

    // 5. Elapsed Time Counter Timer
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

    // 6. Corner Back Button (Top Left - Depth 100)
    this.createCornerBackButton();

    EventBus.emit('current-scene-ready', SceneKeys.DEMIR_CAGI);
  }

  update(_time: number, delta: number): void {
    // Stage 2 Live Forge Airflow & Heat Simulation Loop
    if (this.currentStage === 2 && this.stage2Active) {
      this.updateStage2Simulation(delta);
    }

    // Stage 3 Timed Oscillating Strike Bar Loop
    if (this.currentStage === 3 && this.stage3Active) {
      this.updateStage3TimingBar(delta);
    }
  }

  private cleanUpScene(): void {
    this.events.off(Phaser.Scenes.Events.DESTROY, this.cleanUpScene, this);
    this.stage2Active = false;
    this.stage3Active = false;
    this.isSwordCompleted = false;
    if (this.stage3PointerHandler) {
      this.input.off('pointerdown', this.stage3PointerHandler);
      this.stage3PointerHandler = undefined;
    }
    if (this.stage4DragLayer) {
      this.stage4DragLayer.destroy();
      this.stage4DragLayer = undefined;
    }
    if (this.hammerSafetyTimer) {
      this.hammerSafetyTimer.remove();
      this.hammerSafetyTimer = undefined;
    }
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = undefined;
    }
    this.tweens.killAll();
  }

  private createBackgroundLayer(): void {
    const letterboxBg = this.add.graphics();
    letterboxBg.fillStyle(0x0c0704, 1);
    letterboxBg.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
    letterboxBg.setDepth(0);

    this.bgImage = this.add.image(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2, 'iron_stage1_furnace');
    this.bgImage.setDisplaySize(this.GAME_WIDTH, this.GAME_HEIGHT);
    this.bgImage.setDepth(0);
  }

  private createHeaderUI(): void {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x180d05, 0.94);
    headerBg.fillRoundedRect(this.GAME_WIDTH / 2 - 620, 15, 1240, 64, 14);
    headerBg.lineStyle(2, 0xd97706, 0.9);
    headerBg.strokeRoundedRect(this.GAME_WIDTH / 2 - 620, 15, 1240, 64, 14);
    headerBg.setDepth(100);

    // 1. Left: Stage Title - Strictly BÖLÜM 2 / 6 per user specification
    this.phaseTitleText = this.createText(this.GAME_WIDTH / 2 - 450, 47, 'BÖLÜM 2 / 6', {
      fontSize: '20px',
      fontStyle: '900',
      color: '#FDE68A',
    });
    this.phaseTitleText.setOrigin(0.5);
    this.phaseTitleText.setDepth(101);

    // 2. Center: Objective Caption
    this.objectiveText = this.createText(this.GAME_WIDTH / 2 + 10, 47, 'GÖREV: Demir Cevheri ve Kömürü Ocağa Sürükle', {
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#FCD34D',
    });
    this.objectiveText.setOrigin(0.5);
    this.objectiveText.setDepth(101);

    // 3. Right: Progress Counter & Elapsed Time
    this.counterText = this.createText(this.GAME_WIDTH / 2 + 380, 47, 'İLERLEME: 0/2', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#38BDF8',
    });
    this.counterText.setOrigin(0.5);
    this.counterText.setDepth(101);

    this.timerText = this.createText(this.GAME_WIDTH / 2 + 520, 47, '00:00', {
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

  // ==========================================
  // AŞAMA 1: MALZEMEYİ SEÇ (GERÇEK DRAG & DROP)
  // ==========================================
  private setupStage1(): void {
    this.currentStage = 1;
    this.fedMaterialsCount = 0;
    this.stage1Materials = [];

    this.stage1Container = this.add.container(0, 0);
    this.stage1Container.setDepth(10);

    // Furnace Hearth Glowing Opening (Center: X: 960, Y: 530, Radius: 170)
    this.hearthFlameGlow = this.add.graphics();
    this.hearthFlameGlow.fillStyle(0xd97706, 0.28);
    this.hearthFlameGlow.fillCircle(960, 530, 160);
    this.hearthFlameGlow.lineStyle(3, 0xfde047, 0.85);
    this.hearthFlameGlow.strokeCircle(960, 530, 160);
    this.stage1Container.add(this.hearthFlameGlow);

    this.tweens.add({
      targets: this.hearthFlameGlow,
      alpha: { from: 0.35, to: 0.85 },
      scaleX: { from: 0.96, to: 1.05 },
      scaleY: { from: 0.96, to: 1.05 },
      duration: 650,
      yoyo: true,
      repeat: -1,
    });

    const hearthLabel = this.createText(960, 530, 'DEMİRCİ OCAĞI\n(BURAYA SÜRÜKLE)', {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FEF3C7',
      align: 'center',
    });
    hearthLabel.setOrigin(0.5);
    hearthLabel.setAlpha(0.8);
    this.stage1Container.add(hearthLabel);

    // In-Scene Blacksmith Workbench Ledge (Directly integrated, not a modern dashboard)
    const bench = this.add.graphics();
    bench.fillStyle(0x120a04, 0.92);
    bench.fillRoundedRect(440, 885, 1040, 165, 18);
    bench.lineStyle(2.5, 0x854d0e, 0.9);
    bench.strokeRoundedRect(440, 885, 1040, 165, 18);

    // Wood Grain & Chisel Accents on Bench
    bench.lineStyle(1.5, 0x5a3407, 0.6);
    bench.lineBetween(470, 900, 1450, 900);
    bench.lineBetween(470, 1030, 1450, 1030);
    this.stage1Container.add(bench);

    const benchHeader = this.createText(960, 898, 'ATÖLYE TEZGÂHI • DOĞRU HAMMADDEYİ SEÇ VE OCAĞA SÜRÜKLE', {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FDE68A',
    });
    benchHeader.setOrigin(0.5);
    this.stage1Container.add(benchHeader);

    // 4 Distinct In-Scene Materials:
    // 2 Correct (Red Iron Ore, Oak Charcoal) & 2 Distractors (River Stone, Raw Copper)
    const rawConfigs = [
      { id: 'iron_ore', title: 'Kızıl Demir Cevheri', key: 'ore_iron_red', x: 580, y: 975, isCorrect: true },
      { id: 'charcoal', title: 'Meşe Kömürü', key: 'ore_charcoal', x: 830, y: 975, isCorrect: true },
      { id: 'stone', title: 'Dere Taşı', key: 'ore_stone', x: 1090, y: 975, isCorrect: false },
      { id: 'copper', title: 'Ham Bakır', key: 'ore_copper', x: 1340, y: 975, isCorrect: false },
    ];

    rawConfigs.forEach((cfg) => {
      const matContainer = this.add.container(cfg.x, cfg.y);
      matContainer.setSize(110, 85);
      matContainer.setDepth(20);

      // Contact shadow
      const shadow = this.add.graphics();
      shadow.fillStyle(0x050201, 0.7);
      shadow.fillEllipse(0, 36, 95, 22);
      matContainer.add(shadow);

      // Physical Material Sprite
      const sprite = this.add.image(0, 0, cfg.key);
      sprite.setDisplaySize(90, 70);
      matContainer.add(sprite);

      // Text Label
      const label = this.createText(0, 48, cfg.title, {
        fontSize: '13px',
        fontStyle: 'bold',
        color: cfg.isCorrect ? '#FEF3C7' : '#E2E8F0',
      });
      label.setOrigin(0.5);
      matContainer.add(label);

      // Make draggable with centered hitArea
      const hitArea = new Phaser.Geom.Rectangle(-65, -55, 130, 110);
      matContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, true);
      this.input.setDraggable(matContainer);

      const matPiece: DragMaterial = {
        container: matContainer,
        id: cfg.id,
        isCorrect: cfg.isCorrect,
        origX: cfg.x,
        origY: cfg.y,
        isPlaced: false,
      };
      this.stage1Materials.push(matPiece);
      this.stage1Container?.add(matContainer);

      matContainer.on('dragstart', () => {
        if (matPiece.isPlaced) return;
        matContainer.setDepth(35);
        SoundFx.playStoneDrag();
        this.tweens.add({
          targets: matContainer,
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 100,
        });
      });

      matContainer.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        if (matPiece.isPlaced) return;
        matContainer.x = dragX;
        matContainer.y = dragY;
      });

      matContainer.on('dragend', () => {
        if (matPiece.isPlaced) return;
        const dist = Phaser.Math.Distance.Between(matContainer.x, matContainer.y, 960, 530);
        if (dist <= 180) {
          this.handleStage1Drop(matPiece);
        } else {
          SoundFx.playSandSlide();
          this.tweens.add({
            targets: matContainer,
            x: matPiece.origX,
            y: matPiece.origY,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 250,
            ease: 'Back.easeOut',
            onComplete: () => matContainer.setDepth(20),
          });
        }
      });
    });
  }

  private handleStage1Drop(mat: DragMaterial): void {
    if (!mat.isCorrect) {
      // Gentle helpful feedback for distractors without penalizing
      this.totalErrors++;
      SoundFx.playSandSlide();
      this.cameras.main.shake(70, 0.002);

      this.tweens.add({
        targets: mat.container,
        x: mat.origX,
        y: mat.origY,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 320,
        ease: 'Back.easeOut',
        onComplete: () => mat.container.setDepth(20),
      });

      if (mat.id === 'stone') {
        this.pusula?.setMessage('Taş erimez çırak! Bize demir cevheri ve yakıt lazım.');
      } else {
        this.pusula?.setMessage('Bakır bu devrin ana metali değil; kızıl demir cevherini seç.');
      }
      return;
    }

    // Valid Material Placed
    mat.isPlaced = true;
    mat.container.disableInteractive();

    SoundFx.playBellowsBlow();
    SoundFx.playSuccessTone();
    this.createHearthSparks(960, 530, 28);

    // Suck smoothly into forge opening
    this.tweens.add({
      targets: mat.container,
      x: 960,
      y: 530,
      scaleX: 0.1,
      scaleY: 0.1,
      alpha: 0,
      duration: 250,
      ease: 'Quad.easeIn',
      onComplete: () => {
        mat.container.setVisible(false);
      },
    });

    this.fedMaterialsCount++;
    if (this.counterText) {
      this.counterText.setText(`İLERLEME: ${this.fedMaterialsCount}/2`);
    }

    if (this.fedMaterialsCount === 1) {
      this.pusula?.setMessage('Demir cevheri ateşe girdi! Şimdi yüksek ısı için kömürü ekle.');
    } else if (this.fedMaterialsCount === 2) {
      this.pusula?.setMessage('Meşe kömürü ateşi harladı! Şimdi ocağın hava akışını yönetelim.');

      this.time.delayedCall(850, () => {
        this.transitionToStage(2);
      });
    }
  }

  // ==========================================
  // AŞAMA 2: OCAĞI YÖNET (FİZİKSEL AHŞAP & DERİ KÖRÜK, DİNAMİK ATEŞ & AKKOR METAL)
  // ==========================================
  private setupStage2(): void {
    this.currentStage = 2;
    this.currentHeat = 24;
    this.heatingProgress = 0;
    this.stage2Active = true;
    this.bellowsAngle = 26;
    this.bellowsHandleY = 520;
    this.bellowsMinY = 440;
    this.bellowsMaxY = 620;
    this.isHandleDragging = false;
    this.airWisps = [];
    this.smokeWisps = [];
    this.needleSmoothedAngle = 180 + (this.currentHeat / 100) * 180;

    if (this.phaseTitleText) this.phaseTitleText.setText('BÖLÜM 2 / 6');
    if (this.objectiveText) this.objectiveText.setText('GÖREV: Ahşap Körük Kolunu Pompalayarak Ocağı Tavında Tut');
    if (this.counterText) this.counterText.setText('TAVLANMA: %0');

    this.stage2Container = this.add.container(0, 0);
    this.stage2Container.setDepth(10);

    // 1. Workshop Atmospheric Background Details (Hanging banner, tool bucket, foreground anvil)
    this.createWorkshopAtmosphere();

    // 2. Hearth Embers Bed & Hot Coals (Centered directly on furnace arch coal bed at X: 960, Y: 525)
    this.hearthEmbersGraphics = this.add.graphics();
    this.hearthEmbersGraphics.setDepth(11);
    this.hearthEmbersGraphics.setBlendMode(Phaser.BlendModes.ADD);
    this.stage2Container.add(this.hearthEmbersGraphics);

    // 3. Dynamic Flame Graphics (Undulating sine waves rising from Y: 525)
    this.hearthFireGraphics = this.add.graphics();
    this.hearthFireGraphics.setDepth(12);
    this.hearthFireGraphics.setBlendMode(Phaser.BlendModes.ADD);
    this.stage2Container.add(this.hearthFireGraphics);

    // 4. Blacksmith Tongs (Holding the billet from the left into the coals)
    const tongsGraphics = this.add.graphics();
    tongsGraphics.setDepth(13);
    // Dark wrought iron tongs handles converging from left to forge center
    tongsGraphics.lineStyle(7, 0x1f242d, 1);
    tongsGraphics.lineBetween(730, 560, 880, 520);
    tongsGraphics.lineBetween(720, 580, 880, 524);
    // Hinge rivet
    tongsGraphics.fillStyle(0x475569, 1);
    tongsGraphics.fillCircle(880, 522, 5);
    // Clamp jaws holding the billet
    tongsGraphics.lineStyle(5.5, 0x334155, 1);
    tongsGraphics.lineBetween(880, 520, 914, 514);
    tongsGraphics.lineBetween(880, 524, 914, 526);
    this.stage2Container.add(tongsGraphics);

    // 5. Heated Iron Billet Glowing Aura & Body (Centered at X: 960, Y: 520)
    this.hearthBilletAura = this.add.graphics();
    this.hearthBilletAura.setDepth(13);
    this.hearthBilletAura.setBlendMode(Phaser.BlendModes.ADD);
    this.stage2Container.add(this.hearthBilletAura);

    this.hearthBilletGraphics = this.add.graphics();
    this.hearthBilletGraphics.setDepth(14);
    this.stage2Container.add(this.hearthBilletGraphics);

    // 6. Physical Blacksmith Bellows Structure (Right of Hearth)
    // A) Stationary Support Timber & Base Frame
    const bellowsBaseFrame = this.add.graphics();
    bellowsBaseFrame.setDepth(11);
    // Dark heavy timber support post resting on forge masonry ledge
    bellowsBaseFrame.fillStyle(0x1a0f07, 0.95);
    bellowsBaseFrame.fillRoundedRect(1440, 540, 30, 150, 6);
    bellowsBaseFrame.fillRoundedRect(1495, 550, 26, 140, 6);
    // Cross brace
    bellowsBaseFrame.lineStyle(7, 0x27140a, 1);
    bellowsBaseFrame.lineBetween(1425, 650, 1530, 650);
    bellowsBaseFrame.lineBetween(1440, 650, 1500, 580);
    // Wrought iron bolts
    bellowsBaseFrame.fillStyle(0x0f172a, 1);
    bellowsBaseFrame.fillCircle(1455, 560, 4);
    bellowsBaseFrame.fillCircle(1455, 640, 4);
    bellowsBaseFrame.fillCircle(1508, 640, 4);
    this.stage2Container.add(bellowsBaseFrame);

    // B) Iron Blast Tuyere / Nozzle Pipe (Directing air from 1220 into coals at 1055, Y: 520)
    const nozzlePipe = this.add.graphics();
    nozzlePipe.setDepth(13);
    // Cast iron pipe body
    nozzlePipe.fillStyle(0x1e2229, 1);
    nozzlePipe.beginPath();
    nozzlePipe.moveTo(1220, 514);
    nozzlePipe.lineTo(1055, 516);
    nozzlePipe.lineTo(1055, 526);
    nozzlePipe.lineTo(1220, 528);
    nozzlePipe.closePath();
    nozzlePipe.fillPath();
    // Copper reinforcement nozzle tip
    nozzlePipe.fillStyle(0xb45309, 1);
    nozzlePipe.fillRect(1050, 515, 12, 13);
    nozzlePipe.lineStyle(2, 0xd97706, 0.9);
    nozzlePipe.strokeRect(1050, 515, 12, 13);
    // Hearth opening iron mounting collar
    nozzlePipe.fillStyle(0x334155, 1);
    nozzlePipe.fillRoundedRect(1212, 508, 14, 28, 4);
    this.stage2Container.add(nozzlePipe);

    // C) Fixed Lower Board of the Bellows
    const lowerBoard = this.add.graphics();
    lowerBoard.setDepth(12);
    lowerBoard.fillStyle(0x2e180d, 1);
    lowerBoard.beginPath();
    lowerBoard.moveTo(1220, 520);
    lowerBoard.lineTo(1475, 555);
    lowerBoard.lineTo(1470, 570);
    lowerBoard.lineTo(1215, 528);
    lowerBoard.closePath();
    lowerBoard.fillPath();
    // Iron banding on lower board
    lowerBoard.lineStyle(3, 0x1e293b, 1);
    lowerBoard.lineBetween(1330, 536, 1327, 550);
    lowerBoard.lineBetween(1420, 550, 1417, 564);
    this.stage2Container.add(lowerBoard);

    // D) Dynamic Leather Accordion Body & Movable Upper Board Graphics
    this.bellowsLeatherGraphics = this.add.graphics();
    this.bellowsLeatherGraphics.setDepth(14);
    this.stage2Container.add(this.bellowsLeatherGraphics);

    // E) Articulated Wooden Pump Arm
    this.bellowsArmGraphics = this.add.graphics();
    this.bellowsArmGraphics.setDepth(16);
    this.stage2Container.add(this.bellowsArmGraphics);

    // F) Pump Control Housing Column at X: 1540
    const pumpHousing = this.add.graphics();
    pumpHousing.setDepth(18);
    // Dark timber upright post
    pumpHousing.fillStyle(0x180d05, 0.96);
    pumpHousing.fillRoundedRect(1505, 370, 70, 290, 10);
    pumpHousing.lineStyle(2, 0xd97706, 0.9);
    pumpHousing.strokeRoundedRect(1505, 370, 70, 290, 10);

    // Internal mechanical slot guide
    pumpHousing.fillStyle(0x0a0502, 1);
    pumpHousing.fillRoundedRect(1534, 430, 12, 180, 6);
    pumpHousing.lineStyle(1.5, 0x451a03, 0.85);
    pumpHousing.strokeRoundedRect(1534, 430, 12, 180, 6);

    // Corner iron studs
    pumpHousing.fillStyle(0x0f172a, 1);
    pumpHousing.fillCircle(1515, 380, 3.5);
    pumpHousing.fillCircle(1565, 380, 3.5);
    pumpHousing.fillCircle(1515, 650, 3.5);
    pumpHousing.fillCircle(1565, 650, 3.5);
    this.stage2Container.add(pumpHousing);

    // Column Header Label
    const pumpTitle = this.createText(1540, 395, 'KÖRÜK KOLU', {
      fontSize: '12px',
      fontStyle: '900',
      color: '#FDE68A',
      letterSpacing: 1,
    });
    pumpTitle.setOrigin(0.5);
    pumpTitle.setDepth(19);
    this.stage2Container.add(pumpTitle);

    // Up Arrow ▲ (Pulsing amber glow)
    const upArrow = this.createText(1540, 422, '▲', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#F59E0B',
    });
    upArrow.setOrigin(0.5);
    upArrow.setDepth(19);
    this.stage2Container.add(upArrow);

    this.tweens.add({
      targets: upArrow,
      y: 418,
      alpha: { from: 0.6, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Down Arrow ▼ (Pulsing amber glow)
    const downArrow = this.createText(1540, 622, '▼', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#F59E0B',
    });
    downArrow.setOrigin(0.5);
    downArrow.setDepth(19);
    this.stage2Container.add(downArrow);

    this.tweens.add({
      targets: downArrow,
      y: 626,
      alpha: { from: 0.6, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // G) Draggable Carved Oak Handle at X: 1540
    this.bellowsLeverHandle = this.add.container(1540, this.bellowsHandleY);
    this.bellowsLeverHandle.setSize(96, 120);
    this.bellowsLeverHandle.setDepth(25);

    // Handle Grip graphics (Polished oak with brass pommels and leather wrapping)
    const handleVisual = this.add.graphics();
    // Oak handle vertical post
    handleVisual.fillStyle(0x451a03, 1);
    handleVisual.fillRoundedRect(-14, -45, 28, 90, 8);
    handleVisual.lineStyle(2, 0xd97706, 0.9);
    handleVisual.strokeRoundedRect(-14, -45, 28, 90, 8);
    // Leather center wrap
    handleVisual.fillStyle(0x78350f, 1);
    handleVisual.fillRoundedRect(-16, -22, 32, 44, 4);
    handleVisual.lineStyle(1.5, 0x1c1917, 0.8);
    handleVisual.lineBetween(-15, -12, 15, -12);
    handleVisual.lineBetween(-15, 0, 15, 0);
    handleVisual.lineBetween(-15, 12, 15, 12);
    // Brass top and bottom spherical pommels
    handleVisual.fillStyle(0xf59e0b, 1);
    handleVisual.fillCircle(0, -45, 10);
    handleVisual.fillCircle(0, 45, 10);
    handleVisual.lineStyle(1.5, 0xfef08a, 1);
    handleVisual.strokeCircle(0, -45, 10);
    handleVisual.strokeCircle(0, 45, 10);
    this.bellowsLeverHandle.add(handleVisual);

    // Grip Hint Badge
    const hintBadge = this.createText(0, 62, 'POMPALA\n[ BAS / ÇEK ]', {
      fontSize: '11px',
      fontStyle: '900',
      color: '#FEF3C7',
      align: 'center',
    });
    hintBadge.setOrigin(0.5);
    this.bellowsLeverHandle.add(hintBadge);

    // Draggable & Click Interaction
    const handleHitArea = new Phaser.Geom.Rectangle(-48, -55, 96, 130);
    this.bellowsLeverHandle.setInteractive(handleHitArea, Phaser.Geom.Rectangle.Contains, true);
    this.input.setDraggable(this.bellowsLeverHandle);

    // Instant tactile pump on touch/click
    this.bellowsLeverHandle.on('pointerdown', () => {
      this.currentHeat = Math.min(100, this.currentHeat + 14);
      this.spawnAirBlastWisps(1.4);
      SoundFx.playBellowsPump(1.2);
      SoundFx.playFireRoar(this.currentHeat);
      this.createHearthSparks(960, 520, 12);
      this.cameras.main.shake(60, 0.001);

      // Quick visual compression bounce
      this.tweens.add({
        targets: this,
        bellowsHandleY: Math.min(this.bellowsMaxY, this.bellowsHandleY + 22),
        duration: 75,
        yoyo: true,
        ease: 'Quad.easeOut',
        onUpdate: () => {
          if (this.bellowsLeverHandle) this.bellowsLeverHandle.y = this.bellowsHandleY;
        },
      });
    });

    this.bellowsLeverHandle.on('dragstart', () => {
      this.isHandleDragging = true;
      this.tweens.killTweensOf(this.bellowsLeverHandle!);
    });

    this.bellowsLeverHandle.on('drag', (_pointer: Phaser.Input.Pointer, _dragX: number, dragY: number) => {
      const clampedY = Phaser.Math.Clamp(dragY, this.bellowsMinY, this.bellowsMaxY);
      const dy = clampedY - this.bellowsHandleY;
      this.bellowsHandleY = clampedY;
      this.bellowsLeverHandle!.y = clampedY;

      // Downward compression pump stroke (pushing air out!)
      if (dy > 1.8) {
        const pumpSpeed = dy / 10;
        const heatBoost = Math.min(18, dy * 0.95);
        this.currentHeat = Math.min(100, this.currentHeat + heatBoost);

        // Emit air wisps from tuyere nozzle into coals
        this.spawnAirBlastWisps(pumpSpeed);

        const now = this.time.now;
        if (now - this.lastBellowsSoundTime > 260) {
          this.lastBellowsSoundTime = now;
          SoundFx.playBellowsPump(Math.min(1.8, 0.7 + pumpSpeed * 0.4));
          SoundFx.playFireRoar(this.currentHeat);
          this.createHearthSparks(960, 520, Math.floor(4 + pumpSpeed * 5));

          // Subtle tactile camera punch on firm pumps
          if (dy > 6) {
            this.cameras.main.shake(60, 0.001);
          }
        }
      }
    });

    this.bellowsLeverHandle.on('dragend', () => {
      this.isHandleDragging = false;
      // Spring gently back toward natural relaxed breathing position
      this.tweens.add({
        targets: this,
        bellowsHandleY: 520,
        duration: 400,
        ease: 'Quad.easeOut',
        onUpdate: () => {
          if (this.bellowsLeverHandle) {
            this.bellowsLeverHandle.y = this.bellowsHandleY;
          }
        },
      });
    });

    this.stage2Container.add(this.bellowsLeverHandle);

    // 7. Master Hearth Heat & Tempering Panel (Bottom Center: X: 960, Y: 785)
    this.createMasterHearthPanel(960, 785);

    // Initial draw of physical bellows
    this.drawBellowsVisuals();
  }

  /**
   * Workshop environmental details: Hanging banner on left, tool bucket, and foreground anvil block.
   */
  private createWorkshopAtmosphere(): void {
    if (!this.stage2Container) return;

    const decorGraphics = this.add.graphics();
    decorGraphics.setDepth(10);

    // 1. Hanging Medieval Blacksmith Banner (Left wall: X: 200, Y: 260)
    // Dark wrought iron rod with spear finials
    decorGraphics.fillStyle(0x0f172a, 1);
    decorGraphics.fillRect(125, 168, 150, 6);
    decorGraphics.fillStyle(0xd97706, 1);
    decorGraphics.fillTriangle(120, 171, 128, 163, 128, 179);
    decorGraphics.fillTriangle(280, 171, 272, 163, 272, 179);

    // Crimson damask banner pennant with swallowtail bottom
    decorGraphics.fillStyle(0x7f1d1d, 0.95);
    decorGraphics.beginPath();
    decorGraphics.moveTo(135, 174);
    decorGraphics.lineTo(265, 174);
    decorGraphics.lineTo(265, 345);
    decorGraphics.lineTo(200, 315);
    decorGraphics.lineTo(135, 345);
    decorGraphics.closePath();
    decorGraphics.fillPath();

    // Antique gold border trim
    decorGraphics.lineStyle(2, 0xd97706, 0.9);
    decorGraphics.beginPath();
    decorGraphics.moveTo(139, 178);
    decorGraphics.lineTo(261, 178);
    decorGraphics.lineTo(261, 335);
    decorGraphics.lineTo(200, 308);
    decorGraphics.lineTo(139, 335);
    decorGraphics.closePath();
    decorGraphics.strokePath();

    // Anvil & Hammer Emblem on Banner
    decorGraphics.fillStyle(0xf59e0b, 1);
    // Anvil silhouette
    decorGraphics.beginPath();
    decorGraphics.moveTo(182, 238);
    decorGraphics.lineTo(218, 238);
    decorGraphics.lineTo(214, 245);
    decorGraphics.lineTo(206, 252);
    decorGraphics.lineTo(212, 260);
    decorGraphics.lineTo(188, 260);
    decorGraphics.lineTo(194, 252);
    decorGraphics.lineTo(186, 245);
    decorGraphics.closePath();
    decorGraphics.fillPath();

    // Banner Text Ribbon
    const bannerTopText = this.createText(200, 202, 'ATEŞLE ŞEKİLLENEN', {
      fontSize: '11px',
      fontStyle: '900',
      color: '#FEF3C7',
      letterSpacing: 1,
    });
    bannerTopText.setOrigin(0.5);

    const bannerSubText = this.createText(200, 282, 'GELECEK', {
      fontSize: '13px',
      fontStyle: '900',
      color: '#FDE68A',
      letterSpacing: 2,
    });
    bannerSubText.setOrigin(0.5);

    // 2. Blacksmith Tool Bucket (Left floor: X: 140, Y: 670)
    // Wood staves bucket
    decorGraphics.fillStyle(0x27140a, 1);
    decorGraphics.beginPath();
    decorGraphics.moveTo(115, 715);
    decorGraphics.lineTo(165, 715);
    decorGraphics.lineTo(160, 645);
    decorGraphics.lineTo(120, 645);
    decorGraphics.closePath();
    decorGraphics.fillPath();
    // Iron banding on bucket
    decorGraphics.lineStyle(3, 0x0f172a, 1);
    decorGraphics.lineBetween(118, 660, 162, 660);
    decorGraphics.lineBetween(116, 695, 164, 695);
    // Protruding tongs and punch tools
    decorGraphics.lineStyle(4, 0x475569, 1);
    decorGraphics.lineBetween(132, 648, 124, 615);
    decorGraphics.lineBetween(142, 648, 146, 610);
    decorGraphics.lineBetween(150, 648, 158, 622);

    // 3. Foreground Blacksmith Anvil & Hammer (Right side: X: 1430, Y: 845)
    // Oak stump base
    decorGraphics.fillStyle(0x1c0f08, 0.95);
    decorGraphics.fillRoundedRect(1380, 870, 110, 80, 8);
    decorGraphics.lineStyle(2, 0x0a0502, 1);
    decorGraphics.strokeRoundedRect(1380, 870, 110, 80, 8);

    // Anvil silhouette with horn and heel
    decorGraphics.fillStyle(0x1e293b, 1);
    decorGraphics.beginPath();
    decorGraphics.moveTo(1360, 850); // Horn tip
    decorGraphics.lineTo(1410, 848); // Step
    decorGraphics.lineTo(1475, 848); // Face
    decorGraphics.lineTo(1490, 852); // Heel
    decorGraphics.lineTo(1475, 866); // Waist right
    decorGraphics.lineTo(1460, 872); // Foot right
    decorGraphics.lineTo(1395, 872); // Foot left
    decorGraphics.lineTo(1385, 865); // Waist left
    decorGraphics.closePath();
    decorGraphics.fillPath();

    // Metallic highlight on anvil face
    decorGraphics.lineStyle(2, 0x64748b, 0.85);
    decorGraphics.lineBetween(1412, 849, 1474, 849);

    // Cross-peen hammer resting on anvil
    decorGraphics.lineStyle(5, 0x542d13, 1);
    decorGraphics.lineBetween(1445, 846, 1475, 810); // Wooden handle
    decorGraphics.fillStyle(0x334155, 1);
    decorGraphics.fillRoundedRect(1435, 840, 22, 12, 3); // Forged hammer head
    decorGraphics.lineStyle(1.5, 0x94a3b8, 0.9);
    decorGraphics.strokeRoundedRect(1435, 840, 22, 12, 3);

    // 4. Subtle ambient warm forge lighting flare
    const warmForgeGlow = this.add.graphics();
    warmForgeGlow.setDepth(10);
    warmForgeGlow.setBlendMode(Phaser.BlendModes.ADD);
    warmForgeGlow.fillStyle(0xd97706, 0.12);
    warmForgeGlow.fillCircle(960, 520, 260);

    this.stage2Container.add([decorGraphics, bannerTopText, bannerSubText, warmForgeGlow]);
  }

  /**
   * Master Hearth Heat & Tempering Panel (Bottom Center: X: 960, Y: 785)
   * High-contrast forged iron & antique bronze chassis with dual gauges:
   * Left: Semicircular dial for OCAK HARARETİ (SÖNÜK / İDEAL / ÇOK SICAK) with dynamic needle & flame icon.
   * Right: Circular progress ring for TAV KIVAMI with prominent bold percentage.
   */
  private createMasterHearthPanel(x: number, y: number): void {
    this.hearthGaugePanel = this.add.container(x, y);
    this.hearthGaugePanel.setDepth(20);

    const panelW = 650;
    const panelH = 180;
    const halfW = panelW / 2;
    const halfH = panelH / 2;

    const chassisGraphics = this.add.graphics();

    // 1. Cast heavy drop shadow under panel
    chassisGraphics.fillStyle(0x000000, 0.65);
    chassisGraphics.fillRoundedRect(-halfW + 4, -halfH + 8, panelW, panelH, 18);

    // 2. Heavy forged iron chassis body
    chassisGraphics.fillStyle(0x130a05, 0.96);
    chassisGraphics.fillRoundedRect(-halfW, -halfH, panelW, panelH, 18);

    // 3. Inner beveled metallic plate
    chassisGraphics.fillStyle(0x1a0f08, 0.92);
    chassisGraphics.fillRoundedRect(-halfW + 6, -halfH + 6, panelW - 12, panelH - 12, 14);

    // 4. Antique bronze borders
    chassisGraphics.lineStyle(2.5, 0xd97706, 0.95);
    chassisGraphics.strokeRoundedRect(-halfW, -halfH, panelW, panelH, 18);
    chassisGraphics.lineStyle(1, 0x92400e, 0.6);
    chassisGraphics.strokeRoundedRect(-halfW + 5, -halfH + 5, panelW - 10, panelH - 10, 13);

    // 5. Heavy forged brass rivets in 4 corners
    const cornerOffsets = [
      { rx: -halfW + 16, ry: -halfH + 16 },
      { rx: halfW - 16, ry: -halfH + 16 },
      { rx: -halfW + 16, ry: halfH - 16 },
      { rx: halfW - 16, ry: halfH - 16 },
    ];
    cornerOffsets.forEach(({ rx, ry }) => {
      chassisGraphics.fillStyle(0x1c1917, 0.8);
      chassisGraphics.fillCircle(rx + 1, ry + 1, 5);
      chassisGraphics.fillStyle(0xd97706, 1);
      chassisGraphics.fillCircle(rx, ry, 4.5);
      chassisGraphics.fillStyle(0xfef08a, 0.9);
      chassisGraphics.fillCircle(rx - 1, ry - 1, 2);
    });

    // 6. Center vertical divider bar
    chassisGraphics.lineStyle(2, 0x0c0603, 1);
    chassisGraphics.lineBetween(-1, -halfH + 12, -1, halfH - 12);
    chassisGraphics.lineStyle(2, 0xd97706, 0.8);
    chassisGraphics.lineBetween(1, -halfH + 12, 1, halfH - 12);
    // Center decorative stud
    chassisGraphics.fillStyle(0xd97706, 1);
    chassisGraphics.fillCircle(0, 0, 4);

    // ============================================
    // LEFT SECTION: OCAK HARARETİ (Local Center: X: -162, Y: 0)
    // ============================================
    const leftCenterX = -162;

    // Header Title
    const heatTitle = this.createText(leftCenterX, -halfH + 20, 'OCAK HARARETİ', {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FDE68A',
      letterSpacing: 1.5,
    });
    heatTitle.setOrigin(0.5);

    // Gauge Track static visuals
    const gaugeDialY = 16;
    const gaugeRadius = 58;

    // Gauge dark track groove (180 deg to 360 deg)
    chassisGraphics.lineStyle(12, 0x1e293b, 0.85);
    chassisGraphics.beginPath();
    chassisGraphics.arc(leftCenterX, gaugeDialY, gaugeRadius, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
    chassisGraphics.strokePath();

    // SÖNÜK Zone: 180° to 235° (Cold Slate/Cyan)
    chassisGraphics.lineStyle(9, 0x38bdf8, 0.9);
    chassisGraphics.beginPath();
    chassisGraphics.arc(leftCenterX, gaugeDialY, gaugeRadius, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(235), false);
    chassisGraphics.strokePath();

    // İDEAL Zone: 235° to 315° (Warm Amber Gold with glow)
    chassisGraphics.lineStyle(11, 0xf59e0b, 1);
    chassisGraphics.beginPath();
    chassisGraphics.arc(leftCenterX, gaugeDialY, gaugeRadius, Phaser.Math.DegToRad(235), Phaser.Math.DegToRad(315), false);
    chassisGraphics.strokePath();

    // Ideal Zone soft highlight glow
    chassisGraphics.lineStyle(4, 0xfef08a, 0.7);
    chassisGraphics.beginPath();
    chassisGraphics.arc(leftCenterX, gaugeDialY, gaugeRadius, Phaser.Math.DegToRad(245), Phaser.Math.DegToRad(305), false);
    chassisGraphics.strokePath();

    // ÇOK SICAK Zone: 315° to 360° (Crimson Red)
    chassisGraphics.lineStyle(9, 0xef4444, 0.9);
    chassisGraphics.beginPath();
    chassisGraphics.arc(leftCenterX, gaugeDialY, gaugeRadius, Phaser.Math.DegToRad(315), Phaser.Math.DegToRad(360), false);
    chassisGraphics.strokePath();

    // Tick Dividers
    chassisGraphics.lineStyle(2, 0xffffff, 0.8);
    [235, 315].forEach((deg) => {
      const rad = Phaser.Math.DegToRad(deg);
      const x1 = leftCenterX + Math.cos(rad) * (gaugeRadius - 8);
      const y1 = gaugeDialY + Math.sin(rad) * (gaugeRadius - 8);
      const x2 = leftCenterX + Math.cos(rad) * (gaugeRadius + 8);
      const y2 = gaugeDialY + Math.sin(rad) * (gaugeRadius + 8);
      chassisGraphics.lineBetween(x1, y1, x2, y2);
    });

    // Stylized Flame Icon in Ideal Zone
    chassisGraphics.fillStyle(0xf97316, 0.95);
    chassisGraphics.beginPath();
    chassisGraphics.moveTo(leftCenterX - 6, gaugeDialY - 26);
    chassisGraphics.lineTo(leftCenterX, gaugeDialY - 40);
    chassisGraphics.lineTo(leftCenterX + 6, gaugeDialY - 26);
    chassisGraphics.closePath();
    chassisGraphics.fillPath();
    chassisGraphics.fillStyle(0xfef08a, 1);
    chassisGraphics.fillCircle(leftCenterX, gaugeDialY - 27, 3.5);

    // Pivot Boss
    chassisGraphics.fillStyle(0x0f172a, 1);
    chassisGraphics.fillCircle(leftCenterX, gaugeDialY, 6.5);
    chassisGraphics.fillStyle(0xd97706, 1);
    chassisGraphics.fillCircle(leftCenterX, gaugeDialY, 4.5);

    // Labels under gauge
    const sonukLabel = this.createText(leftCenterX - 68, gaugeDialY + 36, 'SÖNÜK', {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#94A3B8',
    });
    sonukLabel.setOrigin(0.5);

    const idealLabel = this.createText(leftCenterX, gaugeDialY + 36, 'İDEAL', {
      fontSize: '12px',
      fontStyle: '900',
      color: '#FDE68A',
    });
    idealLabel.setOrigin(0.5);

    const sicakLabel = this.createText(leftCenterX + 68, gaugeDialY + 36, 'ÇOK SICAK', {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#F87171',
    });
    sicakLabel.setOrigin(0.5);

    this.hearthStatusText = this.createText(leftCenterX, gaugeDialY + 56, '● SÖNÜK ●', {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#94A3B8',
    });
    this.hearthStatusText.setOrigin(0.5);

    // Dynamic Needle Graphics (drawn inside hearthGaugePanel)
    this.hearthPyrometerNeedle = this.add.graphics();

    // ============================================
    // RIGHT SECTION: TAV KIVAMI (Local Center: X: 162, Y: 0)
    // ============================================
    const rightCenterX = 162;

    // Header Title
    const tavTitle = this.createText(rightCenterX, -halfH + 20, 'TAV KIVAMI', {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#CBD5E1',
      letterSpacing: 1.5,
    });
    tavTitle.setOrigin(0.5);

    // Ring Center
    const ringCenterY = 8;
    const ringRadius = 45;

    // Static groove for progress ring
    chassisGraphics.lineStyle(10, 0x1e293b, 0.9);
    chassisGraphics.strokeCircle(rightCenterX, ringCenterY, ringRadius);

    // Dynamic Progress Ring Graphics
    this.hearthProgressRing = this.add.graphics();

    // Dynamic Progress Percentage Text
    this.hearthProgressLabel = this.createText(rightCenterX, ringCenterY, '%0', {
      fontSize: '32px',
      fontStyle: '900',
      color: '#F59E0B',
    });
    this.hearthProgressLabel.setOrigin(0.5);

    const tavHintLabel = this.createText(rightCenterX, ringCenterY + 62, 'HEDEF: %100 AKKOR TAV', {
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#94A3B8',
    });
    tavHintLabel.setOrigin(0.5);

    this.hearthGaugePanel.add([
      chassisGraphics,
      heatTitle,
      sonukLabel,
      idealLabel,
      sicakLabel,
      this.hearthStatusText,
      this.hearthPyrometerNeedle,
      tavTitle,
      this.hearthProgressRing,
      this.hearthProgressLabel,
      tavHintLabel,
    ]);

    this.stage2Container?.add(this.hearthGaugePanel);
  }

  /**
   * Dynamically draws the leather accordion pleats and upper wooden board based on handle position
   */
  private drawBellowsVisuals(): void {
    if (!this.bellowsLeatherGraphics || !this.bellowsArmGraphics) return;

    this.bellowsLeatherGraphics.clear();
    this.bellowsArmGraphics.clear();

    // Invert: higher Y (handle pulled down) means lower bellows angle (compressed)
    const ratio = (this.bellowsHandleY - this.bellowsMinY) / (this.bellowsMaxY - this.bellowsMinY);
    this.bellowsAngle = 28 - ratio * 22; // 28 deg (open) down to 6 deg (closed)

    const hingeX = 1220;
    const hingeY = 518;
    const bellowsLength = 250;
    const angleRad = Phaser.Math.DegToRad(this.bellowsAngle);

    // Upper board endpoint
    const topEndX = hingeX + Math.cos(-angleRad) * bellowsLength;
    const topEndY = hingeY + Math.sin(-angleRad) * bellowsLength;

    // Fixed lower board endpoint
    const botEndX = 1475;
    const botEndY = 555;

    // 1. Draw Folded Leather Accordion Body (7 Pleats)
    const pleats = 7;
    const upperPoints: Phaser.Math.Vector2[] = [];
    const lowerPoints: Phaser.Math.Vector2[] = [];

    for (let i = 0; i <= pleats; i++) {
      const t = i / pleats;
      const ux = Phaser.Math.Linear(hingeX + 15, topEndX, t);
      const uy = Phaser.Math.Linear(hingeY - 2, topEndY, t);
      const lx = Phaser.Math.Linear(hingeX + 15, botEndX, t);
      const ly = Phaser.Math.Linear(hingeY + 5, botEndY, t);

      upperPoints.push(new Phaser.Math.Vector2(ux, uy));
      lowerPoints.push(new Phaser.Math.Vector2(lx, ly));
    }

    // Leather polygon fill with rich tanned cowhide tones
    this.bellowsLeatherGraphics.fillStyle(0x3e1d0d, 1);
    this.bellowsLeatherGraphics.beginPath();
    this.bellowsLeatherGraphics.moveTo(hingeX + 10, hingeY);
    for (let i = 0; i <= pleats; i++) {
      const offset = (i % 2 === 1) ? 14 * (this.bellowsAngle / 28) : -4;
      this.bellowsLeatherGraphics.lineTo(upperPoints[i].x, upperPoints[i].y - offset);
    }
    this.bellowsLeatherGraphics.lineTo(topEndX, topEndY);
    this.bellowsLeatherGraphics.lineTo(botEndX, botEndY);
    for (let i = pleats; i >= 0; i--) {
      const offset = (i % 2 === 1) ? 14 * (this.bellowsAngle / 28) : -4;
      this.bellowsLeatherGraphics.lineTo(lowerPoints[i].x, lowerPoints[i].y + offset);
    }
    this.bellowsLeatherGraphics.closePath();
    this.bellowsLeatherGraphics.fillPath();

    // Leather creases & stitch lines
    for (let i = 1; i < pleats; i++) {
      const u = upperPoints[i];
      const l = lowerPoints[i];
      this.bellowsLeatherGraphics.lineStyle(2.5, 0x1b0c05, 0.85);
      this.bellowsLeatherGraphics.lineBetween(u.x, u.y, l.x, l.y);

      // Brass studs along the seams
      this.bellowsLeatherGraphics.fillStyle(0xd97706, 0.9);
      this.bellowsLeatherGraphics.fillCircle(u.x, u.y, 2.5);
      this.bellowsLeatherGraphics.fillCircle(l.x, l.y, 2.5);
    }

    // 2. Movable Upper Wooden Board
    this.bellowsLeatherGraphics.fillStyle(0x451a03, 1);
    this.bellowsLeatherGraphics.beginPath();
    this.bellowsLeatherGraphics.moveTo(hingeX, hingeY - 4);
    this.bellowsLeatherGraphics.lineTo(topEndX, topEndY - 6);
    this.bellowsLeatherGraphics.lineTo(topEndX + 6, topEndY + 8);
    this.bellowsLeatherGraphics.lineTo(hingeX, hingeY + 8);
    this.bellowsLeatherGraphics.closePath();
    this.bellowsLeatherGraphics.fillPath();

    // Iron reinforcement band on upper board
    this.bellowsLeatherGraphics.lineStyle(3, 0x1e293b, 1);
    this.bellowsLeatherGraphics.lineBetween(
      Phaser.Math.Linear(hingeX, topEndX, 0.45),
      Phaser.Math.Linear(hingeY, topEndY, 0.45) - 5,
      Phaser.Math.Linear(hingeX, topEndX, 0.45),
      Phaser.Math.Linear(hingeY, topEndY, 0.45) + 8
    );
    this.bellowsLeatherGraphics.lineBetween(
      Phaser.Math.Linear(hingeX, topEndX, 0.82),
      Phaser.Math.Linear(hingeY, topEndY, 0.82) - 5,
      Phaser.Math.Linear(hingeX, topEndX, 0.82),
      Phaser.Math.Linear(hingeY, topEndY, 0.82) + 8
    );

    // Hinge boss at nozzle joint
    this.bellowsLeatherGraphics.fillStyle(0x0f172a, 1);
    this.bellowsLeatherGraphics.fillCircle(hingeX, hingeY, 7);
    this.bellowsLeatherGraphics.fillStyle(0xd97706, 1);
    this.bellowsLeatherGraphics.fillCircle(hingeX, hingeY, 3);

    // 3. Pump Lever Arm & Joint Link (Connecting upper board to the handle)
    const handleX = this.bellowsLeverHandle ? this.bellowsLeverHandle.x : 1540;
    const handleY = this.bellowsHandleY;

    // Lever link rod from upper board to handle
    this.bellowsArmGraphics.lineStyle(6, 0x27140a, 1);
    this.bellowsArmGraphics.lineBetween(topEndX, topEndY, handleX - 14, handleY);
    // Iron brackets
    this.bellowsArmGraphics.fillStyle(0x334155, 1);
    this.bellowsArmGraphics.fillCircle(topEndX, topEndY, 5);
    this.bellowsArmGraphics.fillCircle(handleX - 14, handleY, 5);
  }

  /**
   * Spawns rapid air streak wisps rushing from the tuyere nozzle into the hearth coals
   */
  private spawnAirBlastWisps(speedFactor = 1.0): void {
    if (!this.stage2Container) return;

    const count = Math.floor(3 + speedFactor * 3);
    for (let i = 0; i < count; i++) {
      const line = this.add.graphics();
      line.setDepth(15);
      line.setBlendMode(Phaser.BlendModes.ADD);
      this.stage2Container.add(line);

      this.airWisps.push({
        x: 1060 + Phaser.Math.Between(-10, 10),
        y: 520 + Phaser.Math.Between(-6, 6),
        vx: -Phaser.Math.Between(280, 500) * (0.8 + speedFactor * 0.4),
        vy: Phaser.Math.Between(-20, 20),
        life: 0,
        maxLife: Phaser.Math.Between(180, 280),
        alpha: 0.85,
        line,
      });
    }
  }

  /**
   * Spawns gentle translucent rising smoke from the hearth coals
   */
  private spawnSmokePuff(): void {
    if (!this.stage2Container) return;

    const smoke = this.add.circle(
      960 + Phaser.Math.Between(-50, 50),
      495 + Phaser.Math.Between(-15, 15),
      Phaser.Math.Between(14, 24),
      0x475569,
      0.22
    );
    smoke.setDepth(13);
    this.stage2Container.add(smoke);

    this.smokeWisps.push({
      x: smoke.x,
      y: smoke.y,
      vx: Phaser.Math.Between(-15, 15),
      vy: -Phaser.Math.Between(35, 75),
      alpha: 0.22,
      scale: 1.0,
      arc: smoke,
    });
  }

  /**
   * Live Forge Airflow, Heat Physics & Dynamic Heated Ingot Simulation Loop
   */
  private updateStage2Simulation(delta: number): void {
    const dt = delta / 1000;
    const now = this.time.now;

    // 1. Natural Heat Dissipation (Ocağın yavaşça soğuması)
    // Cools at roughly 10.5 heat units per second
    this.currentHeat = Math.max(8, this.currentHeat - dt * 10.5);

    // Handle spring return when not being dragged
    if (!this.isHandleDragging && this.bellowsHandleY < 520) {
      this.bellowsHandleY = Math.min(520, this.bellowsHandleY + dt * 120);
      if (this.bellowsLeverHandle) {
        this.bellowsLeverHandle.y = this.bellowsHandleY;
      }
    }

    // 2. Redraw Physical Bellows Accordion
    this.drawBellowsVisuals();

    // 3. Update Air Wisps Animation
    for (let i = this.airWisps.length - 1; i >= 0; i--) {
      const wisp = this.airWisps[i];
      wisp.life += delta;
      wisp.x += (wisp.vx * delta) / 1000;
      wisp.y += (wisp.vy * delta) / 1000;

      const progress = wisp.life / wisp.maxLife;
      wisp.alpha = Math.max(0, 0.85 * (1 - progress));

      wisp.line.clear();
      if (progress < 1) {
        wisp.line.lineStyle(2.5, 0xfef08a, wisp.alpha);
        wisp.line.lineBetween(wisp.x, wisp.y, wisp.x + 24, wisp.y);
      } else {
        wisp.line.destroy();
        this.airWisps.splice(i, 1);
      }
    }

    // 4. Update Smoke Wisps Animation
    if (Math.random() < 0.12) {
      this.spawnSmokePuff();
    }
    for (let i = this.smokeWisps.length - 1; i >= 0; i--) {
      const smk = this.smokeWisps[i];
      smk.x += (smk.vx * delta) / 1000;
      smk.y += (smk.vy * delta) / 1000;
      smk.scale += dt * 0.4;
      smk.alpha -= dt * 0.14;

      smk.arc.x = smk.x;
      smk.arc.y = smk.y;
      smk.arc.setScale(smk.scale);
      smk.arc.setAlpha(Math.max(0, smk.alpha));

      if (smk.alpha <= 0) {
        smk.arc.destroy();
        this.smokeWisps.splice(i, 1);
      }
    }

    // 5. Render Dynamic Hearth Embers Bed (Centered at X: 960, Y: 525)
    if (this.hearthEmbersGraphics) {
      this.hearthEmbersGraphics.clear();
      const heatNorm = this.currentHeat / 100;

      // Base ember glow
      const emberRadius = 110 + heatNorm * 45;
      const emberAlpha = 0.4 + heatNorm * 0.55;
      this.hearthEmbersGraphics.fillStyle(heatNorm > 0.6 ? 0xf97316 : 0xd97706, emberAlpha);
      this.hearthEmbersGraphics.fillEllipse(960, 528, emberRadius * 2, emberRadius * 0.65);

      // Charcoal stones with glowing fissures
      const stoneCoords = [
        { x: 910, y: 528, r: 28 },
        { x: 970, y: 532, r: 34 },
        { x: 1020, y: 526, r: 26 },
        { x: 880, y: 524, r: 22 },
        { x: 950, y: 520, r: 30 },
        { x: 1040, y: 530, r: 24 },
      ];

      stoneCoords.forEach((st) => {
        // Hot core
        const coreCol = heatNorm > 0.75 ? 0xfef08a : (heatNorm > 0.45 ? 0xf59e0b : 0x991b1b);
        this.hearthEmbersGraphics?.fillStyle(coreCol, 0.85);
        this.hearthEmbersGraphics?.fillCircle(st.x, st.y, st.r * 0.7);

        // Dark charcoal shell
        this.hearthEmbersGraphics?.fillStyle(0x1c0e07, 0.88);
        this.hearthEmbersGraphics?.fillCircle(st.x + 3, st.y - 2, st.r * 0.55);
      });
    }

    // 6. Render Dynamic Fire Flames (Undulating sine tongues rising from Y: 525)
    if (this.hearthFireGraphics) {
      this.hearthFireGraphics.clear();
      const heatFactor = Math.max(0.15, this.currentHeat / 100);
      const flameCount = 9;

      for (let i = 0; i < flameCount; i++) {
        const offsetRatio = i / (flameCount - 1);
        const baseX = 870 + offsetRatio * 180;
        const baseY = 525;
        const wave = Math.sin(now / 140 + i * 1.3) * 12;
        const flameHeight = (42 + wave) * (0.4 + heatFactor * 1.4);

        // Outer fiery tongue
        const tongueColor = heatFactor > 0.75 ? 0xfde047 : (heatFactor > 0.45 ? 0xf97316 : 0xdc2626);
        this.hearthFireGraphics.fillStyle(tongueColor, 0.55 + Math.sin(now / 180 + i) * 0.2);
        this.hearthFireGraphics.beginPath();
        this.hearthFireGraphics.moveTo(baseX - 16, baseY);
        this.hearthFireGraphics.lineTo(baseX + wave * 0.6, baseY - flameHeight);
        this.hearthFireGraphics.lineTo(baseX + 16, baseY);
        this.hearthFireGraphics.closePath();
        this.hearthFireGraphics.fillPath();

        // Inner incandescent core
        this.hearthFireGraphics.fillStyle(0xfef08a, 0.75);
        this.hearthFireGraphics.beginPath();
        this.hearthFireGraphics.moveTo(baseX - 8, baseY);
        this.hearthFireGraphics.lineTo(baseX + wave * 0.3, baseY - flameHeight * 0.6);
        this.hearthFireGraphics.lineTo(baseX + 8, baseY);
        this.hearthFireGraphics.closePath();
        this.hearthFireGraphics.fillPath();
      }
    }

    // 7. Render Heated Iron Billet & Dynamic Color Transition at X: 960, Y: 520
    // Colors transition: Cold (Slate #334155) -> Warm (Deep Red #991b1b) -> Ideal (Glowing Amber-Gold #f59e0b) -> Incandescent (#fef08a)
    if (this.hearthBilletGraphics && this.hearthBilletAura) {
      this.hearthBilletGraphics.clear();
      this.hearthBilletAura.clear();

      const heatRatio = Phaser.Math.Clamp(this.currentHeat / 100, 0, 1);
      const progRatio = Phaser.Math.Clamp(this.heatingProgress / 100, 0, 1);

      // Heat Aura
      const auraPulse = Math.sin(now / 160) * 8;
      const auraW = 160 + progRatio * 50 + auraPulse;
      const auraH = 68 + progRatio * 28 + auraPulse * 0.5;
      const auraColor = heatRatio > 0.75 ? 0xfde047 : (heatRatio > 0.45 ? 0xf59e0b : 0xef4444);
      const auraAlpha = 0.25 + heatRatio * 0.45 + progRatio * 0.25;

      this.hearthBilletAura.fillStyle(auraColor, auraAlpha);
      this.hearthBilletAura.fillEllipse(960, 520, auraW, auraH);

      // Billet Base Body (Beveled forged ingot: 136x44 px)
      let r = 51, g = 65, b = 85; // Initial cold slate
      if (heatRatio <= 0.45) {
        // Cold slate -> Deep Cherry Red
        const t = heatRatio / 0.45;
        r = Math.floor(Phaser.Math.Linear(51, 185, t));
        g = Math.floor(Phaser.Math.Linear(65, 28, t));
        b = Math.floor(Phaser.Math.Linear(85, 28, t));
      } else if (heatRatio <= 0.78) {
        // Deep Cherry Red -> Molten Orange/Gold
        const t = (heatRatio - 0.45) / 0.33;
        r = Math.floor(Phaser.Math.Linear(185, 245, t));
        g = Math.floor(Phaser.Math.Linear(28, 158, t));
        b = Math.floor(Phaser.Math.Linear(28, 11, t));
      } else {
        // Molten Orange -> Blinding Incandescent Yellow-White
        const t = (heatRatio - 0.78) / 0.22;
        r = Math.floor(Phaser.Math.Linear(245, 254, t));
        g = Math.floor(Phaser.Math.Linear(158, 240, t));
        b = Math.floor(Phaser.Math.Linear(11, 138, t));
      }

      const billetColor = (r << 16) | (g << 8) | b;
      this.hearthBilletGraphics.fillStyle(billetColor, 1);
      this.hearthBilletGraphics.fillRoundedRect(960 - 68, 520 - 22, 136, 44, 9);

      // Hammer facet highlight & bevel
      this.hearthBilletGraphics.lineStyle(2.5, 0xffffff, 0.45 + heatRatio * 0.5);
      this.hearthBilletGraphics.strokeRoundedRect(960 - 68, 520 - 22, 136, 44, 9);

      // Glowing core band inside the billet
      if (heatRatio > 0.35) {
        const coreAlpha = 0.5 + heatRatio * 0.5;
        this.hearthBilletGraphics.fillStyle(0xfef08a, coreAlpha);
        this.hearthBilletGraphics.fillRoundedRect(960 - 52, 520 - 11, 104, 22, 5);
      }
    }

    // 8. Evaluate Tempered Progress (İdeal Tav Bölgesi: %45 - %78)
    if (this.currentHeat >= 45 && this.currentHeat <= 78) {
      // Ideal range! Advances steadily (approx 7.5 seconds)
      this.heatingProgress += dt * 13.5;
      if (this.heatingProgress > 100) this.heatingProgress = 100;

      // Periodic ideal hum chime
      if (now - this.lastIdealHumTime > 1600) {
        this.lastIdealHumTime = now;
        SoundFx.playIdealHeatHum();
      }

      if (this.hearthStatusText) {
        this.hearthStatusText.setText('★ TAVINDA ★');
        this.hearthStatusText.setColor('#86EFAC');
      }
    } else if (this.currentHeat < 45) {
      // Cooling down
      this.heatingProgress = Math.max(0, this.heatingProgress - dt * 2.8);

      if (this.currentHeat < 28 && now - this.lastWarningSoundTime > 2600) {
        this.lastWarningSoundTime = now;
        SoundFx.playHeatWarningLow();
        this.pusula?.setMessage('Ateş zayıflıyor! Ahşap körüğü pompala, ateşe nefes ver.');
      }

      if (this.hearthStatusText) {
        this.hearthStatusText.setText('● SÖNÜK ●');
        this.hearthStatusText.setColor('#94A3B8');
      }
    } else {
      // Overheat (> 78)
      if (Math.random() < 0.2) {
        this.createHearthSparks(960, 520, 3);
      }
      if (now - this.lastSparkSoundTime > 1200) {
        this.lastSparkSoundTime = now;
        SoundFx.playSparkCrackles();
        this.pusula?.setMessage('Ateş fazla harlandı! Körüğü biraz dinlendir, demir erimesin.');
      }

      if (this.hearthStatusText) {
        this.hearthStatusText.setText('▲ AŞIRI HAR! ▲');
        this.hearthStatusText.setColor('#FCA5A5');
      }
    }

    // 9. Update Hearth Pyrometer Needle & Progress Ring (Local coordinates inside hearthGaugePanel)
    if (this.hearthPyrometerNeedle) {
      this.hearthPyrometerNeedle.clear();

      // Smooth needle angle interpolation
      const targetAngle = 180 + (this.currentHeat / 100) * 180;
      this.needleSmoothedAngle = Phaser.Math.Linear(this.needleSmoothedAngle, targetAngle, 0.15);

      const rad = Phaser.Math.DegToRad(this.needleSmoothedAngle);
      const dialX = -162;
      const dialY = 16;
      const needleLen = 48;

      const tipX = dialX + Math.cos(rad) * needleLen;
      const tipY = dialY + Math.sin(rad) * needleLen;
      const perpRad = rad + Math.PI / 2;
      const baseW = 3.5;

      // Needle shadow
      this.hearthPyrometerNeedle.fillStyle(0x000000, 0.45);
      this.hearthPyrometerNeedle.fillTriangle(
        tipX + 2, tipY + 3,
        dialX + Math.cos(perpRad) * baseW + 2, dialY + Math.sin(perpRad) * baseW + 3,
        dialX - Math.cos(perpRad) * baseW + 2, dialY - Math.sin(perpRad) * baseW + 3
      );

      // Needle body: tapered white pointer
      this.hearthPyrometerNeedle.fillStyle(0xffffff, 1);
      this.hearthPyrometerNeedle.fillTriangle(
        tipX, tipY,
        dialX + Math.cos(perpRad) * baseW, dialY + Math.sin(perpRad) * baseW,
        dialX - Math.cos(perpRad) * baseW, dialY - Math.sin(perpRad) * baseW
      );

      // Glowing ruby tip
      this.hearthPyrometerNeedle.fillStyle(0xef4444, 1);
      this.hearthPyrometerNeedle.fillCircle(tipX, tipY, 2.5);

      // Pivot cap
      this.hearthPyrometerNeedle.fillStyle(0xf59e0b, 1);
      this.hearthPyrometerNeedle.fillCircle(dialX, dialY, 4.5);
      this.hearthPyrometerNeedle.fillStyle(0x1e293b, 1);
      this.hearthPyrometerNeedle.fillCircle(dialX, dialY, 2);
    }

    if (this.hearthProgressRing) {
      this.hearthProgressRing.clear();
      const ringX = 162;
      const ringY = 8;
      const ringRadius = 45;

      const progAngle = (this.heatingProgress / 100) * 360;
      if (progAngle > 0) {
        const ringColor = this.heatingProgress >= 80 ? 0xfde047 : 0xf59e0b;
        this.hearthProgressRing.lineStyle(10, ringColor, 1);
        this.hearthProgressRing.beginPath();
        this.hearthProgressRing.arc(ringX, ringY, ringRadius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + progAngle), false);
        this.hearthProgressRing.strokePath();
      }
    }

    if (this.hearthProgressLabel) {
      this.hearthProgressLabel.setText(`%${Math.floor(this.heatingProgress)}`);
    }
    if (this.counterText) {
      this.counterText.setText(`TAVLANMA: %${Math.floor(this.heatingProgress)}`);
    }

    // 10. Goal Reached! Metal is incandescent and ready for forging!
    if (this.heatingProgress >= 100) {
      this.stage2Active = false;
      SoundFx.playSuccessTone();
      this.createHearthSparks(960, 520, 45);
      this.cameras.main.shake(120, 0.002);
      this.pusula?.setMessage('Demir akkor tavına ulaştı! Şimdi örs üzerinde dövme zamanı.');

      this.time.delayedCall(950, () => {
        this.transitionToStage(3);
      });
    }
  }

  private createHearthSparks(x: number, y: number, count = 20): void {
    for (let i = 0; i < count; i++) {
      const spark = this.add.circle(
        x + Phaser.Math.Between(-30, 30),
        y + Phaser.Math.Between(-18, 18),
        Phaser.Math.Between(2.5, 5.5),
        0xffd54f,
        1
      );
      spark.setDepth(30);

      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const speed = Phaser.Math.Between(70, 160);

      this.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(angle) * speed,
        y: spark.y + Math.sin(angle) * speed - 35,
        alpha: 0,
        scale: 0.15,
        duration: Phaser.Math.Between(350, 750),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  // ==========================================
  // AŞAMA 3: ÜRETİMİ YÖNET (ZAMANLAMALI ÇEKİÇ VURUŞU & GERÇEKÇİ ÖRS SAHNESİ)
  // ==========================================
  private setupStage3(): void {
    this.currentStage = 3;
    this.hammerStrikes = 0;
    this.stage3Active = true;
    this.isHammerStriking = false;
    this.timingOscillator = 0;
    this.needleProgress = 0.5;

    if (this.phaseTitleText) this.phaseTitleText.setText('BÖLÜM 2 / 6');
    if (this.objectiveText) this.objectiveText.setText('GÖREV: İbre Yeşil Alana Geldiğinde Ekrana Dokun ve Çekiç Vur');
    if (this.counterText) this.counterText.setText(`VURUŞ: 0/${this.targetStrikes}`);

    this.stage3Container = this.add.container(0, 0);
    this.stage3Container.setDepth(10);

    // 1. Workshop Atmospheric UI & Badges (Right Banner, Left Plaque, Strike Badge)
    this.createStage3Atmosphere();

    // 2. Premium Timing Meter Bar with Instruction Plaque at Top-Center
    this.createTimingMeterUI();

    // 3. Realistic Akkor Iron Billet on Anvil Face (X: 980, Y: 480)
    this.createAnvilWorkpiece();

    // 4. Realistic Physical Forging Hammer Tool (Right of Anvil, Poised for Strike)
    this.createRealisticHammerTool();

    // 5. Unified Screen Pointer / Click Interaction
    this.stage3PointerHandler = (pointer: Phaser.Input.Pointer) => {
      // Ignore right clicks or touches over the top-left navigation back button
      if (pointer.button !== 0) return;
      if (pointer.x < 120 && pointer.y < 90) return;
      this.handleStage3Strike();
    };
    this.input.on('pointerdown', this.stage3PointerHandler, this);

    this.pusula?.setMessage('İbre tam yeşil alana girdiğinde dokun ve çekiç vur! Doğru zamanda vur, demiri şekillendir.');
  }

  /**
   * Workshop environmental decorations: Left Plaque, Right Wall Banner, and Strike Counter Badge.
   */
  private createStage3Atmosphere(): void {
    if (!this.stage3Container) return;

    // 1. Top Right Strike Counter Badge (X: 1720, Y: 215)
    const counterBadge = this.add.container(1720, 215);
    counterBadge.setDepth(20);

    const badgeGfx = this.add.graphics();
    // Drop shadow
    badgeGfx.fillStyle(0x000000, 0.6);
    badgeGfx.fillCircle(2, 4, 46);
    // Dark cast bronze body
    badgeGfx.fillStyle(0x150b05, 0.96);
    badgeGfx.fillCircle(0, 0, 46);
    badgeGfx.lineStyle(2.5, 0xd97706, 0.95);
    badgeGfx.strokeCircle(0, 0, 46);
    badgeGfx.lineStyle(1, 0x92400e, 0.6);
    badgeGfx.strokeCircle(0, 0, 40);

    // Rivets
    [0, 90, 180, 270].forEach((deg) => {
      const rad = Phaser.Math.DegToRad(deg);
      const rx = Math.cos(rad) * 37;
      const ry = Math.sin(rad) * 37;
      badgeGfx.fillStyle(0xd97706, 1);
      badgeGfx.fillCircle(rx, ry, 2.5);
      badgeGfx.fillStyle(0xfef08a, 0.9);
      badgeGfx.fillCircle(rx - 0.7, ry - 0.7, 1);
    });
    counterBadge.add(badgeGfx);

    const badgeHeader = this.createText(0, -18, 'VURUŞ', {
      fontSize: '11px',
      fontStyle: '900',
      color: '#FDE68A',
      letterSpacing: 2,
    });
    badgeHeader.setOrigin(0.5);
    counterBadge.add(badgeHeader);

    this.strikeCounterBadgeText = this.createText(0, 10, `${this.hammerStrikes} / ${this.targetStrikes}`, {
      fontSize: '26px',
      fontStyle: '900',
      color: '#FEF3C7',
    });
    this.strikeCounterBadgeText.setOrigin(0.5);
    counterBadge.add(this.strikeCounterBadgeText);

    this.stage3Container.add(counterBadge);

    // 2. Left Side Bronze Plaque: İSABETLİ VURUŞ GÜÇLÜ ESER (X: 190, Y: 460)
    const leftPlaque = this.add.container(190, 460);
    leftPlaque.setDepth(15);

    const plaqueGfx = this.add.graphics();
    plaqueGfx.fillStyle(0x000000, 0.55);
    plaqueGfx.fillRoundedRect(-75, -50, 150, 100, 10);
    plaqueGfx.fillStyle(0x150b05, 0.94);
    plaqueGfx.fillRoundedRect(-75, -50, 150, 100, 10);
    plaqueGfx.lineStyle(2, 0xd97706, 0.9);
    plaqueGfx.strokeRoundedRect(-75, -50, 150, 100, 10);

    // Mini Anvil & Calipers Emblem
    plaqueGfx.fillStyle(0xd97706, 1);
    plaqueGfx.beginPath();
    plaqueGfx.moveTo(-16, -26);
    plaqueGfx.lineTo(16, -26);
    plaqueGfx.lineTo(12, -18);
    plaqueGfx.lineTo(6, -12);
    plaqueGfx.lineTo(10, -5);
    plaqueGfx.lineTo(-10, -5);
    plaqueGfx.lineTo(-6, -12);
    plaqueGfx.lineTo(-12, -18);
    plaqueGfx.closePath();
    plaqueGfx.fillPath();

    const plaqueText1 = this.createText(0, 12, 'İSABETLİ VURUŞ', {
      fontSize: '10px',
      fontStyle: '900',
      color: '#FEF3C7',
      letterSpacing: 1,
    });
    plaqueText1.setOrigin(0.5);

    const plaqueText2 = this.createText(0, 28, 'GÜÇLÜ ESER', {
      fontSize: '11px',
      fontStyle: '900',
      color: '#FDE68A',
      letterSpacing: 1.5,
    });
    plaqueText2.setOrigin(0.5);

    leftPlaque.add([plaqueGfx, plaqueText1, plaqueText2]);
    this.stage3Container.add(leftPlaque);

    // 3. Right Wall Hanging Banner: İŞLEYEREK GÜÇLENEN GELECEK (X: 1720, Y: 440)
    const rightBanner = this.add.container(1720, 440);
    rightBanner.setDepth(15);

    const bannerGfx = this.add.graphics();
    // Bronze rod
    bannerGfx.fillStyle(0xd97706, 1);
    bannerGfx.fillRect(-65, -85, 130, 5);
    bannerGfx.fillTriangle(-70, -82.5, -64, -88, -64, -77);
    bannerGfx.fillTriangle(70, -82.5, 64, -88, 64, -77);

    // Crimson pennant with swallowtail
    bannerGfx.fillStyle(0x7f1d1d, 0.95);
    bannerGfx.beginPath();
    bannerGfx.moveTo(-55, -80);
    bannerGfx.lineTo(55, -80);
    bannerGfx.lineTo(55, 75);
    bannerGfx.lineTo(0, 55);
    bannerGfx.lineTo(-55, 75);
    bannerGfx.closePath();
    bannerGfx.fillPath();

    // Gold trim
    bannerGfx.lineStyle(2, 0xd97706, 0.9);
    bannerGfx.beginPath();
    bannerGfx.moveTo(-51, -76);
    bannerGfx.lineTo(51, -76);
    bannerGfx.lineTo(51, 68);
    bannerGfx.lineTo(0, 48);
    bannerGfx.lineTo(-51, 68);
    bannerGfx.closePath();
    bannerGfx.strokePath();

    // Golden Anvil Crest
    bannerGfx.fillStyle(0xf59e0b, 1);
    bannerGfx.beginPath();
    bannerGfx.moveTo(-14, -50);
    bannerGfx.lineTo(14, -50);
    bannerGfx.lineTo(10, -42);
    bannerGfx.lineTo(5, -36);
    bannerGfx.lineTo(9, -30);
    bannerGfx.lineTo(-9, -30);
    bannerGfx.lineTo(-5, -36);
    bannerGfx.lineTo(-10, -42);
    bannerGfx.closePath();
    bannerGfx.fillPath();

    const bannerT1 = this.createText(0, -12, 'İŞLEYEREK', {
      fontSize: '11px',
      fontStyle: '900',
      color: '#FEF3C7',
      letterSpacing: 1.5,
    });
    bannerT1.setOrigin(0.5);

    const bannerT2 = this.createText(0, 6, 'GÜÇLENEN', {
      fontSize: '11px',
      fontStyle: '900',
      color: '#FEF3C7',
      letterSpacing: 1.5,
    });
    bannerT2.setOrigin(0.5);

    const bannerT3 = this.createText(0, 26, 'GELECEK', {
      fontSize: '12px',
      fontStyle: '900',
      color: '#FDE68A',
      letterSpacing: 2,
    });
    bannerT3.setOrigin(0.5);

    rightBanner.add([bannerGfx, bannerT1, bannerT2, bannerT3]);
    this.stage3Container.add(rightBanner);
  }

  /**
   * Premium Timing Meter Bar with Top Instruction Plaque (Matching target design reference)
   */
  private createTimingMeterUI(): void {
    if (!this.stage3Container) return;

    // 1. Top Instruction Plaque at X: 960, Y: 185
    const instructionPlaque = this.add.container(960, 185);
    instructionPlaque.setDepth(20);

    const plaqueW = 390;
    const plaqueH = 58;
    const plaqueGfx = this.add.graphics();

    // Drop shadow
    plaqueGfx.fillStyle(0x000000, 0.6);
    plaqueGfx.fillRoundedRect(-plaqueW / 2 + 3, -plaqueH / 2 + 5, plaqueW, plaqueH, 12);
    // Dark bronze plate
    plaqueGfx.fillStyle(0x130a05, 0.96);
    plaqueGfx.fillRoundedRect(-plaqueW / 2, -plaqueH / 2, plaqueW, plaqueH, 12);
    plaqueGfx.lineStyle(2, 0xd97706, 0.95);
    plaqueGfx.strokeRoundedRect(-plaqueW / 2, -plaqueH / 2, plaqueW, plaqueH, 12);

    // Anvil emblem on left side of plaque
    plaqueGfx.fillStyle(0xf59e0b, 1);
    plaqueGfx.beginPath();
    plaqueGfx.moveTo(-145, -12);
    plaqueGfx.lineTo(-115, -12);
    plaqueGfx.lineTo(-120, -5);
    plaqueGfx.lineTo(-124, 0);
    plaqueGfx.lineTo(-120, 10);
    plaqueGfx.lineTo(-140, 10);
    plaqueGfx.lineTo(-136, 0);
    plaqueGfx.lineTo(-140, -5);
    plaqueGfx.closePath();
    plaqueGfx.fillPath();
    // Hammer resting over anvil
    plaqueGfx.lineStyle(3, 0xfef08a, 1);
    plaqueGfx.lineBetween(-142, -18, -122, 2);
    plaqueGfx.fillStyle(0xffffff, 1);
    plaqueGfx.fillRect(-146, -22, 10, 6);

    const instructLine1 = this.createText(25, -10, 'İBRE YEŞİL ALANDAYKEN', {
      fontSize: '11px',
      fontStyle: '900',
      color: '#FDE68A',
      letterSpacing: 1.5,
    });
    instructLine1.setOrigin(0.5);

    const instructLine2 = this.createText(25, 12, 'DOKUN VE VUR!', {
      fontSize: '17px',
      fontStyle: '900',
      color: '#FFFFFF',
      letterSpacing: 2,
    });
    instructLine2.setOrigin(0.5);

    instructionPlaque.add([plaqueGfx, instructLine1, instructLine2]);
    this.stage3Container.add(instructionPlaque);

    // 2. Wide Horizontal Timing Meter Bar at X: 960, Y: 265
    const trackWidth = 620;
    const trackHeight = 50;
    const trackLeft = 960 - trackWidth / 2;
    const trackY = 265;

    const meterBg = this.add.graphics();
    meterBg.setDepth(20);

    // Drop shadow
    meterBg.fillStyle(0x000000, 0.65);
    meterBg.fillRoundedRect(trackLeft - 2, trackY - trackHeight / 2 + 5, trackWidth + 4, trackHeight, 14);

    // Outer dark chassis
    meterBg.fillStyle(0x130a05, 0.96);
    meterBg.fillRoundedRect(trackLeft - 4, trackY - trackHeight / 2 - 3, trackWidth + 8, trackHeight + 6, 16);
    meterBg.lineStyle(2.5, 0xd97706, 0.95);
    meterBg.strokeRoundedRect(trackLeft - 4, trackY - trackHeight / 2 - 3, trackWidth + 8, trackHeight + 6, 16);

    // Left Error Zone (0.0 to successStart: 0.40 -> width 248px)
    const leftErrorWidth = this.successStart * trackWidth;
    meterBg.fillStyle(0x7f1d1d, 0.9);
    meterBg.fillRoundedRect(trackLeft, trackY - trackHeight / 2, leftErrorWidth, trackHeight, 10);
    meterBg.lineStyle(1.5, 0xef4444, 0.8);
    meterBg.strokeRoundedRect(trackLeft + 1, trackY - trackHeight / 2 + 1, leftErrorWidth - 2, trackHeight - 2, 8);

    // Right Error Zone (successEnd: 0.60 to 1.0 -> width 248px)
    const rightErrorLeft = trackLeft + this.successEnd * trackWidth;
    const rightErrorWidth = (1.0 - this.successEnd) * trackWidth;
    meterBg.fillStyle(0x7f1d1d, 0.9);
    meterBg.fillRoundedRect(rightErrorLeft, trackY - trackHeight / 2, rightErrorWidth, trackHeight, 10);
    meterBg.lineStyle(1.5, 0xef4444, 0.8);
    meterBg.strokeRoundedRect(rightErrorLeft + 1, trackY - trackHeight / 2 + 1, rightErrorWidth - 2, trackHeight - 2, 8);

    // Center Green Success Zone (successStart: 0.40 to successEnd: 0.60 -> width 124px)
    const greenLeft = trackLeft + this.successStart * trackWidth;
    const greenWidth = (this.successEnd - this.successStart) * trackWidth;

    // Glowing vibrant emerald green
    meterBg.fillStyle(0x15803d, 0.95);
    meterBg.fillRect(greenLeft, trackY - trackHeight / 2, greenWidth, trackHeight);
    meterBg.fillStyle(0x22c55e, 0.55);
    meterBg.fillRect(greenLeft + 2, trackY - trackHeight / 2 + 2, greenWidth - 4, trackHeight - 4);
    meterBg.lineStyle(2, 0x86efac, 0.95);
    meterBg.strokeRect(greenLeft, trackY - trackHeight / 2, greenWidth, trackHeight);

    // Exact center vertical tick line (X: 960)
    meterBg.lineStyle(2.5, 0xfef08a, 0.9);
    meterBg.lineBetween(960, trackY - trackHeight / 2 + 6, 960, trackY + trackHeight / 2 - 6);

    // Boundary tick lines
    meterBg.lineStyle(2, 0xffffff, 0.7);
    meterBg.lineBetween(greenLeft, trackY - trackHeight / 2 + 4, greenLeft, trackY + trackHeight / 2 - 4);
    meterBg.lineBetween(greenLeft + greenWidth, trackY - trackHeight / 2 + 4, greenLeft + greenWidth, trackY + trackHeight / 2 - 4);

    this.stage3Container.add(meterBg);

    // 3. Dynamic Sliding Golden Needle Graphics
    this.timingSliderGraphics = this.add.graphics();
    this.timingSliderGraphics.setDepth(25);
    this.stage3Container.add(this.timingSliderGraphics);

    // 4. Floating Hit Feedback Text (Positioned at X: 960, Y: 320)
    this.hitFeedbackText = this.createText(960, 320, '', {
      fontSize: '15px',
      fontStyle: '900',
      color: '#4ADE80',
    });
    this.hitFeedbackText.setOrigin(0.5);
    this.hitFeedbackText.setDepth(26);
    this.hitFeedbackText.setAlpha(0);
    this.stage3Container.add(this.hitFeedbackText);
  }

  /**
   * Layered realistic hot iron billet resting on the anvil face (X: 980, Y: 480).
   */
  private createAnvilWorkpiece(): void {
    if (!this.stage3Container) return;

    this.anvilWorkpiece = this.add.container(980, 480);
    this.anvilWorkpiece.setDepth(14);

    // Additive heat aura around glowing billet
    const heatAura = this.add.graphics();
    heatAura.setBlendMode(Phaser.BlendModes.ADD);
    heatAura.fillStyle(0xf97316, 0.35);
    heatAura.fillEllipse(0, 0, 240, 80);
    this.anvilWorkpiece.add(heatAura);

    this.tweens.add({
      targets: heatAura,
      alpha: { from: 0.25, to: 0.5 },
      scaleX: { from: 0.95, to: 1.05 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Workpiece sprite texture
    this.workpieceSprite = this.add.image(0, 0, 'iron_glowing_ingot');
    this.workpieceSprite.setDisplaySize(200, 54);
    this.anvilWorkpiece.add(this.workpieceSprite);

    // Layered vector hot metal skin with molten core and chamfered bevels
    this.workpiecePlateGraphics = this.add.graphics();
    this.drawRealisticBilletGraphics(200, 50);
    this.anvilWorkpiece.add(this.workpiecePlateGraphics);

    this.stage3Container.add(this.anvilWorkpiece);
  }

  /**
   * Renders realistic hot metal gradients and bevel highlights for the glowing billet.
   */
  private drawRealisticBilletGraphics(width: number, height: number): void {
    if (!this.workpiecePlateGraphics) return;

    this.workpiecePlateGraphics.clear();
    const halfW = width / 2;
    const halfH = height / 2;

    // Dark cherry red cooler rim
    this.workpiecePlateGraphics.fillStyle(0x991b1b, 0.95);
    this.workpiecePlateGraphics.fillRoundedRect(-halfW, -halfH, width, height, 8);

    // Molten glowing amber body
    this.workpiecePlateGraphics.fillStyle(0xf97316, 0.92);
    this.workpiecePlateGraphics.fillRoundedRect(-halfW + 4, -halfH + 4, width - 8, height - 8, 6);

    // Incandescent gold core
    this.workpiecePlateGraphics.fillStyle(0xfef08a, 0.95);
    this.workpiecePlateGraphics.fillRoundedRect(-halfW + 12, -halfH + 8, width - 24, height - 16, 4);

    // Top specular hammer reflection
    this.workpiecePlateGraphics.lineStyle(2, 0xffffff, 0.7);
    this.workpiecePlateGraphics.lineBetween(-halfW + 8, -halfH + 3, halfW - 8, -halfH + 3);
  }

  /**
   * Realistic forging hammer container with hickory handle, leather wrap, and forged steel head.
   */
  private createRealisticHammerTool(): void {
    if (!this.stage3Container) return;

    // Pivot is located at smith's grip hand at X: 1260, Y: 510
    this.hammerContainer = this.add.container(1260, 510);
    this.hammerContainer.setDepth(28);
    this.hammerContainer.setAngle(-22); // Poised ready above anvil

    const hammerGfx = this.add.graphics();

    // 1. Hickory wooden handle extending from pivot (0, 0) to (-180, -115)
    // Dark oak / hickory base
    hammerGfx.lineStyle(16, 0x451a03, 1);
    hammerGfx.lineBetween(0, 0, -180, -115);
    // Polished grain highlight
    hammerGfx.lineStyle(6, 0x78350f, 0.9);
    hammerGfx.lineBetween(-10, -6, -175, -112);

    // 2. Leather grip wrapping near hand (0, 0)
    hammerGfx.fillStyle(0x1c1917, 1);
    hammerGfx.fillRoundedRect(-55, -36, 60, 22, 6);
    hammerGfx.lineStyle(2, 0xd97706, 0.9);
    hammerGfx.lineBetween(-40, -32, -15, -16);
    hammerGfx.lineBetween(-30, -32, -5, -16);

    // 3. Heavy forged steel cross-peen hammer head at (-180, -115)
    const headX = -180;
    const headY = -115;

    // Cross-peen wedge on back
    hammerGfx.fillStyle(0x27272a, 1);
    hammerGfx.beginPath();
    hammerGfx.moveTo(headX - 18, headY - 14);
    hammerGfx.lineTo(headX - 38, headY);
    hammerGfx.lineTo(headX - 18, headY + 14);
    hammerGfx.closePath();
    hammerGfx.fillPath();

    // Main steel block
    hammerGfx.fillStyle(0x3f3f46, 1);
    hammerGfx.fillRoundedRect(headX - 18, headY - 22, 54, 44, 5);
    hammerGfx.lineStyle(2, 0x71717a, 1);
    hammerGfx.strokeRoundedRect(headX - 18, headY - 22, 54, 44, 5);

    // Chamfered striking face (on front, which strikes the metal)
    hammerGfx.fillStyle(0xd4d4d8, 1);
    hammerGfx.fillRoundedRect(headX + 34, headY - 20, 6, 40, 2);
    // Steel eye collar and wedge
    hammerGfx.fillStyle(0x18181b, 1);
    hammerGfx.fillCircle(headX + 9, headY, 6);
    hammerGfx.fillStyle(0xd97706, 1);
    hammerGfx.fillCircle(headX + 9, headY, 2.5);

    // 4. Smith's leather work glove around grip at (0, 0)
    hammerGfx.fillStyle(0x271306, 1);
    hammerGfx.fillCircle(0, 0, 20);
    hammerGfx.fillStyle(0x3f1f0a, 1);
    hammerGfx.fillRoundedRect(-14, -14, 28, 28, 8);
    hammerGfx.lineStyle(2, 0x180d05, 0.9);
    hammerGfx.strokeCircle(0, 0, 20);

    this.hammerContainer.add(hammerGfx);
    this.stage3Container.add(this.hammerContainer);

    // Start gentle idle breathing tween
    this.restartHammerIdleTween();
  }

  private restartHammerIdleTween(): void {
    if (!this.hammerContainer) return;
    this.hammerIdleTween?.stop();

    this.hammerIdleTween = this.tweens.add({
      targets: this.hammerContainer,
      angle: { from: -24, to: -20 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Smooth continuous oscillation of the timing needle strictly within [0.0, 1.0]
   */
  private updateStage3TimingBar(delta: number): void {
    if (!this.stage3Active || !this.timingSliderGraphics) return;

    // Smooth continuous oscillation across the track
    this.timingOscillator += (delta / 1000) * this.oscillatorSpeed;
    // Exactly maps sin [-1, 1] to [0.0, 1.0]
    this.needleProgress = (Math.sin(this.timingOscillator) + 1) / 2;
    this.needleProgress = Phaser.Math.Clamp(this.needleProgress, 0.0, 1.0);

    const trackWidth = 620;
    const trackLeft = 960 - trackWidth / 2;
    const trackY = 265;
    const needleX = trackLeft + this.needleProgress * trackWidth;

    this.timingSliderGraphics.clear();

    // Needle drop shadow
    this.timingSliderGraphics.fillStyle(0x000000, 0.45);
    this.timingSliderGraphics.fillRect(needleX - 1, trackY - 32, 4, 64);

    // Glowing vertical needle beam
    this.timingSliderGraphics.lineStyle(3, 0xf59e0b, 0.85);
    this.timingSliderGraphics.lineBetween(needleX, trackY - 32, needleX, trackY + 32);
    this.timingSliderGraphics.lineStyle(1.5, 0xffffff, 1);
    this.timingSliderGraphics.lineBetween(needleX, trackY - 30, needleX, trackY + 30);

    // Top diamond arrowhead pointer (pointing down)
    this.timingSliderGraphics.fillStyle(0xfde047, 1);
    this.timingSliderGraphics.beginPath();
    this.timingSliderGraphics.moveTo(needleX, trackY - 24);
    this.timingSliderGraphics.lineTo(needleX + 7, trackY - 35);
    this.timingSliderGraphics.lineTo(needleX, trackY - 40);
    this.timingSliderGraphics.lineTo(needleX - 7, trackY - 35);
    this.timingSliderGraphics.closePath();
    this.timingSliderGraphics.fillPath();

    // Bottom diamond arrowhead pointer (pointing up)
    this.timingSliderGraphics.fillStyle(0xfde047, 1);
    this.timingSliderGraphics.beginPath();
    this.timingSliderGraphics.moveTo(needleX, trackY + 24);
    this.timingSliderGraphics.lineTo(needleX + 7, trackY + 35);
    this.timingSliderGraphics.lineTo(needleX, trackY + 40);
    this.timingSliderGraphics.lineTo(needleX - 7, trackY + 35);
    this.timingSliderGraphics.closePath();
    this.timingSliderGraphics.fillPath();
  }

  /**
   * Instant snapshot strike evaluation and physical hammer animation execution.
   */
  private handleStage3Strike(): void {
    if (!this.stage3Active || this.isHammerStriking || this.hammerStrikes >= this.targetStrikes) return;

    // IMMEDIATE VALUE SNAPSHOT at the precise touch instant!
    const strikeProgress = this.needleProgress;
    const evalResult = evaluateHammerStrike(strikeProgress, this.successStart, this.successEnd);

    // Lock input immediately to prevent double-hits
    this.isHammerStriking = true;

    // Safety timeout fallback (unlocks after 450ms if any animation fails)
    this.hammerSafetyTimer?.remove();
    this.hammerSafetyTimer = this.time.delayedCall(450, () => {
      this.isHammerStriking = false;
    });

    // Pause idle breathing tween
    this.hammerIdleTween?.stop();

    // Execute physical hammer strike animation
    if (this.hammerContainer) {
      // 1. Accelerating Downstroke (Quad.easeIn) hitting the iron bar
      this.tweens.add({
        targets: this.hammerContainer,
        angle: 14, // Lands flat against glowing iron at (980, 480)
        duration: 70,
        ease: 'Quad.easeIn',
        onComplete: () => {
          // Precise impact instant!
          if (evalResult.isSuccess) {
            this.onSuccessfulHammerStrike();
          } else {
            this.onMissedHammerStrike(evalResult.feedback);
          }

          // 2. Controlled recoil back to ready position
          this.time.delayedCall(25, () => {
            if (!this.hammerContainer) return;
            this.tweens.add({
              targets: this.hammerContainer,
              angle: -22,
              duration: 160,
              ease: 'Back.easeOut',
              onComplete: () => {
                this.isHammerStriking = false;
                this.hammerSafetyTimer?.remove();
                if (this.stage3Active) {
                  this.restartHammerIdleTween();
                }
              },
            });
          });
        },
      });
    } else {
      // Fallback if container not present
      if (evalResult.isSuccess) {
        this.onSuccessfulHammerStrike();
      } else {
        this.onMissedHammerStrike(evalResult.feedback);
      }
      this.isHammerStriking = false;
    }
  }

  private onSuccessfulHammerStrike(): void {
    this.hammerStrikes++;
    SoundFx.playAnvilHit();
    this.cameras.main.shake(100, 0.006);
    this.createAnvilSparks(980, 480);

    // Show floating feedback
    this.showHitFeedback('★ TAM İSABET! ★', '#4ADE80');

    // Flash the workpiece with incandescent white-gold
    if (this.anvilWorkpiece) {
      this.tweens.add({
        targets: this.anvilWorkpiece,
        scaleX: { from: 1.08, to: 1.0 },
        scaleY: { from: 0.92, to: 1.0 },
        duration: 120,
        ease: 'Quad.easeOut',
      });
    }

    if (this.counterText) {
      this.counterText.setText(`VURUŞ: ${this.hammerStrikes}/${this.targetStrikes}`);
    }
    if (this.strikeCounterBadgeText) {
      this.strikeCounterBadgeText.setText(`${this.hammerStrikes} / ${this.targetStrikes}`);
    }

    // Step-by-step visual deformation of the metal piece into a forged mechanical axle
    if (this.hammerStrikes === 1) {
      this.drawRealisticBilletGraphics(225, 44);
      if (this.workpieceSprite) {
        this.workpieceSprite.setDisplaySize(225, 44);
      }
      this.pusula?.setMessage('Tam isabet! Kütük yassılaştı ve uzadı.');
    } else if (this.hammerStrikes === 2) {
      this.drawRealisticBilletGraphics(255, 38);
      if (this.workpieceSprite) {
        this.workpieceSprite.setDisplaySize(255, 38);
      }
      this.pusula?.setMessage('Mükemmel vuruş! Mil formu şekilleniyor.');
    } else if (this.hammerStrikes === 3) {
      this.stage3Active = false;
      if (this.workpiecePlateGraphics) {
        this.workpiecePlateGraphics.clear();
      }
      if (this.workpieceSprite) {
        this.workpieceSprite.setTexture('sword_blade');
        this.workpieceSprite.setDisplaySize(380, 70);
      }

      // Quench hiss & steam puffs
      SoundFx.playWaterQuench();
      this.createDenseSteamClouds(980, 480);

      this.pusula?.setMessage('Usta işi! Kılıç namlusu başarıyla dövüldü ve sertleşti!');

      this.time.delayedCall(1000, () => {
        this.transitionToStage(4);
      });
    }
  }

  private onMissedHammerStrike(feedback: 'EARLY' | 'LATE' | 'PERFECT'): void {
    this.totalErrors++;
    SoundFx.playChiselStrike();
    this.cameras.main.shake(40, 0.002);
    this.createAnvilSparks(980, 480, 8); // Minor spark spray

    if (feedback === 'EARLY') {
      this.showHitFeedback('ERKEN! (Yeşili Bekle)', '#F59E0B');
      this.pusula?.setMessage('Acele etme çırak! İbre tam yeşil alana girdiğinde vur.');
    } else {
      this.showHitFeedback('GEÇ! (Daha Hızlı Ol)', '#EF4444');
      this.pusula?.setMessage('Biraz geç kaldın! İbre yeşil alandan çıkmadan vurmalısın.');
    }
  }

  private showHitFeedback(text: string, color: string): void {
    if (!this.hitFeedbackText) return;

    this.feedbackTween?.stop();
    this.hitFeedbackText.setText(text);
    this.hitFeedbackText.setColor(color);
    this.hitFeedbackText.setAlpha(1);
    this.hitFeedbackText.y = 315;

    this.feedbackTween = this.tweens.add({
      targets: this.hitFeedbackText,
      y: 305,
      alpha: 0,
      duration: 650,
      ease: 'Quad.easeOut',
    });
  }

  private createAnvilSparks(x: number, y: number, count = 35): void {
    for (let i = 0; i < count; i++) {
      const spark = this.add.circle(
        x + Phaser.Math.Between(-25, 25),
        y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(2.5, 5.5),
        Phaser.Utils.Array.GetRandom([0xfef08a, 0xf59e0b, 0xf97316, 0xffffff]),
        1
      );
      spark.setDepth(30);

      // Sparks spray diagonally outward from anvil impact
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const speed = Phaser.Math.Between(80, 180);

      this.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(angle) * speed,
        y: spark.y + Math.sin(angle) * speed - 30,
        alpha: 0,
        scale: 0.15,
        duration: Phaser.Math.Between(350, 700),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  private createDenseSteamClouds(x: number, y: number): void {
    for (let i = 0; i < 35; i++) {
      const steam = this.add.circle(
        x + Phaser.Math.Between(-50, 50),
        y + Phaser.Math.Between(-25, 25),
        Phaser.Math.Between(15, 35),
        0xf1f5f9,
        0.8
      );
      steam.setDepth(26);

      this.tweens.add({
        targets: steam,
        y: steam.y - Phaser.Math.Between(80, 200),
        x: steam.x + Phaser.Math.Between(-60, 60),
        alpha: 0,
        scale: 1.8,
        duration: Phaser.Math.Between(800, 1500),
        ease: 'Quad.easeOut',
        onComplete: () => steam.destroy(),
      });
    }
  }

  // ==========================================
  // AŞAMA 4: ESERİ TAMAMLA (OSMANLI KILICI MONTAJI)
  // ==========================================
  private setupStage4(): void {
    this.currentStage = 4;
    this.swordAssembledCount = 0;
    this.isSwordCompleted = false;
    this.swordParts = [];
    this.swordSlots = [];

    if (this.phaseTitleText) this.phaseTitleText.setText('BÖLÜM 2 / 6');
    if (this.objectiveText) this.objectiveText.setText('GÖREV: Parçaları Doğru Yuvalara Yerleştirerek Eseri Tamamla');
    if (this.counterText) this.counterText.setText('MONTAJ: 0/4');

    this.stage4Container = this.add.container(0, 0);
    this.stage4Container.setDepth(10);

    // Dedicated Top-Level Drag Layer (Depth 9999) - Always strictly rendered above all scene objects
    if (this.stage4DragLayer) {
      this.stage4DragLayer.destroy();
    }
    this.stage4DragLayer = this.add.container(0, 0);
    this.stage4DragLayer.setDepth(9999);

    // Reposition Pusula strictly to bottom-left corner with compact speech bubble (Clear of tray)
    this.pusula?.relocate(85, 915);
    this.pusula?.setCompactLayout(65, -75, 230, 80, '13px');
    this.pusula?.setMessage('Parçaları doğru yuvalarına yerleştir ve Osmanlı kılıcını tamamla!');

    // 1. Atmosphere: Warm Blacksmith Forge Hearth Ambient Glow in the background
    const forgeGlow = this.add.graphics();
    forgeGlow.fillStyle(0xd97706, 0.15);
    forgeGlow.fillCircle(250, 410, 260);
    this.stage4Container.add(forgeGlow);

    this.tweens.add({
      targets: forgeGlow,
      alpha: { from: 0.12, to: 0.24 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    // 2. Upper Header Plaque: "KILICI TAMAMLA" (Center: X: 960, Y: 135)
    const upperPlaque = this.add.graphics();
    upperPlaque.fillStyle(0x180d05, 0.94);
    upperPlaque.fillRoundedRect(960 - 290, 135 - 38, 580, 76, 12);
    upperPlaque.lineStyle(2.5, 0xd97706, 0.95);
    upperPlaque.strokeRoundedRect(960 - 290, 135 - 38, 580, 76, 12);
    upperPlaque.lineStyle(1.2, 0x854d0e, 0.6);
    upperPlaque.strokeRoundedRect(960 - 282, 135 - 30, 564, 60, 8);
    this.stage4Container.add(upperPlaque);

    // Seljuk 8-Point Star Icon on Left of Plaque
    const starIcon = this.createText(960 - 245, 135, '۞', {
      fontSize: '28px',
      color: '#FDE68A',
    });
    starIcon.setOrigin(0.5);
    this.stage4Container.add(starIcon);

    const plaqueTitle = this.createText(960 + 15, 124, 'KILICI TAMAMLA', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FEF3C7',
    });
    plaqueTitle.setOrigin(0.5);
    this.stage4Container.add(plaqueTitle);

    const plaqueSubtitle = this.createText(960 + 15, 150, 'Parçaları doğru yuvalara yerleştir ve Osmanlı kılıcını oluştur.', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FDE68A',
    });
    plaqueSubtitle.setOrigin(0.5);
    this.stage4Container.add(plaqueSubtitle);

    // 3. Left Parchment Scroll: "OSMANLI KILICI" (X: 220, Y: 335)
    this.createLeftParchmentScroll();

    // 4. Right Hanging Textile Banner (X: 1680, Y: 255)
    this.createRightHangingBanner();

    // 5. Bottom Right Parchment Note (X: 1730, Y: 840)
    this.createBottomRightParchmentNote();

    // 6. Central Master Carved Wooden Sword Display Rack / Workbench (Tezgâh / Stant)
    this.createSwordDisplayRack();

    // 7. Sword Slots on the Rack (Exact Silhouettes & Numbered Badges)
    this.createSwordSlotsOnRack();

    // 8. Bottom Carved Walnut Parts Tray & Draggable Pieces
    this.createBottomPartsTray();

    // Initial Pusula Guidance
    this.pusula?.setMessage('Parçaları doğru yuvalarına yerleştir ve Osmanlı kılıcını tamamla. Büyük ustalar detaylarda saklıdır!');
  }

  /**
   * Left Historical Educational Parchment Scroll
   */
  private createLeftParchmentScroll(): void {
    if (!this.stage4Container) return;

    const scrollContainer = this.add.container(215, 335);
    scrollContainer.setDepth(11);

    const scrollG = this.add.graphics();
    // Aged parchment body
    scrollG.fillStyle(0x0a0502, 0.4);
    scrollG.fillRoundedRect(-165, -195, 330, 395, 8); // shadow
    scrollG.fillStyle(0xead8b5, 0.98);
    scrollG.fillRoundedRect(-160, -190, 320, 380, 6);
    scrollG.lineStyle(2, 0x854d0e, 0.9);
    scrollG.strokeRoundedRect(-160, -190, 320, 380, 6);
    scrollG.lineStyle(1, 0xb45309, 0.4);
    scrollG.strokeRoundedRect(-153, -183, 306, 366, 4);

    // Rolled wooden rods with brass finials at top and bottom
    scrollG.fillStyle(0x381807, 1);
    scrollG.fillRoundedRect(-170, -200, 340, 14, 4);
    scrollG.fillRoundedRect(-170, 186, 340, 14, 4);
    scrollG.fillStyle(0xd97706, 1);
    scrollG.fillCircle(-172, -193, 7);
    scrollG.fillCircle(172, -193, 7);
    scrollG.fillCircle(-172, 193, 7);
    scrollG.fillCircle(172, 193, 7);
    scrollContainer.add(scrollG);

    const title = this.createText(0, -145, 'OSMANLI KILICI', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#2A1605',
    });
    title.setOrigin(0.5);
    scrollContainer.add(title);

    const subtitle = this.createText(0, -120, 'Zarafet ve Gücün Simgesi', {
      fontSize: '13px',
      fontStyle: 'italic',
      color: '#78350F',
    });
    subtitle.setOrigin(0.5);
    scrollContainer.add(subtitle);

    // Elegant Sword Line Drawing on Parchment
    const swordSketch = this.add.graphics();
    swordSketch.lineStyle(1.6, 0x854d0e, 0.85);
    // curved blade
    swordSketch.beginPath();
    swordSketch.moveTo(-110, -78);
    swordSketch.lineTo(-40, -72);
    swordSketch.lineTo(20, -75);
    swordSketch.lineTo(65, -82);
    swordSketch.lineTo(20, -66);
    swordSketch.lineTo(-40, -68);
    swordSketch.closePath();
    swordSketch.strokePath();
    // crossguard
    swordSketch.lineBetween(65, -94, 65, -56);
    // grip & pommel
    swordSketch.lineBetween(65, -75, 95, -75);
    swordSketch.lineTo(105, -60);
    swordSketch.strokePath();
    scrollContainer.add(swordSketch);

    // Decorative Flourish divider
    const divider = this.createText(0, -42, '— ❦ —', {
      fontSize: '14px',
      color: '#92400E',
    });
    divider.setOrigin(0.5);
    scrollContainer.add(divider);

    // Historical Educational Narrative Text
    const bodyText = this.createText(
      0,
      40,
      'Osmanlı kılıçları, ustalıkla\ndövülen demirin, estetikle\nbuluştuğu eşsiz eserlerdir.\n\nGücü korur, adaleti temsil eder.',
      {
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#3F250B',
        align: 'center',
        lineSpacing: 8,
      }
    );
    bodyText.setOrigin(0.5);
    scrollContainer.add(bodyText);

    // Bottom Seljuk seal
    const seal = this.createText(0, 150, '❖', {
      fontSize: '18px',
      color: '#B45309',
    });
    seal.setOrigin(0.5);
    scrollContainer.add(seal);

    this.stage4Container.add(scrollContainer);
  }

  /**
   * Right Hanging Banner: "GEÇMİŞİN TEKNOLOJİSİ BUGÜNÜN GELECEĞİNE İLHAM VERİR"
   */
  private createRightHangingBanner(): void {
    if (!this.stage4Container) return;

    const bannerContainer = this.add.container(1680, 255);
    bannerContainer.setDepth(11);

    const bannerG = this.add.graphics();
    // Top wooden rod and hanging string
    bannerG.lineStyle(2, 0xd97706, 0.8);
    bannerG.lineBetween(0, -180, -70, -150);
    bannerG.lineBetween(0, -180, 70, -150);
    bannerG.fillStyle(0x451a03, 1);
    bannerG.fillRoundedRect(-85, -153, 170, 10, 3);

    // Dark charcoal velvet banner body with swallowtail / inverted chevron bottom
    bannerG.fillStyle(0x131922, 0.96);
    bannerG.beginPath();
    bannerG.moveTo(-75, -145);
    bannerG.lineTo(75, -145);
    bannerG.lineTo(75, 130);
    bannerG.lineTo(0, 165);
    bannerG.lineTo(-75, 130);
    bannerG.closePath();
    bannerG.fillPath();

    bannerG.lineStyle(2.2, 0xd97706, 0.95);
    bannerG.beginPath();
    bannerG.moveTo(-75, -145);
    bannerG.lineTo(75, -145);
    bannerG.lineTo(75, 130);
    bannerG.lineTo(0, 165);
    bannerG.lineTo(-75, 130);
    bannerG.closePath();
    bannerG.strokePath();

    // Bottom gold tassels
    bannerG.fillStyle(0xfde047, 1);
    bannerG.fillCircle(0, 170, 4);
    bannerG.lineStyle(2, 0xfde047, 0.9);
    bannerG.lineBetween(0, 170, 0, 185);
    bannerContainer.add(bannerG);

    // Seljuk star at top of banner
    const topStar = this.createText(0, -105, '۞', {
      fontSize: '26px',
      color: '#FDE68A',
    });
    topStar.setOrigin(0.5);
    bannerContainer.add(topStar);

    // Gold embossed text
    const bannerText = this.createText(
      0,
      15,
      'GEÇMİŞİN\nTEKNOLOJİSİ\nBUGÜNÜN\nGELECEĞİNE\nİLHAM VERİR',
      {
        fontSize: '14px',
        fontStyle: '900',
        color: '#FDE68A',
        align: 'center',
        lineSpacing: 6,
      }
    );
    bannerText.setOrigin(0.5);
    bannerContainer.add(bannerText);

    this.stage4Container.add(bannerContainer);
  }

  /**
   * Bottom Right Parchment Note
   */
  private createBottomRightParchmentNote(): void {
    if (!this.stage4Container) return;

    const noteContainer = this.add.container(1730, 840);
    noteContainer.setDepth(11);

    const noteG = this.add.graphics();
    // Drop shadow
    noteG.fillStyle(0x080402, 0.5);
    noteG.fillRoundedRect(-80, -100, 165, 205, 8);
    // Aged card body
    noteG.fillStyle(0xe2cfad, 0.98);
    noteG.fillRoundedRect(-75, -95, 155, 195, 6);
    noteG.lineStyle(1.8, 0x854d0e, 0.85);
    noteG.strokeRoundedRect(-75, -95, 155, 195, 6);
    noteContainer.add(noteG);

    const calligText = this.createText(0, -20, 'Güç\nBilgi ile,\nSanat\nUstalıkla\nBuluşur.', {
      fontSize: '15px',
      fontStyle: 'bold italic',
      color: '#451A03',
      align: 'center',
      lineSpacing: 5,
    });
    calligText.setOrigin(0.5);
    noteContainer.add(calligText);

    const bottomDeco = this.createText(0, 68, '۞', {
      fontSize: '18px',
      color: '#B45309',
    });
    bottomDeco.setOrigin(0.5);
    noteContainer.add(bottomDeco);

    this.stage4Container.add(noteContainer);
  }

  /**
   * Central Carved Walnut Sword Display Rack / Workbench (Tezgâh / Stant)
   */
  private createSwordDisplayRack(): void {
    if (!this.stage4Container) return;

    const rackG = this.add.graphics();

    // 1. Backing Wall / Upper Rack Support (Center: 960, Y: 465)
    rackG.fillStyle(0x0c0603, 0.7);
    rackG.fillRoundedRect(960 - 540, 465 - 125, 1080, 250, 16); // shadow

    rackG.fillStyle(0x1a0f07, 0.96);
    rackG.fillRoundedRect(960 - 530, 465 - 118, 1060, 236, 14);
    rackG.lineStyle(3, 0x854d0e, 0.95);
    rackG.strokeRoundedRect(960 - 530, 465 - 118, 1060, 236, 14);

    // Carved Walnut Inner Inlay Trim
    rackG.lineStyle(1.5, 0xd97706, 0.55);
    rackG.strokeRoundedRect(960 - 518, 465 - 106, 1036, 212, 10);

    // 2. Left & Right Heavy Wooden Bracket Stanchions
    rackG.fillStyle(0x2d170b, 1);
    rackG.fillRoundedRect(960 - 520, 465 - 105, 38, 205, 6);
    rackG.fillRoundedRect(960 + 482, 465 - 105, 38, 205, 6);
    rackG.lineStyle(1.5, 0xd97706, 0.8);
    rackG.strokeRoundedRect(960 - 520, 465 - 105, 38, 205, 6);
    rackG.strokeRoundedRect(960 + 482, 465 - 105, 38, 205, 6);

    // 3. Lower Tiered Heavy Display Base Shelf (Y: 575 to 625)
    rackG.fillStyle(0x130a04, 1);
    rackG.fillRoundedRect(960 - 555, 575, 1110, 42, 8);
    rackG.lineStyle(2.5, 0x854d0e, 0.95);
    rackG.strokeRoundedRect(960 - 555, 575, 1110, 42, 8);

    rackG.fillStyle(0x27140a, 1);
    rackG.fillRoundedRect(960 - 540, 582, 1080, 16, 4);
    rackG.lineStyle(1.2, 0xd97706, 0.7);
    rackG.strokeRoundedRect(960 - 540, 582, 1080, 16, 4);

    // 4. Center Front Triangular Wooden Crest with Gilded Tulip Relief (Lale Motifi)
    rackG.fillStyle(0x1f1006, 1);
    rackG.beginPath();
    rackG.moveTo(960 - 75, 580);
    rackG.lineTo(960, 532);
    rackG.lineTo(960 + 75, 580);
    rackG.closePath();
    rackG.fillPath();
    rackG.lineStyle(2, 0xd97706, 0.9);
    rackG.strokePath();

    // Carved Tulip Relief
    rackG.fillStyle(0xd97706, 0.9);
    rackG.fillCircle(960, 558, 6);
    rackG.lineStyle(1.5, 0xfde68a, 0.95);
    rackG.lineBetween(960, 574, 960, 558);
    rackG.beginPath();
    rackG.moveTo(960, 570);
    rackG.lineTo(960 - 12, 556);
    rackG.lineTo(960 - 8, 546);
    rackG.moveTo(960, 570);
    rackG.lineTo(960 + 12, 556);
    rackG.lineTo(960 + 8, 546);
    rackG.strokePath();

    this.stage4Container.add(rackG);
  }

  /**
   * 4 Dedicated Sword Silhouette Slots on the Rack
   */
  private createSwordSlotsOnRack(): void {
    if (!this.stage4Container) return;

    Object.values(SWORD_SLOT_DEFS).forEach((slotDef) => {
      const slotContainer = this.add.container(slotDef.x, slotDef.y);
      slotContainer.setDepth(11);

      const outline = this.add.graphics();
      outline.fillStyle(0x0e0703, 0.65);

      // Draw exact slot contour outline
      if (slotDef.id === 'slot_blade') {
        outline.fillRoundedRect(-slotDef.width / 2, -slotDef.height / 2 + 10, slotDef.width, slotDef.height - 20, 8);
        outline.lineStyle(2, 0xd97706, 0.75);
        outline.strokeRoundedRect(-slotDef.width / 2, -slotDef.height / 2 + 10, slotDef.width, slotDef.height - 20, 8);
      } else if (slotDef.id === 'slot_guard') {
        outline.fillRoundedRect(-slotDef.width / 2, -slotDef.height / 2, slotDef.width, slotDef.height, 10);
        outline.lineStyle(2, 0xd97706, 0.75);
        outline.strokeRoundedRect(-slotDef.width / 2, -slotDef.height / 2, slotDef.width, slotDef.height, 10);
      } else if (slotDef.id === 'slot_grip') {
        outline.fillRoundedRect(-slotDef.width / 2, -slotDef.height / 2, slotDef.width, slotDef.height, 6);
        outline.lineStyle(2, 0xd97706, 0.75);
        outline.strokeRoundedRect(-slotDef.width / 2, -slotDef.height / 2, slotDef.width, slotDef.height, 6);
      } else if (slotDef.id === 'slot_pommel') {
        outline.fillRoundedRect(-slotDef.width / 2, -slotDef.height / 2, slotDef.width, slotDef.height, 10);
        outline.lineStyle(2, 0xd97706, 0.75);
        outline.strokeRoundedRect(-slotDef.width / 2, -slotDef.height / 2, slotDef.width, slotDef.height, 10);
      }
      slotContainer.add(outline);

      // Subtle breathing pulse on empty slot outline
      this.tweens.add({
        targets: outline,
        alpha: { from: 0.65, to: 0.95 },
        duration: 850,
        yoyo: true,
        repeat: -1,
      });

      // Circular Numbered Badge: 1, 2, 3, 4
      const badgeContainer = this.add.container(0, 0);
      badgeContainer.setDepth(15);

      const badgeG = this.add.graphics();
      badgeG.fillStyle(0x180d05, 0.92);
      badgeG.fillCircle(0, 0, 17);
      badgeG.lineStyle(2, 0xf59e0b, 0.95);
      badgeG.strokeCircle(0, 0, 17);
      badgeContainer.add(badgeG);

      const numText = this.createText(0, 1, `${slotDef.index}`, {
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#FEF08A',
      });
      numText.setOrigin(0.5);
      badgeContainer.add(numText);

      slotContainer.add(badgeContainer);
      this.stage4Container?.add(slotContainer);

      this.swordSlots.push({
        def: slotDef,
        outline,
        badge: badgeContainer,
        isFilled: false,
      });
    });
  }

  /**
   * Bottom Carved Walnut Parts Tray with 4 Compact Cards & Fisher-Yates Shuffled Draggable Pieces
   */
  private createBottomPartsTray(): void {
    if (!this.stage4Container) return;

    // Master Walnut Tray Frame (Center: 960, Y: 855, Width: 1140, Height: 215)
    // Left boundary: 960 - 570 = 390 -> plenty of clearance from Pusula at X: 85..380!
    const trayG = this.add.graphics();
    trayG.fillStyle(0x0b0502, 0.85);
    trayG.fillRoundedRect(960 - 575, 855 - 110, 1150, 220, 16); // shadow

    trayG.fillStyle(0x180e06, 0.96);
    trayG.fillRoundedRect(960 - 570, 855 - 105, 1140, 210, 14);
    trayG.lineStyle(3, 0x854d0e, 0.95);
    trayG.strokeRoundedRect(960 - 570, 855 - 105, 1140, 210, 14);

    trayG.lineStyle(1.5, 0xd97706, 0.5);
    trayG.strokeRoundedRect(960 - 560, 855 - 95, 1120, 190, 10);
    this.stage4Container.add(trayG);

    // 1. Fisher-Yates Shuffle the 4 sword parts strictly ONCE on stage 4 entry
    const shuffledPartIds = shuffleSwordParts();

    // 2. Instantiate each of the 4 tray card slots
    TRAY_CARD_SLOTS.forEach((cardSlot, i) => {
      const partId = shuffledPartIds[i];
      const partDef = SWORD_PART_DEFS[partId];

      // A. Recessed Card Bay (Width: 250, Height: 180)
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x0e0804, 0.92);
      cardBg.fillRoundedRect(cardSlot.x - 125, cardSlot.y - 90, 250, 180, 8);
      cardBg.lineStyle(1.8, 0x78350f, 0.85);
      cardBg.strokeRoundedRect(cardSlot.x - 125, cardSlot.y - 90, 250, 180, 8);

      // Brass Filigree Corner Brackets
      cardBg.lineStyle(2, 0xd97706, 0.8);
      cardBg.strokeRect(cardSlot.x - 121, cardSlot.y - 86, 12, 12);
      cardBg.strokeRect(cardSlot.x + 109, cardSlot.y - 86, 12, 12);
      cardBg.strokeRect(cardSlot.x - 121, cardSlot.y + 74, 12, 12);
      cardBg.strokeRect(cardSlot.x + 109, cardSlot.y + 74, 12, 12);
      this.stage4Container?.add(cardBg);

      // B. Title Tag Pill at Bottom of Card (e.g. "Kılıç Ucu", "Kabza Koruması" - NO numbers!)
      const tagBg = this.add.graphics();
      tagBg.fillStyle(0x1f1107, 0.92);
      tagBg.fillRoundedRect(cardSlot.x - 90, cardSlot.y + 55, 180, 26, 6);
      tagBg.lineStyle(1.2, 0xd97706, 0.85);
      tagBg.strokeRoundedRect(cardSlot.x - 90, cardSlot.y + 55, 180, 26, 6);
      this.stage4Container?.add(tagBg);

      const tagText = this.createText(cardSlot.x, cardSlot.y + 68, partDef.title, {
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#FEF3C7',
      });
      tagText.setOrigin(0.5);
      this.stage4Container?.add(tagText);

      // C. Placed Badge ("✓ Yerleştirildi") - Hidden until placed
      const placedBadge = this.add.container(cardSlot.x, cardSlot.y);
      placedBadge.setDepth(15);
      placedBadge.setVisible(false);

      const pbG = this.add.graphics();
      pbG.fillStyle(0x064e3b, 0.85);
      pbG.fillRoundedRect(-75, -16, 150, 32, 8);
      pbG.lineStyle(1.5, 0x34d399, 0.9);
      pbG.strokeRoundedRect(-75, -16, 150, 32, 8);
      placedBadge.add(pbG);

      const pbText = this.createText(0, 0, '✓ Yerleştirildi', {
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#A7F3D0',
      });
      pbText.setOrigin(0.5);
      placedBadge.add(pbText);
      this.stage4Container?.add(placedBadge);

      // D. Draggable Piece Container (Positioned at center of card, slightly raised for label)
      const pContainer = this.add.container(cardSlot.x, cardSlot.y - 12);
      pContainer.setSize(250, 180);
      pContainer.setDepth(25);

      const shadow = this.add.graphics();
      shadow.fillStyle(0x050201, 0.65);
      shadow.fillEllipse(0, partDef.trayH / 2 + 6, partDef.trayW * 0.8, 16);
      pContainer.add(shadow);

      const sprite = this.add.image(0, 0, partDef.textureKey);
      sprite.setDisplaySize(partDef.trayW, partDef.trayH);
      pContainer.add(sprite);

      // Card-sized Hit Area: covers the entire card (-125 to +125 in X, -90 to +90 in Y)
      const cardHitArea = new Phaser.Geom.Rectangle(-125, -90, 250, 180);
      pContainer.setInteractive(cardHitArea, Phaser.Geom.Rectangle.Contains, true);
      this.input.setDraggable(pContainer);

      const partItem: SwordPartItem = {
        def: partDef,
        container: pContainer,
        sprite,
        shadow,
        cardSlot,
        cardBg,
        placedBadge,
        titleTag: tagBg,
        titleText: tagText,
        isPlaced: false,
      };
      this.swordParts.push(partItem);

      // Relative Grab Offset tracking (Zero jumping when picked up)
      let grabOffsetX = 0;
      let grabOffsetY = 0;
      let isDragging = false;

      const startPieceDrag = (pointer: Phaser.Input.Pointer) => {
        if (partItem.isPlaced || isDragging) return;
        isDragging = true;

        // Kill any previous returning tweens immediately
        this.tweens.killTweensOf(pContainer);
        this.tweens.killTweensOf(sprite);

        // Record grab offset precisely
        grabOffsetX = pContainer.x - pointer.worldX;
        grabOffsetY = pContainer.y - pointer.worldY;

        // Move to Top-Level Drag Layer (Depth 9999)
        if (this.stage4DragLayer) {
          this.stage4DragLayer.add(pContainer);
        }
        pContainer.setDepth(9999);

        // Dim source card while being dragged
        partItem.cardBg.setAlpha(0.5);

        // Expand hitArea to cover the full physical scale of the piece (+ 40px padding)
        const activeHitW = Math.max(260, partDef.width + 40);
        const activeHitH = Math.max(160, partDef.height + 40);
        pContainer.input?.hitArea?.setTo(-activeHitW / 2, -activeHitH / 2, activeHitW, activeHitH);

        SoundFx.playStoneDrag();

        // Smoothly scale up to 1:1 full physical sword size
        this.tweens.add({
          targets: sprite,
          displayWidth: partDef.width,
          displayHeight: partDef.height,
          duration: 120,
          ease: 'Quad.easeOut',
        });
      };

      pContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (partItem.isPlaced) return;
        grabOffsetX = pContainer.x - pointer.worldX;
        grabOffsetY = pContainer.y - pointer.worldY;
      });

      pContainer.on('dragstart', (pointer: Phaser.Input.Pointer) => {
        startPieceDrag(pointer);
      });

      pContainer.on('drag', (pointer: Phaser.Input.Pointer) => {
        if (partItem.isPlaced) return;
        if (!isDragging) {
          startPieceDrag(pointer);
        }

        // Apply relative grab offset to eliminate any jumping
        pContainer.x = pointer.worldX + grabOffsetX;
        pContainer.y = pointer.worldY + grabOffsetY;

        // Proximity Highlight on its STRICT TARGET SLOT ONLY (Dual-check: container OR pointer)
        const targetSlot = this.swordSlots.find((s) => s.def.id === partDef.slotId);
        if (targetSlot && !targetSlot.isFilled) {
          const distToCenter = Phaser.Math.Distance.Between(pContainer.x, pContainer.y, targetSlot.def.x, targetSlot.def.y);
          const pointerInBox = isPointInsideSlotRect(targetSlot.def, pointer.worldX, pointer.worldY, 35);
          const containerInBox = isPointInsideSlotRect(targetSlot.def, pContainer.x, pContainer.y, 35);

          if (distToCenter <= 150 || pointerInBox || containerInBox) {
            targetSlot.outline.setAlpha(1.0);
            targetSlot.outline.setScale(1.04);
          } else {
            targetSlot.outline.setScale(1.0);
          }
        }
      });

      const finishPieceDrag = (pointer: Phaser.Input.Pointer) => {
        if (partItem.isPlaced || !isDragging) return;
        isDragging = false;
        this.handleSwordDrop(partItem, pointer.worldX, pointer.worldY);
      };

      pContainer.on('dragend', (pointer: Phaser.Input.Pointer) => {
        finishPieceDrag(pointer);
      });

      pContainer.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (isDragging) finishPieceDrag(pointer);
      });

      pContainer.on('pointercancel', (pointer: Phaser.Input.Pointer) => {
        if (isDragging) finishPieceDrag(pointer);
      });

      this.stage4Container?.add(pContainer);
    });
  }

  /**
   * Handle drop evaluation, exact snapping, error handling and progression
   */
  private handleSwordDrop(part: SwordPartItem, pointerX?: number, pointerY?: number): void {
    const evalResult = evaluateSwordDrop(
      part.def.id,
      part.container.x,
      part.container.y,
      140,
      pointerX,
      pointerY,
      30
    );

    if (evalResult.isSuccess && evalResult.snapX !== undefined && evalResult.snapY !== undefined) {
      // 1. Correct Match! Snap into position
      part.isPlaced = true;
      this.input.setDraggable(part.container, false);
      part.container.disableInteractive();

      // Return from dragLayer back to stage4Container
      if (this.stage4Container) {
        this.stage4Container.add(part.container);
      }
      part.container.setDepth(part.def.standDepth);

      const matchedSlot = this.swordSlots.find((s) => s.def.id === part.def.slotId);
      if (matchedSlot) {
        matchedSlot.isFilled = true;
        // Fade out slot numbered badge and dashed outline
        this.tweens.add({
          targets: [matchedSlot.badge, matchedSlot.outline],
          alpha: 0,
          duration: 200,
        });
      }

      // Sounds & physical impact
      SoundFx.playLockSound();
      SoundFx.playStampEngrave();
      this.cameras.main.shake(45, 0.002);
      this.createAnvilSparks(evalResult.snapX, evalResult.snapY, 14);

      // Snap precisely to slot coordinates with zero rotation and exact scale
      this.tweens.add({
        targets: part.container,
        x: evalResult.snapX,
        y: evalResult.snapY,
        duration: 180,
        ease: 'Back.easeOut',
      });

      this.tweens.add({
        targets: part.sprite,
        displayWidth: part.def.width,
        displayHeight: part.def.height,
        duration: 180,
      });

      part.container.angle = 0;
      part.shadow.setVisible(false);

      // In the bottom tray: mark the source card as placed
      part.cardBg.setAlpha(0.4);
      part.titleTag.setVisible(false);
      part.titleText.setVisible(false);
      part.placedBadge.setVisible(true);

      this.swordAssembledCount++;
      if (this.counterText) {
        this.counterText.setText(`MONTAJ: ${this.swordAssembledCount}/4`);
      }

      // Responsive Pusula narrative guidance
      if (this.swordAssembledCount === 1) {
        this.pusula?.setMessage('Kılıç ucu tezgâha oturdu! Şimdi namlu ile sapı koruyan siperi yerleştir.');
      } else if (this.swordAssembledCount === 2) {
        this.pusula?.setMessage('Siper yerine kilitlendi! Şimdi ustanın eline tam oturacak sapı tak.');
      } else if (this.swordAssembledCount === 3) {
        this.pusula?.setMessage('Sap montajı tamam! Son olarak kılıcın dengesini sağlayan başlığı yerleştir.');
      } else if (this.swordAssembledCount === 4) {
        this.onAllSwordPartsCompleted();
      }
    } else {
      // 2. Missed / Wrong Slot -> Smooth return to its assigned tray card
      SoundFx.playSandSlide();

      // Restore card-sized hitArea
      part.container.input?.hitArea?.setTo(-125, -90, 250, 180);

      this.tweens.add({
        targets: part.container,
        x: part.cardSlot.x,
        y: part.cardSlot.y - 12,
        duration: 240,
        ease: 'Back.easeOut',
        onComplete: () => {
          if (this.stage4Container) {
            this.stage4Container.add(part.container);
          }
          part.container.setDepth(25);
          part.cardBg.setAlpha(0.92);
        },
      });

      this.tweens.add({
        targets: part.sprite,
        displayWidth: part.def.trayW,
        displayHeight: part.def.trayH,
        duration: 240,
      });

      // Reset slot highlights
      this.swordSlots.forEach((s) => {
        if (!s.isFilled) {
          s.outline.setScale(1.0);
        }
      });

      if (evalResult.reason === 'WRONG_SLOT') {
        this.pusula?.setMessage('Bu parça bu yuvaya uymuyor. Şekline ve yuva numarasına dikkat et!');
      } else {
        this.pusula?.setMessage('Parçayı tezgâhtaki doğru yuvasının tam üzerine sürükle.');
      }
    }
  }

  /**
   * Final Completion: 4/4 Pieces Assembled
   * Executes metallic specular light gleam, golden aura, fanfare and victory transition.
   */
  private onAllSwordPartsCompleted(): void {
    if (this.isSwordCompleted) return;
    this.isSwordCompleted = true;

    // Lock interactions
    this.swordParts.forEach((p) => p.container.disableInteractive());

    // Audio Fanfare & Sword Sheath Ring
    SoundFx.playSwordSheath();
    SoundFx.playVictoryFanfare();

    // Cinematic zoom-in onto the completed Ottoman master sword
    this.cameras.main.zoomTo(1.08, 900);

    // Warm Ambient Gold Aura behind the completed sword
    const swordAura = this.add.graphics();
    swordAura.fillStyle(0xfde047, 0.22);
    swordAura.fillRoundedRect(960 - 500, SWORD_BASELINE_Y - 50, 1000, 100, 20);
    swordAura.setDepth(9);
    this.stage4Container?.add(swordAura);

    this.tweens.add({
      targets: swordAura,
      alpha: { from: 0.1, to: 0.4 },
      duration: 500,
      yoyo: true,
      repeat: 2,
    });

    // Metallic Specular Shine Sweep from left to right along the entire sword blade & hilt
    const shine = this.add.graphics();
    shine.fillStyle(0xffffff, 0.85);
    shine.fillRect(-12, -80, 24, 160);
    shine.setDepth(35);
    shine.x = 440;
    shine.y = SWORD_BASELINE_Y;
    this.stage4Container?.add(shine);

    this.tweens.add({
      targets: shine,
      x: 1450,
      duration: 800,
      ease: 'Quad.easeInOut',
      onComplete: () => shine.destroy(),
    });

    // Floating Golden Sparks
    for (let i = 0; i < 24; i++) {
      this.time.delayedCall(i * 50, () => {
        this.createHearthSparks(
          960 + Phaser.Math.Between(-420, 420),
          SWORD_BASELINE_Y + Phaser.Math.Between(-40, 40),
          2
        );
      });
    }

    this.pusula?.setMessage('Harika! Tüm parçaları doğru yerlerine yerleştirdin ve eseri tamamladın.');

    this.time.delayedCall(1800, () => {
      this.onGameCompleted();
    });
  }

  // ==========================================
  // CAMERA STAGE TRANSITIONS (300ms fade)
  // ==========================================
  private transitionToStage(nextStage: 1 | 2 | 3 | 4): void {
    this.cameras.main.fadeOut(300, 5, 3, 2);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.stage1Container) {
        this.stage1Container.destroy();
        this.stage1Container = undefined;
      }
      if (this.stage1Materials && this.stage1Materials.length > 0) {
        this.stage1Materials.forEach((m) => {
          try { m.container.destroy(); } catch { /* ignore */ }
        });
        this.stage1Materials = [];
      }
      if (this.stage2Container) {
        this.stage2Container.destroy();
        this.stage2Container = undefined;
      }
      if (this.stage3Container) {
        this.stage3Container.destroy();
        this.stage3Container = undefined;
      }
      if (this.stage3PointerHandler) {
        this.input.off('pointerdown', this.stage3PointerHandler);
        this.stage3PointerHandler = undefined;
      }
      if (this.hammerSafetyTimer) {
        this.hammerSafetyTimer.remove();
        this.hammerSafetyTimer = undefined;
      }
      if (this.stage4Container) {
        this.stage4Container.destroy();
        this.stage4Container = undefined;
      }
      if (this.stage4DragLayer) {
        this.stage4DragLayer.destroy();
        this.stage4DragLayer = undefined;
      }

      if (nextStage === 1) {
        this.bgImage?.setTexture('iron_stage1_furnace');
        this.setupStage1();
      } else if (nextStage === 2) {
        this.bgImage?.setTexture('iron_stage1_furnace');
        this.setupStage2();
      } else if (nextStage === 3) {
        this.bgImage?.setTexture('iron_stage2_anvil');
        this.setupStage3();
      } else if (nextStage === 4) {
        this.bgImage?.setTexture('iron_stage4_showcase');
        this.setupStage4();
      }

      this.cameras.main.fadeIn(300, 5, 3, 2);
    });
  }

  private onGameCompleted(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;

    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    // Mark Module 2 'demir_cagi' Completed in GameStore to unlock Module 3 ('anadolu_ustaligi')
    GameStore.completeModule('demir_cagi');

    this.time.delayedCall(700, () => {
      this.createMonumentalSteleVictoryModal();
    });
  }

  /**
   * Monumental Ancient Stone Stele Victory Modal (Matching Museum & Archeology Standard)
   * Size: 1040x600 px, Center: (X: 960, Y: 530), Serif Antiqua Typography
   */
  private createMonumentalSteleVictoryModal(): void {
    const result = calculateResult(this.elapsedSeconds, this.totalErrors);
    GameStore.saveResult('demir_cagi', result);
    EventBus.emit('mission-result', 'demir_cagi');
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