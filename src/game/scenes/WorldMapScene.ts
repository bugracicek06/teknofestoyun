import { BaseScene } from './BaseScene';
import { SceneKeys } from '../../types/game';
import { GAME_MODULES } from '../../data/modules';
import { GameStore } from '../state/GameStore';
import { LandmarkNode } from '../objects/LandmarkNode';
import { GlowingPath } from '../objects/GlowingPath';
import { PusulaCharacter } from '../objects/PusulaCharacter';
import { ProgressPassport } from '../objects/ProgressPassport';
import { GameButton } from '../objects/GameButton';
import { EventBus } from '../state/EventBus';
import Phaser from 'phaser';

export class WorldMapScene extends BaseScene {
  constructor() {
    super(SceneKeys.WORLD_MAP);
  }

  create(): void {
    // 1. Layered Landscape Background (Earth -> Metal -> Tech -> Cosmos)
    this.createCinematicBackground();

    // 2. Define 6 Landmark Node Positions forming an S-curve across 1920x1080 canvas
    const landmarkPositions: Phaser.Math.Vector2[] = [
      new Phaser.Math.Vector2(240, 680), // 1. Göbeklitepe
      new Phaser.Math.Vector2(550, 420), // 2. Demir Çağı
      new Phaser.Math.Vector2(880, 680), // 3. Anadolu Ustalığı
      new Phaser.Math.Vector2(1180, 420), // 4. Serinhisar Bıçakçılığı
      new Phaser.Math.Vector2(1480, 680), // 5. Millî Teknoloji
      new Phaser.Math.Vector2(1720, 420), // 6. Uzay Teknolojileri
    ];

    // 3. Render Glowing Spline Path connecting all landmarks
    new GlowingPath(this, landmarkPositions);

    // 4. Render 6 Landmark Islands
    landmarkPositions.forEach((pos, index) => {
      const mod = GAME_MODULES[index];
      const isUnlocked = GameStore.isModuleUnlocked(mod.id);
      const isCompleted = GameStore.isModuleCompleted(mod.id);

      new LandmarkNode(this, pos.x, pos.y, mod, isUnlocked, isCompleted, (selectedMod) => {
        this.onLandmarkSelected(selectedMod.sceneKey);
      });
    });

    // 5. Progress Passport Bar at Top
    const completedCount = GAME_MODULES.filter((m) => GameStore.isModuleCompleted(m.id)).length;
    new ProgressPassport(this, this.GAME_WIDTH / 2 + 100, 60, completedCount);

    // 6. Find Next Active Module for Pusula Speech & Action Button
    const activeModule = GAME_MODULES.find((m) => GameStore.isModuleUnlocked(m.id) && !GameStore.isModuleCompleted(m.id)) || GAME_MODULES[0];

    const pusulaMsg = completedCount === 0
      ? 'İlk durak Göbeklitepe! Zaman yolculuğumuz başlıyor.'
      : `Harika! Şimdi ${activeModule.title} görevine yelken açıyoruz!`;

    new PusulaCharacter(this, 220, 180, pusulaMsg);

    // 7. Small Corner Back Button (Top-Left)
    this.createCornerBackButton();

    // 8. Large Dynamic Main Action Button at Bottom Center
    const btnLabel = completedCount === 0
      ? 'İLK GÖREVE BAŞLA  ➔'
      : `${activeModule.title.toUpperCase()}  ➔`;

    new GameButton(
      this,
      this.GAME_WIDTH / 2,
      970,
      480,
      92,
      btnLabel,
      () => {
        this.onLandmarkSelected(activeModule.sceneKey);
      },
      0x00f2fe,
      '#070B19'
    );

    EventBus.emit('current-scene-ready', SceneKeys.WORLD_MAP);
  }

  private createCornerBackButton(): void {
    const btn = this.add.container(65, 60);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a1128, 0.9);
    bg.fillCircle(0, 0, 30);
    bg.lineStyle(2, 0x00f2fe, 0.8);
    bg.strokeCircle(0, 0, 30);

    const iconText = this.add.text(0, 0, '◄', {
      fontFamily: this.SYSTEM_FONT,
      fontSize: '24px',
      color: '#00F2FE',
    });
    iconText.setOrigin(0.5);

    btn.add([bg, iconText]);

    const hitArea = new Phaser.Geom.Circle(0, 0, 30);
    btn.setInteractive(hitArea, Phaser.Geom.Circle.Contains, true);

    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 7, 11, 25);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SceneKeys.START);
      });
    });
  }

  private onLandmarkSelected(sceneKey: SceneKeys): void {
    this.cameras.main.zoomTo(1.1, 350, 'Quad.easeIn');
    this.cameras.main.fadeOut(350, 7, 11, 25);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey);
    });
  }
}
