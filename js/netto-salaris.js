/**
 * MaandlastCheck — Netto Salaris Calculator 2026
 * Belastingtabellen conform Belastingdienst 2026
 */

// ——— 2025 BELASTINGPARAMETERS ———
const TAX_2025 = {
  // Box 1 schijven (loon/inkomsten)
  schijven: [
    { tot: 75624,   tarief: 0.3697 },
    { tot: Infinity, tarief: 0.4950 },
  ],

  // Arbeidskorting 2025 (opbouw en afbouw)
  arbeidskorting: (loon) => {
    if (loon <= 0) return 0;
    let ak;
    if (loon <= 11490)       ak = loon * 0.08052;
    else if (loon <= 24820)  ak = 925 + (loon - 11490) * 0.29462;
    else if (loon <= 39957)  ak = 4853 + (loon - 24820) * 0.01655;  // plateau
    else if (loon <= 124934) ak = 5052 - (loon - 39957) * 0.06510;  // afbouw
    else ak = 0;
    return Math.max(0, Math.round(ak));
  },

  // Algemene heffingskorting 2025
  ahk: (loon, lhkToepassen) => {
    if (!lhkToepassen) return 0;
    let ahk;
    if (loon <= 22660)     ahk = 3362;
    else if (loon <= 75639) ahk = 3362 - (loon - 22660) * 0.06337;
    else ahk = 0;
    return Math.max(0, Math.round(ahk));
  },

  // Bijdrage Zvw 2025
  zvwTarief: 0.0532,
  zvwMax:    75864,
};

// ——— FORMAT HELPERS ———
const fmt = (val) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const fmtPct = (val) =>
  new Intl.NumberFormat('nl-NL', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(val);

// ——— CORE BEREKENING ———
function berekenNetto(brutoJaar, opties = {}) {
  const { lhk = true, dertig = false, vakantiegeldIncl = false, aow = false } = opties;

  // Bruto incl. vakantiegeld
  let brutoTotaal = vakantiegeldIncl ? brutoJaar : brutoJaar * 1.08;
  // Maandsalaris (excl. vakantiegeld voor periodieke berekening)
  const brutoMaand = brutoJaar / 12;

  // Bij 30%-regeling: 30% van loon is onbelast
  const belastbaarJaar = dertig ? brutoJaar * 0.70 : brutoJaar;

  // ——— Belasting box 1 ———
  let belastingJaar = 0;
  let resterend = belastbaarJaar;
  for (const schijf of TAX_2025.schijven) {
    if (resterend <= 0) break;
    const inSchijf = schijf.tot === Infinity
      ? resterend
      : Math.min(resterend, schijf.tot - (belastbaarJaar - resterend));
    belastingJaar += inSchijf * schijf.tarief;
    resterend -= inSchijf;
  }
  belastingJaar = Math.round(belastingJaar);

  // ——— Heffingskortingen ———
  const ak  = TAX_2025.arbeidskorting(belastbaarJaar);
  const ahk = TAX_2025.ahk(belastbaarJaar, lhk);

  // ——— Zvw ———
  const zvwBasis  = Math.min(belastbaarJaar, TAX_2025.zvwMax);
  const zvwJaar   = Math.round(zvwBasis * TAX_2025.zvwTarief);

  // ——— Netto berekening ———
  const nettoJaar      = belastbaarJaar - belastingJaar + ak + ahk - zvwJaar;
  const nettoMaand     = Math.round(nettoJaar / 12);
  const nettoVakantie  = vakantiegeldIncl ? 0 : Math.round((brutoJaar * 0.08) * (nettoJaar / belastbaarJaar));
  const effectiefTarief = (belastingJaar - ak - ahk + zvwJaar) / belastbaarJaar;

  return {
    brutoMaand:    Math.round(brutoMaand),
    belastingMaand: Math.round((belastingJaar) / 12),
    zvwMaand:       Math.round(zvwJaar / 12),
    akMaand:        Math.round(ak / 12),
    ahkMaand:       Math.round(ahk / 12),
    nettoMaand,
    nettoJaar:      Math.round(nettoJaar),
    nettoVakantie,
    effectiefTarief: Math.max(0, effectiefTarief),
  };
}

// ——— UI ———
function updateUI() {
  const brutoJaar = parseFloat(document.getElementById('bruto-jaar').value) || 0;
  const lhk       = document.getElementById('lhk').checked;
  const dertig    = document.getElementById('dertig').checked;
  const vakIncl   = document.getElementById('vakantiegeld').value === 'included';

  const r = berekenNetto(brutoJaar, { lhk, dertig, vakantiegeldIncl: vakIncl });

  document.getElementById('res-netto-maand').textContent     = fmt(r.nettoMaand);
  document.getElementById('res-bruto-maand').textContent     = fmt(r.brutoMaand);
  document.getElementById('res-belasting').textContent       = `− ${fmt(r.belastingMaand)}`;
  document.getElementById('res-zvw').textContent             = `− ${fmt(r.zvwMaand)}`;
  document.getElementById('res-arbeidskorting').textContent  = `+ ${fmt(r.akMaand)}`;
  document.getElementById('res-ahk').textContent             = `+ ${fmt(r.ahkMaand)}`;
  document.getElementById('res-netto-jaar').textContent      = fmt(r.nettoJaar);
  document.getElementById('res-vakantiegeld').textContent    = vakIncl ? '—' : fmt(r.nettoVakantie);
  document.getElementById('res-effectief').textContent       = fmtPct(r.effectiefTarief);
}

// ——— EVENT LISTENERS ———
document.addEventListener('DOMContentLoaded', () => {
  const inputs = ['bruto-jaar', 'vakantiegeld', 'leeftijd'];
  const toggles = ['lhk', 'dertig'];

  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateUI);
  });

  toggles.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updateUI);
  });

  updateUI();
});
