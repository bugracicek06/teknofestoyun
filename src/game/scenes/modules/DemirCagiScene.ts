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
import crankHandleUrl from '../../../assets/svg/crank_handle.svg';
import gearMediumUrl from '../../../assets/svg/gear_medium.svg';
import mechAxleUrl from '../../../assets/svg/mech_axle.svg';
import mechPinUrl from '../../../assets/svg/mech_pin.svg';

interface DragMaterial {
  container: Phaser.GameObjects.Container;
  id: string;
  isCorrect: boolean;
  origX: number;
  origY: number;
  isPlaced: boolean;
}

interface AssemblySocket {
  id: string;
  x: number;
  y: number;
  radius: number;
  isFilled: boolean;
  name: string;
  slotRing: Phaser.GameObjects.Graphics;
}

interface MechAssemblyPart {
  container: Phaser.GameObjects.Container;
  id: string;
  targetSocketId: string;
  origX: number;
  origY: number;
  isPlaced: boolean;
  placedSprite?: Phaser.GameObjects.Image;
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

  // Compact Aesthetic Antique Pyrometer
  private compactPyrometerNeedle?: Phaser.GameObjects.Graphics;
  private compactProgressRing?: Phaser.GameObjects.Graphics;
  private compactStatusText?: Phaser.GameObjects.Text;
  private compactProgressLabel?: Phaser.GameObjects.Text;

  // Stage 3: Üretimi Yönet (Timed Rhythmic Forging on Anvil)
  private stage3Container?: Phaser.GameObjects.Container;
  private anvilWorkpiece?: Phaser.GameObjects.Container;
  private workpieceSprite?: Phaser.GameObjects.Image;
  private workpiecePlateGraphics?: Phaser.GameObjects.Graphics;
  private hammerTool?: Phaser.GameObjects.Image;
  private timingSlider?: Phaser.GameObjects.Graphics;
  private timingNeedleX = 960;
  private timingOscillator = 0;
  private stage3Active = false;
  private hammerStrikes = 0;
  private isHammerStriking = false;

  // Stage 4: Eseri Tamamla (Mechanical Gear & Axle Assembly)
  private stage4Container?: Phaser.GameObjects.Container;
  private assemblySockets: AssemblySocket[] = [];
  private assemblyParts: MechAssemblyPart[] = [];
  private assembledCount = 0;
  private isMechanismRunning = false;


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
    if (!this.textures.exists('crank_handle')) this.load.image('crank_handle', crankHandleUrl);
    if (!this.textures.exists('gear_medium')) this.load.image('gear_medium', gearMediumUrl);
    if (!this.textures.exists('mech_axle')) this.load.image('mech_axle', mechAxleUrl);
    if (!this.textures.exists('mech_pin')) this.load.image('mech_pin', mechPinUrl);
  }

  create(): void {
    // Reset state variables
    this.currentStage = 1;
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
    this.assembledCount = 0;
    this.isMechanismRunning = false;
    this.stage1Materials = [];
    this.assemblySockets = [];
    this.assemblyParts = [];

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
    this.setupStage1();

    // Dev stage navigation hotkeys

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

    // Stage 4 Running Animated Mechanical Assembly Loop
    if (this.currentStage === 4 && this.isMechanismRunning) {
      this.updateStage4Mechanism(delta);
    }
  }

  private cleanUpScene(): void {
    this.events.off(Phaser.Scenes.Events.DESTROY, this.cleanUpScene, this);
    this.stage2Active = false;
    this.stage3Active = false;
    this.isMechanismRunning = false;
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
    this.bellowsHandleY = 600;
    this.bellowsMinY = 530;
    this.bellowsMaxY = 710;
    this.isHandleDragging = false;
    this.airWisps = [];
    this.smokeWisps = [];

    if (this.phaseTitleText) this.phaseTitleText.setText('BÖLÜM 2 / 6');
    if (this.objectiveText) this.objectiveText.setText('GÖREV: Ahşap Körük Kolunu Pompalayarak Ocağı Tavında Tut');
    if (this.counterText) this.counterText.setText('TAVLANMA: %0');

    this.stage2Container = this.add.container(0, 0);
    this.stage2Container.setDepth(10);

    // 1. Hearth Embers Bed & Hot Coals (Centered directly on furnace coal bed at Y: 660)
    this.hearthEmbersGraphics = this.add.graphics();
    this.hearthEmbersGraphics.setDepth(11);
    this.hearthEmbersGraphics.setBlendMode(Phaser.BlendModes.ADD);
    this.stage2Container.add(this.hearthEmbersGraphics);

    // 2. Dynamic Flame Graphics (Undulating sine waves with additive warmth)
    this.hearthFireGraphics = this.add.graphics();
    this.hearthFireGraphics.setDepth(12);
    this.hearthFireGraphics.setBlendMode(Phaser.BlendModes.ADD);
    this.stage2Container.add(this.hearthFireGraphics);

    // 3. Blacksmith Tongs (Holding the billet from the left into the coals)
    const tongsGraphics = this.add.graphics();
    tongsGraphics.setDepth(13);
    // Dark wrought iron tongs handles and clamp jaws
    tongsGraphics.lineStyle(7, 0x1f242d, 1);
    tongsGraphics.lineBetween(730, 705, 888, 662);
    tongsGraphics.lineBetween(720, 725, 888, 668);
    // Hinge rivet
    tongsGraphics.fillStyle(0x475569, 1);
    tongsGraphics.fillCircle(888, 665, 5);
    // Clamp jaws holding the billet
    tongsGraphics.lineStyle(5.5, 0x334155, 1);
    tongsGraphics.lineBetween(888, 662, 922, 652);
    tongsGraphics.lineBetween(888, 668, 922, 666);
    this.stage2Container.add(tongsGraphics);

    // 4. Heated Iron Billet Glowing Aura & Body
    this.hearthBilletAura = this.add.graphics();
    this.hearthBilletAura.setDepth(13);
    this.hearthBilletAura.setBlendMode(Phaser.BlendModes.ADD);
    this.stage2Container.add(this.hearthBilletAura);

    this.hearthBilletGraphics = this.add.graphics();
    this.hearthBilletGraphics.setDepth(14);
    this.stage2Container.add(this.hearthBilletGraphics);

    // 5. Physical Blacksmith Bellows Structure (Right of Hearth)
    // A) Stationary Support Timber & Base Frame
    const bellowsBaseFrame = this.add.graphics();
    bellowsBaseFrame.setDepth(11);
    // Dark heavy timber support post resting on forge masonry ledge
    bellowsBaseFrame.fillStyle(0x1a0f07, 0.95);
    bellowsBaseFrame.fillRoundedRect(1450, 640, 32, 160, 6);
    bellowsBaseFrame.fillRoundedRect(1510, 650, 28, 150, 6);
    // Cross brace
    bellowsBaseFrame.lineStyle(8, 0x27140a, 1);
    bellowsBaseFrame.lineBetween(1430, 760, 1550, 760);
    bellowsBaseFrame.lineBetween(1450, 760, 1520, 680);
    // Wrought iron bolts
    bellowsBaseFrame.fillStyle(0x0f172a, 1);
    bellowsBaseFrame.fillCircle(1466, 660, 4);
    bellowsBaseFrame.fillCircle(1466, 750, 4);
    bellowsBaseFrame.fillCircle(1524, 750, 4);
    this.stage2Container.add(bellowsBaseFrame);

    // B) Iron Blast Tuyere / Nozzle Pipe (Directing air directly into coals at Y: 660)
    const nozzlePipe = this.add.graphics();
    nozzlePipe.setDepth(13);
    // Cast iron pipe body from 1210 down to 1095
    nozzlePipe.fillStyle(0x1e2229, 1);
    nozzlePipe.beginPath();
    nozzlePipe.moveTo(1210, 654);
    nozzlePipe.lineTo(1095, 656);
    nozzlePipe.lineTo(1095, 668);
    nozzlePipe.lineTo(1210, 670);
    nozzlePipe.closePath();
    nozzlePipe.fillPath();
    // Copper reinforcement nozzle tip
    nozzlePipe.fillStyle(0xb45309, 1);
    nozzlePipe.fillRect(1090, 655, 12, 14);
    nozzlePipe.lineStyle(2, 0xd97706, 0.9);
    nozzlePipe.strokeRect(1090, 655, 12, 14);
    // Hearth opening iron mounting plate
    nozzlePipe.fillStyle(0x334155, 1);
    nozzlePipe.fillRoundedRect(1202, 646, 14, 32, 4);
    this.stage2Container.add(nozzlePipe);

    // C) Fixed Lower Board of the Bellows
    const lowerBoard = this.add.graphics();
    lowerBoard.setDepth(12);
    lowerBoard.fillStyle(0x2e180d, 1);
    lowerBoard.beginPath();
    lowerBoard.moveTo(1210, 662);
    lowerBoard.lineTo(1460, 705);
    lowerBoard.lineTo(1455, 720);
    lowerBoard.lineTo(1205, 670);
    lowerBoard.closePath();
    lowerBoard.fillPath();
    // Iron banding on lower board
    lowerBoard.lineStyle(3, 0x1e293b, 1);
    lowerBoard.lineBetween(1320, 682, 1317, 698);
    lowerBoard.lineBetween(1410, 698, 1407, 714);
    this.stage2Container.add(lowerBoard);

    // D) Dynamic Leather Accordion Body & Movable Upper Board Graphics
    this.bellowsLeatherGraphics = this.add.graphics();
    this.bellowsLeatherGraphics.setDepth(14);
    this.stage2Container.add(this.bellowsLeatherGraphics);

    // E) Articulated Wooden Pump Arm
    this.bellowsArmGraphics = this.add.graphics();
    this.bellowsArmGraphics.setDepth(16);
    this.stage2Container.add(this.bellowsArmGraphics);

    // F) Draggable Carved Oak Handle
    this.bellowsLeverHandle = this.add.container(1525, this.bellowsHandleY);
    this.bellowsLeverHandle.setSize(90, 110);
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
    const hintBadge = this.createText(0, 64, 'POMPALA\n[ BAS / ÇEK ]', {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FEF3C7',
      align: 'center',
    });
    hintBadge.setOrigin(0.5);
    this.bellowsLeverHandle.add(hintBadge);

    // Draggable & Click Interaction
    const handleHitArea = new Phaser.Geom.Rectangle(-45, -55, 90, 130);
    this.bellowsLeverHandle.setInteractive(handleHitArea, Phaser.Geom.Rectangle.Contains, true);
    this.input.setDraggable(this.bellowsLeverHandle);

    // Instant tactile pump on touch/click
    this.bellowsLeverHandle.on('pointerdown', () => {
      this.currentHeat = Math.min(100, this.currentHeat + 14);
      this.spawnAirBlastWisps(1.4);
      SoundFx.playBellowsPump(1.2);
      SoundFx.playFireRoar(this.currentHeat);
      this.createHearthSparks(960, 660, 10);
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
          this.createHearthSparks(960, 660, Math.floor(4 + pumpSpeed * 5));

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
        bellowsHandleY: 600,
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

    // 6. Compact Antique Forged Pyrometer (Mounted unobtrusively at X: 720, Y: 220)
    this.createCompactPyrometer(720, 220);

    // Initial draw of physical bellows
    this.drawBellowsVisuals();

  }

  /**
   * Compact, aesthetic antique pyrometer that sits elegantly on the forge masonry without blocking the center.
   */
  private createCompactPyrometer(x: number, y: number): void {
    const pyrometerBg = this.add.graphics();
    pyrometerBg.setDepth(15);

    // Dark cast bronze backplate with antique border
    pyrometerBg.fillStyle(0x130a04, 0.94);
    pyrometerBg.fillRoundedRect(x - 110, y - 45, 220, 90, 12);
    pyrometerBg.lineStyle(2, 0xb45309, 0.85);
    pyrometerBg.strokeRoundedRect(x - 110, y - 45, 220, 90, 12);

    // Iron corner rivets
    pyrometerBg.fillStyle(0x78350f, 1);
    pyrometerBg.fillCircle(x - 100, y - 35, 3.5);
    pyrometerBg.fillCircle(x + 100, y - 35, 3.5);
    pyrometerBg.fillCircle(x - 100, y + 35, 3.5);
    pyrometerBg.fillCircle(x + 100, y + 35, 3.5);

    // Arc gauge track (Cold / Ideal / Overheat)
    // Cold zone (0% to 45% -> -140 deg to -70 deg)
    pyrometerBg.lineStyle(5, 0x475569, 0.7);
    pyrometerBg.beginPath();
    pyrometerBg.arc(x - 30, y + 10, 32, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(245), false);
    pyrometerBg.strokePath();

    // Ideal Zone (45% to 78% -> 245 deg to 310 deg)
    pyrometerBg.lineStyle(6, 0xf59e0b, 1);
    pyrometerBg.beginPath();
    pyrometerBg.arc(x - 30, y + 10, 32, Phaser.Math.DegToRad(245), Phaser.Math.DegToRad(315), false);
    pyrometerBg.strokePath();

    // Overheat Zone (78% to 100% -> 315 deg to 360 deg)
    pyrometerBg.lineStyle(5, 0xdc2626, 0.7);
    pyrometerBg.beginPath();
    pyrometerBg.arc(x - 30, y + 10, 32, Phaser.Math.DegToRad(315), Phaser.Math.DegToRad(360), false);
    pyrometerBg.strokePath();

    // Center pivot jewel
    pyrometerBg.fillStyle(0xd97706, 1);
    pyrometerBg.fillCircle(x - 30, y + 10, 4);

    this.stage2Container?.add(pyrometerBg);

    // Needle Graphics
    this.compactPyrometerNeedle = this.add.graphics();
    this.compactPyrometerNeedle.setDepth(16);
    this.stage2Container?.add(this.compactPyrometerNeedle);

    // Zone labels
    const labelTitle = this.createText(x - 30, y - 30, 'OCAK HARARETİ', {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FDE68A',
    });
    labelTitle.setOrigin(0.5);

    this.compactStatusText = this.createText(x - 30, y + 28, 'SÖNÜK', {
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#94A3B8',
    });
    this.compactStatusText.setOrigin(0.5);

    // Tempered Progress Indicator (Right side of dial)
    this.compactProgressRing = this.add.graphics();
    this.compactProgressRing.setDepth(16);

    const progressLabel = this.createText(x + 55, y - 26, 'TAV KIVAMI', {
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#CBD5E1',
    });
    progressLabel.setOrigin(0.5);

    this.compactProgressLabel = this.createText(x + 55, y + 5, '%0', {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#F59E0B',
    });
    this.compactProgressLabel.setOrigin(0.5);

    this.stage2Container?.add([labelTitle, this.compactStatusText, this.compactProgressRing, progressLabel, this.compactProgressLabel]);
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

    const hingeX = 1210;
    const hingeY = 640;
    const bellowsLength = 250;
    const angleRad = Phaser.Math.DegToRad(this.bellowsAngle);

    // Upper board endpoint
    const topEndX = hingeX + Math.cos(-angleRad) * bellowsLength;
    const topEndY = hingeY + Math.sin(-angleRad) * bellowsLength;

    // Fixed lower board endpoint
    const botEndX = 1460;
    const botEndY = 685;

    // 1. Draw Folded Leather Accordion Body (6 Pleats)
    const pleats = 6;
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
    const handleX = this.bellowsLeverHandle ? this.bellowsLeverHandle.x : 1525;
    const handleY = this.bellowsHandleY;

    // Lever link rod from upper board to handle
    this.bellowsArmGraphics.lineStyle(6, 0x27140a, 1);
    this.bellowsArmGraphics.lineBetween(topEndX, topEndY, handleX - 8, handleY);
    // Iron brackets
    this.bellowsArmGraphics.fillStyle(0x334155, 1);
    this.bellowsArmGraphics.fillCircle(topEndX, topEndY, 5);
    this.bellowsArmGraphics.fillCircle(handleX - 8, handleY, 5);
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
        x: 1100 + Phaser.Math.Between(-10, 10),
        y: 640 + Phaser.Math.Between(-6, 6),
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
      605 + Phaser.Math.Between(-15, 15),
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
    if (!this.isHandleDragging && this.bellowsHandleY < 600) {
      this.bellowsHandleY = Math.min(600, this.bellowsHandleY + dt * 120);
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

    // 5. Render Dynamic Hearth Embers Bed
    if (this.hearthEmbersGraphics) {
      this.hearthEmbersGraphics.clear();
      const heatNorm = this.currentHeat / 100;

      // Base ember glow
      const emberRadius = 110 + heatNorm * 45;
      const emberAlpha = 0.4 + heatNorm * 0.55;
      this.hearthEmbersGraphics.fillStyle(heatNorm > 0.6 ? 0xf97316 : 0xd97706, emberAlpha);
      this.hearthEmbersGraphics.fillEllipse(960, 665, emberRadius * 2, emberRadius * 0.65);

      // Charcoal stones with glowing fissures
      const stoneCoords = [
        { x: 910, y: 668, r: 28 },
        { x: 970, y: 672, r: 34 },
        { x: 1020, y: 666, r: 26 },
        { x: 880, y: 664, r: 22 },
        { x: 950, y: 660, r: 30 },
        { x: 1040, y: 670, r: 24 },
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

    // 6. Render Dynamic Fire Flames (Undulating sine tongues)
    if (this.hearthFireGraphics) {
      this.hearthFireGraphics.clear();
      const heatFactor = Math.max(0.15, this.currentHeat / 100);
      const flameCount = 9;

      for (let i = 0; i < flameCount; i++) {
        const offsetRatio = i / (flameCount - 1);
        const baseX = 870 + offsetRatio * 180;
        const baseY = 670;
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

    // 7. Render Heated Iron Billet & Dynamic Color Transition
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
      this.hearthBilletAura.fillEllipse(960, 660, auraW, auraH);

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
      this.hearthBilletGraphics.fillRoundedRect(960 - 68, 660 - 22, 136, 44, 9);

      // Hammer facet highlight & bevel
      this.hearthBilletGraphics.lineStyle(2.5, 0xffffff, 0.45 + heatRatio * 0.5);
      this.hearthBilletGraphics.strokeRoundedRect(960 - 68, 660 - 22, 136, 44, 9);

      // Glowing core band inside the billet
      if (heatRatio > 0.35) {
        const coreAlpha = 0.5 + heatRatio * 0.5;
        this.hearthBilletGraphics.fillStyle(0xfef08a, coreAlpha);
        this.hearthBilletGraphics.fillRoundedRect(960 - 52, 660 - 11, 104, 22, 5);
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

      if (this.compactStatusText) {
        this.compactStatusText.setText('★ TAVINDA ★');
        this.compactStatusText.setColor('#86EFAC');
      }
    } else if (this.currentHeat < 45) {
      // Cooling down
      this.heatingProgress = Math.max(0, this.heatingProgress - dt * 2.8);

      if (this.currentHeat < 28 && now - this.lastWarningSoundTime > 2600) {
        this.lastWarningSoundTime = now;
        SoundFx.playHeatWarningLow();
        this.pusula?.setMessage('Ateş zayıflıyor! Ahşap körüğü pompala, ateşe nefes ver.');
      }

      if (this.compactStatusText) {
        this.compactStatusText.setText('SÖNÜK');
        this.compactStatusText.setColor('#94A3B8');
      }
    } else {
      // Overheat (> 78)
      if (Math.random() < 0.2) {
        this.createHearthSparks(960, 660, 3);
      }
      if (now - this.lastSparkSoundTime > 1200) {
        this.lastSparkSoundTime = now;
        SoundFx.playSparkCrackles();
        this.pusula?.setMessage('Ateş fazla harlandı! Körüğü biraz dinlendir, demir erimesin.');
      }

      if (this.compactStatusText) {
        this.compactStatusText.setText('AŞIRI HAR');
        this.compactStatusText.setColor('#FCA5A5');
      }
    }

    // 9. Update Compact Pyrometer Needle & Progress Ring
    if (this.compactPyrometerNeedle) {
      this.compactPyrometerNeedle.clear();
      // Needle angle: from 180 deg (0%) to 360 deg (100%)
      const needleAngleDeg = 180 + (this.currentHeat / 100) * 180;
      const rad = Phaser.Math.DegToRad(needleAngleDeg);
      const needleLen = 30;

      this.compactPyrometerNeedle.lineStyle(2.5, 0xffffff, 1);
      this.compactPyrometerNeedle.lineBetween(690, 230, 690 + Math.cos(rad) * needleLen, 230 + Math.sin(rad) * needleLen);
      this.compactPyrometerNeedle.fillStyle(0xfde047, 1);
      this.compactPyrometerNeedle.fillCircle(690 + Math.cos(rad) * needleLen, 230 + Math.sin(rad) * needleLen, 3);
    }

    if (this.compactProgressRing) {
      this.compactProgressRing.clear();
      // Tempered Ring (X: 775, Y: 225, Radius: 20)
      this.compactProgressRing.lineStyle(4, 0x1e293b, 0.9);
      this.compactProgressRing.strokeCircle(775, 225, 20);

      const progAngle = (this.heatingProgress / 100) * 360;
      if (progAngle > 0) {
        this.compactProgressRing.lineStyle(4.5, 0xf59e0b, 1);
        this.compactProgressRing.beginPath();
        this.compactProgressRing.arc(775, 225, 20, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + progAngle), false);
        this.compactProgressRing.strokePath();
      }
    }

    if (this.compactProgressLabel) {
      this.compactProgressLabel.setText(`%${Math.floor(this.heatingProgress)}`);
    }
    if (this.counterText) {
      this.counterText.setText(`TAVLANMA: %${Math.floor(this.heatingProgress)}`);
    }

    // 10. Goal Reached! Metal is incandescent and ready for forging!
    if (this.heatingProgress >= 100) {
      this.stage2Active = false;
      SoundFx.playSuccessTone();
      this.createHearthSparks(960, 660, 45);
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
  // AŞAMA 3: ÜRETİMİ YÖNET (ZAMANLAMALI ÇEKİÇ VURUŞU)
  // ==========================================
  private setupStage3(): void {
    this.currentStage = 3;
    this.hammerStrikes = 0;
    this.stage3Active = true;
    this.isHammerStriking = false;
    this.timingOscillator = 0;

    if (this.phaseTitleText) this.phaseTitleText.setText('BÖLÜM 2 / 6');
    if (this.objectiveText) this.objectiveText.setText('GÖREV: İbre Yeşil Alana Geldiğinde Ekrana Dokun ve Çekiç Vur');
    if (this.counterText) this.counterText.setText('VURUŞ: 0/3');

    this.stage3Container = this.add.container(0, 0);
    this.stage3Container.setDepth(10);

    // 1. In-Scene Workpiece on Anvil (Center: X: 980, Y: 480)
    this.anvilWorkpiece = this.add.container(980, 480);
    this.anvilWorkpiece.setDepth(12);

    this.workpieceSprite = this.add.image(0, 0, 'iron_glowing_ingot');
    this.workpieceSprite.setDisplaySize(190, 70);
    this.anvilWorkpiece.add(this.workpieceSprite);

    this.workpiecePlateGraphics = this.add.graphics();
    this.anvilWorkpiece.add(this.workpiecePlateGraphics);

    this.stage3Container.add(this.anvilWorkpiece);

    // 2. Blacksmith Hammer Tool (Poised ready above workpiece)
    this.hammerTool = this.add.image(1080, 350, 'smith_hammer');
    this.hammerTool.setDisplaySize(120, 120);
    this.hammerTool.setDepth(25);
    this.stage3Container.add(this.hammerTool);

    this.tweens.add({
      targets: this.hammerTool,
      y: 330,
      angle: -8,
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. Antique Forged Timing Bar Track (X: 960, Y: 240, Width: 520, Height: 36)
    const trackBg = this.add.graphics();
    trackBg.fillStyle(0x180d05, 0.94);
    trackBg.fillRoundedRect(960 - 260, 220, 520, 44, 12);
    trackBg.lineStyle(2.5, 0xd97706, 0.9);
    trackBg.strokeRoundedRect(960 - 260, 220, 520, 44, 12);
    this.stage3Container.add(trackBg);

    // Sweet Spot (Green Strike Zone) in Center: Width 96px (X: 960 - 48 to 960 + 48)
    const sweetSpot = this.add.graphics();
    sweetSpot.fillStyle(0x22c55e, 0.75);
    sweetSpot.fillRect(960 - 48, 225, 96, 34);
    sweetSpot.lineStyle(2, 0x86efac, 1);
    sweetSpot.strokeRect(960 - 48, 225, 96, 34);
    this.stage3Container.add(sweetSpot);

    const sweetSpotLabel = this.createText(960, 242, '★ VURUŞ ★', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    sweetSpotLabel.setOrigin(0.5);
    this.stage3Container.add(sweetSpotLabel);

    // Dynamic Sliding Needle
    this.timingSlider = this.add.graphics();
    this.timingSlider.setDepth(16);
    this.stage3Container.add(this.timingSlider);

    // 4. Full Touch / Click Interactive Zone across the whole Anvil
    const hitZone = this.add.zone(980, 480, 500, 360);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.setDepth(30);

    hitZone.on('pointerdown', () => {
      this.handleStage3Strike();
    });
    this.stage3Container.add(hitZone);

    this.pusula?.setMessage('İbre tam yeşil alana girdiğinde dokun ve örse çekiç vur!');
  }

  private updateStage3TimingBar(delta: number): void {
    if (!this.timingSlider) return;

    // Smooth continuous oscillation across the track
    this.timingOscillator += (delta / 1000) * 3.4;
    // Sweeps between (960 - 225) and (960 + 225)
    this.timingNeedleX = 960 + Math.sin(this.timingOscillator) * 225;

    this.timingSlider.clear();
    // Indicator Needle
    this.timingSlider.fillStyle(0xfde047, 1);
    this.timingSlider.fillTriangle(
      this.timingNeedleX - 8,
      210,
      this.timingNeedleX + 8,
      210,
      this.timingNeedleX,
      224
    );
    this.timingSlider.lineStyle(3, 0xfde047, 1);
    this.timingSlider.lineBetween(this.timingNeedleX, 222, this.timingNeedleX, 262);
  }

  private handleStage3Strike(): void {
    if (!this.stage3Active || this.isHammerStriking || this.hammerStrikes >= 3) return;

    this.isHammerStriking = true;

    // Check distance from center green zone (center: 960, radius: 48)
    const distFromSweetSpot = Math.abs(this.timingNeedleX - 960);
    const isSuccess = distFromSweetSpot <= 54;

    // Hammer swing animation
    this.tweens.add({
      targets: this.hammerTool,
      x: 980,
      y: 440,
      angle: 28,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeIn',
      onYoyo: () => {
        if (isSuccess) {
          this.onSuccessfulHammerStrike();
        } else {
          this.onMissedHammerStrike();
        }
      },
      onComplete: () => {
        this.isHammerStriking = false;
      },
    });
  }

  private onSuccessfulHammerStrike(): void {
    this.hammerStrikes++;
    SoundFx.playAnvilHit();
    this.cameras.main.shake(120, 0.007);
    this.createAnvilSparks(980, 480);

    if (this.counterText) {
      this.counterText.setText(`VURUŞ: ${this.hammerStrikes}/3`);
    }

    // Step-by-step visual deformation of the metal piece into a forged mechanical axle
    if (this.hammerStrikes === 1) {
      if (this.workpieceSprite) {
        this.workpieceSprite.setDisplaySize(230, 55);
        this.workpieceSprite.setScale(1.1, 0.8);
      }
      this.pusula?.setMessage('Tam isabet! Kütük yassılaştı ve uzadı.');
    } else if (this.hammerStrikes === 2) {
      if (this.workpieceSprite) {
        this.workpieceSprite.setDisplaySize(260, 45);
        this.workpieceSprite.setScale(1.0, 0.9);
      }
      this.pusula?.setMessage('Mükemmel vuruş! Mil formu şekilleniyor.');
    } else if (this.hammerStrikes === 3) {
      this.stage3Active = false;
      if (this.workpieceSprite) {
        this.workpieceSprite.setTexture('mech_axle');
        this.workpieceSprite.setDisplaySize(270, 60);
      }

      // Quench hiss & steam puffs
      SoundFx.playWaterQuench();
      this.createDenseSteamClouds(980, 480);

      this.pusula?.setMessage('Usta işi! Mekanizma mili başarıyla dövüldü ve sertleşti!');

      this.time.delayedCall(1000, () => {
        this.transitionToStage(4);
      });
    }
  }

  private onMissedHammerStrike(): void {
    this.totalErrors++;
    SoundFx.playChiselStrike();
    this.cameras.main.shake(50, 0.002);
    this.pusula?.setMessage('Ritmik ol çırak! İbre tam yeşil alandayken vur.');
  }

  private createAnvilSparks(x: number, y: number): void {
    for (let i = 0; i < 30; i++) {
      const spark = this.add.circle(
        x + Phaser.Math.Between(-30, 30),
        y + Phaser.Math.Between(-15, 15),
        Phaser.Math.Between(2.5, 6),
        0xffd54f,
        1
      );
      spark.setDepth(25);

      const angle = (Math.PI * 2 * i) / 30 + (Math.random() * 0.4 - 0.2);
      const speed = Phaser.Math.Between(70, 150);

      this.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(angle) * speed,
        y: spark.y + Math.sin(angle) * speed - 35,
        alpha: 0,
        scale: 0.15,
        duration: Phaser.Math.Between(350, 650),
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
  // AŞAMA 4: ESERİ TAMAMLA (MEKANİK PARÇA MONTAJI & ÇALIŞTIRMA)
  // ==========================================
  private setupStage4(): void {
    this.currentStage = 4;
    this.assembledCount = 0;
    this.isMechanismRunning = false;
    this.assemblySockets = [];
    this.assemblyParts = [];

    if (this.phaseTitleText) this.phaseTitleText.setText('BÖLÜM 2 / 6');
    if (this.objectiveText) this.objectiveText.setText('GÖREV: Mekanik Parçaları Doğru Yuvalara Sürükleyerek Mekanizmayı Tamamla');
    if (this.counterText) this.counterText.setText('MONTAJ: 0/4');

    this.stage4Container = this.add.container(0, 0);
    this.stage4Container.setDepth(10);

    // 1. Master Mechanical Chassis / Workbench Mounting Plate (Center: X: 960, Y: 500)
    const chassisPlate = this.add.graphics();
    chassisPlate.fillStyle(0x180d05, 0.94);
    chassisPlate.fillRoundedRect(960 - 280, 500 - 180, 560, 360, 20);
    chassisPlate.lineStyle(3, 0xd97706, 0.9);
    chassisPlate.strokeRoundedRect(960 - 280, 500 - 180, 560, 360, 20);

    // Wood & Iron Inlay Detail
    chassisPlate.lineStyle(1.5, 0x854d0e, 0.6);
    chassisPlate.strokeRoundedRect(960 - 265, 500 - 165, 530, 330, 14);
    this.stage4Container.add(chassisPlate);

    const chassisLabel = this.createText(960, 350, 'TARİHİ MEKANİK AKTARIM MEKANİZMASI TABLİYESİ', {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FDE68A',
    });
    chassisLabel.setOrigin(0.5);
    this.stage4Container.add(chassisLabel);

    // 2. Four Defined Assembly Sockets on the Chassis:
    // S1: Axle Shaft Socket (Center-Left)
    // S2: Bronze Gear Socket (Concentric on Axle)
    // S3: Crank Handle Socket (Right of Axle)
    // S4: Base Locking Pin Socket (Bottom Support)
    const socketDefs = [
      { id: 'socket_axle', x: 960, y: 500, radius: 65, name: 'Dövme Çelik Mil Yuvası' },
      { id: 'socket_gear', x: 860, y: 500, radius: 55, name: 'Bronz Dişli Çark Yuvası' },
      { id: 'socket_crank', x: 1060, y: 500, radius: 55, name: 'Kaldıraç Kolu Yuvası' },
      { id: 'socket_pin', x: 960, y: 610, radius: 45, name: 'Kilit Pimi Yuvası' },
    ];

    socketDefs.forEach((def) => {
      const ring = this.add.graphics();
      ring.lineStyle(2.5, 0xfde047, 0.85);
      ring.strokeCircle(def.x, def.y, def.radius);
      ring.fillStyle(0x0f0904, 0.6);
      ring.fillCircle(def.x, def.y, def.radius);

      const label = this.createText(def.x, def.y + def.radius + 14, def.name, {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#CBD5E1',
      });
      label.setOrigin(0.5);

      this.stage4Container?.add([ring, label]);

      this.assemblySockets.push({
        id: def.id,
        x: def.x,
        y: def.y,
        radius: def.radius,
        isFilled: false,
        name: def.name,
        slotRing: ring,
      });
    });

    // 3. Bottom Physical Tray for Draggable Mechanical Parts
    const trayBg = this.add.graphics();
    trayBg.fillStyle(0x120a04, 0.92);
    trayBg.fillRoundedRect(420, 885, 1080, 165, 18);
    trayBg.lineStyle(2.5, 0x854d0e, 0.9);
    trayBg.strokeRoundedRect(420, 885, 1080, 165, 18);
    this.stage4Container.add(trayBg);

    const trayLabel = this.createText(960, 900, 'MONTAJ PARÇALARI • DOĞRU YUVALARA SÜRÜKLEYEREK KİLİTLE', {
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FDE68A',
    });
    trayLabel.setOrigin(0.5);
    this.stage4Container.add(trayLabel);

    // 4 Draggable Mechanical Parts:
    const partConfigs = [
      { id: 'part_axle', targetSocket: 'socket_axle', title: '1. Çelik Mil', key: 'mech_axle', x: 550, y: 975, w: 140, h: 45 },
      { id: 'part_gear', targetSocket: 'socket_gear', title: '2. Dişli Çark', key: 'gear_medium', x: 820, y: 975, w: 75, h: 75 },
      { id: 'part_crank', targetSocket: 'socket_crank', title: '3. Kaldıraç Kolu', key: 'crank_handle', x: 1090, y: 975, w: 75, h: 75 },
      { id: 'part_pin', targetSocket: 'socket_pin', title: '4. Kilit Pimi', key: 'mech_pin', x: 1360, y: 975, w: 65, h: 65 },
    ];

    partConfigs.forEach((cfg) => {
      const pContainer = this.add.container(cfg.x, cfg.y);
      pContainer.setSize(cfg.w, cfg.h);
      pContainer.setDepth(20);

      const shadow = this.add.graphics();
      shadow.fillStyle(0x050201, 0.7);
      shadow.fillEllipse(0, cfg.h / 2 + 6, cfg.w, 18);
      pContainer.add(shadow);

      const sprite = this.add.image(0, 0, cfg.key);
      sprite.setDisplaySize(cfg.w, cfg.h);
      pContainer.add(sprite);

      const lbl = this.createText(0, cfg.h / 2 + 18, cfg.title, {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#FEF3C7',
      });
      lbl.setOrigin(0.5);
      pContainer.add(lbl);

      const partHitArea = new Phaser.Geom.Rectangle(-cfg.w / 2 - 15, -cfg.h / 2 - 15, cfg.w + 30, cfg.h + 30);
      pContainer.setInteractive(partHitArea, Phaser.Geom.Rectangle.Contains, true);
      this.input.setDraggable(pContainer);

      const partObj: MechAssemblyPart = {
        container: pContainer,
        id: cfg.id,
        targetSocketId: cfg.targetSocket,
        origX: cfg.x,
        origY: cfg.y,
        isPlaced: false,
      };
      this.assemblyParts.push(partObj);

      pContainer.on('dragstart', () => {
        if (partObj.isPlaced) return;
        pContainer.setDepth(35);
        SoundFx.playStoneDrag();
        this.tweens.add({
          targets: pContainer,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100,
        });
      });

      pContainer.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        if (partObj.isPlaced) return;
        pContainer.x = dragX;
        pContainer.y = dragY;
      });

      pContainer.on('dragend', () => {
        if (partObj.isPlaced) return;
        this.handleStage4Drop(partObj);
      });
    });

    this.pusula?.setMessage('Mekanik parçaları şasideki yuvalarına sürükle ve kilitle.');
  }

  private handleStage4Drop(part: MechAssemblyPart): void {
    const targetSocket = this.assemblySockets.find((s) => s.id === part.targetSocketId);
    if (!targetSocket) return;

    const dist = Phaser.Math.Distance.Between(part.container.x, part.container.y, targetSocket.x, targetSocket.y);

    if (dist <= 110) {
      // Correct Socket Match
      part.isPlaced = true;
      targetSocket.isFilled = true;
      part.container.disableInteractive();

      SoundFx.playLockSound();
      SoundFx.playGearSnap();
      this.cameras.main.shake(70, 0.003);

      // Snap precisely to target socket center
      this.tweens.add({
        targets: part.container,
        x: targetSocket.x,
        y: targetSocket.y,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 180,
        ease: 'Back.easeOut',
      });

      // Golden confirmation pulse on socket
      const glow = this.add.graphics();
      glow.fillStyle(0xfde047, 0.4);
      glow.fillCircle(targetSocket.x, targetSocket.y, targetSocket.radius + 15);
      glow.setDepth(18);
      this.stage4Container?.add(glow);

      this.tweens.add({
        targets: glow,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 450,
        onComplete: () => glow.destroy(),
      });

      this.assembledCount++;
      if (this.counterText) {
        this.counterText.setText(`MONTAJ: ${this.assembledCount}/4`);
      }

      if (this.assembledCount === 1) {
        this.pusula?.setMessage('Mil şasiye oturdu! Şimdi dişli çarkı yerleştir.');
      } else if (this.assembledCount === 2) {
        this.pusula?.setMessage('Dişli kilitlendi! Şimdi çevirme kolunu monte et.');
      } else if (this.assembledCount === 3) {
        this.pusula?.setMessage('Kaldıraç kolu takıldı! Son olarak kilit pimini sür.');
      } else if (this.assembledCount === 4) {
        this.onAllAssemblyPartsCompleted();
      }
    } else {
      // Missed socket -> Spring back smoothly
      SoundFx.playSandSlide();
      this.tweens.add({
        targets: part.container,
        x: part.origX,
        y: part.origY,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 250,
        ease: 'Back.easeOut',
        onComplete: () => part.container.setDepth(20),
      });
      this.pusula?.setMessage('Parçayı doğru yuvasının tam üzerine sürükle.');
    }
  }

  private onAllAssemblyPartsCompleted(): void {
    // All 4 parts locked in! Now make the mechanism run actively!
    this.isMechanismRunning = true;
    SoundFx.playGearSpin();
    SoundFx.playVictoryFanfare();

    // Camera zoom-in onto the active working mechanism
    this.cameras.main.zoomTo(1.15, 900);

    this.pusula?.setMessage('Başardın! Malzemeyi seçtin, süreci yönettin ve kendi eserini oluşturdun.');

    // Sparkle burst around the functioning machine
    for (let i = 0; i < 24; i++) {
      this.time.delayedCall(i * 60, () => {
        this.createHearthSparks(960 + Phaser.Math.Between(-100, 100), 500 + Phaser.Math.Between(-80, 80), 3);
      });
    }

    this.time.delayedCall(1500, () => {
      this.onGameCompleted();
    });
  }

  private updateStage4Mechanism(delta: number): void {
    // Smoothly rotate the gear and the crank handle together
    const gearPart = this.assemblyParts.find((p) => p.id === 'part_gear');
    const crankPart = this.assemblyParts.find((p) => p.id === 'part_crank');

    const rotSpeed = (delta / 1000) * 160; // 160 degrees per second
    if (gearPart) {
      gearPart.container.angle += rotSpeed;
    }
    if (crankPart) {
      crankPart.container.angle += rotSpeed;
    }
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
      if (this.stage4Container) {
        this.stage4Container.destroy();
        this.stage4Container = undefined;
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