# Butiken 🛒

Ett webbaserat 2D-isometriskt butiksspel för 8–12-åringar (och vuxna!).
Du är butiksföreståndare: ta betalt i kassan, fyll på hyllorna, hantera
leveranser och paket – och bygg ut butiken utan att gå i konkurs.

Byggt med [Phaser](https://phaser.io), TypeScript och Vite enligt
[byggspecifikationen](Butiksspelet_Byggspecifikation.md).

## Spela

- **Klicka på kassan** för att ställa dig där och ta betalt
- **Klicka på en hylla** för att fylla på från lagret
- **Klicka på golvet** för att gå dit
- På kvällen: se dagens resultat, **beställ varor** och **köp uppgraderingar**
- Sparas automatiskt varje kväll – fortsätt där du slutade

## Utveckling

Källkoden ligger här i `butiken-src/`. Det byggda spelet ligger i
`../butiken/` och checkas in, så att SpelaSpel kan serveras som statiska
filer utan byggsteg.

```bash
npm install
npm run dev      # dev-server
npm run build    # typkontroll + produktionsbygge till ../butiken/
npm run preview  # kör det byggda spelet lokalt
```

Kör `npm run build` och checka in `butiken/` efter varje ändring i spelet.

Allt spelinnehåll (varor, uppgraderingar, balanssiffror) ligger i
`src/config/` och kan justeras utan att röra spellogiken.

Typsnittet Baloo 2 (OFL) kommer från `@fontsource/baloo-2` och byggs in i
spelet, så inga anrop görs till Google Fonts.
