// MaandlastCheck — Abonnementen-Check 2025

const fmt = (val) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const DIENSTEN = [
  // Streaming video
  { id: 'netflix',      label: 'Netflix',          prijs: 13.99 },
  { id: 'disney',       label: 'Disney+',           prijs: 9.99  },
  { id: 'videoland',    label: 'Videoland',         prijs: 10.99 },
  { id: 'prime',        label: 'Prime Video',       prijs: 9.99  },
  { id: 'appletv',      label: 'Apple TV+',         prijs: 9.99  },
  // Muziek & video
  { id: 'spotify',      label: 'Spotify',           prijs: 11.99 },
  { id: 'youtube',      label: 'YouTube Premium',   prijs: 13.99 },
  { id: 'applemusic',   label: 'Apple Music',       prijs: 10.99 },
  // Nieuws
  { id: 'nrc',          label: 'NRC',               prijs: 24.95 },
  { id: 'volkskrant',   label: 'Volkskrant',        prijs: 23.99 },
  // Gaming
  { id: 'psplus',       label: 'PlayStation Plus',  prijs: 8.99  },
  { id: 'gamepass',     label: 'Xbox Game Pass',    prijs: 6.99  },
  { id: 'nintendo',     label: 'Nintendo Online',   prijs: 3.99  },
  // Cloud & apps
  { id: 'icloud',       label: 'iCloud+',           prijs: 2.99  },
  { id: 'ms365',        label: 'Microsoft 365',     prijs: 6.99  },
  { id: 'googleone',    label: 'Google One',        prijs: 1.99  },
  // Sport
  { id: 'sportschool',  label: 'Sportschool',       prijs: 35.00 },
  // Telecom
  { id: 'mobiel',       label: 'Mobiel abonnement', prijs: 30.00 },
  { id: 'internet',     label: 'Internet thuis',    prijs: 45.00 },
  // Eten
  { id: 'thuisbezorgd', label: 'Thuisbezorgd+',     prijs: 9.99  },
  // Eigen invoer
  { id: 'custom1',      label: '',                  prijs: 0 },
  { id: 'custom2',      label: '',                  prijs: 0 },
  { id: 'custom3',      label: '',                  prijs: 0 },
];

function updateTotal() {
  let totaal = 0;
  let count  = 0;

  DIENSTEN.forEach(d => {
    const cb = document.getElementById(`toggle-${d.id}`);
    const pr = document.getElementById(`prijs-${d.id}`);
    if (cb?.checked) {
      totaal += parseFloat(pr?.value) || 0;
      count++;
    }
  });

  document.getElementById('res-maand-totaal').textContent = fmt(totaal);
  document.getElementById('res-jaar-totaal').textContent  = fmt(totaal * 12);
  document.getElementById('res-count').textContent        = count;

  const adviesEl = document.getElementById('res-advies');
  if (count === 0) {
    adviesEl.textContent = 'Vink je actieve abonnementen aan.';
  } else if (totaal > 150) {
    adviesEl.textContent = `${fmt(totaal)}/mnd is hoog — welke diensten gebruik je écht dagelijks?`;
  } else if (totaal > 80) {
    adviesEl.textContent = 'Gemiddeld niveau. Controleer of je alles actief gebruikt.';
  } else {
    adviesEl.textContent = 'Zuinig abonnementenpakket — goed bezig!';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  DIENSTEN.forEach(d => {
    document.getElementById(`toggle-${d.id}`)?.addEventListener('change', updateTotal);
    document.getElementById(`prijs-${d.id}`)?.addEventListener('input', updateTotal);
  });
  updateTotal();
});
