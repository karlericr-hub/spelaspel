import './style.css'
import { playPop, unlockAudio } from './audio'
import { Game } from './game'
import { setupInput } from './input'
import { LEVELS, MAX_RANK } from './levels'
import { STEP_MS } from './physics'
import { Renderer } from './render'
import { hasTicket, useTicket } from './ticket'

const canvas = document.querySelector<HTMLCanvasElement>('#game')
if (!canvas) throw new Error('Hittar inte canvas #game')

const game = new Game()
// Exponeras för enkel felsökning i konsolen
;(window as unknown as { game: Game }).game = game

function el<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector)
  if (!node) throw new Error(`Hittar inte ${selector}`)
  return node
}

const pauseButton = el<HTMLButtonElement>('#pause')
const pauseOverlay = el<HTMLDivElement>('#pause-overlay')
const gameoverOverlay = el<HTMLDivElement>('#gameover-overlay')
const finalScore = el<HTMLParagraphElement>('#final-score')
const newHighscoreEl = el<HTMLParagraphElement>('#new-highscore')

const lockedOverlay = el<HTMLDivElement>('#locked-overlay')
const restartButton = el<HTMLButtonElement>('#restart')
const playAgainInfo = el<HTMLParagraphElement>('#play-again-info')

// Spärr: utan biljett från SpelaSpel går spelet inte att starta.
let locked = !hasTicket()
let ticketUsed = false

function lock(): void {
  locked = true
  game.paused = true
  pauseOverlay.classList.add('hidden')
  pauseButton.classList.add('hidden')
  lockedOverlay.classList.remove('hidden')
}

if (locked) lock()

// Biljetten förbrukas när första katten släpps — sedan räknas omgången
// som påbörjad även om sidan laddas om.
game.onDrop = () => {
  if (ticketUsed) return
  ticketUsed = true
  useTicket()
}

function setPaused(paused: boolean): void {
  if (game.gameOver || locked) return
  game.paused = paused
  pauseOverlay.classList.toggle('hidden', !paused)
}

pauseButton.addEventListener('click', () => setPaused(!game.paused))
el<HTMLButtonElement>('#resume').addEventListener('click', () => setPaused(false))
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP' || e.code === 'Escape') setPaused(!game.paused)
})

game.onMergeEffect = (event) => {
  const newRank = Math.min(event.rank + 1, MAX_RANK)
  renderer.burst(event.x, event.y, LEVELS[newRank].color, LEVELS[event.rank].radius)
  playPop(event.rank)
}

// Ljud kräver en användargest innan AudioContext får starta
window.addEventListener('pointerdown', unlockAudio)
window.addEventListener('keydown', unlockAudio)

game.onGameOver = () => {
  finalScore.textContent = `${game.score} poäng`
  newHighscoreEl.classList.toggle('hidden', !game.newHighscore)
  // En ny omgång kräver en ny biljett (nya poäng i SpelaSpel)
  const canPlayAgain = hasTicket()
  restartButton.classList.toggle('hidden', !canPlayAgain)
  playAgainInfo.classList.toggle('hidden', canPlayAgain)
  gameoverOverlay.classList.remove('hidden')
}

restartButton.addEventListener('click', () => {
  if (!hasTicket()) {
    gameoverOverlay.classList.add('hidden')
    lock()
    return
  }
  gameoverOverlay.classList.add('hidden')
  pauseOverlay.classList.add('hidden')
  ticketUsed = false
  game.restart()
})

// Skala bredvid spelet: alla katter från minsta till största
const scalePanel = el<HTMLElement>('#scale')
LEVELS.forEach((level, rank) => {
  const img = document.createElement('img')
  img.src = level.sprite
  img.alt = `Katt rank ${rank}`
  img.style.setProperty('--w', String(Math.round(24 + rank * 3.2)))
  scalePanel.appendChild(img)
})
const renderer = new Renderer(canvas)
setupInput(canvas, game)

// Fast tidssteg med ackumulator — fysiken blir likadan oavsett skärmfrekvens.
let last = performance.now()
let accumulator = 0

function frame(now: number): void {
  const elapsed = Math.min(now - last, 250) // undvik dödsspiral efter fliken varit dold
  last = now
  accumulator += elapsed
  while (accumulator >= STEP_MS) {
    game.tick()
    accumulator -= STEP_MS
  }
  renderer.draw(game)
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
