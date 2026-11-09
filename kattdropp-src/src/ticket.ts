// Kattdropp låses upp med poäng från SpelaSpel. Huvudsidan sparar en
// "biljett" i localStorage när man har minst 230 poäng (och nollställer
// poängen). Biljetten räcker till en omgång och förbrukas när första
// katten släpps.
const TICKET_KEY = 'spelaspel.kattdropp-biljett'

export function hasTicket(): boolean {
  try {
    return localStorage.getItem(TICKET_KEY) === '1'
  } catch {
    // Utan lagring går det inte att spärra — släpp igenom spelaren.
    return true
  }
}

export function useTicket(): void {
  try {
    localStorage.removeItem(TICKET_KEY)
  } catch {
    // Ingen lagring — inget att förbruka.
  }
}
