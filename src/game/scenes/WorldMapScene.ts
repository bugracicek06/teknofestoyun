import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SceneKeys } from '../../types/game';
import { GAME_MODULES } from '../../data/modules';
import { GameStore } from '../state/GameStore';
import { SoundFx } from '../utils/audio';
import { EventBus } from '../state/EventBus';

import worldMapBgUrl from '../../assets/world_map_bg.jpg';

export class WorldMapScene extends BaseScene {
  private bgImage?: Phaser.GameObjects.Image;

  constructor() {
    super(SceneKeys.WORLD_MAP);
  }

  preload(): void {
    if (!this.textures.exists('world_map_bg')) {
      this.load.image('world_map_bg', worldMapBgUrl);
    }
  }

  create(): void {
    // 1. Futuristic Sci-Fi Level Selection Screen Background (1920x1080)
    this.createWorldMapBackground();

    // 2. Minimalist Floating Header
    this.createCorporateKioskHeader('ÇAĞLAR HARİTASI & GÖREV SEÇİMİ');

    // 3. 6 Chronological 3D Milestone Nodes aligned with background art
    const milestonePositions = [
      { x: 250, y: 430, w: 220, h: 220 }, // 1. Göbeklitepe
      { x: 540, y: 600, w: 220, h: 220 }, // 2. Demir Çağı
      { x: 810, y: 420, w: 220, h: 220 }, // 3. Anadolu Ustalığı
      { x: 1100, y: 610, w: 220, h: 220 }, // 4. Bilim ve Sanayileşme
      { x: 1380, y: 430, w: 220, h: 220 }, // 5. Millî Teknoloji
      { x: 1670, y: 600, w: 220, h: 220 }, // 6. Uzay Çağı
    ];

    this.createInteractiveMilestoneNodes(milestonePositions);

    // 4. Find Active Module
    const activeModule =
      GAME_MODULES.find((m) => GameStore.isModuleUnlocked(m.id) && !GameStore.isModuleCompleted(m.id)) ||
      GAME_MODULES[GAME_MODULES.length - 1];

    // 5. Glowing Bottom GÖREVE BAŞLA Button Area (X: 960, Y: 940)
    this.createStartMissionButton(activeModule);

    // 6. Corner Back Button
    this.createCornerBackButton();

    EventBus.emit('current-scene-ready', SceneKeys.WORLD_MAP);
  }

  private createWorldMapBackground(): void {
    const bgFill = this.add.graphics();
    bgFill.fillStyle(0x050a18, 1);
    bgFill.fillRect(0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
    bgFill.setDepth(0);

    this.bgImage = this.add.image(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2, 'world_map_bg');
    this.bgImage.setDisplaySize(this.GAME_WIDTH, this.GAME_HEIGHT);
    this.bgImage.setDepth(0);
  }

  private createInteractiveMilestoneNodes(positions: { x: number; y: number; w: number; h: number }[]): void {
    positions.forEach((pos, index) => {
      const mod = GAME_MODULES[index];
      const isUnlocked = GameStore.isModuleUnlocked(mod.id);
      const isCompleted = GameStore.isModuleCompleted(mod.id);
      const isActive = isUnlocked && !isCompleted;

      const node = this.add.container(pos.x, pos.y);
      node.setDepth(20);

      // Status Badge Tag (Above / Below Node)
      if (isCompleted) {
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(0x064e3b, 0.9);
        badgeBg.fillRoundedRect(-65, -115, 130, 26, 13);
        badgeBg.lineStyle(1.5, 0x10b981, 1);
        badgeBg.strokeRoundedRect(-65, -115, 130, 26, 13);
        node.add(badgeBg);

        const badgeText = this.add.text(0, -102, '✔ TAMAMLANDI', {
          fontFamily: this.SYSTEM_FONT,
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#34D399',
        });
        badgeText.setOrigin(0.5, 0.5);
        node.add(badgeText);
      } else if (isActive) {
        // Glowing pulsing ring around active stage
        const ring = this.add.graphics();
        ring.lineStyle(2.5, 0x38bdf8, 0.9);
        ring.strokeCircle(0, 0, 95);
        node.add(ring);

        this.tweens.add({
          targets: ring,
          scaleX: { from: 0.95, to: 1.12 },
          scaleY: { from: 0.95, to: 1.12 },
          alpha: { from: 0.4, to: 1.0 },
          duration: 750,
          yoyo: true,
          repeat: -1,
        });

        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(0x881337, 0.95);
        badgeBg.fillRoundedRect(-65, -115, 130, 26, 13);
        badgeBg.lineStyle(1.5, 0xf43f5e, 1);
        badgeBg.strokeRoundedRect(-65, -115, 130, 26, 13);
        node.add(badgeBg);

        const badgeText = this.add.text(0, -102, '⚡ ŞİMDİKİ GÖREV', {
          fontFamily: this.SYSTEM_FONT,
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#FDE047',
        });
        badgeText.setOrigin(0.5, 0.5);
        node.add(badgeText);
      } else {
        // Locked State Overlay
        const lockIcon = this.add.text(0, 0, '🔒', {
          fontSize: '28px',
          color: '#94A3B8',
        });
        lockIcon.setOrigin(0.5, 0.5);
        lockIcon.setAlpha(0.65);
        node.add(lockIcon);
      }

      // Interactive Touch Area
      if (isUnlocked) {
        node.setSize(pos.w, pos.h);
        node.setInteractive({ useHandCursor: true });

        node.on('pointerover', () => {
          this.tweens.add({
            targets: node,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 120,
          });
        });

        node.on('pointerout', () => {
          this.tweens.add({
            targets: node,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 120,
          });
        });

        node.on('pointerdown', () => {
          SoundFx.playLockSound();
          this.onMilestoneSelected(mod.sceneKey);
        });
      }
    });
  }

  private createStartMissionButton(activeModule: typeof GAME_MODULES[0]): void {
    const btnW = 380;
    const btnH = 68;
    const btnX = this.GAME_WIDTH / 2;
    const btnY = 942;

    const btnContainer = this.add.container(btnX, btnY);
    btnContainer.setDepth(50);

    // Transparent interactive touch zone directly matching the background START MISSION area
    const touchZone = this.add.zone(0, 0, btnW, btnH);
    touchZone.setInteractive({ useHandCursor: true });
    btnContainer.add(touchZone);

    // Glowing Pulse Halo
    const glowHalo = this.add.graphics();
    glowHalo.fillStyle(0xe11d48, 0.35);
    glowHalo.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);
    btnContainer.add(glowHalo);

    this.tweens.add({
      targets: glowHalo,
      alpha: { from: 0.2, to: 0.7 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    touchZone.on('pointerover', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 120,
      });
    });

    touchZone.on('pointerout', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 120,
      });
    });

    touchZone.on('pointerdown', () => {
      SoundFx.playLockSound();
      this.onMilestoneSelected(activeModule.sceneKey);
    });
  }

  private createCornerBackButton(): void {
    const btn = this.add.container(55, 100);
    btn.setDepth(140);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.85);
    bg.fillCircle(0, 0, 24);
    bg.lineStyle(1.5, 0x38bdf8, 0.8);
    bg.strokeCircle(0, 0, 24);

    const iconText = this.add.text(0, 0, '◄', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '18px',
      color: '#38BDF8',
    });
    iconText.setOrigin(0.5);

    btn.add([bg, iconText]);

    const hitArea = new Phaser.Geom.Circle(0, 0, 24);
    btn.setInteractive(hitArea, Phaser.Geom.Circle.Contains, true);

    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(280, 5, 10, 24);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKeys.START);
      });
    });
  }

  private onMilestoneSelected(sceneKey: SceneKeys): void {
    this.cameras.main.zoomTo(1.1, 350, 'Quad.easeIn');
    this.cameras.main.fadeOut(350, 5, 10, 24);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey);
    });
  }
}
