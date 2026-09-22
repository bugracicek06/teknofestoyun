import { BaseScene } from '../BaseScene';
import { SceneKeys } from '../../../types/game';
import { EventBus } from '../../state/EventBus';

/**
 * CraftDesignScene (Anadolu Ustalığı - Çini Sanatı)
 * Coordinates with React CiniSanatiMissionShell component for museum-grade interactive tile art experience.
 */
export class CraftDesignScene extends BaseScene {
  constructor() {
    super(SceneKeys.ANADOLU_USTALIGI);
  }

  create(): void {
    // Clear canvas background and notify KioskShell that scene is ready
    this.cameras.main.setBackgroundColor('#070B19');
    EventBus.emit('current-scene-ready', SceneKeys.ANADOLU_USTALIGI);
  }
}
