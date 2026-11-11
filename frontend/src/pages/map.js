import {
  APPROXIMATE_AREAS,
  approximatePin,
  formatApproximatePin,
  isStoredPin,
  pinForAreaKey,
} from '../lib/geolocation.js';
import { localArchive } from '../lib/db.js';

const STORY_LIMIT = 150;

export function mountMapPage(root, { onChange = () => {} } = {}) {
  if (!root) return { refresh: async () => {} };
  const openButton = root.querySelector('[data-map-open]');
  const panel = root.querySelector('[data-map-panel]');
  const canvas = root.querySelector('[data-map-canvas]');
  const note = root.querySelector('[data-map-note]');
  const selector = root.querySelector('[data-map-story]');
  const area = root.querySelector('[data-map-area]');
  const saveButton = root.querySelector('[data-map-save]');
  const clearButton = root.querySelector('[data-map-clear]');
  const list = root.querySelector('[data-map-pins]');
  const empty = root.querySelector('[data-map-empty]');
  const count = root.querySelector('[data-map-count]');

  let leaflet = null;
  let loaded = false;
  let loading = false;
  let currentSelection = null;
  let rows = [];
  let run = 0;
  let canvasUnavailable = false;

  function message(value, error = false) {
    note.textContent = value;
    note.dataset.error = String(error);
  }

  for (const entry of APPROXIMATE_AREAS) {
    const option = document.createElement('option');
    option.value = entry.key;
    option.textContent = entry.label;
    area.append(option);
  }

  function chosenStory() {
    return rows.find((story) => story.id === selector.value);
  }

  function showSelection(pin) {
    currentSelection = pin;
    area.value = '';
    message('Approximate location selected: ' + formatApproximatePin(pin) + '. Tap Save pin to keep it locally.');
  }

  function chooseOnMap(latitude, longitude) {
    if (!chosenStory()) {
      message('Record a story before selecting a map pin.', true);
      return;
    }
    try {
      showSelection(approximatePin(latitude, longitude));
    } catch {
      message('Choose a location near Olievenhoutbosch, or pick an approximate area below.', true);
    }
  }

  function button(text, callback) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = text;
    element.className = 'min-h-11 rounded-xl border border-[#bdd0c2] px-3 py-2 text-sm font-semibold text-[#315d46]';
    element.addEventListener('click', callback);
    return element;
  }

  function updateList(pinned) {
    list.replaceChildren();
    empty.hidden = pinned.length > 0;
    count.textContent = pinned.length + (pinned.length === 1 ? ' story pinned' : ' stories pinned');
    for (const story of pinned) {
      const item = document.createElement('li');
      item.className = 'rounded-xl border border-[#dce6dd] bg-[#fafcf9] p-3';
      const title = document.createElement('strong');
      title.className = 'block break-words text-sm text-[#173d31]';
      title.textContent = story.title;
      const detail = document.createElement('p');
      detail.className = 'mt-1 text-xs text-[#5b7664]';
      detail.textContent = formatApproximatePin(story.pin);
      const action = button('Select this story', () => {
        selector.value = story.id;
        currentSelection = null;
        if (leaflet) leaflet.centerOn(story.pin);
        message('Selected ' + story.title + '. You can change or remove its approximate pin.');
      });
      action.classList.add('mt-2');
      item.append(title, detail, action);
      list.append(item);
    }
  }

  async function refresh() {
    const currentRun = ++run;
    try {
      // Local archive metadata only. No audio blobs or server request.
      const result = await localArchive.listStories({ limit: STORY_LIMIT });
      const pinned = await localArchive.getPinnedStories({ limit: STORY_LIMIT });
      if (currentRun !== run) return;
      rows = result.stories;
      const existing = selector.value;
      selector.replaceChildren();
      if (rows.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'Record a story first';
        option.value = '';
        selector.append(option);
      }
      for (const story of rows) {
        const option = document.createElement('option');
        option.value = story.id;
        option.textContent = story.title;
        selector.append(option);
      }
      if (rows.some((story) => story.id === existing)) selector.value = existing;
      saveButton.disabled = rows.length === 0;
      clearButton.disabled = rows.length === 0;
      updateList(pinned);
      leaflet?.renderPins(pinned);
      if (result.count > STORY_LIMIT || pinned.length >= STORY_LIMIT) {
        message('Showing the first 150 stories. Additional stories cannot be pinned from this screen yet.');
      }
    } catch {
      message('Could not load local locations. Check browser storage.', true);
    }
  }

  async function loadMap() {
    if (loading || loaded || canvasUnavailable) return;
    if (navigator.onLine === false) {
      message('You are offline. Choose an approximate area below; the text list works without map tiles.');
      return;
    }
    loading = true;
    message('Loading the interactive map only now to save mobile data…');
    try {
      const { createLeafletMap } = await import('../components/map-view.js');
      leaflet = createLeafletMap(canvas, {
        onChoose: chooseOnMap,
        onError: (value) => message(value, true),
      });
      loaded = true;
      await refresh();
      message('Tap the map to choose an approximate area, then Save pin. Map tiles use mobile data.');
    } catch {
      canvasUnavailable = true;
      canvas.hidden = true;
      message('Map tiles or map code could not load. Use the approximate-area picker instead.', true);
    } finally {
      loading = false;
    }
  }

  openButton.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    openButton.textContent = panel.hidden ? 'Open local story map' : 'Hide story map';
    openButton.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) {
      void refresh();
      void loadMap();
    }
  });

  selector.addEventListener('change', () => {
    currentSelection = null;
    area.value = '';
    const selected = chosenStory();
    if (selected && isStoredPin(selected.pin)) {
      message('Current pin: ' + formatApproximatePin(selected.pin));
      leaflet?.centerOn(selected.pin);
    } else {
      message('Select a map position or a broad approximate area for this story.');
    }
  });

  area.addEventListener('change', () => {
    if (!area.value) return;
    try {
      const pin = pinForAreaKey(area.value);
      currentSelection = pin;
      leaflet?.centerOn(pin);
      message('Selected ' + formatApproximatePin(pin) + '. Tap Save pin to keep it on this device.');
    } catch {
      currentSelection = null;
      message('Choose an available approximate area.', true);
    }
  });

  saveButton.addEventListener('click', async () => {
    const story = chosenStory();
    const pin = currentSelection;
    if (!story || !pin) {
      message('Choose a story and tap the map or select a broad area before saving.', true);
      return;
    }
    saveButton.disabled = true;
    try {
      await localArchive.setStoryPin(story.id, pin.lat, pin.lng);
      currentSelection = null;
      await refresh();
      await onChange();
      message('Approximate story pin saved locally. No precise GPS or location was uploaded.');
    } catch {
      message('Could not save this pin. Check local browser storage.', true);
    } finally {
      saveButton.disabled = rows.length === 0;
    }
  });

  clearButton.addEventListener('click', async () => {
    const story = chosenStory();
    if (!story) return;
    if (!window.confirm('Remove the approximate location from this story? The recording will remain saved.')) return;
    clearButton.disabled = true;
    try {
      await localArchive.clearStoryPin(story.id);
      currentSelection = null;
      await refresh();
      await onChange();
      message('Location removed. Your recorded audio is unchanged.');
    } catch {
      message('Could not remove the location. Please try again.', true);
    } finally {
      clearButton.disabled = rows.length === 0;
    }
  });

  window.addEventListener('online', () => {
    if (!panel.hidden && !loaded) void loadMap();
  });

  void refresh();
  return { refresh };
}
