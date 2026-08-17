import Phaser from 'phaser';
import { BaseScene } from '../BaseScene';
import { SceneKeys } from '../../../types/game';
import { GameStore } from '../../state/GameStore';
import { PusulaCharacter } from '../../objects/PusulaCharacter';
import { SoundFx } from '../../utils/audio';
import { EventBus } from '../../state/EventBus';

// Safe TypeScript Asset Imports for Vite production bundler
import ironStage1BgUrl from '../../../assets/iron_stage1_furnace.jpg';
import ironStage2BgUrl from '../../../assets/iron_stage2_anvil.jpg';
import ironStage3BgUrl from '../../../assets/iron_stage3_quench.jpg';
import ironStage4BgUrl from '../../../assets/iron_stage4_showcase.jpg';

import oreIronRedUrl from '../../../assets/svg/ore_iron_red.svg';
import oreCharcoalUrl from '../../../assets/svg/ore_charcoal.svg';
import serinhisarHotRodUrl from '../../../assets/svg/serinhisar_hot_rod.svg';
import serinhisarBladeForgingUrl from '../../../assets/svg/serinhisar_blade_forging.svg';
import serinhisarBladeHotUrl from '../../../assets/svg/serinhisar_blade_hot.svg';
import serinhisarBladeSteelUrl from '../../../assets/svg/serinhisar_blade_steel.svg';
import serinhisarSheathUrl from '../../../assets/svg/serinhisar_sheath.svg';
import smithHammerUrl from '../../../assets/svg/smith_hammer.svg';

interface MaterialPiece {
  container: Phaser.GameObjects.Container;
  id: string;
  origX: number;
  origY: number;
  isPlaced: boolean;
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

  // Stage 1 Objects (Furnace Feeding)
  private stage1Container?: Phaser.GameObjects.Container;
  private materials: MaterialPiece[] = [];
  private fedCount = 0;

  // Stage 2 Objects (Anvil Forging)
  private stage2Container?: Phaser.GameObjects.Container;
  private hammerStrikes = 0;
  private anvilHotBar?: Phaser.GameObjects.Image;
  private hammerTool?: Phaser.GameObjects.Image;
  private strikeGuideRing?: Phaser.GameObjects.Graphics;

  // Stage 3 Objects (Water Quenching)
  private stage3Container?: Phaser.GameObjects.Container;
  private quenchingTongsBlade?: Phaser.GameObjects.Image;
  private isQuenched = false;

  // Stage 4 Objects (Master Stamping & Sheathing)
  private stage4Container?: Phaser.GameObjects.Container;
  private isSheathed = false;
  private stampGlow?: Phaser.GameObjects.Text;

  private ANCIENT_FONT = '"Cinzel", "Trajan Pro", "Times New Roman", "Georgia", serif';

  constructor() {
    super(SceneKeys.DEMIR_CAGI);
  }

  preload(): void {
    if (!this.textures.exists('iron_stage1_furnace')) {
      this.load.image('iron_stage1_furnace', ironStage1BgUrl);
      this.load.image('iron_stage2_anvil', ironStage2BgUrl);
      this.load.image('iron_stage3_quench', ironStage3BgUrl);
      this.load.image('iron_stage4_showcase', ironStage4BgUrl);
    }
    if (!this.textures.exists('ore_iron_red')) {
      this.load.image('ore_iron_red', oreIronRedUrl);
      this.load.image('ore_charcoal', oreCharcoalUrl);
      this.load.image('serinhisar_hot_rod', serinhisarHotRodUrl);
      this.load.image('serinhisar_blade_forging', serinhisarBladeForgingUrl);
      this.load.image('serinhisar_blade_hot', serinhisarBladeHotUrl);
      this.load.image('serinhisar_blade_steel', serinhisarBladeSteelUrl);
      this.load.image('serinhisar_sheath', serinhisarSheathUrl);
      this.load.image('smith_hammer', smithHammerUrl);
    }
  }

  create(): void {
    // Reset state variables
    this.currentStage = 1;
    this.elapsedSeconds = 0;
    this.totalErrors = 0;
    this.isCompleted = false;
    this.fedCount = 0;
    this.hammerStrikes = 0;
    this.isQuenched = false;
    this.isSheathed = false;
    this.materials = [];

    // Smooth Camera Fade-in from World Map transition
    this.cameras.main.fadeIn(350, 7, 11, 25);

    // Lifecycle cleanup hooks
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUpScene, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanUpScene, this);

    // 1. Dynamic Stage Background (Depth 0 - 1920x1080)
    this.createBackgroundLayer();

    // 2. Slim Blacksmith Archaeology Header (Depth 100)
    this.createHeaderUI();

    // 3. Pusula Companion Character (Bottom Left - Depth 100)
    this.pusula = new PusulaCharacter(
      this,
      210,
      760,
      'Demirci ocağına hoş geldin! Önce ocağı 2 demir cevheri ve 1 meşe kömürüyle besleyelim.'
    );

    // 4. Start Stage 1
    this.setupStage1();

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

  public getCurrentStage(): number {
    return this.currentStage;
  }

  private cleanUpScene(): void {
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
    headerBg.fillStyle(0x180d05, 0.92);
    headerBg.fillRoundedRect(this.GAME_WIDTH / 2 - 620, 15, 1240, 64, 14);
    headerBg.lineStyle(2, 0xd97706, 0.85);
    headerBg.strokeRoundedRect(this.GAME_WIDTH / 2 - 620, 15, 1240, 64, 14);
    headerBg.setDepth(100);

    // 1. Left: Stage Title
    this.phaseTitleText = this.createText(this.GAME_WIDTH / 2 - 360, 47, '1/4: OCAĞI BESLE', {
      fontSize: '19px',
      fontStyle: '900',
      color: '#FDE68A',
    });
    this.phaseTitleText.setOrigin(0.5);
    this.phaseTitleText.setDepth(101);

    // 2. Center: Objective Caption
    this.objectiveText = this.createText(this.GAME_WIDTH / 2 + 80, 47, 'GÖREV: 2 Demir Cevheri ve 1 Kömürü Kor Ateşine Sürükle', {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FCD34D',
    });
    this.objectiveText.setOrigin(0.5);
    this.objectiveText.setDepth(101);

    // 3. Right: Progress Counter & Elapsed Time
    this.counterText = this.createText(this.GAME_WIDTH / 2 + 370, 47, 'HAMMADDE: 0/3', {
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

  // ==========================================
  // AŞAMA 1: FIRIN BESLEME (iron_stage1_furnace)
  // ==========================================
  private setupStage1(): void {
    this.currentStage = 1;
    this.fedCount = 0;
    this.materials = [];

    this.stage1Container = this.add.container(0, 0);
    this.stage1Container.setDepth(10);

    // Furnace Mouth Target Glow (Center: X: 960, Y: 560)
    const furnaceGlow = this.add.graphics();
    furnaceGlow.fillStyle(0xff6f00, 0.25);
    furnaceGlow.fillCircle(960, 560, 160);
    furnaceGlow.lineStyle(2.5, 0xffd54f, 0.8);
    furnaceGlow.strokeCircle(960, 560, 160);
    this.stage1Container.add(furnaceGlow);

    this.tweens.add({
      targets: furnaceGlow,
      alpha: { from: 0.3, to: 0.85 },
      scaleX: { from: 0.95, to: 1.05 },
      scaleY: { from: 0.95, to: 1.05 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    // Bottom Material Tray
    const trayBg = this.add.graphics();
    trayBg.fillStyle(0x140c04, 0.94);
    trayBg.fillRoundedRect(this.GAME_WIDTH / 2 - 540, 880, 1080, 175, 18);
    trayBg.lineStyle(2.5, 0xd97706, 0.85);
    trayBg.strokeRoundedRect(this.GAME_WIDTH / 2 - 540, 880, 1080, 175, 18);

    const trayLabel = this.createText(this.GAME_WIDTH / 2, 898, 'DEMİRCİ HAMMADDE TEPSİSİ (FIRIN BESLEME)', {
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FDE68A',
    });
    trayLabel.setOrigin(0.5);
    this.stage1Container.add([trayBg, trayLabel]);

    // 3 Pieces: 2 Iron Ores + 1 Oak Charcoal
    const configs = [
      { id: 'ore_1', title: 'Kızıl Demir Cevheri (1)', key: 'ore_iron_red', x: 640, y: 965 },
      { id: 'ore_2', title: 'Kızıl Demir Cevheri (2)', key: 'ore_iron_red', x: 960, y: 965 },
      { id: 'coal', title: 'Meşe Kömürü Bloğu', key: 'ore_charcoal', x: 1280, y: 965 },
    ];

    configs.forEach((cfg) => {
      const pContainer = this.add.container(cfg.x, cfg.y);
      pContainer.setSize(120, 90);
      pContainer.setDepth(15);

      const shadow = this.add.graphics();
      shadow.fillStyle(0x0a0502, 0.6);
      shadow.fillEllipse(0, 34, 90, 20);
      pContainer.add(shadow);

      const img = this.add.image(0, 0, cfg.key);
      img.setDisplaySize(100, 75);
      pContainer.add(img);

      const lbl = this.createText(0, 48, cfg.title, {
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#FEF3C7',
      });
      lbl.setOrigin(0.5);
      pContainer.add(lbl);

      pContainer.setInteractive({ useHandCursor: true });
      this.input.setDraggable(pContainer);

      const matObj: MaterialPiece = {
        container: pContainer,
        id: cfg.id,
        origX: cfg.x,
        origY: cfg.y,
        isPlaced: false,
      };
      this.materials.push(matObj);

      pContainer.on('dragstart', () => {
        if (matObj.isPlaced) return;
        pContainer.setDepth(30);
        SoundFx.playStoneDrag();
        this.tweens.add({
          targets: pContainer,
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 120,
        });
      });

      pContainer.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        if (matObj.isPlaced) return;
        pContainer.x = dragX;
        pContainer.y = dragY;
      });

      pContainer.on('dragend', () => {
        if (matObj.isPlaced) return;
        const dist = Phaser.Math.Distance.Between(pContainer.x, pContainer.y, 960, 560);
        if (dist <= 170) {
          this.feedMaterialIntoHearth(matObj);
        } else {
          SoundFx.playSandSlide();
          this.tweens.add({
            targets: pContainer,
            x: matObj.origX,
            y: matObj.origY,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 250,
            ease: 'Back.easeOut',
            onComplete: () => pContainer.setDepth(15),
          });
        }
      });
    });
  }

  private feedMaterialIntoHearth(mat: MaterialPiece): void {
    mat.isPlaced = true;
    mat.container.disableInteractive();

    SoundFx.playChiselStrike();
    this.createHearthSparks(960, 560);

    this.tweens.add({
      targets: mat.container,
      x: 960,
      y: 560,
      scaleX: 0.1,
      scaleY: 0.1,
      alpha: 0,
      duration: 240,
      ease: 'Quad.easeIn',
      onComplete: () => {
        mat.container.setVisible(false);
      },
    });

    this.fedCount++;
    if (this.counterText) {
      this.counterText.setText(`HAMMADDE: ${this.fedCount}/3`);
    }

    if (this.fedCount === 1) {
      this.pusula?.setMessage('Demir cevheri kor ateşine girdi! Şimdi diğer parçaları da atalım.');
    } else if (this.fedCount === 2) {
      this.pusula?.setMessage('Meşe kömürü yüksek ısının ve karbon dengesinin kaynağıdır.');
    } else if (this.fedCount === 3) {
      this.pusula?.setMessage('Ocak hazır! Demir 1200°C akkor kıvama geldi; şimdi örse geçiyoruz!');

      this.time.delayedCall(700, () => {
        this.transitionToStage(2);
      });
    }
  }

  private createHearthSparks(x: number, y: number): void {
    for (let i = 0; i < 24; i++) {
      const spark = this.add.circle(
        x + Phaser.Math.Between(-30, 30),
        y + Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(3, 7),
        0xff6f00,
        1
      );
      spark.setDepth(25);

      const angle = (Math.PI * 2 * i) / 24;
      const speed = Phaser.Math.Between(50, 110);

      this.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(angle) * speed,
        y: spark.y + Math.sin(angle) * speed - 25,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(400, 750),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  // ==========================================
  // AŞAMA 2: ÖRS ÜZERİNDE DÖVME (iron_stage2_anvil)
  // ==========================================
  private setupStage2(): void {
    this.currentStage = 2;
    this.hammerStrikes = 0;

    if (this.phaseTitleText) this.phaseTitleText.setText('2/4: ÖRS ÜZERİNDE DÖVME');
    if (this.objectiveText) this.objectiveText.setText('GÖREV: Örs Üzerindeki Akkor Demire 3 Ritmik Çekiç Darbesi İndir');
    if (this.counterText) this.counterText.setText('ÇEKİÇ DARBESİ: 0/3');

    this.stage2Container = this.add.container(0, 0);
    this.stage2Container.setDepth(10);

    // Target strike guide ring over glowing hot billet (X: 980, Y: 465)
    this.strikeGuideRing = this.add.graphics();
    this.strikeGuideRing.lineStyle(3, 0xffd54f, 0.9);
    this.strikeGuideRing.strokeCircle(980, 465, 55);
    this.stage2Container.add(this.strikeGuideRing);

    this.tweens.add({
      targets: this.strikeGuideRing,
      scaleX: { from: 0.85, to: 1.2 },
      scaleY: { from: 0.85, to: 1.2 },
      alpha: { from: 0.4, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Dynamic Hot Workpiece Overlay
    this.anvilHotBar = this.add.image(980, 465, 'serinhisar_hot_rod');
    this.anvilHotBar.setDisplaySize(200, 50);
    this.stage2Container.add(this.anvilHotBar);

    // Floating Animated Hammer Tool
    this.hammerTool = this.add.image(1050, 360, 'smith_hammer');
    this.hammerTool.setDisplaySize(110, 110);
    this.hammerTool.setDepth(25);
    this.stage2Container.add(this.hammerTool);

    this.tweens.add({
      targets: this.hammerTool,
      y: 340,
      angle: -10,
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Touch Interactive Hit Zone (X: 980, Y: 465, Radius: 120px)
    const hitZone = this.add.zone(980, 465, 240, 200);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.setDepth(30);

    hitZone.on('pointerdown', () => {
      this.handleStage2HammerHit(hitZone);
    });
  }

  private handleStage2HammerHit(hitZone: Phaser.GameObjects.Zone): void {
    if (this.hammerStrikes >= 3 || !this.anvilHotBar || !this.hammerTool) return;

    this.hammerStrikes++;

    // Hammer swing animation
    this.tweens.add({
      targets: this.hammerTool,
      x: 980,
      y: 440,
      angle: 25,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeIn',
    });

    // Sound & 100ms camera shake
    SoundFx.playAnvilHit();
    this.cameras.main.shake(100, 0.006);

    // Metal sparks
    this.createAnvilSparks(980, 465);

    if (this.counterText) {
      this.counterText.setText(`ÇEKİÇ DARBESİ: ${this.hammerStrikes}/3`);
    }

    if (this.hammerStrikes === 1) {
      this.anvilHotBar.setScale(1.25, 0.85);
      this.pusula?.setMessage('İlk darbe! Çubuk yassılaşarak namlu tabanına dönüştü.');
    } else if (this.hammerStrikes === 2) {
      this.anvilHotBar.setTexture('serinhisar_blade_forging');
      this.anvilHotBar.setDisplaySize(260, 65);
      this.anvilHotBar.setScale(1.0);
      this.pusula?.setMessage('İkinci darbe! Namlu sivrilip sırt eğimi oluştu.');
    } else if (this.hammerStrikes === 3) {
      this.anvilHotBar.setTexture('serinhisar_blade_hot');
      this.anvilHotBar.setDisplaySize(300, 70);
      hitZone.disableInteractive();
      this.hammerTool.setVisible(false);
      if (this.strikeGuideRing) this.strikeGuideRing.setVisible(false);

      this.pusula?.setMessage('Kusursuz Serinhisar namlu profili ortaya çıktı! Şimdi su verme aşamasına geçiyoruz!');

      this.time.delayedCall(700, () => {
        this.transitionToStage(3);
      });
    }
  }

  private createAnvilSparks(x: number, y: number): void {
    for (let i = 0; i < 30; i++) {
      const spark = this.add.circle(
        x + Phaser.Math.Between(-25, 25),
        y + Phaser.Math.Between(-15, 15),
        Phaser.Math.Between(2.5, 6),
        0xffd54f,
        1
      );
      spark.setDepth(20);

      const angle = (Math.PI * 2 * i) / 30 + (Math.random() * 0.4 - 0.2);
      const speed = Phaser.Math.Between(60, 140);

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

  // ==========================================
  // AŞAMA 3: SU VERME VE BUHAR (iron_stage3_quench)
  // ==========================================
  private setupStage3(): void {
    this.currentStage = 3;
    this.isQuenched = false;

    if (this.phaseTitleText) this.phaseTitleText.setText('3/4: SU VERME & TAVLAMA');
    if (this.objectiveText) this.objectiveText.setText('GÖREV: Akkor Namluyu Su Teknesine Daldırarak Çelikleştir');
    if (this.counterText) this.counterText.setText('TAVLAMA: %0');

    this.stage3Container = this.add.container(0, 0);
    this.stage3Container.setDepth(10);

    // Glowing Hot Blade held by tongs in center of water surface (X: 960, Y: 580)
    this.quenchingTongsBlade = this.add.image(960, 560, 'serinhisar_blade_hot');
    this.quenchingTongsBlade.setDisplaySize(320, 75);
    this.quenchingTongsBlade.setAngle(20);
    this.quenchingTongsBlade.setDepth(12);
    this.stage3Container.add(this.quenchingTongsBlade);

    // Water ripple guide circle
    const rippleGuide = this.add.graphics();
    rippleGuide.lineStyle(2.5, 0x38bdf8, 0.8);
    rippleGuide.strokeCircle(960, 580, 75);
    this.stage3Container.add(rippleGuide);

    this.tweens.add({
      targets: rippleGuide,
      scaleX: { from: 0.8, to: 1.25 },
      scaleY: { from: 0.8, to: 1.25 },
      alpha: { from: 0.3, to: 0.9 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    const actionPrompt = this.createText(960, 460, '👇 Namluyu Suya Daldırmak İçin Dokun / Tıkla', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FDE68A',
    });
    actionPrompt.setOrigin(0.5);
    this.stage3Container.add(actionPrompt);

    // Interactive Quench Zone
    const quenchZone = this.add.zone(960, 580, 360, 240);
    quenchZone.setInteractive({ useHandCursor: true });
    quenchZone.setDepth(30);

    quenchZone.once('pointerdown', () => {
      quenchZone.destroy();
      actionPrompt.destroy();
      rippleGuide.destroy();
      this.performQuenchingAction();
    });
  }

  private performQuenchingAction(): void {
    if (this.isQuenched || !this.quenchingTongsBlade) return;
    this.isQuenched = true;

    // Plunge deeper into water
    this.tweens.add({
      targets: this.quenchingTongsBlade,
      y: 600,
      duration: 350,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        // Sound & Steam particles
        SoundFx.playWaterQuench();
        this.cameras.main.shake(90, 0.003);

        // Turn to cold polished high-carbon steel
        this.quenchingTongsBlade?.setTexture('serinhisar_blade_steel');
        this.createDenseSteamClouds(960, 580);

        if (this.counterText) {
          this.counterText.setText('TAVLAMA: %100');
        }

        this.pusula?.setMessage('Su verildi! Çelik sertleşti ve parlak namlu çeliğine dönüştü.');

        this.time.delayedCall(900, () => {
          this.transitionToStage(4);
        });
      },
    });
  }

  private createDenseSteamClouds(x: number, y: number): void {
    for (let i = 0; i < 40; i++) {
      const steam = this.add.circle(
        x + Phaser.Math.Between(-60, 60),
        y + Phaser.Math.Between(-30, 30),
        Phaser.Math.Between(15, 35),
        0xf1f5f9,
        0.85
      );
      steam.setDepth(22);

      this.tweens.add({
        targets: steam,
        y: steam.y - Phaser.Math.Between(90, 220),
        x: steam.x + Phaser.Math.Between(-70, 70),
        alpha: 0,
        scale: 2.0,
        duration: Phaser.Math.Between(900, 1600),
        ease: 'Quad.easeOut',
        onComplete: () => steam.destroy(),
      });
    }
  }

  // ==========================================
  // AŞAMA 4: USTA DAMGASI VE KINLAMA (iron_stage4_showcase)
  // ==========================================
  private setupStage4(): void {
    this.currentStage = 4;
    this.isSheathed = false;

    if (this.phaseTitleText) this.phaseTitleText.setText('4/4: SERİNHİSAR DAMGASI & KINLAMA');
    if (this.objectiveText) this.objectiveText.setText('GÖREV: Namluya "SERİNHİSAR" Damgasını Vur ve Bıçağı Kınına Sür');
    if (this.counterText) this.counterText.setText('KINLAMA: 0/1');

    this.stage4Container = this.add.container(0, 0);
    this.stage4Container.setDepth(10);

    // Step 4A: Master Stamp Punch on Blade (X: 430, Y: 560)
    this.time.delayedCall(450, () => {
      SoundFx.playStampEngrave();
      this.cameras.main.shake(80, 0.004);
      this.createStampSparks(430, 560);

      this.stampGlow = this.add.text(430, 560, '★ SERİNHİSAR ★', {
        fontFamily: this.ANCIENT_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#FDE047',
        shadow: { color: '#B45309', blur: 8, fill: true },
      });
      this.stampGlow.setOrigin(0.5, 0.5);
      this.stampGlow.setAngle(-25);
      this.stampGlow.setDepth(15);
      this.stage4Container?.add(this.stampGlow);

      this.pusula?.setMessage('Usta "SERİNHİSAR" damgası vuruldu! Şimdi bıçağı deri kınına yerleştir.');

      // Step 4B: Sheathing Interaction
      this.time.delayedCall(600, () => {
        this.enableShowcaseSheathing();
      });
    });
  }

  private createStampSparks(x: number, y: number): void {
    for (let i = 0; i < 25; i++) {
      const spark = this.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-15, 15),
        Phaser.Math.Between(2.5, 5),
        0xfde047,
        1
      );
      spark.setDepth(20);

      this.tweens.add({
        targets: spark,
        y: spark.y - Phaser.Math.Between(25, 60),
        x: spark.x + Phaser.Math.Between(-35, 35),
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(350, 700),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  private enableShowcaseSheathing(): void {
    if (!this.stage4Container) return;

    const actionPrompt = this.createText(this.GAME_WIDTH / 2, 850, '👆 Bıçağı Kınına Kilitlemek İçin Dokun / Tıkla', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FDE68A',
    });
    actionPrompt.setOrigin(0.5);
    this.stage4Container.add(actionPrompt);

    const sheatheZone = this.add.zone(this.GAME_WIDTH / 2, 540, 900, 400);
    sheatheZone.setInteractive({ useHandCursor: true });
    sheatheZone.setDepth(30);

    sheatheZone.once('pointerdown', () => {
      sheatheZone.destroy();
      actionPrompt.destroy();
      this.performFinalSheathing();
    });
  }

  private performFinalSheathing(): void {
    if (this.isSheathed) return;
    this.isSheathed = true;

    // Play crisp leather sheathing and metal lock sound
    SoundFx.playSwordSheath();
    this.cameras.main.shake(80, 0.003);

    // Celebratory light glow
    const lockGlow = this.add.graphics();
    lockGlow.fillStyle(0xffd54f, 0.3);
    lockGlow.fillCircle(560, 440, 90);
    lockGlow.setDepth(18);
    this.stage4Container?.add(lockGlow);

    this.tweens.add({
      targets: lockGlow,
      alpha: 0,
      scaleX: 1.8,
      scaleY: 1.8,
      duration: 600,
      onComplete: () => lockGlow.destroy(),
    });

    if (this.counterText) {
      this.counterText.setText('KINLAMA: 1/1');
    }

    this.pusula?.setMessage('Muhteşem bir zanaat! Bin yıllık Serinhisar Bıçağı başarıyla dövüldü ve kınlandı!');

    this.time.delayedCall(850, () => {
      this.onGameCompleted();
    });
  }

  // ==========================================
  // CAMERA TRANSITIONS BETWEEN STAGES (300ms fade)
  // ==========================================
  private transitionToStage(nextStage: 2 | 3 | 4): void {
    // 300ms Fade out
    this.cameras.main.fadeOut(300, 5, 3, 2);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Clean up previous stage containers
      if (this.stage1Container) {
        this.stage1Container.destroy();
        this.stage1Container = undefined;
      }
      if (this.stage2Container) {
        this.stage2Container.destroy();
        this.stage2Container = undefined;
      }
      if (this.stage3Container) {
        this.stage3Container.destroy();
        this.stage3Container = undefined;
      }

      // Switch Background Image
      if (nextStage === 2) {
        this.bgImage?.setTexture('iron_stage2_anvil');
        this.setupStage2();
      } else if (nextStage === 3) {
        this.bgImage?.setTexture('iron_stage3_quench');
        this.setupStage3();
      } else if (nextStage === 4) {
        this.bgImage?.setTexture('iron_stage4_showcase');
        this.setupStage4();
      }

      // 300ms Fade in
      this.cameras.main.fadeIn(300, 5, 3, 2);
    });
  }

  private onGameCompleted(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;

    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    // Mark Module 2 Completed in GameStore
    GameStore.completeModule('iron_age');

    this.time.delayedCall(600, () => {
      this.createMonumentalSteleVictoryModal();
    });
  }

  /**
   * Monumental Ancient Stone Stele Victory Modal (Matching Göbeklitepe Standard)
   * Size: 1040x600 px, Center: (X: 960, Y: 530), Serif Antiqua Typography
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
    steleSlab.lineBetween(-steleW / 2 + 18, steleH / 2 - 18 - bLen, -steleW / 2 + 18, steleH / 2 - 18);
    steleSlab.lineBetween(-steleW / 2 + 18, steleH / 2 - 18, -steleW / 2 + 18 + bLen, steleH / 2 - 18);
    // Bottom-Right
    steleSlab.lineBetween(steleW / 2 - 18 - bLen, steleH / 2 - 18, steleW / 2 - 18, steleH / 2 - 18);
    steleSlab.lineBetween(steleW / 2 - 18, steleH / 2 - 18 - bLen, steleW / 2 - 18, steleH / 2 - 18);

    modal.add(steleSlab);

    // 4. Header Section: Monumental Gold Leaf Title with ⚔️ Icon (Y: -238, -188)
    const iconHeader = this.add.text(0, -238, '⚔️', {
      fontSize: '44px',
    });
    iconHeader.setOrigin(0.5, 0.5);

    const titleText = this.add.text(0, -188, 'SERİNHİSAR DEMİR ZANAATI TAMAMLANDI', {
      fontFamily: this.ANCIENT_FONT,
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#FEF08A',
      shadow: { color: '#B45309', blur: 14, fill: true },
    });
    titleText.setOrigin(0.5, 0.5);
    modal.add([iconHeader, titleText]);

    // 5. Archaeological Discovery Note (Y: -118, 22px, 880px width)
    const discoveryNote = this.add.text(
      0,
      -118,
      'Bin yıllık Denizli Serinhisar demircilik geleneği; yüksek ısıyla tavlanan çeliğin ustalıkla işlenmesiyle dünya çapında bir zanaata dönüştü.',
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

    // 6. Enlarged 3 Skill Assessment Meters (Y: -20, 26px)
    const badgeRowY = -20;
    const badgeItems = [
      { text: '👁️ GÖZLEM: ⭐⭐⭐', x: -320 },
      { text: '⚒️ USTALIK: ⭐⭐⭐', x: 0 },
      { text: '📐 METALURJİ: ⭐⭐⭐', x: 320 },
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

    // 7. Performance Stats Line (Y: +65)
    const statsText = this.add.text(
      0,
      65,
      `⏱️ Süre: ${this.elapsedSeconds} sn    •    🎯 Hata: ${this.totalErrors}    •    🏆 Ustalık: %100`,
      {
        fontFamily: this.ANCIENT_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#E5E7EB',
      }
    );
    statsText.setOrigin(0.5, 0.5);
    modal.add(statsText);

    // 8. Monumental Golden Age Button: "SONRAKİ ÇAĞA GEÇ ➔" (Y: +185, 520x70 px)
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

    this.createVictorySparks(this.GAME_WIDTH / 2, 530);
  }

  private createVictorySparks(x: number, y: number): void {
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
