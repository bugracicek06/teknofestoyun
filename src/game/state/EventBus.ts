import type { GameProgressState } from './GameStore';
type Events = {
  'store-changed': [GameProgressState];
  'current-scene-ready': [string];
  'mission-result': [string];
  'asset-progress': [number];
  'asset-fallback': [string];
  'gobeklitepe-progress': [number, string[], string | null];
  'gobeklitepe-select-piece': [string];
  'gobeklitepe-drag-start': [{ pieceId: string; clientX: number; clientY: number }];
  'gobeklitepe-drag-move': [{ pieceId: string; clientX: number; clientY: number }];
  'gobeklitepe-drag-end': [{ pieceId: string; clientX: number; clientY: number }];
};
class TypedEventBus {
  private target = new EventTarget();
  private listeners = new Map<string, Map<object, EventListener>>();
  on<K extends keyof Events>(name: K, listener: (...args: Events[K]) => void): void {
    this.off(name, listener);
    const wrapped: EventListener = event => listener(...(event as CustomEvent<Events[K]>).detail);
    const entries = this.listeners.get(name) || new Map<object, EventListener>();
    entries.set(listener, wrapped); this.listeners.set(name, entries);
    this.target.addEventListener(name, wrapped);
  }
  off<K extends keyof Events>(name: K, listener: (...args: Events[K]) => void): void {
    const entries = this.listeners.get(name), wrapped = entries?.get(listener);
    if (wrapped) this.target.removeEventListener(name, wrapped);
    entries?.delete(listener);
  }
  emit<K extends keyof Events>(name: K, ...args: Events[K]): void {
    this.target.dispatchEvent(new CustomEvent(name, { detail: args }));
  }
}
export const EventBus = new TypedEventBus();
