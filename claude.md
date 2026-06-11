# MaandlastCheck.nl — Project Context

## Wat is dit project?
Evergreen SEO-website met gratis financiële calculators voor Nederlandse consumenten. Doel: organisch verkeer via Google + AdSense inkomsten. Geen backend, geen registratie — volledig client-side.

## Stack
- Puur HTML/CSS/JavaScript (geen framework)
- Hosting: GitHub Pages (static)
- Geen build stap, geen npm, geen dependencies
- Google Fonts: Inter (body) + DM Serif Display (headings)

## Bestandsstructuur
```
/
├── index.html                               ← homepage
├── css/style.css                            ← volledig design system (CSS variables)
├── js/netto-salaris.js                      ← belastingberekeningen
├── js/hypotheek.js                          ← NIBUD hypotheeklogica
├── js/studielast.js                         ← DUO draagkrachtberekening
├── js/huur-vs-koop.js                       ← huur vs. koop vergelijker
├── js/lening-check.js                       ← oversluiten berekening
├── js/koopkracht.js                         ← koopkracht-index
├── tools/
│   ├── netto-salaris-calculator.html
│   ├── maximale-hypotheek-calculator.html
│   ├── studielast-calculator.html
│   ├── huur-vs-koop-calculator.html
│   ├── lening-check.html
│   └── koopkracht-calculator.html
├── robots.txt
├── sitemap.xml
└── disclaimer.html
```

## Design system (CSS variables in style.css)
```css
--bg:        #F5F6F2   /* pagina achtergrond */
--bg-card:   #FFFFFF
--text:      #1A2233   /* hoofdtekst */
--text-muted:#5A6478
--accent:    #1B6E4F   /* emerald groen — netto salaris tool */
--accent-lt: #E8F5EF
--accent2:   #2E4A7A   /* navy blauw — hypotheek tool */
--accent2-lt:#EAF0FB
--border:    #DDE1E8
--font-display: 'DM Serif Display'
--font-body:    'Inter'
```

## Belastingparameters 2025 (in js/netto-salaris.js)
- Box 1 schijf 1: 36,97% tot €75.624
- Box 1 schijf 2: 49,50% boven €75.624
- Arbeidskorting: max €5.052 (opbouw t/m ~€40k, afbouw t/m €124.934)
- Algemene heffingskorting: max €3.362 (afbouw boven €22.660, nihil boven €75.639)
- Zvw-bijdrage: 5,32% (max grondslag €75.864)
- **Updaten elke januari** op basis van nieuwe Belastingdienst tabellen

## NIBUD-normen 2025 (in js/hypotheek.js)
- FLP (financieringslastenpercentage) tabel: 14% t/m 27% afhankelijk van inkomen en rente
- Twee inkomens: laagste telt voor 90% mee
- Studielening DUO-toets: 0,75% van schuld = fictieve maandlast
- Eigen woningforfait: 0,35% (woningwaarde €12.500–€1.200.000)
- **Updaten elke januari** op basis van nieuwe NIBUD publicatie

## SEO-strategie
- Elke tool = aparte URL met eigen `<title>`, `<meta description>`, canonical
- Schema.org WebPage markup op elke pagina
- sitemap.xml indienen in Google Search Console
- Uitlegblokken onder elke calculator voor long-tail content
- Doelzoekwoorden:
  - "netto salaris berekenen 2025"
  - "bruto netto berekening"
  - "maximale hypotheek berekenen"
  - "hoeveel hypotheek kan ik krijgen"

## Google Analytics
- Tag ID: **G-0BPFBM6MPD**
- Snippet staat direct na `<link rel="stylesheet">` in de `<head>` van elke pagina
- **Verplicht op elke nieuwe HTML-pagina** die aangemaakt wordt

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-0BPFBM6MPD"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-0BPFBM6MPD');
</script>
```

## AdSense
Ad slots staan klaar als HTML comments: `<!-- ADVERTENTIE -->`
Locaties:
- index.html: 1x leaderboard na hero, 1x rectangle na tools
- tool pages: 1x boven calculator, 1x onder SEO-content

## Nieuwe tool toevoegen
1. Maak `tools/naam-tool.html` — kopieer structuur van bestaande tool
2. Maak `js/naam-tool.js` — berekeningen in losse JS file
3. Voeg toe aan `index.html` tools-grid (`.tool-card`)
4. Voeg toe aan navigatie in `site-header` op alle pagina's
5. Voeg URL toe aan `sitemap.xml`
6. Update `<meta>` en canonical URL

## Geplande tools (backlog)
- Budget Planner: "Wat hou ik over per maand na vaste lasten?"
- Abonnementen-check: Wat geef ik maandelijks uit aan digitale diensten?
- Vaste Lasten Trend: Houd maandelijks je totale kosten bij

## Onderhoud
- Belastingparameters: updaten in **januari** elk jaar
- NIBUD-normen: updaten in **januari** elk jaar
- Sitemap: bijwerken bij nieuwe tools
- Google Search Console: controleer maandelijks op indexeringsproblemen