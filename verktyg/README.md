# Verktyg för balansering

Simulatorerna läser spellogiken **direkt ur `index.html`** (`logik.js` klipper ut
blocket mellan `const DRAG_ANTAL` och vy-koden och kör det i en sandlåda). Det finns
alltså ingen kopia av reglerna som kan glida isär från spelet — ändrar du ett kort
mäter nästa körning det nya kortet.

Kräver bara Node. Inga beroenden.

```
node verktyg/playtest.js [n]   # vem vinner? arketyper × partier
node verktyg/intresse.js       # är besluten äkta val, och väger korten jämnt?
node verktyg/vipp.js [n]       # hur nära är förlusterna?
node verktyg/motvind.js [n]    # ställ svårighetsgraden utan att röra målen
```

## Spelararketyperna

`spelare.js` delar in dem i tre grupper efter **vad de får se**:

- **Blinda** — läser inte pilarna alls. Myntkastaren, Vänsterhänt, Högerhänt,
  Snålvargen, Storsatsaren. Om någon av dem lyckas är spelet trasigt: då går det
  att vinna utan att läsa korten.
- **Informerade** — ser pilarnas riktning, men inte storlekarna. *Pilläsaren* är
  den realistiska förstagångsspelaren och det som svårighetsgraden kalibreras mot.
  *Opinionsspelaren* förstår dessutom vad mätarna gör och var hon står.
- **Facit** — Optimeraren känner varje siffra i effekttabellen. Ett tak, inte en
  människa.

Steget mellan Pilläsaren och Opinionsspelaren är spelets inlärningskurva:
det man lär sig mellan genomspelningarna är hur *stora* effekterna är.

## Kriterierna spelet ska klara

`playtest.js` och `intresse.js` skriver ut dem med ✓/✗:

| kriterium | varför |
|---|---|
| ingen blind strategi i topp 3 | annars går spelet att vinna utan att läsa |
| bästa blinda strategi under 20 % | samma sak, med marginal |
| pilläsaren 30–55 % | en uppmärksam förstagångsspelare ska ha en chans |
| opinionsspelaren minst 25 enheter över pilläsaren | det ska löna sig att förstå systemet |
| minst hälften av korten är äkta bedömningsfrågor | ett kort med fast rätt svar är inget val |
| topp 6 kort under 55 % av beslutstyngden | inte några få kort som avgör allt |
| inget kort under 1,5 % tyngd | inga döda kort |

## Om du ändrar leken

1. Ändra effekterna i `DÄCK` i `index.html`.
2. `node verktyg/intresse.js` — sitter besluten kvar som val?
3. `node verktyg/motvind.js` — skriv in de föreslagna `press`-talen i `PARTIER`.
4. `node verktyg/playtest.js` — alla kriterier gröna?

Två regler som håller leken frisk: **båda sidorna av ett kort ska ha en nackdel**
(annars finns inget val), och **storlekarna ska variera mycket** inom ett kort
(annars räcker det att räkna pilar).
