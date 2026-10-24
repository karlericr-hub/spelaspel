// Ljud genereras med Web Audio — inga ljudfiler behövs.
let ctx: AudioContext | null = null

// Måste anropas från en användargest (klick/tangent) innan ljud kan spelas.
export function unlockAudio(): void {
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

// Kort "pop" vid merge; tonhöjden stiger med rank.
export function playPop(rank: number): void {
  if (!ctx || ctx.state !== 'running') return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const freq = 280 * Math.pow(2, rank / 5)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq * 0.75, t)
  osc.frequency.exponentialRampToValueAtTime(freq * 1.35, t + 0.09)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.25, t + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.17)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.2)
}
