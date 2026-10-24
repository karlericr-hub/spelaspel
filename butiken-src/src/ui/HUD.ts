import Phaser from 'phaser';
import type { GameState } from '../state/GameState';
import type { Checkout } from '../entities/Checkout';
import { INV_SCALE, VIEW_W } from '../utils/scale';
import { PALETTE, DEPTH, TEXT, css } from '../config/theme';

/** En ikon med tillhörande siffra i statusraden. */
interface Stat {
  icon: Phaser.GameObjects.Sprite;
  text: Phaser.GameObjects.Text;
}

const BAR_H = 52;

/** Alltid synlig överlagring: pengar, dag/klocka, betyg och kö. */
export class HUD {
  private moneyText: Phaser.GameObjects.Text;
  private dayText: Phaser.GameObjects.Text;
  private rating: Stat;
  private queue: Stat;
  private served: Stat;
  private lost: Stat;
  /** Pengarna räknas upp mjukt i stället för att hoppa till nytt värde. */
  private shownMoney: number;
  /** Senaste saldot vi sett – används för att märka när ett köp höjer kassan. */
  private lastMoney: number;
  /** Senast utritade heltalssaldot, så texten bara skrivs om när den ändras. */
  private lastRenderedMoney = NaN;

  constructor(
    private scene: Phaser.Scene,
    private state: GameState,
    private checkouts: Checkout[],
  ) {
    const panel = scene.add.rectangle(0, 0, VIEW_W, BAR_H, PALETTE.panel.bar, 0.97);
    panel.setOrigin(0, 0).setDepth(DEPTH.hudPanel);
    // Mjuk skugga under raden lyfter den från spelplanen.
    const shade = scene.add.rectangle(0, BAR_H + 3, VIEW_W, 8, PALETTE.panel.shadow, 0.1);
    shade.setOrigin(0, 0).setDepth(DEPTH.hudPanel);
    const edge = scene.add.rectangle(0, BAR_H, VIEW_W, 3, PALETTE.accent.base, 0.95);
    edge.setOrigin(0, 0).setDepth(DEPTH.hudPanel);

    const coin = scene.add
      .sprite(26, BAR_H / 2, 'iconCoin')
      .setScale(INV_SCALE * 1.15)
      .setDepth(DEPTH.hudText);
    // Myntet gör ett kort snurr då och då så att blicken hittar saldot.
    // Snurret ska vara snabbt – ett långsamt snurr gör att myntet står
    // ihoptryckt större delen av tiden.
    scene.tweens.add({
      targets: coin,
      scaleX: INV_SCALE * 0.2,
      duration: 260,
      yoyo: true,
      repeat: -1,
      repeatDelay: 5200,
      ease: 'Sine.easeInOut',
    });

    this.shownMoney = state.money;
    this.lastMoney = state.money;
    this.moneyText = scene.add
      .text(
        42,
        BAR_H / 2,
        '',
        TEXT.heading({ fontSize: '22px', color: css(PALETTE.accent.deep) }),
      )
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.hudText);

    scene.add
      .sprite(VIEW_W / 2 - 74, BAR_H / 2, 'iconCalendar')
      .setScale(INV_SCALE)
      .setDepth(DEPTH.hudText);
    this.dayText = scene.add
      .text(VIEW_W / 2 - 60, BAR_H / 2, '', TEXT.body({ color: css(PALETTE.text.strong) }))
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.hudText);

    // Statusgruppen till höger, från vänster till höger.
    this.rating = this.makeStat(VIEW_W - 320, 'iconStar');
    this.queue = this.makeStat(VIEW_W - 240, 'iconPerson');
    this.served = this.makeStat(VIEW_W - 160, 'iconCheck');
    this.lost = this.makeStat(VIEW_W - 80, 'iconCross');

    this.update();
  }

  private makeStat(x: number, iconKey: string): Stat {
    const icon = this.scene.add
      .sprite(x, BAR_H / 2, iconKey)
      .setScale(INV_SCALE)
      .setDepth(DEPTH.hudText);
    const text = this.scene.add
      .text(x + 14, BAR_H / 2, '0', TEXT.label({ fontSize: '17px', fontStyle: 'bold' }))
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.hudText);
    return { icon, text };
  }

  /** Sätter siffran och puffar till ikonen när värdet ändrats. */
  private setStat(stat: Stat, value: string): void {
    if (stat.text.text === value) return;
    stat.text.setText(value);
    this.scene.tweens.add({
      targets: stat.icon,
      scale: INV_SCALE * 1.3,
      duration: 110,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  update(timeText?: string): void {
    this.updateMoney();

    const clock = timeText ? `  •  ${timeText}` : '';
    this.dayText.setText(`Dag ${this.state.day}${clock}`);

    const s = this.state.stats;
    this.setStat(this.rating, String(Math.round(this.state.rating)));
    this.setStat(
      this.queue,
      String(this.checkouts.reduce((sum, c) => sum + c.queue.length, 0)),
    );
    this.setStat(this.served, String(s.servedToday));
    this.setStat(this.lost, String(s.lostToday));
  }

  /**
   * Saldot räknas upp mjukt och löpande mot kassans faktiska värde. Varje köp
   * höjer kassan direkt i speltillståndet; här glider den visade siffran dit
   * bildruta för bildruta så att den tickar uppåt medan kunderna betalar i
   * stället för att hoppa. Höjs kassan (ett köp gick igenom) puffas saldot till
   * så att blicken dras dit.
   */
  private updateMoney(): void {
    const target = this.state.money;

    // Ett köp (eller pakethämtning) har precis höjt kassan → puffa saldot.
    if (target > this.lastMoney) {
      this.pulseMoney();
    }
    this.lastMoney = target;

    const diff = target - this.shownMoney;
    if (Math.abs(diff) < 0.5) {
      // Tillräckligt nära – lås fast på det exakta värdet.
      this.shownMoney = target;
    } else {
      // Bildrutetålig utjämning: samma tempo oavsett bildfrekvens. Faktorn
      // 0.006 per sekund ger ett snabbt men tydligt uppräkningstempo (~0,5 s).
      const deltaMs = this.scene.game.loop.delta;
      const t = 1 - Math.pow(0.006, deltaMs / 1000);
      this.shownMoney += diff * t;
    }

    const shown = Math.round(this.shownMoney);
    if (shown !== this.lastRenderedMoney) {
      this.lastRenderedMoney = shown;
      this.moneyText.setText(`${shown} kr`);
    }
  }

  /** Kort puff på saldotexten som markerar att kassan just höjts av ett köp. */
  private pulseMoney(): void {
    // Snabba köp i följd får inte stapla skaltweens och lämna texten förstorad.
    this.scene.tweens.killTweensOf(this.moneyText);
    this.moneyText.setScale(1);
    this.scene.tweens.add({
      targets: this.moneyText,
      scale: 1.18,
      duration: 120,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }
}
