import type { Game } from './game'
import { WIDTH } from './physics'

// Räkna om klientkoordinater till canvas-koordinater — canvasen kan vara
// CSS-skalad och centrerad, så getBoundingClientRect() krävs.
function canvasX(canvas: HTMLCanvasElement, clientX: number): number {
  const rect = canvas.getBoundingClientRect()
  return ((clientX - rect.left) / rect.width) * WIDTH
}

export function setupInput(canvas: HTMLCanvasElement, game: Game): void {
  canvas.addEventListener('mousemove', (e) => {
    game.setAim(canvasX(canvas, e.clientX))
  })

  canvas.addEventListener('click', (e) => {
    game.setAim(canvasX(canvas, e.clientX))
    game.drop()
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
