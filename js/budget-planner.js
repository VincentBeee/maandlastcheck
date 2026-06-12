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
    const barEl = document.getElementById(`bar-${g}`);
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
  const svgEl = document.getElementById('sankey-svg');
  if (!svgEl) return;

  const ns = 'http://www.w3.org/2000/svg';
  const inkomen = parseFloat(document.getElementById('inkomen')?.value) || 0;

  svgEl.innerHTML = '';

  if (inkomen <= 0) {
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', '400'); t.setAttribute('y', '190');
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-family', 'Inter, sans-serif');
    t.setAttribute('font-size', '13');
    t.setAttribute('fill', '#5A6478');
    t.textContent = 'Vul je inkomen in om de flow te zien.';
    svgEl.appendChild(t);
    return;
  }

  // Categorieën (zelfde groepen als updateUI)
  const groups = [
    { label: 'Wonen',           color: '#2E4A7A', ids: ['huur','energie','zorgverzekering','verzekeringen'] },
    { label: 'Levensonderhoud', color: '#3A5C9A', ids: ['boodschappen','transport','abonnementen-post'] },
    { label: 'Persoonlijk',     color: '#4D6EB2', ids: ['verzorging','uiteten','hobby'] },
    { label: 'Sparen & overig', color: '#6583C4', ids: ['sparen','overig'] },
  ];

  const flows = groups
    .map(g => ({ label: g.label, color: g.color, val: som(g.ids) }))
    .filter(f => f.val > 0);

  const totalLasten = flows.reduce((s, f) => s + f.val, 0);
  const vrij = inkomen - totalLasten;
  if (vrij > 0) flows.push({ label: 'Vrij besteedbaar', color: '#1B6E4F', val: vrij });
  if (flows.length === 0) return;

  // Layout
  const W = 800, H = 380;
  const pTop = 40, pBot = 26;
  const nW = 16, gap = 7;
  const srcX = 10, tgtX = 604;
  const usableH = H - pTop - pBot;
  const n = flows.length;
  const totalGapH = gap * Math.max(0, n - 1);
  const totalForScale = Math.max(inkomen, totalLasten);
  const scale = (usableH - totalGapH) / totalForScale;
  const srcH = inkomen * scale;

  // Als lasten > inkomen: flows op de bronkant comprimeren
  const srcCompress = totalLasten > inkomen ? inkomen / totalLasten : 1;

  // Bereken node-posities
  let srcOff = 0, tgtOff = 0;
  const nodes = flows.map(f => {
    const tH = f.val * scale;
    const sH = tH * srcCompress;
    const nd = {
      label: f.label, color: f.color, val: f.val,
      sy1: pTop + srcOff, sy2: pTop + srcOff + sH,
      ty1: pTop + tgtOff, ty2: pTop + tgtOff + tH,
      tH,
    };
    srcOff += sH;
    tgtOff += tH + gap;
    return nd;
  });

  // Helper: maak SVG-element aan
  const mk = (tag, attrs, txt) => {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, String(v));
    if (txt !== undefined) e.textContent = txt;
    return e;
  };

  const midX = Math.round((srcX + nW + tgtX) / 2);

  // Flows (bezier-vlakken)
  nodes.forEach(nd => {
    svgEl.appendChild(mk('path', {
      d: `M${srcX + nW},${nd.sy1} C${midX},${nd.sy1} ${midX},${nd.ty1} ${tgtX},${nd.ty1}` +
         `L${tgtX},${nd.ty2} C${midX},${nd.ty2} ${midX},${nd.sy2} ${srcX + nW},${nd.sy2}Z`,
      fill: nd.color,
      opacity: '0.18',
    }));
  });

  // Bronnode (inkomen, links)
  svgEl.appendChild(mk('rect', { x: srcX, y: pTop, width: nW, height: Math.max(srcH, 2), fill: '#1B6E4F', rx: 3 }));

  // Labels boven bronnode
  svgEl.appendChild(mk('text', {
    x: srcX + nW / 2, y: pTop - 20,
    'text-anchor': 'middle', 'font-family': 'Inter, sans-serif',
    'font-size': 11, 'font-weight': 600, fill: '#1A2233',
  }, 'Inkomen'));
  svgEl.appendChild(mk('text', {
    x: srcX + nW / 2, y: pTop - 7,
    'text-anchor': 'middle', 'font-family': 'Inter, sans-serif',
    'font-size': 10, fill: '#5A6478',
  }, fmt(inkomen)));

  // Doelnodes + labels (rechts)
  nodes.forEach(nd => {
    svgEl.appendChild(mk('rect', { x: tgtX, y: nd.ty1, width: nW, height: Math.max(nd.tH, 2), fill: nd.color, rx: 3 }));

    if (nd.tH >= 14) {
      const lx = tgtX + nW + 8;
      const midY = (nd.ty1 + nd.ty2) / 2;
      const pct  = Math.round(nd.val / inkomen * 100);
      svgEl.appendChild(mk('text', {
        x: lx, y: midY - 7,
        'font-family': 'Inter, sans-serif', 'font-size': 11, 'font-weight': 600, fill: '#1A2233',
      }, nd.label));
      svgEl.appendChild(mk('text', {
        x: lx, y: midY + 7,
        'font-family': 'Inter, sans-serif', 'font-size': 10, fill: '#5A6478',
      }, `${fmt(nd.val)} · ${pct}%`));
    }
  });

  // Watermark
  svgEl.appendChild(mk('text', {
    x: W / 2, y: H - 8,
    'text-anchor': 'middle', 'font-family': 'Inter, sans-serif',
    'font-size': 9, fill: 'rgba(90,100,120,0.38)',
  }, 'maandlastcheck.nl'));
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.budget-input').forEach(el => el.addEventListener('input', updateUI));
  updateUI();
});
