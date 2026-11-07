import type { Game } from './game'
import { WIDTH } from './physics'

// Räkna om klientkoordinater till canvas-koordinater — canvasen kan vara
// CSS-skalad och centrerad, så getBoundingClientRect() krävs.
function canvasX(canvas: HTMLCanvasElement, clientX: number): number {
  const rect = canvas.getBoundingClientRect()
  return ((clientX - rect.left) / rect.width) * WIDTH
}

export function setupInput(canvas: HTMLCanvasElement, game: Game): void {
  // Pekarhändelser täcker både mus och touch: på mobil drar man fingret för
  // att sikta och släpper katten när fingret lyfts.
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' || canvas.hasPointerCapture(e.pointerId)) {
      game.setAim(canvasX(canvas, e.clientX))
    }
  })

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return
    canvas.setPointerCapture(e.pointerId)
    game.setAim(canvasX(canvas, e.clientX))
    e.preventDefault()
  })

  canvas.addEventListener('pointerup', (e) => {
    if (!canvas.hasPointerCapture(e.pointerId)) return
    canvas.releasePointerCapture(e.pointerId)
    game.setAim(canvasX(canvas, e.clientX))
    game.drop()
  })

  canvas.addEventListener('pointercancel', (e) => {
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
  })

  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') {
      game.keyLeft = true
      e.preventDefault()
    } else if (e.code === 'ArrowRight') {
      game.keyRight = true
      e.preventDefault()
    } else if (e.code === 'Space') {
      game.drop()
      e.preventDefault()
    }
  })

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') game.keyLeft = false
    else if (e.code === 'ArrowRight') game.keyRight = false
  })
}
