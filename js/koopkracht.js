// MaandlastCheck — Koopkracht-index 2025

const fmt = (val) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const fmtPct = (val, decimals = 1) =>
  new Intl.NumberFormat('nl-NL', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val / 100);

function berekenKoopkracht({ inkomen, loongroei, inflatie, horizonJaar }) {
  const nominaalEinde = inkomen * Math.pow(1 + loongroei / 100, horizonJaar);
  const cpiEinde      = Math.pow(1 + inflatie / 100, horizonJaar);
  const reeelEinde    = nominaalEinde / cpiEinde;
  const mutatiePct    = (reeelEinde / inkomen - 1) * 100;
  const verschilMaand = reeelEinde - inkomen;

  // Effectieve jaarlijkse koopkrachtmutatie
  const jaarMutatiePct = ((1 + loongroei / 100) / (1 + inflatie / 100) - 1) * 100;

  return {
    inkomenStart:    Math.round(inkomen),
    nominaalEinde:   Math.round(nominaalEinde),
    reeelEinde:      Math.round(reeelEinde),
    mutatiePct,
    jaarMutatiePct,
    verschilMaand:   Math.round(verschilMaand),
    vereistLoongroei: inflatie,
    koopkrachtWint:  mutatiePct > 0,
  };
}

function updateUI() {
  const inkomen     = parseFloat(document.getElementById('inkomen').value) || 0;
  const loongroei   = parseFloat(document.getElementById('loongroei').value) || 0;
  const inflatie    = parseFloat(document.getElementById('inflatie').value) || 0;
  const horizonJaar = parseInt(document.getElementById('horizon').value) || 1;

  if (inkomen <= 0) return;

  const r = berekenKoopkracht({ inkomen, loongroei, inflatie, horizonJaar });

  document.querySelectorAll('.horizon-label').forEach(el => { el.textContent = horizonJaar; });

  document.getElementById('res-reeel-einde').textContent   = fmt(r.reeelEinde);
  document.getElementById('res-nominaal-einde').textContent = fmt(r.nominaalEinde);
  document.getElementById('res-mutatie-totaal').textContent = (r.mutatiePct >= 0 ? '+' : '') + fmtPct(r.mutatiePct);
  document.getElementById('res-mutatie-jaar').textContent   = (r.jaarMutatiePct >= 0 ? '+' : '') + fmtPct(r.jaarMutatiePct) + ' / jaar';

  const verschilEl = document.getElementById('res-verschil-maand');
  verschilEl.textContent = (r.verschilMaand >= 0 ? '+' : '− ') + fmt(Math.abs(r.verschilMaand)) + ' / mnd';

  document.getElementById('res-vereist-loon').textContent  = fmtPct(r.vereistLoongroei) + ' / jaar';

  const adviesEl = document.getElementById('res-advies');
  if (r.koopkrachtWint) {
    adviesEl.textContent = `Je koopkracht stijgt: je loonstijging (${fmtPct(loongroei)}) overtreft inflatie (${fmtPct(inflatie)}).`;
  } else if (Math.abs(r.jaarMutatiePct) < 0.05) {
    adviesEl.textContent = 'Je koopkracht blijft vrijwel gelijk: loongroei en inflatie zijn nagenoeg gelijk.';
  } else {
    adviesEl.textContent = `Je koopkracht daalt: je loonstijging (${fmtPct(loongroei)}) houdt geen gelijke tred met inflatie (${fmtPct(inflatie)}).`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ['inkomen', 'loongroei', 'inflatie'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', updateUI));
  document.getElementById('horizon')?.addEventListener('change', updateUI);
  updateUI();
});
