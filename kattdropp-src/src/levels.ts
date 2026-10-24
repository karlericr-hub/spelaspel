import cat0 from '../assets/cats/cat0.svg'
import cat1 from '../assets/cats/cat1.svg'
import cat2 from '../assets/cats/cat2.svg'
import cat3 from '../assets/cats/cat3.svg'
import cat4 from '../assets/cats/cat4.svg'
import cat5 from '../assets/cats/cat5.svg'
import cat6 from '../assets/cats/cat6.svg'
import cat7 from '../assets/cats/cat7.svg'
import cat8 from '../assets/cats/cat8.svg'
import cat9 from '../assets/cats/cat9.svg'
import cat10 from '../assets/cats/cat10.svg'

// Alla nivådefinitioner på ett ställe. Radie växer geometriskt (~1.27),
// poäng är triangeltal (n+1)(n+2)/2. Rank 9–10 är nedjusterade mot tabellens
// 174/220 så att största katten får plats med marginal i behållaren (440 px).
export interface LevelDef {
  radius: number
  color: string
  score: number
  sprite: string
}

export const LEVELS: LevelDef[] = [
  { radius: 20, color: '#f2a65a', score: 1, sprite: cat0 },
  { radius: 26, color: '#a8b5c9', score: 3, sprite: cat1 },
  { radius: 33, color: '#e8875a', score: 6, sprite: cat2 },
  { radius: 42, color: '#c9b189', score: 10, sprite: cat3 },
  { radius: 53, color: '#8f8f8f', score: 15, sprite: cat4 },
  { radius: 67, color: '#e0c568', score: 21, sprite: cat5 },
  { radius: 85, color: '#b98ec9', score: 28, sprite: cat6 },
  { radius: 108, color: '#7fb08a', score: 36, sprite: cat7 },
  { radius: 137, color: '#d9788f', score: 45, sprite: cat8 },
  { radius: 170, color: '#6f9fd8', score: 55, sprite: cat9 },
  { radius: 205, color: '#e8b04a', score: 66, sprite: cat10 },
]

export const MAX_RANK = LEVELS.length - 1

// Endast dessa ranks kan slumpas fram som nya objekt.
export const MAX_DROP_RANK = 4

export function randomDropRank(): number {
  return Math.floor(Math.random() * (MAX_DROP_RANK + 1))
}
