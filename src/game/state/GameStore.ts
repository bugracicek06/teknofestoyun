import type { MissionResult } from '../systems/scoring';
import { EventBus } from './EventBus.ts';
import {
  type PlayerSession,
  createEmptyPlayerSession,
  validateAndCleanFullName,
  REQUIRED_MODULE_IDS,
  areAllModulesCompleted,
} from '../systems/certificate.ts';

export interface GameProgressState {
  unlockedModuleIds: string[];
  completedModuleIds: string[];
  currentModuleId: string;
  isAudioMuted: boolean;
  results: Record<string, MissionResult>;
  playerSession: PlayerSession;
}

class GameStoreManager {
  private readonly storageKey = 'medeniyetten-milli-teknolojiye:progress:v1';
  private readonly moduleOrder = [
    'gobeklitepe',
    'demir_cagi',
    'anadolu_ustaligi',
    'sanayilesme',
    'milli_teknoloji',
    'uzay_teknolojileri',
  ];

  private state: GameProgressState = {
    unlockedModuleIds: ['gobeklitepe'],
    completedModuleIds: [],
    currentModuleId: 'gobeklitepe',
    isAudioMuted: false,
    results: {},
    playerSession: createEmptyPlayerSession(),
  };

  constructor() {
    this.restore();
    this.resetSession();
  }

  public getState(): GameProgressState {
    return {
      ...this.state,
      results: structuredClone(this.state.results),
      unlockedModuleIds: [...this.state.unlockedModuleIds],
      completedModuleIds: [...this.state.completedModuleIds],
      playerSession: structuredClone(this.state.playerSession),
    };
  }

  public getPlayerSession(): PlayerSession {
    return structuredClone(this.state.playerSession);
  }

  public setPlayerFullName(rawName: string): { success: boolean; cleanedName: string; error?: string } {
    const { isValid, cleanedName, error } = validateAndCleanFullName(rawName);
    if (!isValid) {
      return { success: false, cleanedName, error };
    }

    this.state.playerSession.fullName = cleanedName;
    this.state.playerSession.startedAt = new Date().toISOString();
    this.persistAndNotify();
    return { success: true, cleanedName };
  }

  public setCertificateData(certificateId: string, certificateNumber: string): void {
    this.state.playerSession.certificateId = certificateId;
    this.state.playerSession.certificateNumber = certificateNumber;
    this.persistAndNotify();
  }

  public isAllModulesCompleted(): boolean {
    return areAllModulesCompleted(this.state.completedModuleIds);
  }

  public isModuleUnlocked(moduleId: string): boolean {
    const normalizedId = moduleId === 'serinhisar_bicakciligi' ? 'sanayilesme' : moduleId;
    return this.state.unlockedModuleIds.includes(normalizedId);
  }

  public isModuleCompleted(moduleId: string): boolean {
    const normalizedId = moduleId === 'serinhisar_bicakciligi' ? 'sanayilesme' : moduleId;
    return this.state.completedModuleIds.includes(normalizedId);
  }

  public unlockModule(moduleId: string): void {
    const normalizedId = moduleId === 'serinhisar_bicakciligi' ? 'sanayilesme' : moduleId;
    if (!this.state.unlockedModuleIds.includes(normalizedId)) {
      this.state.unlockedModuleIds.push(normalizedId);
      this.persistAndNotify();
    }
  }

  public saveResult(moduleId: string, result: MissionResult): void {
    if (!this.moduleOrder.includes(moduleId) || !this.isModuleUnlocked(moduleId)) return;
    this.state.results[moduleId] = structuredClone(result);
    this.completeModule(moduleId);
    this.persistAndNotify();
  }

  public completeModule(moduleId: string): void {
    const normalizedId = moduleId === 'serinhisar_bicakciligi' ? 'sanayilesme' : moduleId;
    if (!this.moduleOrder.includes(normalizedId) || !this.isModuleUnlocked(normalizedId)) return;

    let changed = false;
    if (!this.state.completedModuleIds.includes(normalizedId)) {
      this.state.completedModuleIds.push(normalizedId);
      changed = true;

      const currentIndex = this.moduleOrder.indexOf(normalizedId);
      if (currentIndex !== -1 && currentIndex + 1 < this.moduleOrder.length) {
        const nextModuleId = this.moduleOrder[currentIndex + 1];
        if (!this.state.unlockedModuleIds.includes(nextModuleId)) {
          this.state.unlockedModuleIds.push(nextModuleId);
        }
      }
    }

    // Keep playerSession.completedModules in sync
    if (!this.state.playerSession.completedModules.includes(normalizedId)) {
      this.state.playerSession.completedModules.push(normalizedId);
      changed = true;
    }

    // Freeze completion timestamp once when all 6 modules are successfully completed
    if (this.isAllModulesCompleted() && !this.state.playerSession.completedAt) {
      this.state.playerSession.completedAt = new Date().toISOString();
      changed = true;
    }

    if (changed) {
      this.persistAndNotify();
    }
  }

  public setCurrentModule(moduleId: string): void {
    if (!this.isModuleUnlocked(moduleId)) return;
    this.state.currentModuleId = moduleId;
    this.persistAndNotify();
  }

  public setAudioMuted(isMuted: boolean): void {
    if (this.state.isAudioMuted === isMuted) return;
    this.state.isAudioMuted = isMuted;
    this.persistAndNotify();
  }

  public toggleAudioMuted(): boolean {
    this.setAudioMuted(!this.state.isAudioMuted);
    return this.state.isAudioMuted;
  }

  /**
   * Reset game progress (retains session if any)
   */
  public resetProgress(): void {
    this.state.unlockedModuleIds = ['gobeklitepe'];
    this.state.completedModuleIds = [];
    this.state.results = {};
    this.state.currentModuleId = 'gobeklitepe';
    this.state.playerSession.completedModules = [];
    this.state.playerSession.completedAt = null;
    this.persistAndNotify();
  }

  /**
   * Full Kiosk Session Reset: clears player name, session, scores, and progress.
   * Does NOT delete previously issued certificates from the backend.
   */
  public resetSession(): void {
    this.state.unlockedModuleIds = ['gobeklitepe'];
    this.state.completedModuleIds = [];
    this.state.results = {};
    this.state.currentModuleId = 'gobeklitepe';
    this.state.playerSession = createEmptyPlayerSession();
    this.persistAndNotify();
  }

  private persistAndNotify(): void {
    this.persist();
    EventBus.emit('store-changed', this.getState());
  }

  private persist(): void {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify({ isAudioMuted: this.state.isAudioMuted }));
    } catch {
      // Kiosk browsers can disable storage; gameplay remains available in memory.
    }
  }

  private restore(): void {
    try {
      const rawState = window.localStorage.getItem(this.storageKey);
      if (!rawState) return;

      const savedState: Partial<GameProgressState> = JSON.parse(rawState);
      this.state.isAudioMuted = savedState.isAudioMuted === true;
    } catch {
      this.state.isAudioMuted = false;
    }
  }
}

export const GameStore = new GameStoreManager();
export { REQUIRED_MODULE_IDS };
