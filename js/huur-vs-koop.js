// MaandlastCheck — Huur vs. Koop Vergelijker 2026

const fmt = (val) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

function annuiteit(principal, renteJaarPct, maanden) {
  if (principal <= 0) return 0;
  const r = renteJaarPct / 100 / 12;
  if (r < 0.000001) return principal / maanden;
  return principal * r * Math.pow(1 + r, maanden) / (Math.pow(1 + r, maanden) - 1);
}

function restschuld(principal, renteJaarPct, totalMaanden, betaaldeMaanden) {
  if (principal <= 0) return 0;
  const r = renteJaarPct / 100 / 12;
  const m = annuiteit(principal, renteJaarPct, totalMaanden);
  if (r < 0.000001) return Math.max(0, principal - m * betaaldeMaanden);
  const fv = principal * Math.pow(1 + r, betaaldeMaanden)
           - m * (Math.pow(1 + r, betaaldeMaanden) - 1) / r;
  return Math.max(0, fv);
}

function berekenVergelijking({ woningprijs, eigenInbreng, rente, looptijdJaar, waardestijging,
                                huurMaand, huurstijging, horizonJaar, beleggingsrendement, starter }) {
  const hypotheek       = woningprijs - eigenInbreng;
  const looptijdMaanden = looptijdJaar * 12;
  const horizonMaanden  = horizonJaar * 12;

  const overdracht  = starter ? 0 : woningprijs * 0.02;
  const kostenKoper = overdracht + 2000; // notaris + taxatie

  const hypMaand       = annuiteit(hypotheek, rente, looptijdMaanden);
  const onderhoudMaand = woningprijs * 0.01 / 12; // 1% onderhoud per jaar

  const woningwaardeNa = woningprijs * Math.pow(1 + waardestijging / 100, horizonJaar);
  const betaaldMnd     = Math.min(horizonMaanden, looptijdMaanden);
  const restschuldNa   = restschuld(hypotheek, rente, looptijdMaanden, betaaldMnd);
  const koopVermogen   = woningwaardeNa - restschuldNa;

  // Huurder belegt eigenInbreng + kostenKoper en investeert maandelijks het verschil
  const r_m = beleggingsrendement / 100 / 12;
  let portfolio = eigenInbreng + kostenKoper;

  for (let m = 0; m < horizonMaanden; m++) {
    portfolio *= (1 + r_m);
    const jaar      = Math.floor(m / 12);
    const huurDezeM = huurMaand * Math.pow(1 + huurstijging / 100, jaar);
    const koopDezeM = (m < looptijdMaanden ? hypMaand : 0) + onderhoudMaand;
    portfolio      += (koopDezeM - huurDezeM);
  }

  const huurEinde = huurMaand * Math.pow(1 + huurstijging / 100, horizonJaar - 1);

  return {
    hypMaand:        Math.round(hypMaand),
    onderhoudMaand:  Math.round(onderhoudMaand),
    koopMaandTotaal: Math.round(hypMaand + onderhoudMaand),
    kostenKoper:     Math.round(kostenKoper),
    woningwaardeNa:  Math.round(woningwaardeNa),
    restschuldNa:    Math.round(restschuldNa),
    koopVermogen:    Math.round(koopVermogen),
    huurStart:       Math.round(huurMaand),
    huurEinde:       Math.round(huurEinde),
    huurVermogen:    Math.round(portfolio),
    verschil:        Math.round(koopVermogen - portfolio),
    kopenWint:       koopVermogen > portfolio,
  };
}

function updateUI() {
  const woningprijs         = parseFloat(document.getElementById('woningprijs').value) || 0;
  const eigenInbreng        = parseFloat(document.getElementById('eigen-inbreng').value) || 0;
  const rente               = parseFloat(document.getElementById('rente').value) || 0;
  const looptijdJaar        = parseInt(document.getElementById('looptijd').value) || 30;
  const waardestijging      = parseFloat(document.getElementById('waardestijging').value) || 0;
  const starter             = document.getElementById('starter').checked;
  const huurMaand           = parseFloat(document.getElementById('huur-maand').value) || 0;
  const huurstijging        = parseFloat(document.getElementById('huurstijging').value) || 0;
  const horizonJaar         = parseInt(document.getElementById('horizon').value) || 10;
  const beleggingsrendement = parseFloat(document.getElementById('beleggingsrendement').value) || 0;

  if (woningprijs <= 0 || eigenInbreng <= 0 || eigenInbreng >= woningprijs) return;

  const r = berekenVergelijking({
    woningprijs, eigenInbreng, rente, looptijdJaar, waardestijging,
    huurMaand, huurstijging, horizonJaar, beleggingsrendement, starter,
  });

  document.querySelectorAll('.horizon-label').forEach(el => { el.textContent = horizonJaar; });

  document.getElementById('res-koop-vermogen').textContent = fmt(r.koopVermogen);
  document.getElementById('res-huur-vermogen').textContent = fmt(r.huurVermogen);

  const winner = r.kopenWint ? 'Kopen' : 'Huren';
  const diff   = Math.abs(r.verschil);
  document.getElementById('res-winner').textContent =
    `${winner} levert ${fmt(diff)} meer op na ${horizonJaar} jaar`;

  document.getElementById('res-koop-maand').textContent   = `${fmt(r.koopMaandTotaal)} / mnd`;
  document.getElementById('res-kosten-koper').textContent = fmt(r.kostenKoper);
  document.getElementById('res-woningwaarde').textContent = fmt(r.woningwaardeNa);
  document.getElementById('res-restschuld').textContent   = fmt(r.restschuldNa);
  document.getElementById('res-huur-start').textContent   = `${fmt(r.huurStart)} / mnd`;
  document.getElementById('res-huur-einde').textContent   = `${fmt(r.huurEinde)} / mnd`;
  document.getElementById('res-portfolio').textContent    = fmt(r.huurVermogen);
}

document.addEventListener('DOMContentLoaded', () => {
  ['woningprijs','eigen-inbreng','rente','waardestijging','huur-maand','huurstijging','beleggingsrendement']
    .forEach(id => document.getElementById(id)?.addEventListener('input', updateUI));
  ['looptijd','horizon']
    .forEach(id => document.getElementById(id)?.addEventListener('change', updateUI));
  document.getElementById('starter')?.addEventListener('change', updateUI);
  updateUI();
});
