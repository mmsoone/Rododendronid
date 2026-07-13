const STORAGE_KEY = 'rododendronid.plants.v1';

const SEED_PLANTS = [
  'Fryderyk', 'Mariette', 'Nicoletta', 'Millenium',
  'Haaga', 'Princes Daisy', 'Irene Koster', 'Apricot'
].map(name => ({
  id: crypto.randomUUID(),
  name,
  location: '',
  bloom: '',
  height: '',
  width: '',
  hardiness: '',
  origin: '',
  color: '',
  notes: '',
  photo: ''
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

let plants = loadPlants();
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

      card.innerHTML = `
        ${thumbHtml}
        <div class="plant-card-info">
          <h3>${escapeHtml(plant.name)}</h3>
          <div class="plant-card-meta">${escapeHtml(metaParts.join(' · ') || 'Andmed lisamata')}</div>
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

  const photoEl = document.getElementById('view-photo');
  if (plant.photo) {
    photoEl.src = plant.photo;
    photoEl.hidden = false;
  } else {
    photoEl.hidden = true;
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
  } else {
    document.getElementById('edit-modal-title').textContent = 'Lisa taim';
    document.getElementById('plant-id').value = '';
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
    photo: e.target.dataset.photo || ''
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
