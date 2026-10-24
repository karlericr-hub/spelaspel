import { DROP_Y, type Game } from './game'
import { LEVELS } from './levels'
import { DEATH_LINE, FLOOR_Y, HEIGHT, WALL_LEFT, WALL_RIGHT, WIDTH } from './physics'

const BG = '#2b2438'
const CONTAINER_BG = '#3a3050'
const WALL_COLOR = '#57487a'

// Spritsen ritas i viewBox 0 0 200 240 med ansiktscirkelns centrum i
// (100, 140) och radie 100 — öronen sticker upp ovanför fysikcirkeln.
const SPRITE_W = 200
const SPRITE_H = 240
const SPRITE_CX = 100
const SPRITE_CY = 140

const POP_MS = 150
const POP_SCALE = 1.15

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number // 0..1, räknar ner
  size: number
  color: string
}

const sprites: HTMLImageElement[] = LEVELS.map((level) => {
  const img = new Image()
  img.src = level.sprite
  return img
})

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private particles: Particle[] = []
  private lastFrame = performance.now()

  constructor(canvas: HTMLCanvasElement) {
    // Skarp rendering på retina: fysisk storlek × dpr, skala kontexten en gång.
    const dpr = window.devicePixelRatio || 1
    canvas.width = WIDTH * dpr
    canvas.height = HEIGHT * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Kunde inte skapa 2d-kontext')
    ctx.scale(dpr, dpr)
    this.ctx = ctx
  }

  burst(x: number, y: number, color: string, radius: number): void {
    const count = 10 + Math.floor(radius / 12)
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
      const speed = 90 + Math.random() * 140 + radius
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 1,
        size: 3 + Math.random() * 4,
        color,
      })
    }
  }

  draw(game: Game): void {
    const now = performance.now()
    const dt = Math.min((now - this.lastFrame) / 1000, 0.1)
    this.lastFrame = now

    const ctx = this.ctx
    ctx.clearRect(0, 0, WIDTH, HEIGHT)

    // Bakgrund + behållare
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.fillStyle = CONTAINER_BG
    ctx.fillRect(WALL_LEFT, DEATH_LINE, WALL_RIGHT - WALL_LEFT, FLOOR_Y - DEATH_LINE)
    ctx.fillStyle = WALL_COLOR
    ctx.fillRect(WALL_LEFT - 8, DEATH_LINE, 8, FLOOR_Y - DEATH_LINE)
    ctx.fillRect(WALL_RIGHT, DEATH_LINE, 8, FLOOR_Y - DEATH_LINE)
    ctx.fillRect(WALL_LEFT - 8, FLOOR_Y - 8, WALL_RIGHT - WALL_LEFT + 16, 8)

    this.drawDeathLine(game)
    this.drawAim(game)
    this.drawCats(game)
    this.drawParticles(dt, game.paused)
    this.drawHud(game)
  }

  private drawDeathLine(game: Game): void {
    const ctx = this.ctx
    ctx.save()
    if (game.dangerMs > 0 && !game.gameOver) {
      // Varning: blinka rött medan game over-timern räknar
      const blink = 0.35 + 0.55 * Math.abs(Math.sin(performance.now() / 120))
      ctx.strokeStyle = `rgba(255, 80, 80, ${blink})`
      ctx.lineWidth = 3
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1
    }
    ctx.setLineDash([10, 6])
    ctx.beginPath()
    ctx.moveTo(WALL_LEFT, DEATH_LINE)
    ctx.lineTo(WALL_RIGHT, DEATH_LINE)
    ctx.stroke()
    ctx.restore()
  }

  private drawAim(game: Game): void {
    if (game.gameOver) return
    const ctx = this.ctx
    const level = LEVELS[game.currentRank]

    // Siktlinje från släpp-positionen ner i behållaren
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 8])
    ctx.beginPath()
    ctx.moveTo(game.aimX, DROP_Y)
    ctx.lineTo(game.aimX, FLOOR_Y)
    ctx.stroke()
    ctx.restore()

    // Förhandsvisning av objektet som ska släppas
    this.drawCat(game.currentRank, game.aimX, DROP_Y, level.radius, 0)
  }

  private drawCats(game: Game): void {
    const now = performance.now()
    for (const body of game.physics.cats()) {
      const level = LEVELS[body.cat.rank]
      let radius = level.radius
      if (body.cat.popUntil > now) {
        // Skalpop vid merge: 1.15 → 1.0
        const t = (body.cat.popUntil - now) / POP_MS
        radius *= 1 + (POP_SCALE - 1) * t
      }
      this.drawCat(body.cat.rank, body.position.x, body.position.y, radius, body.angle)
    }
  }

  private drawCat(rank: number, x: number, y: number, radius: number, angle: number): void {
    const ctx = this.ctx
    const img = sprites[rank]
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    if (img.complete && img.naturalWidth > 0) {
      const scale = (radius * 2) / SPRITE_W
      ctx.drawImage(img, -SPRITE_CX * scale, -SPRITE_CY * scale, SPRITE_W * scale, SPRITE_H * scale)
    } else {
      // Reserv tills spriten laddats
      ctx.fillStyle = LEVELS[rank].color
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private drawParticles(dt: number, paused: boolean): void {
    const ctx = this.ctx
    for (const p of this.particles) {
      if (!paused) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 500 * dt
        p.life -= dt / 0.45
      }
      if (p.life <= 0) continue
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    this.particles = this.particles.filter((p) => p.life > 0)
  }

  private drawHud(game: Game): void {
    const ctx = this.ctx

    // Poäng uppe till vänster, highscore under
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 26px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(String(game.score), 16, 34)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.font = '14px system-ui, sans-serif'
    ctx.fillText(`Bästa: ${game.highscore}`, 16, 56)

    // Nästa objekt uppe till höger (under pausknappen)
    const next = LEVELS[game.nextRank]
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.textAlign = 'right'
    ctx.fillText('Nästa', WIDTH - 14, 66)
    this.drawCat(game.nextRank, WIDTH - 14 - 21, 94, Math.min(next.radius, 20), 0)
  }
}
