import { QueueStation } from './QueueStation';

/** Kassan där kunderna betalar för sina varor. */
export class Checkout extends QueueStation {
  constructor(scene: Phaser.Scene, gridX: number, gridY: number, maxLength: number) {
    super(scene, gridX, gridY, maxLength);
    this.buildVisuals(0x8d6e63, 'Kassa', 'till');
  }
}
