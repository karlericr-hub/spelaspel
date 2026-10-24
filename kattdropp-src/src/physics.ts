import { Bodies, Body, Composite, Engine, Events } from 'matter-js'
import { LEVELS, MAX_RANK } from './levels'

// Logisk spelplan, fast upplösning.
export const WIDTH = 480
export const HEIGHT = 720
export const WALL_LEFT = 20
export const WALL_RIGHT = 460
export const FLOOR_Y = HEIGHT
export const DEATH_LINE = 120

export const STEP_MS = 1000 / 60

export interface CatData {
  rank: number
  droppedAt: number // ms-tid när objektet kom in i världen
  merged: boolean
  popUntil: number // sluttid för skalpop-animationen
}

export type CatBody = Body & { cat: CatData }

export function isCat(body: Body): body is CatBody {
  return body.label === 'cat'
}

const WALL_THICKNESS = 80

export interface MergeEvent {
  // Ranken paret hade — poäng slås upp på denna
  rank: number
  x: number
  y: number
  // null när två rank-10 slås ihop och båda bara försvinner
  newBody: CatBody | null
}

export class Physics {
  engine: Engine
  onMerge: ((event: MergeEvent) => void) | null = null

  private mergeQueue: Array<[CatBody, CatBody]> = []

  constructor() {
    this.engine = Engine.create({ enableSleeping: true })
    this.engine.gravity.y = 1.0

    const wallOpts = { isStatic: true, label: 'wall' }
    // Väggarna sticker upp långt ovanför canvasen så inget trycks ut på sidorna.
    const wallHeight = HEIGHT + 600
    const wallCenterY = FLOOR_Y - wallHeight / 2
    const left = Bodies.rectangle(
      WALL_LEFT - WALL_THICKNESS / 2, wallCenterY, WALL_THICKNESS, wallHeight, wallOpts,
    )
    const right = Bodies.rectangle(
      WALL_RIGHT + WALL_THICKNESS / 2, wallCenterY, WALL_THICKNESS, wallHeight, wallOpts,
    )
    const floor = Bodies.rectangle(
      WIDTH / 2, FLOOR_Y + WALL_THICKNESS / 2, WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS, wallOpts,
    )
    Composite.add(this.engine.world, [left, right, floor])

    // Merge-kandidater upptäcks här men världen muteras ALDRIG i handlern —
    // det ger krascher och tunnling mitt i fysiksteget.
    Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const a = pair.bodyA
        const b = pair.bodyB
        if (!isCat(a) || !isCat(b)) continue
        if (a.cat.rank !== b.cat.rank) continue
        // Flaggan sätts direkt: collisionStart kan trigga flera gånger för
        // samma kontakt, och utan flaggan merge:as samma par flera gånger.
        if (a.cat.merged || b.cat.merged) continue
        a.cat.merged = true
        b.cat.merged = true
        this.mergeQueue.push([a, b])
      }
    })

    Events.on(this.engine, 'afterUpdate', () => this.drainMergeQueue())
  }

  private drainMergeQueue(): void {
    if (this.mergeQueue.length === 0) return
    const queue = this.mergeQueue
    this.mergeQueue = []
    for (const [a, b] of queue) {
      Composite.remove(this.engine.world, a)
      Composite.remove(this.engine.world, b)
      const rank = a.cat.rank
      const x = (a.position.x + b.position.x) / 2
      const y = (a.position.y + b.position.y) / 2
      let newBody: CatBody | null = null
      if (rank < MAX_RANK) {
        // Ärv medelhastigheten så att sammanslagningen ser naturlig ut
        const vx = (a.velocity.x + b.velocity.x) / 2
        const vy = (a.velocity.y + b.velocity.y) / 2
        newBody = this.spawnCat(rank + 1, x, y, vx, vy)
        newBody.cat.popUntil = performance.now() + 150
      }
      this.onMerge?.({ rank, x, y, newBody })
    }
  }

  spawnCat(rank: number, x: number, y: number, vx = 0, vy = 0): CatBody {
    const level = LEVELS[rank]
    const body = Bodies.circle(x, y, level.radius, {
      label: 'cat',
      restitution: 0.25,
      friction: 0.5,
      frictionStatic: 0.6,
      frictionAir: 0.01,
      density: 0.001,
      sleepThreshold: 60,
    }) as CatBody
    body.cat = {
      rank,
      droppedAt: performance.now(),
      merged: false,
      popUntil: 0,
    }
    Body.setVelocity(body, { x: vx, y: vy })
    Composite.add(this.engine.world, body)
    return body
  }

  cats(): CatBody[] {
    return Composite.allBodies(this.engine.world).filter(isCat)
  }

  step(): void {
    Engine.update(this.engine, STEP_MS)
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
