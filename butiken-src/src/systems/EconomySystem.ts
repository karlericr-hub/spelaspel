import type { GameState, Product } from '../state/GameState';
import { BALANCE } from '../config/balance';
import type { Mood } from '../entities/Customer';

/** Hanterar alla pengaflöden och dagsstatistik. */
export class EconomySystem {
  constructor(private state: GameState) {}

  /** Säljer innehållet i en varukorg. Returnerar totalsumman. */
  sell(basket: Product[]): number {
    const total = basket.reduce((sum, p) => sum + p.sellPrice, 0);
    this.state.money += total;
    this.state.stats.revenueToday += total;
    this.state.stats.servedToday++;
    for (const p of basket) {
      this.state.stats.soldToday[p.id] = (this.state.stats.soldToday[p.id] ?? 0) + 1;
    }
    return total;
  }

  /** Avgift för en hanterad pakethämtning/-inlämning. */
  parcelIncome(): number {
    const fee = BALANCE.parcelFee;
    this.state.money += fee;
    this.state.stats.revenueToday += fee;
    this.state.stats.servedToday++;
    return fee;
  }

  registerLostCustomer(): void {
    this.state.stats.lostToday++;
  }

  /**
   * Uppdaterar butiksbetyget när en kund lämnar butiken, utifrån humöret vid
   * utgången. Betyget är en löpande summa från 0: nöjda (gröna) kunder höjer
   * det, missnöjda sänker det.
   */
  applyMoodRating(mood: Mood): void {
    this.state.rating += BALANCE.ratingByMood[mood];
  }
}
