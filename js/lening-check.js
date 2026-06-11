// MaandlastCheck — Lening-Check (Oversluiten) 2025

const fmt = (val) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

function annuiteit(principal, renteJaarPct, maanden) {
  if (principal <= 0 || maanden <= 0) return 0;
  const r = renteJaarPct / 100 / 12;
  if (r < 0.000001) return principal / maanden;
  return principal * r * Math.pow(1 + r, maanden) / (Math.pow(1 + r, maanden) - 1);
}

function berekenOversluiten({ schuld, huidigeRente, restLooptijdJaar, nieuweRente, nieuweLooptijdJaar, oversluitkosten }) {
  const restMnd  = restLooptijdJaar * 12;
  const nieuwMnd = nieuweLooptijdJaar * 12;

  const huidigeMaandlast = annuiteit(schuld, huidigeRente, restMnd);
  const nieuweMaandlast  = annuiteit(schuld, nieuweRente, nieuwMnd);
  const maandBesparing   = huidigeMaandlast - nieuweMaandlast;

  const renteHuidig = huidigeMaandlast * restMnd - schuld;
  const renteNieuw  = nieuweMaandlast  * nieuwMnd  - schuld;
  const renteBesparing = renteHuidig - renteNieuw - oversluitkosten;

  const breakEvenMnd = maandBesparing > 0
    ? Math.ceil(oversluitkosten / maandBesparing)
    : null;

  return {
    huidigeMaandlast: Math.round(huidigeMaandlast),
    nieuweMaandlast:  Math.round(nieuweMaandlast),
    maandBesparing:   Math.round(maandBesparing),
    renteHuidig:      Math.round(renteHuidig),
    renteNieuw:       Math.round(renteNieuw),
    renteBesparing:   Math.round(renteBesparing),
    breakEvenMnd,
    isVoordelig:      maandBesparing > 0 && breakEvenMnd !== null && breakEvenMnd <= nieuwMnd,
  };
}

function updateUI() {
  const schuld           = parseFloat(document.getElementById('schuld').value) || 0;
  const huidigeRente     = parseFloat(document.getElementById('huidige-rente').value) || 0;
  const restLooptijdJaar = parseInt(document.getElementById('rest-looptijd').value) || 1;
  const nieuweRente      = parseFloat(document.getElementById('nieuwe-rente').value) || 0;
  const nieuweLooptijdJaar = parseInt(document.getElementById('nieuwe-looptijd').value) || 1;
  const oversluitkosten  = parseFloat(document.getElementById('oversluitkosten').value) || 0;

  if (schuld <= 0) return;

  const r = berekenOversluiten({ schuld, huidigeRente, restLooptijdJaar, nieuweRente, nieuweLooptijdJaar, oversluitkosten });

  document.getElementById('res-maandbesparing').textContent = r.maandBesparing > 0
    ? fmt(r.maandBesparing)
    : `− ${fmt(Math.abs(r.maandBesparing))}`;

  document.getElementById('res-huidige-maand').textContent  = fmt(r.huidigeMaandlast);
  document.getElementById('res-nieuwe-maand').textContent   = fmt(r.nieuweMaandlast);
  document.getElementById('res-rente-huidig').textContent   = fmt(r.renteHuidig);
  document.getElementById('res-rente-nieuw').textContent    = fmt(r.renteNieuw);

  const besparingEl = document.getElementById('res-rentebesparing');
  besparingEl.textContent = r.renteBesparing >= 0
    ? fmt(r.renteBesparing)
    : `− ${fmt(Math.abs(r.renteBesparing))}`;

  const breakEvenEl = document.getElementById('res-breakeven');
  if (r.breakEvenMnd !== null) {
    const jaar = Math.floor(r.breakEvenMnd / 12);
    const mnd  = r.breakEvenMnd % 12;
    breakEvenEl.textContent = jaar > 0 ? `${jaar} jaar${mnd > 0 ? ` ${mnd} mnd` : ''}` : `${r.breakEvenMnd} mnd`;
  } else {
    breakEvenEl.textContent = r.maandBesparing <= 0 ? 'Niet voordelig' : '—';
  }

  const adviesEl = document.getElementById('res-advies');
  if (r.maandBesparing <= 0) {
    adviesEl.textContent = 'Oversluiten verhoogt je maandlast — niet voordelig.';
  } else if (r.isVoordelig) {
    adviesEl.textContent = `Oversluiten is voordelig: je verdient de kosten terug binnen ${r.breakEvenMnd} maanden.`;
  } else {
    adviesEl.textContent = 'Break-even valt buiten de nieuwe looptijd — kritisch bekijken.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ['schuld', 'huidige-rente', 'nieuwe-rente', 'oversluitkosten'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', updateUI));
  ['rest-looptijd', 'nieuwe-looptijd'].forEach(id =>
    document.getElementById(id)?.addEventListener('change', updateUI));
  updateUI();
});
