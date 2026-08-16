import { EventBus } from './EventBus';

export interface GameProgressState {
  unlockedModuleIds: string[];
  completedModuleIds: string[];
  currentModuleId: string;
  isAudioMuted: boolean;
}

class GameStoreManager {
  private state: GameProgressState = {
    unlockedModuleIds: [
      'gobeklitepe',
      'demir_cagi',
      'anadolu_ustaligi',
      'sanayilesme',
      'milli_teknoloji',
      'uzay_teknolojileri',
    ], // All modules unlocked in debug/test mode
    completedModuleIds: [],
    currentModuleId: 'milli_teknoloji',
    isAudioMuted: false,
  };

  public getState(): GameProgressState {
    return { ...this.state };
  }

  public isModuleUnlocked(moduleId: string): boolean {
    const normalizedId = moduleId === 'serinhisar_bicakciligi' ? 'sanayilesme' : moduleId;
    return this.state.unlockedModuleIds.includes(normalizedId) || true;
  }

  public isModuleCompleted(moduleId: string): boolean {
    const normalizedId = moduleId === 'serinhisar_bicakciligi' ? 'sanayilesme' : moduleId;
    return this.state.completedModuleIds.includes(normalizedId);
  }

  public unlockModule(moduleId: string): void {
    const normalizedId = moduleId === 'serinhisar_bicakciligi' ? 'sanayilesme' : moduleId;
    if (!this.state.unlockedModuleIds.includes(normalizedId)) {
      this.state.unlockedModuleIds.push(normalizedId);
      EventBus.emit('store-changed', this.state);
    }
  }

  public completeModule(moduleId: string): void {
    const normalizedId = moduleId === 'serinhisar_bicakciligi' ? 'sanayilesme' : moduleId;
    if (!this.state.completedModuleIds.includes(normalizedId)) {
      this.state.completedModuleIds.push(normalizedId);

      // Auto-unlock next module if available
      const moduleOrder = [
        'gobeklitepe',
        'demir_cagi',
        'anadolu_ustaligi',
        'sanayilesme',
        'milli_teknoloji',
        'uzay_teknolojileri',
      ];
      const currentIndex = moduleOrder.indexOf(normalizedId);
      if (currentIndex !== -1 && currentIndex + 1 < moduleOrder.length) {
        this.unlockModule(moduleOrder[currentIndex + 1]);
      }

      EventBus.emit('store-changed', this.state);
    }
  }

  public setCurrentModule(moduleId: string): void {
    this.state.currentModuleId = moduleId;
    EventBus.emit('store-changed', this.state);
  }

  public resetProgress(): void {
    this.state.completedModuleIds = [];
    this.state.currentModuleId = 'gobeklitepe';
    EventBus.emit('store-changed', this.state);
  }
}

export const GameStore = new GameStoreManager();
