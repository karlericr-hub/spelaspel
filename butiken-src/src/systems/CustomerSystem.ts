import Phaser from 'phaser';
import { Customer } from '../entities/Customer';
import type { Shelf } from '../entities/Shelf';
import type { Checkout } from '../entities/Checkout';
import type { ParcelDesk } from '../entities/ParcelDesk';
import { isProductUnlocked, type GameState } from '../state/GameState';
import type { EconomySystem } from './EconomySystem';
import type { UpgradeSystem } from './UpgradeSystem';
import { sfx } from './Sfx';
import { BALANCE } from '../config/balance';

/** Spawnar kunder (och paketkunder) och håller reda på alla i butiken. */
export class CustomerSystem {
  readonly customers: Customer[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;

  constructor(
    private scene: Phaser.Scene,
    private shelves: Map<string, Shelf>,
    private checkouts: Checkout[],
    private parcelDesk: ParcelDesk | undefined,
    private state: GameState,
    private economy: EconomySystem,
    private upgrades: UpgradeSystem,
    private doorPoint: { x: number; y: number },
    private isCheckoutStaffed: (index: number) => boolean,
  ) {}

  start(): void {
    this.scheduleNext();
  }

  stop(): void {
    this.spawnTimer?.remove();
  }

  private scheduleNext(): void {
    const rate =
      this.state.difficulty.spawnRate *
      this.upgrades.spawnMultiplier *
      (this.state.adActiveToday ? BALANCE.adSpawnBoost : 1);
    const delay = Phaser.Math.Between(BALANCE.spawnIntervalMinMs, BALANCE.spawnIntervalMaxMs) / rate;
    this.spawnTimer = this.scene.time.delayedCall(delay, () => {
      this.spawn();
      this.scheduleNext();
    });
  }

  private rollPatience(): number {
    return (
      Phaser.Math.Between(BALANCE.patienceMinS * 1000, BALANCE.patienceMaxS * 1000) *
      this.state.difficulty.patienceModifier
    );
  }

  /**
   * Kassan kunden ställer sig i. Kunderna väljer alltid en bemannad kassa (med
   * kassör eller föreståndaren på plats) och tar den med kortast kö bland dessa.
   * Står ingen kassa bemannad faller valet tillbaka på kortaste kön överlag.
   */
  private pickCheckout(): Checkout {
    const staffed = this.checkouts.filter((_, i) => this.isCheckoutStaffed(i));
    const pool = staffed.length > 0 ? staffed : this.checkouts;
    return pool.reduce((best, c) => (c.queue.length < best.queue.length ? c : best));
  }

  private makeCallbacks() {
    return {
      onLost: () => {
        this.economy.registerLostCustomer();
        sfx.sad();
      },
      onGone: (c: Customer) => {
        // Varje kund som lämnar butiken påverkar betyget utifrån sitt humör.
        this.economy.applyMoodRating(c.mood);
        const idx = this.customers.indexOf(c);
        if (idx !== -1) this.customers.splice(idx, 1);
      },
    };
  }

  private spawn(): void {
    const productIds = this.state.products
      .filter((p) => isProductUnlocked(this.state, p))
      .map((p) => p.id);

    // Vilken kund som helst kan ha ett paket att hämta (om butiken är
    // paketombud). En del av dessa hämtar bara paket, resten handlar också.
    const hasParcel =
      this.parcelDesk !== undefined && Phaser.Math.Between(1, 100) <= BALANCE.parcelChancePct;
    const parcelOnly = hasParcel && Phaser.Math.Between(1, 100) <= BALANCE.parcelOnlyPct;

    const list: string[] = [];
    if (!parcelOnly) {
      const count = Phaser.Math.Between(BALANCE.shoppingListMin, BALANCE.shoppingListMax);
      for (let i = 0; i < count; i++) {
        list.push(Phaser.Utils.Array.GetRandom(productIds));
      }
    }

    const customer = new Customer(
      this.scene,
      this.doorPoint.x,
      this.doorPoint.y,
      list,
      this.rollPatience(),
      this.shelves,
      () => this.pickCheckout(),
      hasParcel ? this.parcelDesk : undefined,
      this.doorPoint,
      this.makeCallbacks(),
    );
    this.customers.push(customer);
  }
}
