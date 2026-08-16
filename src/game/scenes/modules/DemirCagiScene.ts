import { BaseScene } from '../BaseScene';
import { SceneKeys } from '../../../types/game';
import { GameStore } from '../../state/GameStore';
import { PusulaCharacter } from '../../objects/PusulaCharacter';
import { OreSampleNode } from '../../objects/OreSampleNode';
import type { OreSampleConfig } from '../../objects/OreSampleNode';
import { TemperatureGauge } from '../../objects/TemperatureGauge';
import { StrikePointNode } from '../../objects/StrikePointNode';
import type { StrikePointConfig } from '../../objects/StrikePointNode';
import { VictoryModal } from '../../objects/VictoryModal';
import { SoundFx } from '../../utils/audio';
import { EventBus } from '../../state/EventBus';
import Phaser from 'phaser';

// Safe TypeScript Asset Imports for Vite production bundler
import oreStoneUrl from '../../../assets/svg/ore_stone.svg';
import oreCopperUrl from '../../../assets/svg/ore_copper.svg';
import oreBronzeUrl from '../../../assets/svg/ore_bronze.svg';
import oreIronUrl from '../../../assets/svg/ore_iron.svg';
import bellowsToolUrl from '../../../assets/svg/bellows_tool.svg';
import hammerToolUrl from '../../../assets/svg/hammer_tool.svg';
import chiselRawUrl from '../../../assets/svg/chisel_raw.svg';
import chiselForgedUrl from '../../../assets/svg/chisel_forged.svg';

export class DemirCagiScene extends BaseScene {
  private pusula?: PusulaCharacter;
  private currentPhase = 1;
  private wrongMaterialPicks = 0;
  private totalErrors = 0;
  private elapsedSeconds = 0;
  private timerEvent?: Phaser.Time.TimerEvent;
  private timerText?: Phaser.GameObjects.Text;
  private phaseTitleText?: Phaser.GameObjects.Text;
  private isCompleted = false;

  // Phase 1 Objects
  private oreNodes: OreSampleNode[] = [];
  private workbenchGraphics?: Phaser.GameObjects.Graphics;

  // Phase 2 Objects
  private tempGauge?: TemperatureGauge;
  private bellowsBtn?: Phaser.GameObjects.Container;
  private furnaceFireGraphics?: Phaser.GameObjects.Graphics;

  // Phase 3 Objects
  private anvilGraphics?: Phaser.GameObjects.Graphics;
  private rawIronBlock?: Phaser.GameObjects.Image;
  private forgedChisel?: Phaser.GameObjects.Image;
  private hammerSprite?: Phaser.GameObjects.Image;
  private strikePoints: StrikePointNode[] = [];
  private currentStrikeIndex = 0;
  private coolingTimer?: Phaser.Time.TimerEvent;
  private isMetalCool = false;

  constructor() {
    super(SceneKeys.DEMIR_CAGI);
  }

  preload(): void {
    if (!this.textures.exists('ore_stone')) {
      this.load.image('ore_stone', oreStoneUrl);
      this.load.image('ore_copper', oreCopperUrl);
      this.load.image('ore_bronze', oreBronzeUrl);
      this.load.image('ore_iron', oreIronUrl);
      this.load.image('bellows_tool', bellowsToolUrl);
      this.load.image('hammer_tool', hammerToolUrl);
      this.load.image('chisel_raw', chiselRawUrl);
      this.load.image('chisel_forged', chiselForgedUrl);
    }
  }

  create(): void {
    this.currentPhase = 1;
    this.wrongMaterialPicks = 0;
    this.totalErrors = 0;
    this.elapsedSeconds = 0;
    this.isCompleted = false;
    this.currentStrikeIndex = 0;
    this.isMetalCool = false;
    this.oreNodes = [];
    this.strikePoints = [];

    this.cameras.main.fadeIn(350, 7, 11, 25);

    // 1. Forge Cave Atmosphere Environment Background
    this.createForgeEnvironment();

    // 2. Header UI Panel
    this.createHeaderUI();

    // 3. Setup Phase 1: Material Workbench (4 Physical Material Samples)
    this.setupPhase1Workbench();

    // 4. Pusula Companion Character (Bottom Left)
    this.pusula = new PusulaCharacter(
      this,
      240,
      760,
      'Isıya ve darbeye dayanıklı doğru malzemeyi bul!'
    );

    // 5. Neutral Elapsed Timer
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

    // 6. Corner Back Button
    this.createCornerBackButton();

    EventBus.emit('current-scene-ready', SceneKeys.DEMIR_CAGI);
  }

  update(_time: number, delta: number): void {
    // Phase 2 Temperature Equilibrium Update
    if (this.currentPhase === 2 && this.tempGauge && !this.tempGauge.isCompleted) {
      this.tempGauge.updateGauge(delta, () => this.onPhase2Complete());

      // Update Pusula temperature advice
      const zoneState = this.tempGauge.getZoneState();
      if (zoneState === 'low') {
        this.pusula?.setMessage('Biraz daha hızlı körükle!');
      } else if (zoneState === 'high') {
        this.pusula?.setMessage('Ateşi biraz sakinleştir!');
      } else {
        this.pusula?.setMessage('Harika! Ateş ideal dövme sıcaklığında!');
      }
    }
  }

  private createForgeEnvironment(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0505, 1);
    bg.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);

    // Fiery Furnace Ambient Glow (Center Background)
    const fireGlow = this.add.graphics();
    fireGlow.fillStyle(0xff5722, 0.2);
    fireGlow.fillCircle(this.GAME_WIDTH / 2, 420, 500);

    // Cave Stone Wall Texture Silhouettes
    const caveWalls = this.add.graphics();
    caveWalls.fillStyle(0x1c1312, 0.8);
    caveWalls.fillRect(0, 0, 300, 1080);
    caveWalls.fillRect(1620, 0, 300, 1080);

    // Central Blacksmith Furnace Fire Arch Structure
    const furnaceArch = this.add.graphics();
    furnaceArch.fillStyle(0x2c1b18, 1);
    furnaceArch.fillRoundedRect(this.GAME_WIDTH / 2 - 240, 200, 480, 340, 30);
    furnaceArch.lineStyle(4, 0xff5722, 0.8);
    furnaceArch.strokeRoundedRect(this.GAME_WIDTH / 2 - 240, 200, 480, 340, 30);

    // Furnace Fire Flame Area
    this.furnaceFireGraphics = this.add.graphics();
    this.renderFurnaceFire(0xff9800);
  }

  private renderFurnaceFire(color: number): void {
    if (!this.furnaceFireGraphics) return;
    this.furnaceFireGraphics.clear();
    this.furnaceFireGraphics.fillStyle(color, 0.85);
    this.furnaceFireGraphics.fillTriangle(
      this.GAME_WIDTH / 2 - 120, 480,
      this.GAME_WIDTH / 2, 270,
      this.GAME_WIDTH / 2 + 120, 480
    );
    this.furnaceFireGraphics.fillStyle(0xffeb3b, 0.9);
    this.furnaceFireGraphics.fillTriangle(
      this.GAME_WIDTH / 2 - 70, 480,
      this.GAME_WIDTH / 2, 330,
      this.GAME_WIDTH / 2 + 70, 480
    );
  }

  private createHeaderUI(): void {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a1128, 0.92);
    headerBg.fillRoundedRect(this.GAME_WIDTH / 2 - 500, 20, 1000, 70, 16);
    headerBg.lineStyle(2, 0xe67e22, 0.8);
    headerBg.strokeRoundedRect(this.GAME_WIDTH / 2 - 500, 20, 1000, 70, 16);

    this.phaseTitleText = this.createText(this.GAME_WIDTH / 2 - 260, 55, 'AŞAMA 1: MALZEMEYİ KEŞFET', {
      fontSize: '24px',
      fontStyle: '900',
      color: '#E67E22',
    });
    this.phaseTitleText.setOrigin(0.5);

    this.timerText = this.createText(this.GAME_WIDTH / 2 + 340, 55, 'SÜRE: 00:00', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#F8FAFC',
    });
    this.timerText.setOrigin(0.5);
  }

  private updateTimerUI(): void {
    if (!this.timerText) return;
    const mins = Math.floor(this.elapsedSeconds / 60);
    const secs = this.elapsedSeconds % 60;
    this.timerText.setText(`SÜRE: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
  }

  // =========================================================================
  // AŞAMA 1 – MALZEMEYİ KEŞFET
  // =========================================================================

  private setupPhase1Workbench(): void {
    // Physical Wooden Workbench Frame
    this.workbenchGraphics = this.add.graphics();
    this.workbenchGraphics.fillStyle(0x3e2723, 0.95);
    this.workbenchGraphics.fillRoundedRect(this.GAME_WIDTH / 2 - 550, 560, 1100, 260, 24);
    this.workbenchGraphics.lineStyle(3, 0xffd700, 0.7);
    this.workbenchGraphics.strokeRoundedRect(this.GAME_WIDTH / 2 - 550, 560, 1100, 260, 24);

    const benchText = this.createText(this.GAME_WIDTH / 2, 582, 'ATÖLYE TEZGÂHI - MALZEME ÖRNEKLERİ', {
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    benchText.setOrigin(0.5);

    // 4 Material Samples Configs (Taş, Bakır Cevheri, Bronz Külçe, Demir Cevheri)
    const samples: OreSampleConfig[] = [
      { id: 'stone', title: 'Taş Örneği', svgKey: 'ore_stone', isCorrect: false, explanation: 'Taş yüksek darbede kırılır.', x: 540, y: 700 },
      { id: 'copper', title: 'Bakır Cevheri', svgKey: 'ore_copper', isCorrect: false, explanation: 'Bakır yumuşak bir metaldir, yüksek ısıda eğilir.', x: 820, y: 700 },
      { id: 'bronze', title: 'Bronz Külçe', svgKey: 'ore_bronze', isCorrect: false, explanation: 'Bronz, bakır ve kalayın birleştirilmesiyle elde edilen bir alaşımdır. Demir kadar sert araçlar için uygun değildir.', x: 1100, y: 700 },
      { id: 'iron', title: 'Demir Cevheri', svgKey: 'ore_iron', isCorrect: true, explanation: 'Harika! Demir cevheri yüksek ısıda dövülerek en dayanıklı araçları oluşturur.', x: 1380, y: 700 },
    ];

    samples.forEach((cfg) => {
      const node = new OreSampleNode(this, cfg, (selected) => this.handleOreSelected(selected));
      this.oreNodes.push(node);
    });
  }

  private handleOreSelected(sample: OreSampleNode): void {
    if (this.currentPhase !== 1) return;

    if (!sample.config.isCorrect) {
      this.wrongMaterialPicks++;
      this.totalErrors++;
      this.pusula?.setMessage(sample.config.explanation);

      // Trigger hint pulse on Demir Cevheri after 2 wrong picks
      if (this.wrongMaterialPicks >= 2) {
        const ironNode = this.oreNodes.find((n) => n.config.isCorrect);
        ironNode?.showHintPulse();
      }
    } else {
      // Correct choice: Demir Cevheri!
      this.pusula?.setMessage('Harika! Demirin işlenmesi, dayanıklı araçların yaygınlaşmasını sağladı.');

      // Animate iron ore into furnace
      this.tweens.add({
        targets: sample,
        x: this.GAME_WIDTH / 2,
        y: 440,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 800,
        ease: 'Quad.easeIn',
        onComplete: () => {
          sample.setVisible(false);
          this.time.delayedCall(400, () => this.startPhase2());
        },
      });
    }
  }

  // =========================================================================
  // AŞAMA 2 – FIRINI ISIT
  // =========================================================================

  private startPhase2(): void {
    this.currentPhase = 2;
    if (this.phaseTitleText) {
      this.phaseTitleText.setText('AŞAMA 2: FIRINI ISIT (KÖRÜKLE ATEŞİ DENGEDE TUT)');
    }

    // Hide workbench samples
    this.oreNodes.forEach((n) => n.setVisible(false));
    if (this.workbenchGraphics) this.workbenchGraphics.setVisible(false);

    // Temperature Gauge
    this.tempGauge = new TemperatureGauge(this, this.GAME_WIDTH / 2, 120);

    // Bellows Tool Button (Right Side)
    this.bellowsBtn = this.add.container(1560, 680);
    const bellowsBg = this.add.graphics();
    bellowsBg.fillStyle(0x0a1128, 0.95);
    bellowsBg.fillCircle(0, 0, 90);
    bellowsBg.lineStyle(3, 0xffd700, 0.9);
    bellowsBg.strokeCircle(0, 0, 90);

    if (this.textures.exists('bellows_tool')) {
      const bellowsImg = this.add.image(0, -10, 'bellows_tool');
      bellowsImg.setDisplaySize(120, 120);
      this.bellowsBtn.add(bellowsImg);
    }

    const bellowsText = this.createText(0, 55, 'KÖRÜKLE', {
      fontSize: '20px',
      fontStyle: '900',
      color: '#FFD700',
    });
    bellowsText.setOrigin(0.5);

    this.bellowsBtn.add([bellowsBg, bellowsText]);

    const hitArea = new Phaser.Geom.Circle(0, 0, 90);
    this.bellowsBtn.setInteractive(hitArea, Phaser.Geom.Circle.Contains, true);

    this.bellowsBtn.on('pointerdown', () => {
      if (this.tempGauge && !this.tempGauge.isCompleted) {
        SoundFx.playSuccessTone();
        this.tempGauge.pumpBellows();

        // Pump animation
        this.tweens.add({
          targets: this.bellowsBtn,
          scaleX: 0.9,
          scaleY: 0.9,
          duration: 90,
          yoyo: true,
        });

        // Fire flash
        this.renderFurnaceFire(0xffeb3b);
        this.time.delayedCall(250, () => this.renderFurnaceFire(0xff9800));
      }
    });

    this.pusula?.setMessage('Körüğe dokunarak sıcaklığı ideal yeşil bölgede 8 saniye tut!');
  }

  private onPhase2Complete(): void {
    if (this.currentPhase !== 2) return;
    this.currentPhase = 3;

    this.pusula?.setMessage('Mükemmel! Körük ateşe fazla hava vererek metali ideal sıcaklığa getirdi.');

    if (this.bellowsBtn) this.bellowsBtn.setVisible(false);
    if (this.tempGauge) this.tempGauge.setVisible(false);

    this.time.delayedCall(800, () => this.startPhase3());
  }

  // =========================================================================
  // AŞAMA 3 – DEMİRİ ŞEKİLLENDİR
  // =========================================================================

  private startPhase3(): void {
    if (this.phaseTitleText) {
      this.phaseTitleText.setText('AŞAMA 3: DEMİRİ ŞEKİLLENDİR (PARLAYAN NOKTALARA VUR)');
    }

    // Render Anvil (Örs) in Center Floor
    this.anvilGraphics = this.add.graphics();
    this.anvilGraphics.fillStyle(0x263238, 1);
    this.anvilGraphics.fillRoundedRect(this.GAME_WIDTH / 2 - 200, 680, 400, 140, 20);
    this.anvilGraphics.lineStyle(3, 0x78909c, 1);
    this.anvilGraphics.strokeRoundedRect(this.GAME_WIDTH / 2 - 200, 680, 400, 140, 20);

    const anvilText = this.createText(this.GAME_WIDTH / 2, 795, 'DEMİRCİ ÖRSÜ', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#90A4AE',
    });
    anvilText.setOrigin(0.5);

    // Glowing Hot Iron Block on Anvil
    if (this.textures.exists('chisel_raw')) {
      this.rawIronBlock = this.add.image(this.GAME_WIDTH / 2, 650, 'chisel_raw');
      this.rawIronBlock.setDisplaySize(200, 120);
    }

    // Blacksmith Hammer Tool (Hovering right)
    if (this.textures.exists('hammer_tool')) {
      this.hammerSprite = this.add.image(this.GAME_WIDTH / 2 + 240, 560, 'hammer_tool');
      this.hammerSprite.setDisplaySize(140, 140);
    }

    // 6 Sequential Strike Point Nodes across the hot iron block
    const pointPositions: StrikePointConfig[] = [
      { id: 1, x: this.GAME_WIDTH / 2 - 80, y: 650 },
      { id: 2, x: this.GAME_WIDTH / 2 - 40, y: 650 },
      { id: 3, x: this.GAME_WIDTH / 2, y: 650 },
      { id: 4, x: this.GAME_WIDTH / 2 + 40, y: 650 },
      { id: 5, x: this.GAME_WIDTH / 2 + 80, y: 650 },
      { id: 6, x: this.GAME_WIDTH / 2, y: 650 },
    ];

    pointPositions.forEach((cfg) => {
      const node = new StrikePointNode(this, cfg, (struckNode) => this.handleStrike(struckNode));
      this.strikePoints.push(node);
    });

    this.currentStrikeIndex = 0;
    this.activateNextStrikePoint();

    // Start cooling timer (Metal cools down if player waits > 7 seconds)
    this.resetCoolingTimer();
  }

  private activateNextStrikePoint(): void {
    if (this.currentStrikeIndex < this.strikePoints.length) {
      const node = this.strikePoints[this.currentStrikeIndex];
      node.activatePoint();
    }
  }

  private handleStrike(node: StrikePointNode): void {
    if (this.isMetalCool) return; // Must reheat metal if cooled

    this.resetCoolingTimer();
    node.markStruck();

    // Hammer swing strike animation
    if (this.hammerSprite) {
      this.tweens.add({
        targets: this.hammerSprite,
        x: node.x + 30,
        y: node.y - 40,
        angle: -50,
        duration: 120,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          this.hammerSprite?.setPosition(this.GAME_WIDTH / 2 + 240, 560);
          this.hammerSprite?.setAngle(0);
        },
      });
    }

    // Progressive Iron Shaping: Gradually scale & deform raw block
    if (this.rawIronBlock) {
      const progressRatio = (this.currentStrikeIndex + 1) / 6;
      this.tweens.add({
        targets: this.rawIronBlock,
        scaleX: 1.0 - progressRatio * 0.2,
        scaleY: 1.0 - progressRatio * 0.35,
        duration: 120,
      });
    }

    this.currentStrikeIndex++;

    if (this.currentStrikeIndex < this.strikePoints.length) {
      this.activateNextStrikePoint();
    } else {
      // 6th Hit Complete!
      this.onForgingComplete();
    }
  }

  private resetCoolingTimer(): void {
    if (this.coolingTimer) this.coolingTimer.remove();
    this.isMetalCool = false;
    if (this.rawIronBlock) this.rawIronBlock.clearTint();

    this.coolingTimer = this.time.delayedCall(7000, () => {
      if (this.currentPhase === 3 && !this.isCompleted) {
        this.triggerMetalCooling();
      }
    });
  }

  private triggerMetalCooling(): void {
    this.isMetalCool = true;
    if (this.rawIronBlock) {
      this.rawIronBlock.setTint(0x475569); // Dark cooled grey tint
    }
    this.pusula?.setMessage('Metal soğudu, yeniden ısıtalım!');

    // Reheating transition animation (2 seconds)
    this.time.delayedCall(1200, () => {
      this.pusula?.setMessage('Demir fırında yeniden ısıtılıyor...');
      this.tweens.add({
        targets: this.rawIronBlock,
        x: this.GAME_WIDTH / 2,
        y: 440,
        scaleX: 0.6,
        scaleY: 0.6,
        duration: 800,
        yoyo: true,
        onComplete: () => {
          this.resetCoolingTimer();
          this.pusula?.setMessage('Demir kızardı! Dövme işlemine devam et!');
        },
      });
    });
  }

  private onForgingComplete(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;

    if (this.coolingTimer) this.coolingTimer.remove();
    if (this.timerEvent) this.timerEvent.remove();

    // Replace raw block with polished forged iron chisel
    if (this.rawIronBlock) this.rawIronBlock.setVisible(false);

    if (this.textures.exists('chisel_forged')) {
      this.forgedChisel = this.add.image(this.GAME_WIDTH / 2, 540, 'chisel_forged');
      this.forgedChisel.setDisplaySize(240, 150);

      // Celebratory 360 rotation & rise presentation animation
      this.tweens.add({
        targets: this.forgedChisel,
        y: 400,
        angle: 360,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 900,
        ease: 'Back.easeOut',
      });
    }

    this.pusula?.setMessage('Ustalar metali ısıtarak ve döverek biçimlendirdi!');

    // Update GameStore: Complete Demir Cagi & Unlock Anadolu Ustaligi ONCE
    GameStore.completeModule('demir_cagi');

    // Calculate Victory Stats
    const stats = VictoryModal.calculateStats(this.elapsedSeconds, this.totalErrors);

    this.time.delayedCall(1200, () => {
      new VictoryModal(this, stats, () => {
        this.cameras.main.fadeOut(350, 7, 11, 25);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start(SceneKeys.WORLD_MAP);
        });
      });
    });
  }

  private createCornerBackButton(): void {
    const btn = this.add.container(65, 55);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a1128, 0.9);
    bg.fillCircle(0, 0, 28);
    bg.lineStyle(2, 0xe67e22, 0.8);
    bg.strokeCircle(0, 0, 28);

    const iconText = this.add.text(0, 0, '◄', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '22px',
      color: '#E67E22',
    });
    iconText.setOrigin(0.5);

    btn.add([bg, iconText]);

    const hitArea = new Phaser.Geom.Circle(0, 0, 28);
    btn.setInteractive(hitArea, Phaser.Geom.Circle.Contains, true);

    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 7, 11, 25);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKeys.WORLD_MAP);
      });
    });
  }
}
