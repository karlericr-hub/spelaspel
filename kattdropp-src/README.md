# Kattdropp

Ett fysikbaserat merge-pusselspel för webbläsare: släpp katter i behållaren,
två likadana som möts slås ihop till en större. Byggt med Vite, TypeScript
och Matter.js enligt [SPEC.md](SPEC.md).

## Styrning

- **Mus:** flytta siktet, klicka för att släppa
- **Tangentbord:** vänster/höger pil flyttar siktet, mellanslag släpper
- **P** eller **Esc** pausar

## Utveckling

Källkoden ligger här i `kattdropp-src/`. Det byggda spelet ligger i
`../kattdropp/` och checkas in, så att SpelaSpel kan serveras som statiska
filer utan byggsteg.

```sh
npm install
npm run dev      # dev-server
npm run build    # typkontroll + produktionsbygge till ../kattdropp/
```

Kör `npm run build` och checka in `kattdropp/` efter varje ändring i spelet.
