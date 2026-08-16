import Phaser from 'phaser';

// Global EventBus for React <-> Phaser cross-communication
export const EventBus = new Phaser.Events.EventEmitter();
