# Kattdropp — byggspecifikation

Ett fysikbaserat merge-pusselspel för webbläsare på dator. Inspirerat av
Suika-genren: släpp objekt i en behållare, två likadana som kolliderar slås
ihop till nästa storlek.

## Teknisk stack

- **Vite** + **TypeScript** (vanilla, inget ramverk behövs)
- **Matter.js** för 2D-fysik
- Rendering: egen `<canvas>`-renderare ovanpå Matter (använd INTE `Matter.Render`
  i produktion — den är bara för debug och kan inte rita bilder snyggt)
- `localStorage` för highscore
- Deploy: **GitHub Pages** via GitHub Actions

Ingen backend, inga beroenden utöver Matter.js. Bygget ska bli statiska filer
som kan serveras från vilken katalog som helst.

## Spelmekanik

### Nivåer (ranks)

11 nivåer, rank 0–10. Radien växer geometriskt med faktor ~1.27:

| Rank | Radie (px) | Poäng vid merge |
|------|-----------|-----------------|
| 0    | 20        | 1               |
| 1    | 26        | 3               |
| 2    | 33        | 6               |
| 3    | 42        | 10              |
| 4    | 53        | 15              |
| 5    | 67        | 21              |
| 6    | 85        | 28              |
| 7    | 108       | 36              |
| 8    | 137       | 45              |
| 9    | 174       | 55              |
| 10   | 220       | 66              |

Poäng = triangeltal (n+1)(n+2)/2. Justera radierna mot spelplanens bredd så att
största objektet får plats med marginal.

Radierna definieras i en enda `LEVELS`-array med `{ radius, color, sprite, score }`
så att allt är på ett ställe.

### Spelplan

- Logisk upplösning: 480 × 720 px, fast. Canvas centreras i fönstret.
  Sätt `canvas.width/height` till logisk storlek × `devicePixelRatio` och
  skala ritkontexten en gång — då blir det skarpt på retina-skärmar utan att
  fysiken behöver bry sig. Ingen responsiv layout behövs.
- Om fönstret är lägre än 720 px: skala hela canvasen proportionellt med CSS
  (`height: min(720px, 100vh)`), fysiken påverkas inte.
- Behållare: tre statiska Matter-bodies (vänstervägg, högervägg, golv).
  Innerbredd ~440 px.
- **Dödslinje** vid y ≈ 120 (under förhandsvisningen).

### Släpp

- **Mus:** `mousemove` flyttar siktet, `click` släpper. Räkna om
  klientkoordinater till canvas-koordinater via `getBoundingClientRect()` —
  annars hamnar siktet fel så fort canvasen är skalad eller centrerad.
- **Tangentbord** (bra att ha på dator): vänster/höger pil flyttar siktet,
  mellanslag släpper. Håll pil intryckt → kontinuerlig förflyttning.
- Klampa x-positionen så att objektet aldrig hamnar delvis utanför väggarna:
  `clamp(x, wallLeft + r, wallRight - r)`.
- Rita en tunn siktlinje från släpp-positionen ner i behållaren.
- Cooldown ~450 ms mellan släpp.
- Endast rank 0–4 kan slumpas fram som nya objekt.
- Visa nästa objekt uppe i hörnet (slumpa det i förväg).

### Merge-logik — här sitter alla buggarna

Detta är den svåraste delen. Följ exakt:

1. Lyssna på `Matter.Events.on(engine, 'collisionStart', ...)`.
2. För varje par: kolla att båda är spelobjekt, har **samma rank**, och att
   ingen av dem redan är markerad `merged`.
3. Sätt `bodyA.merged = true; bodyB.merged = true` **direkt**, och lägg paret
   i en kö. Utan den flaggan slås samma par ihop flera gånger, eftersom
   collisionStart kan trigga flera gånger för samma kontakt.
4. Ta INTE bort bodies inne i collision-handlern. Töm kön i
   `Events.on(engine, 'afterUpdate', ...)`. Att mutera världen mitt i
   fysiksteget ger krascher och tunnling.
5. Vid merge: `World.remove` båda, skapa ny body med rank+1 i mittpunkten
   mellan dem, ärv medelhastigheten så att det ser naturligt ut.
6. Rank 10 + rank 10 → båda försvinner, stor bonuspoäng (valfritt).

### Game over

Naiv variant ("något är ovanför linjen") ger falska förluster när objekt
studsar upp vid släpp. Gör så här istället:

- Ett objekt räknas som farligt om det (a) har rört fysiken minst 1 sekund
  sedan det släpptes, och (b) har `body.position.y - radius < DEATH_LINE`.
- Starta en timer när minst ett farligt objekt finns. Om tillståndet håller i
  sig **2 sekunder i följd** → game over. Nollställ timern så fort inget
  farligt objekt finns.
- Visa varning (blinkande linje) medan timern räknar.

### Fysikparametrar (utgångsvärden)

```js
engine.gravity.y = 1.0
restitution: 0.25    // studs — högre ger kaotiskt spel
friction: 0.5
frictionStatic: 0.6
frictionAir: 0.01
density: 0.001       // konstant → större objekt blir tyngre, vilket är rätt
sleepThreshold: 60   // låt Matter söva bodies, ger stabil hög
```

Kör `Engine.update(engine, 1000/60)` med **fast tidssteg** i en
`requestAnimationFrame`-loop med ackumulator. Använd inte `Runner` med
variabelt delta — det gör fysiken olika på olika skärmfrekvenser.

## Grafik

- Rita varje objekt som cirkel + egen SVG/PNG-sprite, roterad med
  `body.angle`.
- Alla sprites ska vara **egna original** — inga assets hämtade från något
  befintligt spel.
- Merge-effekt: kort partikelpuff + skalpop (scale 1.15 → 1.0 på 150 ms).
- Ljud: kort "pop" per merge, tonhöjd höjs med rank.

## UI

- Poäng uppe till vänster, highscore under.
- Nästa-objekt uppe till höger.
- Game over-overlay med slutpoäng, ny highscore-markering, "Spela igen".
- Pausknapp.

## Filstruktur

```
src/
  main.ts          # bootstrap, canvas-setup, resize
  game.ts          # speltillstånd, loop, game over
  physics.ts       # Matter-setup, väggar, merge-kön
  levels.ts        # LEVELS-arrayen
  render.ts        # canvas-ritning
  input.ts         # mus + tangentbord
  audio.ts
  storage.ts       # highscore
assets/cats/*.svg
```

## Ordning att bygga i

1. Canvas + Matter + väggar + släpp cirklar med färg. Ingen merge.
2. Merge-logik med kö och flagga. Verifiera med konsollogg att inga
   dubbelmerges sker.
3. Poäng + nästa-objekt + highscore.
4. Game over med fördröjningslogiken.
5. Sprites, animationer, ljud.
6. GitHub Actions + GitHub Pages.

Commit efter varje steg. Steg 2 och 4 är de som brukar behöva flest
iterationer — testa dem ordentligt innan du går vidare.

## Deploy till GitHub Pages

**Viktigt:** projektet ligger under `https://<användare>.github.io/<repo>/`,
inte i roten. Sätt därför i `vite.config.ts`:

```ts
export default defineConfig({
  base: '/kattdropp/',   // måste matcha repots namn, med snedstreck i båda ändar
})
```

Utan detta laddas inte JS/assets efter deploy (vit sida, 404 i konsollen).
Referera alltid till assets via `import`, aldrig med hårdkodade absoluta
sökvägar som `/assets/cat0.svg` — de bryts av base-pathen.

Workflow i `.github/workflows/deploy.yml`, med officiella Pages-actions
(`actions/configure-pages`, `actions/upload-pages-artifact`,
`actions/deploy-pages`). Bygg med `npm ci && npm run build`, ladda upp `dist/`.
Kör på push till `main` samt `workflow_dispatch` för manuell trigger.

Behörigheter som krävs i workflowen:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

Aktivera sedan Pages i repo-inställningarna med **Source: GitHub Actions**
(inte "Deploy from a branch").
