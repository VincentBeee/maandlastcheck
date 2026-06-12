// MaandlastCheck — Budget Planner 2026

const fmt = (val) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

function som(ids) {
  return ids.reduce((acc, id) => acc + (parseFloat(document.getElementById(id)?.value) || 0), 0);
}

function updateUI() {
  const inkomen    = parseFloat(document.getElementById('inkomen').value) || 0;
  const wonenT     = som(['huur', 'energie', 'zorgverzekering', 'verzekeringen']);
  const levensT    = som(['boodschappen', 'transport', 'abonnementen-post']);
  const persoonT   = som(['verzorging', 'uiteten', 'hobby']);
  const sparenT    = som(['sparen', 'overig']);
  const totaal     = wonenT + levensT + persoonT + sparenT;
  const vrij       = inkomen - totaal;
  const vrijPct    = inkomen > 0 ? (vrij / inkomen) * 100 : 0;
  const pct        = (d) => inkomen > 0 ? Math.min(100, Math.max(0, Math.round(d / inkomen * 100))) : 0;

  document.getElementById('res-vrij').textContent     = fmt(vrij);
  document.getElementById('res-inkomen').textContent  = fmt(inkomen);
  document.getElementById('res-wonen').textContent    = fmt(wonenT);
  document.getElementById('res-levens').textContent   = fmt(levensT);
  document.getElementById('res-persoon').textContent  = fmt(persoonT);
  document.getElementById('res-sparen').textContent   = fmt(sparenT);
  document.getElementById('res-totaal').textContent   = fmt(totaal);
  document.getElementById('res-vrij-pct').textContent = Math.round(vrijPct) + '% vrij besteedbaar';

  // Voortgangsbalken (% van inkomen)
  ['wonen','levens','persoon','sparen'].forEach((g, i) => {
    const el = document.getElementById(`bar-${g}`);
    const v  = [wonenT, levensT, persoonT, sparenT][i];
    if (el) el.style.width = pct(v) + '%';
  });

  const adviesEl = document.getElementById('res-advies');
  if (vrij < 0) {
    adviesEl.textContent = 'Je geeft meer uit dan je verdient — bekijk je vaste lasten kritisch.';
  } else if (vrijPct < 5) {
    adviesEl.textContent = 'Krappe marge. Streef naar minimaal 10% buffer voor onverwachte kosten.';
  } else if (vrijPct >= 20) {
    adviesEl.textContent = 'Ruime marge! Overweeg dit gericht weg te zetten in spaargeld of beleggingen.';
  } else {
    adviesEl.textContent = 'Budget in balans. Streef naar 10–20% vrij besteedbaar als buffer.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.budget-input').forEach(el => el.addEventListener('input', updateUI));
  updateUI();
});
