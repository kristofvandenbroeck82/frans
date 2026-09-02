# Franse Flitsen

Progressive Web App om Franse woordjes te oefenen, gericht op het niveau van het 5de leerjaar. Werkt in de browser en is installeerbaar als app-icoon op Android.

## Concept

- Elk **hoofdstuk** ("schrift") bevat Frans/Nederlandse woordparen, onderverdeeld in **3 reeksen**.
- De gebruiker importeert woordenlijsten zelf via een CSV-bestand — geen backend nodig.
- Oefenvormen per sessie, willekeurig gemixt: meerkeuze, typen, flashcards.
- Gamification in Duolingo-stijl: XP per goed antwoord, streakbonus, dagstreak (🔥), niveaus, 1-3 sterren per reeks op basis van score.
- Alle data (woordenlijsten + voortgang) wordt lokaal opgeslagen via `localStorage` — blijft bewaard na herladen, werkt offline.

## Status

MVP werkt end-to-end: CSV-import, oefensessies (3 types), scoring, XP/niveau/streak, PWA-installatie (manifest + service worker + iconen).

Nog **niet** geïmplementeerd (zie Roadmap): cloud-opslag/sync over meerdere toestellen, "moeilijke woorden" herhaalmodus, geluid/animatie bij feedback.

## Bestandsstructuur

```
/
├── index.html          # volledige app: HTML + CSS + JS (vanilla JS, geen framework)
├── manifest.json        # PWA-manifest (naam, iconen, themakleur, standalone display)
├── service-worker.js    # cache-first offline-ondersteuning van de app shell
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── icon-maskable-512.png
```

Geen build step, geen package.json — puur statische bestanden. Kan direct geserveerd worden door eender welke statische host (GitHub Pages, Netlify, Vercel, Firebase Hosting, ...).

⚠️ Let op: de service worker vereist **https** (of `localhost`). Lokaal openen via `file://` werkt voor het testen van de app-logica, maar niet voor installatie/offline-gedrag — daarvoor moet het gehost worden.

## Data-formaat (CSV-import)

Verwachte kolommen, komma-gescheiden, met header:

```csv
hoofdstuk,reeks,frans,nederlands
Hoofdstuk 1 - Op school,1,le stylo,de pen
Hoofdstuk 1 - Op school,1,le cahier,het schrift
Hoofdstuk 1 - Op school,2,la chaise,de stoel
```

- `hoofdstuk`: vrije tekst, wordt omgezet naar een interne id (slug) — rijen met dezelfde naam komen in hetzelfde hoofdstuk terecht.
- `reeks`: moet `1`, `2` of `3` zijn.
- `frans` / `nederlands`: de woordparen.

Import gebeurt via PapaParse (CDN, `cdnjs.cloudflare.com/.../papaparse.min.js`) in `verwerkCsv()` in `index.html`. Nieuwe imports **vullen aan** op bestaande hoofdstukken (geen overschrijven/dedup op woordniveau — dat is een aandachtspunt bij herhaalde imports, zie Bekende beperkingen).

## Opslagstructuur (localStorage)

Twee sleutels:

- `frans-flitsen:woordenlijst` →
  ```
  { hoofdstukken: { [id]: { naam, volgorde, reeksen: { 1:[{fr,nl}], 2:[...], 3:[...] } } } }
  ```
- `frans-flitsen:voortgang` →
  ```
  {
    xpTotaal: number,
    streak: { dagen: number, laatsteDatum: "jjjj-m-d" },
    hoofdstukken: { [id]: { reeksen: { 1:{sterren,laatsteScore}, ... } } }
  }
  ```

## Design system

- **Kleuren**: `--paper #FBF6EA` (achtergrond, notitieblad), `--kaft #1F4B3F` (donkergroen, header/nav), `--rood #D64545` (foutfeedback), `--blauw #2F5D8A` (secundair/typ-oefening), `--goud #E8A93B` (XP/sterren), `--succes #4C9A5D` (juiste antwoorden).
- **Typografie**: koppen in "Baloo 2" (rond, speels), body in "Nunito" — beide via Google Fonts.
- **Visueel thema**: schoolschrift/notitieboekje-metafoor (hoofdstukken als "schriften" met spiraalbinding, correctierood voor foute antwoorden zoals een leerkrachtenpen).

## Gamification-logica (in `index.html`)

- 10 XP per juist antwoord, +5 XP bonus bij elke 3 juiste antwoorden op rij (`sessie.goedeStreak`).
- Niveau = `floor(xpTotaal / 100) + 1`.
- Dagstreak: vergelijkt `laatsteDatum` met vandaag/gisteren in `werkStreakBij()`.
- Sterren per reeks: ≥90% = 3, ≥70% = 2, ≥50% = 1, anders 0 — hoogst behaalde score per reeks blijft staan.

## Hosting-opties (getest/besproken)

1. **GitHub Pages** — gratis, maar vereist een **publieke** repo op het gratis GitHub-plan (private repo + Pages vraagt om upgrade).
2. **Netlify Drop** (`app.netlify.com/drop`) — gratis, geen account nodig, sleep de map erin, meteen een live link.
3. Cloud-sync (Firebase/Supabase) — nog niet geïmplementeerd, zie Roadmap.

## Roadmap / ideeën

- [ ] Cloud-opslag zodat voortgang meegaat over meerdere toestellen (bv. Firebase Firestore of Supabase, anonieme device-id of simpele login).
- [ ] "Moeilijke woorden"-modus: woorden die vaak fout beantwoord worden vaker herhalen (spaced repetition-achtig).
- [ ] Geluidseffecten en kleine animatie bij goed/fout antwoord.
- [ ] Dedup bij CSV-herimport (nu kunnen woorden dubbel terechtkomen als je 2x dezelfde lijst importeert).
- [ ] Beheerscherm om woorden te verwijderen/bewerken zonder herimport.
- [ ] Eventueel: native wrapper via Capacitor voor een installeerbare .apk buiten de browser om.

## Bekende beperkingen

- Geen accountsysteem — voortgang is gebonden aan browser + toestel.
- Geen validatie tegen dubbele woorden bij herhaalde CSV-import.
- Typen wordt exact vergeleken (na trim + lowercase) — geen tolerantie voor accenten/tikfouten.
