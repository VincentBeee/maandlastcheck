// MaandlastCheck — Studielast Calculator (DUO terugbetaling) 2026

const DUO_2025 = {
  rente: {
    nieuw: 2.56,  // % nieuw stelsel (HBO/WO vanaf sept 2015)
    oud:   0.46,  // % oud stelsel (vóór sept 2015)
  },
  termijn: {
    nieuw: 35 * 12,
    oud:   15 * 12,
  },
  draagkrachtPct: 0.04,
  drempel: {
    single:  22600,
    partner: 32000,
  },
};

const fmt = (val) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

function berekenAnnuiteit(schuld, renteJaarPct, maanden) {
  if (schuld <= 0) return 0;
  const r = renteJaarPct / 100 / 12;
  if (r < 0.000001) return schuld / maanden;
  return schuld * r * Math.pow(1 + r, maanden) / (Math.pow(1 + r, maanden) - 1);
}

function berekenRestschuld(schuld, renteJaarPct, maanden, maandBetaling) {
  if (schuld <= 0) return 0;
  const r = renteJaarPct / 100 / 12;
  if (r < 0.000001) return Math.max(0, schuld - maandBetaling * maanden);
  const fv = schuld * Math.pow(1 + r, maanden) - maandBetaling * (Math.pow(1 + r, maanden) - 1) / r;
  return Math.max(0, fv);
}

function berekenStudielast(schuld, inkomen, stelsel, rente, partnersituatie) {
  const termijn = DUO_2025.termijn[stelsel];
  const drempel = DUO_2025.drempel[partnersituatie];

  const annuiteit = berekenAnnuiteit(schuld, rente, termijn);
  const draagkrachtMaand = Math.max(0, (inkomen - drempel) * DUO_2025.draagkrachtPct / 12);

  // Je betaalt het laagste van draagkracht en annuïteit
  const werkelijkeBetaling = Math.min(annuiteit, draagkrachtMaand);

  const restschuld = berekenRestschuld(schuld, rente, termijn, werkelijkeBetaling);
  const totaalBetaald = werkelijkeBetaling * termijn;

  // DUO-toetsregel hypotheek: 0,75% van oorspronkelijke schuld per jaar
  const hypotheekFictiefMaand = schuld * 0.0075 / 12;

  return {
    annuiteit:             Math.round(annuiteit),
    draagkrachtMaand:      Math.round(draagkrachtMaand),
    werkelijkeMaandlast:   Math.round(werkelijkeBetaling),
    restschuld:            Math.round(restschuld),
    totaalBetaald:         Math.round(totaalBetaald),
    hypotheekFictiefMaand: Math.round(hypotheekFictiefMaand),
    termijnJaar:           termijn / 12,
    wordtKwijtgescholden:  restschuld > 100,
  };
}

function updateUI() {
  const schuld  = parseFloat(document.getElementById('schuld').value) || 0;
  const inkomen = parseFloat(document.getElementById('inkomen').value) || 0;
  const stelsel = document.getElementById('stelsel').value;
  const rente   = parseFloat(document.getElementById('rente').value) || 0;
  const partner = document.getElementById('partner').value;

  const r = berekenStudielast(schuld, inkomen, stelsel, rente, partner);

  document.getElementById('res-maandlast').textContent   = fmt(r.werkelijkeMaandlast);
  document.getElementById('res-draagkracht').textContent = fmt(r.draagkrachtMaand);
  document.getElementById('res-annuiteit').textContent   = fmt(r.annuiteit);
  document.getElementById('res-termijn').textContent     = `${r.termijnJaar} jaar`;
  document.getElementById('res-totaal').textContent      = fmt(r.totaalBetaald);
  document.getElementById('res-restschuld').textContent  =
    r.wordtKwijtgescholden ? `${fmt(r.restschuld)} kwijtgescholden` : '—';
  document.getElementById('res-hypotheek').textContent   = `− ${fmt(r.hypotheekFictiefMaand)} / mnd`;
}

function syncRente() {
  const stelsel = document.getElementById('stelsel').value;
  const renteEl = document.getElementById('rente');
  renteEl.value = DUO_2025.rente[stelsel];
  updateUI();
}

document.addEventListener('DOMContentLoaded', () => {
  ['schuld', 'inkomen', 'rente'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateUI);
  });

  document.getElementById('stelsel').addEventListener('change', syncRente);
  document.getElementById('partner').addEventListener('change', updateUI);

  updateUI();
});
