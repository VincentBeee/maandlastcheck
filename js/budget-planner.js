// MaandlastCheck — Budget Planner 2026

const fmt = (val) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

function som(ids) {
  return ids.reduce((acc, id) => acc + (parseFloat(document.getElementById(id)?.value) || 0), 0);
}

function somDynamic(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return 0;
  let total = 0;
  container.querySelectorAll('.dyn-value').forEach(input => { total += parseFloat(input.value) || 0; });
  return total;
}

let _rowId = 0;

function addRow(containerId, placeholder) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const uid = 'dyn-' + (++_rowId);
  const row = document.createElement('div');
  row.className = 'dynamic-row';
  row.innerHTML =
    '<input type="text" class="label-input" placeholder="' + placeholder + '">' +
    '<div class="input-wrap has-prefix">' +
      '<span class="input-prefix">€</span>' +
      '<input type="number" class="budget-input dyn-value" id="' + uid + '" value="0" min="0" step="10">' +
    '</div>' +
    '<button class="remove-row-btn" onclick="removeRow(this)" aria-label="Verwijder">&times;</button>';
  container.appendChild(row);
  row.querySelector('.dyn-value').addEventListener('input', updateUI);
  row.querySelector('.label-input').focus();
}

function removeRow(btn) {
  btn.closest('.dynamic-row').remove();
  updateUI();
}

function updateUI() {
  const inkomenBase  = parseFloat(document.getElementById('inkomen').value) || 0;
  const inkomenExtra = somDynamic('extra-inkomen-rows');
  const inkomen      = inkomenBase + inkomenExtra;

  const wonenT   = som(['huur','energie','zorgverzekering','verzekeringen']) + somDynamic('extra-wonen-rows');
  const levensT  = som(['boodschappen','transport','abonnementen-post'])      + somDynamic('extra-levens-rows');
  const persoonT = som(['verzorging','uiteten','hobby'])                       + somDynamic('extra-persoon-rows');
  const sparenT  = som(['sparen','overig'])                                    + somDynamic('extra-sparen-rows');
  const totaal   = wonenT + levensT + persoonT + sparenT;
  const vrij     = inkomen - totaal;
  const vrijPct  = inkomen > 0 ? (vrij / inkomen) * 100 : 0;
  const pct      = (d) => inkomen > 0 ? Math.min(100, Math.max(0, Math.round(d / inkomen * 100))) : 0;

  document.getElementById('res-vrij').textContent     = fmt(vrij);
  document.getElementById('res-inkomen').textContent  = fmt(inkomen);
  document.getElementById('res-wonen').textContent    = fmt(wonenT);
  document.getElementById('res-levens').textContent   = fmt(levensT);
  document.getElementById('res-persoon').textContent  = fmt(persoonT);
  document.getElementById('res-sparen').textContent   = fmt(sparenT);
  document.getElementById('res-totaal').textContent   = fmt(totaal);
  document.getElementById('res-vrij-pct').textContent = Math.round(vrijPct) + '% vrij besteedbaar';

  ['wonen','levens','persoon','sparen'].forEach((g, i) => {
    const barEl = document.getElementById('bar-' + g);
    const v     = [wonenT, levensT, persoonT, sparenT][i];
    if (barEl) barEl.style.width = pct(v) + '%';
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

  renderSankey();
}

// ——— SANKEY DIAGRAM ———
function renderSankey() {
  const svg = document.getElementById('sankey-svg');
  if (!svg) return;

  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const NS = 'http://www.w3.org/2000/svg';
  function mkEl(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  const inkomenBase  = parseFloat(document.getElementById('inkomen')?.value) || 0;
  const inkomenExtra = somDynamic('extra-inkomen-rows');
  const inkomen      = inkomenBase + inkomenExtra;

  if (inkomen <= 0) {
    const t = mkEl('text', { x: 400, y: 190, 'text-anchor': 'middle', 'font-family': 'Inter,sans-serif', 'font-size': 14, fill: '#888' });
    t.textContent = 'Vul je inkomen in om de flow te zien.';
    svg.appendChild(t);
    return;
  }

  const cats = [
    { name: 'Wonen',           color: '#2E4A7A', ids: ['huur','energie','zorgverzekering','verzekeringen'], extraId: 'extra-wonen-rows' },
    { name: 'Levensonderhoud', color: '#3A5C9A', ids: ['boodschappen','transport','abonnementen-post'],     extraId: 'extra-levens-rows' },
    { name: 'Persoonlijk',     color: '#4D6EB2', ids: ['verzorging','uiteten','hobby'],                     extraId: 'extra-persoon-rows' },
    { name: 'Sparen & overig', color: '#6583C4', ids: ['sparen','overig'],                                  extraId: 'extra-sparen-rows' },
  ];

  const items = cats
    .map(c => ({ name: c.name, color: c.color, val: som(c.ids) + somDynamic(c.extraId) }))
    .filter(c => c.val > 0);

  const totalOut = items.reduce((s, c) => s + c.val, 0);
  const vrij = inkomen - totalOut;
  if (vrij > 0) items.push({ name: 'Vrij besteedbaar', color: '#1B6E4F', val: vrij });
  if (items.length === 0) return;

  const W = 800, H = 380, PT = 42, PB = 28;
  const NW = 16, GAP = 7;
  const SX = 10, TX = 608;
  const usable = H - PT - PB;
  const gapTotal = GAP * (items.length - 1);
  const scale = (usable - gapTotal) / Math.max(inkomen, totalOut);
  const srcH = inkomen * scale;
  const compress = totalOut > inkomen ? inkomen / totalOut : 1;
  const MX = Math.round((SX + NW + TX) / 2);

  let so = 0, to = 0;
  const nodes = items.map(it => {
    const th = it.val * scale;
    const sh = th * compress;
    const nd = { name: it.name, color: it.color, val: it.val, sy1: PT+so, sy2: PT+so+sh, ty1: PT+to, ty2: PT+to+th, th };
    so += sh; to += th + GAP;
    return nd;
  });

  // Flows (bezier-vlakken)
  nodes.forEach(nd => {
    svg.appendChild(mkEl('path', {
      d: 'M'+(SX+NW)+','+nd.sy1+' C'+MX+','+nd.sy1+' '+MX+','+nd.ty1+' '+TX+','+nd.ty1+
         'L'+TX+','+nd.ty2+' C'+MX+','+nd.ty2+' '+MX+','+nd.sy2+' '+(SX+NW)+','+nd.sy2+'Z',
      fill: nd.color, opacity: 0.22,
    }));
  });

  // Bronnode (inkomen, links)
  svg.appendChild(mkEl('rect', { x: SX, y: PT, width: NW, height: Math.max(srcH, 2), fill: '#1B6E4F', rx: 3 }));
  const sl = mkEl('text', { x: SX+NW/2, y: PT-20, 'text-anchor': 'middle', 'font-family': 'Inter,sans-serif', 'font-size': 11, 'font-weight': 600, fill: '#1A2233' });
  sl.textContent = 'Inkomen';
  svg.appendChild(sl);
  const sv = mkEl('text', { x: SX+NW/2, y: PT-7, 'text-anchor': 'middle', 'font-family': 'Inter,sans-serif', 'font-size': 10, fill: '#5A6478' });
  sv.textContent = fmt(inkomen);
  svg.appendChild(sv);

  // Doelnodes + labels (rechts)
  nodes.forEach(nd => {
    svg.appendChild(mkEl('rect', { x: TX, y: nd.ty1, width: NW, height: Math.max(nd.th, 2), fill: nd.color, rx: 3 }));
    if (nd.th >= 14) {
      const lx = TX + NW + 8;
      const my = (nd.ty1 + nd.ty2) / 2;
      const pct = Math.round(nd.val / inkomen * 100);
      const tl = mkEl('text', { x: lx, y: my-7, 'font-family': 'Inter,sans-serif', 'font-size': 11, 'font-weight': 600, fill: '#1A2233' });
      tl.textContent = nd.name;
      svg.appendChild(tl);
      const tv = mkEl('text', { x: lx, y: my+7, 'font-family': 'Inter,sans-serif', 'font-size': 10, fill: '#5A6478' });
      tv.textContent = fmt(nd.val) + ' · ' + pct + '%';
      svg.appendChild(tv);
    }
  });

  // Watermark
  const wm = mkEl('text', { x: W/2, y: H-8, 'text-anchor': 'middle', 'font-family': 'Inter,sans-serif', 'font-size': 9, fill: 'rgba(90,100,120,0.38)' });
  wm.textContent = 'maandlastcheck.nl';
  svg.appendChild(wm);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.budget-input').forEach(el => el.addEventListener('input', updateUI));
  updateUI();
});
