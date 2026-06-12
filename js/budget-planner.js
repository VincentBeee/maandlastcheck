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

  // Inkomensbronnen verzamelen
  const INC_COLORS = ['#1B6E4F', '#27916A', '#33AF7F', '#3EC494'];
  const sources = [];
  const baseVal = parseFloat(document.getElementById('inkomen')?.value) || 0;
  if (baseVal > 0) sources.push({ name: 'Netto inkomen', val: baseVal, color: INC_COLORS[0] });
  const extraIncEl = document.getElementById('extra-inkomen-rows');
  if (extraIncEl) {
    extraIncEl.querySelectorAll('.dynamic-row').forEach((row, i) => {
      const val = parseFloat(row.querySelector('.dyn-value')?.value) || 0;
      if (val > 0) {
        const name = row.querySelector('.label-input')?.value.trim() || 'Extra inkomen';
        sources.push({ name, val, color: INC_COLORS[Math.min(i + 1, INC_COLORS.length - 1)] });
      }
    });
  }
  const inkomen = sources.reduce((s, src) => s + src.val, 0);

  if (inkomen <= 0) {
    const t = mkEl('text', { x: 450, y: 190, 'text-anchor': 'middle', 'font-family': 'Inter,sans-serif', 'font-size': 14, fill: '#888' });
    t.textContent = 'Vul je inkomen in om de flow te zien.';
    svg.appendChild(t);
    return;
  }

  // Uitgavencategorieën verzamelen
  const catDefs = [
    { name: 'Wonen',           color: '#2E4A7A', ids: ['huur','energie','zorgverzekering','verzekeringen'], extraId: 'extra-wonen-rows' },
    { name: 'Levensonderhoud', color: '#3A5C9A', ids: ['boodschappen','transport','abonnementen-post'],     extraId: 'extra-levens-rows' },
    { name: 'Persoonlijk',     color: '#4D6EB2', ids: ['verzorging','uiteten','hobby'],                     extraId: 'extra-persoon-rows' },
    { name: 'Sparen & overig', color: '#6583C4', ids: ['sparen','overig'],                                  extraId: 'extra-sparen-rows' },
  ];
  const expenses = catDefs
    .map(c => ({ name: c.name, color: c.color, val: som(c.ids) + somDynamic(c.extraId) }))
    .filter(c => c.val > 0);
  const totalOut = expenses.reduce((s, c) => s + c.val, 0);
  const vrij = inkomen - totalOut;
  if (vrij > 0) expenses.push({ name: 'Vrij besteedbaar', color: '#1B6E4F', val: vrij });

  // Layout — drie kolommen, alles verticaal gecentreerd op CY
  const W = 900, H = 380;
  const GAP = 8, NW = 16;
  const SX = 145;   // inkomensnodes links
  const BX = 405;   // budget-node midden
  const TX = 665;   // uitgavennodes rechts
  const CY = H / 2;
  const USABLE = H - 56;

  const nInc = sources.length, nExp = expenses.length;
  const scale = Math.min(
    nInc > 1 ? (USABLE - GAP * (nInc - 1)) / inkomen : USABLE / inkomen,
    (USABLE - GAP * Math.max(0, nExp - 1)) / inkomen
  );

  // Budget-node hoogte en positie
  const budH  = inkomen * scale;
  const budY1 = CY - budH / 2;
  const budY2 = CY + budH / 2;

  // Inkomensnodes (links, gecentreerd als groep)
  const incGroupH = sources.reduce((s, src) => s + src.val * scale, 0) + GAP * Math.max(0, nInc - 1);
  let iY = CY - incGroupH / 2;
  const incNodes = sources.map(src => {
    const h = src.val * scale;
    const nd = { name: src.name, val: src.val, color: src.color, y1: iY, y2: iY + h, h };
    iY += h + GAP;
    return nd;
  });

  // Uitgavennodes (rechts, gecentreerd als groep)
  const expGroupH = expenses.reduce((s, ex) => s + ex.val * scale, 0) + GAP * Math.max(0, nExp - 1);
  let eY = CY - expGroupH / 2;
  const expNodes = expenses.map(ex => {
    const h = ex.val * scale;
    const nd = { name: ex.name, val: ex.val, color: ex.color, y1: eY, y2: eY + h, h };
    eY += h + GAP;
    return nd;
  });

  // Koppelingen inkomen → budget (links van budget-bar)
  let bLOff = 0;
  const incFlows = incNodes.map(nd => {
    const bY1 = budY1 + bLOff, bY2 = bY1 + nd.h;
    bLOff += nd.h;
    return { nd, bY1, bY2 };
  });

  // Koppelingen budget → uitgaven (rechts van budget-bar)
  const expCompress = totalOut > inkomen ? inkomen / totalOut : 1;
  let bROff = 0;
  const expFlows = expNodes.map(nd => {
    const bH = nd.h * expCompress;
    const bY1 = budY1 + bROff, bY2 = bY1 + bH;
    bROff += bH;
    return { nd, bY1, bY2 };
  });

  const ML = Math.round((SX + NW + BX) / 2); // bezier-middelpunt links sectie
  const MR = Math.round((BX + NW + TX) / 2); // bezier-middelpunt rechts sectie

  // ——— TEKENEN ———

  // Inkomen → budget flows
  incFlows.forEach(f => {
    const n = f.nd;
    svg.appendChild(mkEl('path', {
      d: 'M'+(SX+NW)+','+n.y1+' C'+ML+','+n.y1+' '+ML+','+f.bY1+' '+BX+','+f.bY1+
         'L'+BX+','+f.bY2+' C'+ML+','+f.bY2+' '+ML+','+n.y2+' '+(SX+NW)+','+n.y2+'Z',
      fill: n.color, opacity: 0.22,
    }));
  });

  // Budget → uitgaven flows
  expFlows.forEach(f => {
    const n = f.nd;
    svg.appendChild(mkEl('path', {
      d: 'M'+(BX+NW)+','+f.bY1+' C'+MR+','+f.bY1+' '+MR+','+n.y1+' '+TX+','+n.y1+
         'L'+TX+','+n.y2+' C'+MR+','+n.y2+' '+MR+','+f.bY2+' '+(BX+NW)+','+f.bY2+'Z',
      fill: n.color, opacity: 0.22,
    }));
  });

  // Inkomensnodes + labels (links van node)
  incNodes.forEach(nd => {
    svg.appendChild(mkEl('rect', { x: SX, y: nd.y1, width: NW, height: Math.max(nd.h, 2), fill: nd.color, rx: 3 }));
    const lx = SX - 8;
    const my = (nd.y1 + nd.y2) / 2;
    const tl = mkEl('text', { x: lx, y: my - 7, 'text-anchor': 'end', 'font-family': 'Inter,sans-serif', 'font-size': 11, 'font-weight': 600, fill: '#1A2233' });
    tl.textContent = nd.name;
    svg.appendChild(tl);
    const tv = mkEl('text', { x: lx, y: my + 7, 'text-anchor': 'end', 'font-family': 'Inter,sans-serif', 'font-size': 10, fill: '#5A6478' });
    tv.textContent = fmt(nd.val);
    svg.appendChild(tv);
  });

  // Budget-node (midden)
  svg.appendChild(mkEl('rect', { x: BX, y: budY1, width: NW, height: Math.max(budH, 2), fill: '#1E7A56', rx: 3 }));
  const bl = mkEl('text', { x: BX + NW/2, y: budY1 - 16, 'text-anchor': 'middle', 'font-family': 'Inter,sans-serif', 'font-size': 11, 'font-weight': 600, fill: '#1A2233' });
  bl.textContent = 'Budget';
  svg.appendChild(bl);
  const bv = mkEl('text', { x: BX + NW/2, y: budY1 - 4, 'text-anchor': 'middle', 'font-family': 'Inter,sans-serif', 'font-size': 10, fill: '#5A6478' });
  bv.textContent = fmt(inkomen);
  svg.appendChild(bv);

  // Uitgavennodes + labels (rechts van node)
  expNodes.forEach(nd => {
    svg.appendChild(mkEl('rect', { x: TX, y: nd.y1, width: NW, height: Math.max(nd.h, 2), fill: nd.color, rx: 3 }));
    if (nd.h >= 14) {
      const lx = TX + NW + 8;
      const my = (nd.y1 + nd.y2) / 2;
      const pct = Math.round(nd.val / inkomen * 100);
      const tl = mkEl('text', { x: lx, y: my - 7, 'font-family': 'Inter,sans-serif', 'font-size': 11, 'font-weight': 600, fill: '#1A2233' });
      tl.textContent = nd.name;
      svg.appendChild(tl);
      const tv = mkEl('text', { x: lx, y: my + 7, 'font-family': 'Inter,sans-serif', 'font-size': 10, fill: '#5A6478' });
      tv.textContent = fmt(nd.val) + ' · ' + pct + '%';
      svg.appendChild(tv);
    }
  });

  // Watermerk
  const wm = mkEl('text', { x: W/2, y: H - 8, 'text-anchor': 'middle', 'font-family': 'Inter,sans-serif', 'font-size': 9, fill: 'rgba(90,100,120,0.38)' });
  wm.textContent = 'maandlastcheck.nl';
  svg.appendChild(wm);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.budget-input').forEach(el => el.addEventListener('input', updateUI));
  updateUI();
});
