const STORAGE_KEY = 'rododendronid.plants.v1';

const VARIETY_COLOR_HEX = {
  'Fryderyk': '#F4E5B8',
  'Marietta': '#C9509E',
  'Nicoletta': '#F2C6D9',
  'Millenium Gold': '#E8C547',
  'Haaga': '#D9548C',
  'Irene Koster': '#F2C6C2',
  'Apricot': '#F7A661',
  'Helsinki University': '#CC6699',
  'Elsie Straver': '#F5D9A8',
  'Cunninghama White': '#F7F5F0',
  'Anna Rose Whitney': '#D9739A',
  'Diorama': '#E8622E',
  'Lilac Lights': '#B57EDC',
  'Princes Daisy': '#F7E6E0'
};

const SEED_DATA = [
  { name: 'Fryderyk', height: '50-60 cm', width: '80 cm', hardiness: 'kuni -24°C', origin: 'Poola (Piotr Muras, 2010)' },
  { name: 'Marietta', height: '120-140 cm', width: '90-100 cm', hardiness: 'kuni -21°C', origin: 'Saksamaa (Hans Hachmann, u. 1986)' },
  { name: 'Nicoletta', height: '60-70 cm', width: '100-110 cm', hardiness: 'kuni -23°C', origin: 'Inglismaa (Waterer, Bagshot, 1969)' },
  { name: 'Millenium Gold', height: '90-120 cm', width: '90-120 cm', hardiness: 'kuni -23°C', origin: 'Holland (Boskoop)' },
  { name: 'Haaga', height: '150-180 cm', width: '120-150 cm', hardiness: 'kuni -32°C', origin: 'Soome (Helsingi Ülikool / Mustila, Tigerstedt programm)' },
  { name: 'Princes Daisy', height: '', width: '', hardiness: '', origin: 'Poola (Eugeniusz Pudełek, u. 2023)' },
  { name: 'Irene Koster', height: '180-240 cm', width: '150-180 cm', hardiness: 'kuni -23°C', origin: 'Holland (M. Koster & Sons)' },
  { name: 'Apricot', height: '150-180 cm', width: '120-150 cm', hardiness: 'kuni -26°C', origin: 'USA (Joseph Gable)' },
  { name: 'Helsinki University', height: '150-180 cm', width: '100-120 cm', hardiness: 'kuni -39°C', origin: 'Soome (Helsingi Ülikool / Mustila)' },
  { name: 'Elsie Straver', height: '200-250 cm', width: '200-250 cm', hardiness: 'kuni -18°C', origin: 'Holland (Boskoop)' },
  { name: 'Cunninghama White', height: '200-220 cm', width: '150-160 cm', hardiness: 'kuni -26°C', origin: 'Šotimaa (James Cunningham, 1830)' },
  { name: 'Anna Rose Whitney', height: '180-200 cm', width: '180-200 cm', hardiness: 'kuni -21°C', origin: 'USA (William E. Whitney, 1954)' },
  { name: 'Diorama', height: '160-200 cm', width: '100-200 cm', hardiness: 'kuni -23°C', origin: 'Holland (Boskoop)' },
  { name: 'Lilac Lights', height: '120 cm', width: '120 cm', hardiness: 'kuni -34°C', origin: 'USA (Bailey Nurseries, Minnesota)' }
];

const SEED_PLANTS = SEED_DATA.map(({ name, height, width, hardiness, origin }) => ({
  id: crypto.randomUUID(),
  name,
  location: '',
  bloom: '',
  height,
  width,
  hardiness,
  origin,
  color: '',
  notes: '',
  photo: '',
  locationPhoto: ''
}));

function loadPlants() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    savePlants(SEED_PLANTS);
    return SEED_PLANTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function savePlants(plants) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
}

function mergeSeedData(plants) {
  let changed = false;
  const byName = new Map(plants.map(p => [p.name, p]));
  SEED_PLANTS.forEach(seed => {
    const existing = byName.get(seed.name);
    if (!existing) {
      plants.push({ ...seed, id: crypto.randomUUID() });
      changed = true;
    } else {
      ['height', 'width', 'hardiness', 'origin'].forEach(field => {
        if (!existing[field] && seed[field]) {
          existing[field] = seed[field];
          changed = true;
        }
      });
    }
  });
  if (changed) savePlants(plants);
  return plants;
}

let plants = mergeSeedData(loadPlants());
let currentViewId = null;

const plantListEl = document.getElementById('plant-list');
const emptyStateEl = document.getElementById('empty-state');
const plantCountEl = document.getElementById('plant-count');
const searchInput = document.getElementById('search-input');

const viewModal = document.getElementById('view-modal');
const editModal = document.getElementById('edit-modal');

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = plants.filter(p => p.name.toLowerCase().includes(query));

  plantListEl.innerHTML = '';
  emptyStateEl.hidden = filtered.length > 0;

  filtered
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'et'))
    .forEach(plant => {
      const card = document.createElement('div');
      card.className = 'plant-card';
      card.dataset.id = plant.id;

      const thumbHtml = plant.photo
        ? `<img class="plant-thumb" src="${escapeAttr(plant.photo)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'plant-thumb-placeholder',textContent:'🌸'}))">`
        : `<div class="plant-thumb-placeholder">🌸</div>`;

      const metaParts = [plant.bloom, plant.location].filter(Boolean);
      const hardinessHtml = plant.hardiness
        ? `<div class="plant-card-hardiness" title="Külmakindlus">❄️ ${escapeHtml(plant.hardiness)}</div>`
        : '';

      card.innerHTML = `
        ${thumbHtml}
        <div class="plant-card-info">
          <h3>${escapeHtml(plant.name)}</h3>
          <div class="plant-card-meta">${escapeHtml(metaParts.join(' · ') || 'Andmed lisamata')}</div>
          ${hardinessHtml}
        </div>
      `;
      card.addEventListener('click', () => openViewModal(plant.id));
      plantListEl.appendChild(card);
    });

  plantCountEl.textContent = plants.length === 1
    ? '1 taim kollektsioonis'
    : `${plants.length} taime kollektsioonis`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

function getColorHex(plant) {
  return VARIETY_COLOR_HEX[plant.name] || '';
}

function updateColorSwatch(el, hex) {
  if (hex) {
    el.style.setProperty('--swatch-color', hex);
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

function openViewModal(id) {
  const plant = plants.find(p => p.id === id);
  if (!plant) return;
  currentViewId = id;

  document.getElementById('view-name').textContent = plant.name;
  document.getElementById('view-location').textContent = plant.location || '—';
  document.getElementById('view-bloom').textContent = plant.bloom || '—';
  document.getElementById('view-height').textContent = plant.height || '—';
  document.getElementById('view-width').textContent = plant.width || '—';
  document.getElementById('view-hardiness').textContent = plant.hardiness || '—';
  document.getElementById('view-origin').textContent = plant.origin || '—';
  document.getElementById('view-color').textContent = plant.color || '—';
  document.getElementById('view-notes').textContent = plant.notes || '—';
  updateColorSwatch(document.getElementById('view-color-swatch'), getColorHex(plant));

  const photoEl = document.getElementById('view-photo');
  if (plant.photo) {
    photoEl.src = plant.photo;
    photoEl.hidden = false;
  } else {
    photoEl.hidden = true;
  }

  const locationPhotoEl = document.getElementById('view-location-photo');
  if (plant.locationPhoto) {
    locationPhotoEl.src = plant.locationPhoto;
    locationPhotoEl.hidden = false;
  } else {
    locationPhotoEl.hidden = true;
  }

  viewModal.hidden = false;
}

function closeViewModal() {
  viewModal.hidden = true;
  currentViewId = null;
}

function openEditModal(id = null) {
  const form = document.getElementById('plant-form');
  form.reset();
  document.getElementById('photo-preview').hidden = true;
  document.getElementById('photo-remove-btn').hidden = true;
  form.dataset.photo = '';
  document.getElementById('location-photo-preview').hidden = true;
  document.getElementById('location-photo-remove-btn').hidden = true;
  form.dataset.locationPhoto = '';

  if (id) {
    const plant = plants.find(p => p.id === id);
    document.getElementById('edit-modal-title').textContent = 'Muuda taime';
    document.getElementById('plant-id').value = plant.id;
    document.getElementById('field-name').value = plant.name || '';
    document.getElementById('field-location').value = plant.location || '';
    document.getElementById('field-bloom').value = plant.bloom || '';
    document.getElementById('field-height').value = plant.height || '';
    document.getElementById('field-width').value = plant.width || '';
    document.getElementById('field-hardiness').value = plant.hardiness || '';
    document.getElementById('field-origin').value = plant.origin || '';
    document.getElementById('field-color').value = plant.color || '';
    document.getElementById('field-notes').value = plant.notes || '';
    updateColorSwatch(document.getElementById('form-color-swatch'), getColorHex(plant));
    if (plant.photo) {
      form.dataset.photo = plant.photo;
      const preview = document.getElementById('photo-preview');
      preview.src = plant.photo;
      preview.hidden = false;
      document.getElementById('photo-remove-btn').hidden = false;
      if (plant.photo.startsWith('http')) {
        document.getElementById('field-photo-url').value = plant.photo;
      }
    }
    if (plant.locationPhoto) {
      form.dataset.locationPhoto = plant.locationPhoto;
      const locPreview = document.getElementById('location-photo-preview');
      locPreview.src = plant.locationPhoto;
      locPreview.hidden = false;
      document.getElementById('location-photo-remove-btn').hidden = false;
    }
  } else {
    document.getElementById('edit-modal-title').textContent = 'Lisa taim';
    document.getElementById('plant-id').value = '';
    document.getElementById('form-color-swatch').hidden = true;
  }

  editModal.hidden = false;
}

function closeEditModal() {
  editModal.hidden = true;
}

document.getElementById('add-btn').addEventListener('click', () => openEditModal());

document.querySelectorAll('[data-close-view]').forEach(el =>
  el.addEventListener('click', closeViewModal)
);
document.querySelectorAll('[data-close-edit]').forEach(el =>
  el.addEventListener('click', closeEditModal)
);

viewModal.addEventListener('click', e => { if (e.target === viewModal) closeViewModal(); });
editModal.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });

document.getElementById('view-edit-btn').addEventListener('click', () => {
  const id = currentViewId;
  closeViewModal();
  openEditModal(id);
});

document.getElementById('view-delete-btn').addEventListener('click', () => {
  if (!currentViewId) return;
  if (confirm('Kustutada see taim kollektsioonist?')) {
    plants = plants.filter(p => p.id !== currentViewId);
    savePlants(plants);
    closeViewModal();
    render();
  }
});

function setPhotoPreview(url) {
  document.getElementById('plant-form').dataset.photo = url;
  const preview = document.getElementById('photo-preview');
  preview.onerror = () => { preview.hidden = true; };
  preview.onload = () => { preview.hidden = false; };
  preview.src = url;
  document.getElementById('photo-remove-btn').hidden = false;
}

document.getElementById('field-photo').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('field-photo-url').value = '';
  const reader = new FileReader();
  reader.onload = () => setPhotoPreview(reader.result);
  reader.readAsDataURL(file);
});

document.getElementById('field-photo-url').addEventListener('input', e => {
  const url = e.target.value.trim();
  if (!url) return;
  document.getElementById('field-photo').value = '';
  setPhotoPreview(url);
});

document.getElementById('photo-remove-btn').addEventListener('click', () => {
  document.getElementById('plant-form').dataset.photo = '';
  document.getElementById('field-photo').value = '';
  document.getElementById('field-photo-url').value = '';
  document.getElementById('photo-preview').hidden = true;
  document.getElementById('photo-remove-btn').hidden = true;
});

document.getElementById('field-location-photo').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('plant-form').dataset.locationPhoto = reader.result;
    const preview = document.getElementById('location-photo-preview');
    preview.src = reader.result;
    preview.hidden = false;
    document.getElementById('location-photo-remove-btn').hidden = false;
  };
  reader.readAsDataURL(file);
});

document.getElementById('location-photo-remove-btn').addEventListener('click', () => {
  document.getElementById('plant-form').dataset.locationPhoto = '';
  document.getElementById('field-location-photo').value = '';
  document.getElementById('location-photo-preview').hidden = true;
  document.getElementById('location-photo-remove-btn').hidden = true;
});

document.getElementById('plant-form').addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('plant-id').value;
  const data = {
    name: document.getElementById('field-name').value.trim(),
    location: document.getElementById('field-location').value.trim(),
    bloom: document.getElementById('field-bloom').value,
    height: document.getElementById('field-height').value.trim(),
    width: document.getElementById('field-width').value.trim(),
    hardiness: document.getElementById('field-hardiness').value.trim(),
    origin: document.getElementById('field-origin').value.trim(),
    color: document.getElementById('field-color').value.trim(),
    notes: document.getElementById('field-notes').value.trim(),
    photo: e.target.dataset.photo || '',
    locationPhoto: e.target.dataset.locationPhoto || ''
  };

  if (!data.name) return;

  if (id) {
    const plant = plants.find(p => p.id === id);
    Object.assign(plant, data);
  } else {
    plants.push({ id: crypto.randomUUID(), ...data });
  }

  savePlants(plants);
  closeEditModal();
  render();
});

searchInput.addEventListener('input', render);

render();

const LOCATION_KEY = 'rododendronid.location.v1';

function loadLocation() {
  try {
    return JSON.parse(localStorage.getItem(LOCATION_KEY));
  } catch {
    return null;
  }
}

function saveLocation(loc) {
  localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
}

function parseHardinessThreshold(hardiness) {
  if (!hardiness) return null;
  const match = hardiness.match(/-\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=et&format=json`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (!data.results || !data.results.length) return null;
  const r = data.results[0];
  return {
    lat: r.latitude,
    lon: r.longitude,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(', ')
  };
}

async function fetchForecastMinTemps(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_min&forecast_days=7&timezone=auto`;
  const resp = await fetch(url);
  const data = await resp.json();
  return data.daily || null;
}

function updateLocationLabel() {
  const loc = loadLocation();
  document.getElementById('location-label').textContent = loc ? `📍 ${loc.label}` : '📍 Asukoht määramata';
}

async function checkWeatherWarning() {
  const loc = loadLocation();
  const banner = document.getElementById('weather-banner');
  if (!loc) {
    banner.hidden = true;
    return;
  }
  try {
    const daily = await fetchForecastMinTemps(loc.lat, loc.lon);
    if (!daily || !daily.temperature_2m_min) {
      banner.hidden = true;
      return;
    }
    let worstIndex = -1;
    let worstTemp = Infinity;
    daily.temperature_2m_min.forEach((t, i) => {
      if (t < worstTemp) {
        worstTemp = t;
        worstIndex = i;
      }
    });

    const atRisk = plants.filter(p => {
      const threshold = parseHardinessThreshold(p.hardiness);
      return threshold !== null && worstTemp < threshold;
    });

    if (atRisk.length > 0) {
      const dateStr = new Date(daily.time[worstIndex]).toLocaleDateString('et-EE', {
        weekday: 'long', day: 'numeric', month: 'long'
      });
      document.getElementById('weather-banner-text').textContent =
        `❄️ ${dateStr} oodatakse kuni ${Math.round(worstTemp)}°C — kata kindlasti: ${atRisk.map(p => p.name).join(', ')}`;
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }
  } catch {
    banner.hidden = true;
  }
}

document.getElementById('location-edit-btn').addEventListener('click', () => {
  const loc = loadLocation();
  document.getElementById('location-input').value = loc ? loc.label.split(',')[0] : '';
  document.getElementById('location-error').hidden = true;
  document.getElementById('location-modal').hidden = false;
});

document.querySelectorAll('[data-close-location]').forEach(el =>
  el.addEventListener('click', () => { document.getElementById('location-modal').hidden = true; })
);

document.getElementById('location-modal').addEventListener('click', e => {
  if (e.target.id === 'location-modal') document.getElementById('location-modal').hidden = true;
});

document.getElementById('location-save-btn').addEventListener('click', async () => {
  const name = document.getElementById('location-input').value.trim();
  const errorEl = document.getElementById('location-error');
  errorEl.hidden = true;
  if (!name) return;

  const btn = document.getElementById('location-save-btn');
  btn.disabled = true;
  btn.textContent = 'Otsin...';
  try {
    const result = await geocodeCity(name);
    if (!result) {
      errorEl.textContent = 'Kohta ei leitud, proovi teistsugust kirjapilti.';
      errorEl.hidden = false;
      return;
    }
    saveLocation(result);
    updateLocationLabel();
    document.getElementById('location-modal').hidden = true;
    checkWeatherWarning();
  } catch {
    errorEl.textContent = 'Ilmaandmete laadimine ebaõnnestus. Kontrolli internetiühendust.';
    errorEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvesta';
  }
});

updateLocationLabel();
checkWeatherWarning();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
