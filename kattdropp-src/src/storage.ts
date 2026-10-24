const KEY = 'kattdropp.highscore'

export function loadHighscore(): number {
  try {
    const raw = localStorage.getItem(KEY)
    const value = raw === null ? 0 : Number(raw)
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

export function saveHighscore(score: number): void {
  try {
    localStorage.setItem(KEY, String(score))
  } catch {
    // localStorage kan vara blockerad (t.ex. privat läge) — highscore blir
    // då bara per session.
  }
}
