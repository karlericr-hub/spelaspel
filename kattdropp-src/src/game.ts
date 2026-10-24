import { LEVELS, randomDropRank } from './levels'
import { clamp, DEATH_LINE, type MergeEvent, Physics, STEP_MS, WALL_LEFT, WALL_RIGHT, WIDTH } from './physics'
import { loadHighscore, saveHighscore } from './storage'

export const DROP_Y = 70
const DROP_COOLDOWN_MS = 450
const AIM_SPEED = 320 // px/s med tangentbord
const MAX_RANK_MERGE_BONUS = 200 // rank 10 + rank 10

// Game over-logik: ett objekt är "farligt" först när det varit i fysiken
// minst DANGER_MIN_AGE_MS och sticker upp ovanför dödslinjen. Tillståndet
// måste hålla i sig DANGER_HOLD_MS i följd innan spelet är över — annars
// ger studsar vid släpp falska förluster.
const DANGER_MIN_AGE_MS = 1000
export const DANGER_HOLD_MS = 2000

export class Game {
  physics = new Physics()
  score = 0
  highscore = loadHighscore()
  aimX = WIDTH / 2
  currentRank = randomDropRank()
  nextRank = randomDropRank()
  paused = false
  gameOver = false
  newHighscore = false
  // Hur länge minst ett farligt objekt funnits, i följd (ms)
  dangerMs = 0

  keyLeft = false
  keyRight = false

  onGameOver: (() => void) | null = null
  onMergeEffect: ((event: MergeEvent) => void) | null = null

  private lastDropAt = -Infinity
  private highscoreAtStart = this.highscore

  constructor() {
    this.attachMergeHandler()
  }

  private attachMergeHandler(): void {
    this.physics.onMerge = (event) => {
      this.addScore(LEVELS[event.rank].score)
      if (!event.newBody) this.addScore(MAX_RANK_MERGE_BONUS)
      this.onMergeEffect?.(event)
    }
  }

  restart(): void {
    this.physics = new Physics()
    this.attachMergeHandler()
    this.score = 0
    this.highscoreAtStart = this.highscore
    this.currentRank = randomDropRank()
    this.nextRank = randomDropRank()
    this.aimX = WIDTH / 2
    this.paused = false
    this.gameOver = false
    this.newHighscore = false
    this.dangerMs = 0
    this.lastDropAt = -Infinity
  }

  private addScore(points: number): void {
    this.score += points
    if (this.score > this.highscore) {
      this.highscore = this.score
      saveHighscore(this.highscore)
    }
  }

  setAim(x: number): void {
    const r = LEVELS[this.currentRank].radius
    this.aimX = clamp(x, WALL_LEFT + r, WALL_RIGHT - r)
  }

  canDrop(): boolean {
    return (
      !this.paused &&
      !this.gameOver &&
      performance.now() - this.lastDropAt >= DROP_COOLDOWN_MS
    )
  }

  drop(): void {
    if (!this.canDrop()) return
    this.lastDropAt = performance.now()
    const rank = this.currentRank
    const r = LEVELS[rank].radius
    const x = clamp(this.aimX, WALL_LEFT + r, WALL_RIGHT - r)
    this.physics.spawnCat(rank, x, DROP_Y)
    this.currentRank = this.nextRank
    this.nextRank = randomDropRank()
    this.setAim(this.aimX) // klampa om ifall nya objektet är större
  }

  // Ett fast fysik/logik-steg (STEP_MS).
  tick(): void {
    if (this.paused || this.gameOver) return
    if (this.keyLeft !== this.keyRight) {
      const dx = (AIM_SPEED * STEP_MS) / 1000
      this.setAim(this.aimX + (this.keyRight ? dx : -dx))
    }
    this.physics.step()
    this.updateDanger()
  }

  private updateDanger(): void {
    const now = performance.now()
    const dangerous = this.physics.cats().some(
      (body) =>
        now - body.cat.droppedAt >= DANGER_MIN_AGE_MS &&
        body.position.y - LEVELS[body.cat.rank].radius < DEATH_LINE,
    )
    if (!dangerous) {
      this.dangerMs = 0
      return
    }
    this.dangerMs += STEP_MS
    if (this.dangerMs >= DANGER_HOLD_MS) {
      this.gameOver = true
      this.newHighscore = this.score > this.highscoreAtStart
      this.onGameOver?.()
    }
  }
}
