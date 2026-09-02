# Franse Flitsen

Progressive Web App om Franse woordjes te oefenen, gericht op het niveau van het 5de leerjaar. Werkt in de browser en is installeerbaar als app-icoon op Android.

## Concept

- Elk **hoofdstuk** ("schrift") bevat Frans/Nederlandse woordparen, onderverdeeld in **3 reeksen**.
- De gebruiker importeert woordenlijsten zelf via een CSV-bestand, of ze worden automatisch ingelezen uit de `woordenlijsten/`-folder bij het opstarten — geen backend nodig.
- Oefenvormen per sessie, willekeurig gemixt uit de types die de gebruiker heeft aangevinkt: meerkeuze, typen (Nederlands en/of Frans apart instelbaar), flashcards.
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
├── woordenlijsten/       # CSV-bestanden die automatisch ingelezen worden bij opstart
│   └── index.json       # lijstje bestandsnamen die ingelezen moeten worden
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

Import gebeurt via PapaParse (CDN, `cdnjs.cloudflare.com/.../papaparse.min.js`) in `verwerkCsv()` in `index.html`. Nieuwe imports **vullen aan** op bestaande hoofdstukken; woorden die (op fr+nl na trim/lowercase) al in dezelfde reeks staan, worden overgeslagen — herhaalde imports (manueel of automatisch) verdubbelen dus niet.

### Automatische import uit een folder

Bestanden in `web/woordenlijsten/` worden bij elke opstart automatisch ingelezen (`autoImporteerWoordenlijsten()` in `index.html`), zonder dat de gebruiker iets moet uploaden. Omdat de app geen backend heeft en de browser een folder niet zelf kan "listen", houdt `web/woordenlijsten/index.json` een lijstje bestandsnamen bij:

```json
["hoofdstuk1.csv", "hoofdstuk2.csv"]
```

Om een nieuwe woordenlijst automatisch te laten inladen: zet het CSV-bestand in `web/woordenlijsten/` en voeg de bestandsnaam toe aan `index.json`. Elk bestand wordt via dezelfde `verwerkCsv()`-logica en dedup verwerkt als een manuele upload.

## Opslagstructuur (localStorage)

Drie sleutels:

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
- `frans-flitsen:instellingen` →
  ```
  { oefenvormen: { mc: boolean, flashcard: boolean, typNl: boolean, typFr: boolean } }
  ```
  Bepaalt welke oefenvormen meegenomen worden bij het opbouwen van een sessie (`startSessie()`); instelbaar via het blok "Oefenvormen" boven "Kies een reeks". Standaard staan meerkeuze, flashcards en typen (Nederlands) aan, typen (Frans) uit.

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
- [ ] Beheerscherm om woorden te verwijderen/bewerken zonder herimport.
- [ ] Eventueel: native wrapper via Capacitor voor een installeerbare .apk buiten de browser om.

## Bekende beperkingen

- Geen accountsysteem — voortgang is gebonden aan browser + toestel.
- Dedup bij CSV-import werkt enkel op exacte fr+nl-overeenkomst (na trim + lowercase); een aangepaste vertaling van een al bestaand woord wordt niet automatisch bijgewerkt, enkel genegeerd als "al aanwezig" of als extra rij toegevoegd.
- Typen wordt exact vergeleken (na trim + lowercase) — geen tolerantie voor accenten/tikfouten.
- Automatische import (`woordenlijsten/index.json`) vereist dat het bestand via http(s) geserveerd wordt; werkt niet bij lokaal openen via `file://`.
