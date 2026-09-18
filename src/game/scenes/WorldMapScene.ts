import { BaseScene } from './BaseScene';
import { SceneKeys } from '../../types/game';
import { EventBus } from '../state/EventBus';

export class WorldMapScene extends BaseScene {
  constructor() { super(SceneKeys.WORLD_MAP); }
  create(): void {
    this.add.rectangle(960, 540, 1920, 1080, 0x070b19);
    EventBus.emit('current-scene-ready', SceneKeys.WORLD_MAP);
  }
}
