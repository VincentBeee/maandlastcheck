/**
 * MaandlastCheck — Maximale Hypotheek Calculator 2025
 * Gebaseerd op NIBUD woonlastennormen 2025
 */

// ——— NIBUD FINANCIERINGSLASTENPERCENTAGES 2025 ———
// [inkomengrens, FLP bij rente <= 2%, FLP bij rente <= 3%, FLP bij rente <= 4%, FLP bij rente <= 5%, FLP bij rente <= 6%]
// Vereenvoudigde tabel — officiële NIBUD tabel heeft meer gradaties
const NIBUD_FLP = [
  { tot: 21000,  pct: [0.14, 0.14, 0.14, 0.13, 0.13] },
  { tot: 25000,  pct: [0.17, 0.17, 0.16, 0.16, 0.15] },
  { tot: 30000,  pct: [0.21, 0.20, 0.20, 0.19, 0.18] },
  { tot: 35000,  pct: [0.22, 0.22, 0.21, 0.21, 0.20] },
  { tot: 40000,  pct: [0.23, 0.23, 0.22, 0.22, 0.21] },
  { tot: 45000,  pct: [0.24, 0.24, 0.23, 0.23, 0.22] },
  { tot: 55000,  pct: [0.25, 0.25, 0.24, 0.24, 0.23] },
  { tot: 70000,  pct: [0.26, 0.26, 0.25, 0.25, 0.24] },
  { tot: Infinity, pct: [0.27, 0.27, 0.26, 0.26, 0.25] },
];

function getNibudPct(toetsinkomen, rente) {
  const renteIdx = rente <= 2 ? 0 : rente <= 3 ? 1 : rente <= 4 ? 2 : rente <= 5 ? 3 : 4;
  for (const rij of NIBUD_FLP) {
    if (toetsinkomen <= rij.tot) return rij.pct[renteIdx];
  }
  return 0.27;
}

// ——— ANNUÏTEITSFACTOR ———
// Geeft de annuïtaire maandfactor als fractie van de hoofdsom
function annuiteitsFactor(rentePct, looptijdJaar) {
  const r = rentePct / 12 / 100;
  const n = looptijdJaar * 12;
  if (r === 0) return 1 / n;
  return (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ——— LINEAIRE FACTOR (eerste maand = hoogste last) ———
function lineaireMaandlastEerste(hoofdsom, rentePct, looptijdJaar) {
  const n = looptijdJaar * 12;
  const aflossingMaand = hoofdsom / n;
  const renteMaand = hoofdsom * (rentePct / 100 / 12);
  return aflossingMaand + renteMaand;
}

// ——— DUO STUDIELENING IMPACT ———
// 0.75% van oorspronkelijke schuld = fictieve jaarlast voor toets
function studieleningImpact(schuld, rente, looptijd) {
  const fictieveMaandlast = schuld * 0.0075 / 12;
  // Bereken hoeveel hypotheek deze maandlast "kost"
  const factor = annuiteitsFactor(rente, looptijd);
  return Math.round(fictieveMaandlast / factor);
}

// ——— EIGEN WONINGFORFAIT ———
function ewf(woningwaarde) {
  if (woningwaarde <= 12500) return 0;
  if (woningwaarde <= 25000) return Math.round(woningwaarde * 0.001);
  if (woningwaarde <= 50000) return Math.round(woningwaarde * 0.002);
  if (woningwaarde <= 75000) return Math.round(woningwaarde * 0.0025);
  if (woningwaarde <= 1200000) return Math.round(woningwaarde * 0.0035);
  return Math.round(1200000 * 0.0035 + (woningwaarde - 1200000) * 0.0235);
}

// ——— FORMAT ———
const fmt = (val) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const fmtPct = (val) =>
  new Intl.NumberFormat('nl-NL', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

// ——— CORE BEREKENING ———
function berekenHypotheek() {
  const inkomen1   = parseFloat(document.getElementById('inkomen1').value) || 0;
  const tweeInk    = document.getElementById('twee-inkomens').checked;
  const inkomen2   = tweeInk ? (parseFloat(document.getElementById('inkomen2').value) || 0) : 0;
  const rente      = parseFloat(document.getElementById('rente').value) || 4.0;
  const looptijd   = parseInt(document.getElementById('looptijd').value) || 30;
  const vorm       = document.getElementById('hypotheekvorm').value;
  const studie     = parseFloat(document.getElementById('studielening').value) || 0;

  // Toetsinkomen: hoogste + 90% van laagste
  const hoogste  = Math.max(inkomen1, inkomen2);
  const laagste  = tweeInk ? Math.min(inkomen1, inkomen2) : 0;
  const toetsinkomen = hoogste + laagste * 0.90;

  // NIBUD norm
  const nibudPct = getNibudPct(toetsinkomen, rente);
  const maxJaarlast = toetsinkomen * nibudPct;
  const maxMaandlast = maxJaarlast / 12;

  // Maximale hypotheek op basis van annuïteit
  const factor = annuiteitsFactor(rente, looptijd);
  let maxHypotheek = Math.round(maxMaandlast / factor);

  // Corrigeer voor studieschuld
  const studieImpact = studie > 0 ? studieleningImpact(studie, rente, looptijd) : 0;
  maxHypotheek -= studieImpact;
  maxHypotheek = Math.max(0, maxHypotheek);

  // Maandlast bij max hypotheek
  let feitelijkeMaandlast;
  if (vorm === 'annuitair') {
    feitelijkeMaandlast = Math.round(maxHypotheek * factor);
  } else {
    feitelijkeMaandlast = Math.round(lineaireMaandlastEerste(maxHypotheek, rente, looptijd));
    // Lineair: max hypotheek herberekenen op basis van startlast
    const linFactor = lineaireMaandlastEerste(1, rente, looptijd);
    maxHypotheek = Math.round(maxMaandlast / linFactor);
    feitelijkeMaandlast = Math.round(maxMaandlast);
  }

  // EWF
  const ewfJaar = ewf(maxHypotheek);

  // Update DOM
  document.getElementById('res-max-hyp').textContent       = fmt(maxHypotheek);
  document.getElementById('res-toetsinkomen').textContent  = fmt(toetsinkomen);
  document.getElementById('res-nibud-norm').textContent    = fmtPct(nibudPct);
  document.getElementById('res-max-maandlast').textContent = fmt(maxMaandlast);
  document.getElementById('res-maandlast').textContent     = fmt(feitelijkeMaandlast);
  document.getElementById('res-ewf').textContent           = `${fmt(ewfJaar)} / jaar`;
  document.getElementById('res-studie-impact').textContent = studie > 0 ? `− ${fmt(studieImpact)}` : '—';
}

// ——— EVENT LISTENERS ———
document.addEventListener('DOMContentLoaded', () => {
  const inputs = ['inkomen1', 'inkomen2', 'rente', 'looptijd', 'hypotheekvorm', 'studielening'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', berekenHypotheek);
  });

  document.getElementById('twee-inkomens').addEventListener('change', function () {
    document.getElementById('inkomen2-group').style.display = this.checked ? 'block' : 'none';
    berekenHypotheek();
  });

  berekenHypotheek();
});
