import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AREA_CENTER } from '../lib/geolocation.js';

// This module is dynamically imported only after a user opens the map.
// The OSM Standard tile service is intended for on-demand interactive viewing,
// NOT bulk downloading, background fetching or offline tile caching.
export function createLeafletMap(container, { onChoose, onError = () => {} } = {}) {
  const center = [AREA_CENTER.lat, AREA_CENTER.lng];
  const map = L.map(container, {
    center,
    zoom: 14,
    minZoom: 12,
    maxZoom: 17,
    zoomControl: true,
    scrollWheelZoom: false,
    tap: false,
    maxBounds: L.latLngBounds(
      [AREA_CENTER.lat - 0.055, AREA_CENTER.lng - 0.065],
      [AREA_CENTER.lat + 0.055, AREA_CENTER.lng + 0.065],
    ),
    maxBoundsViscosity: 1,
  });

  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    maxZoom: 17,
    maxNativeZoom: 17,
    keepBuffer: 0,
    updateWhenIdle: true,
    detectRetina: false,
    crossOrigin: false,
  }).addTo(map);
  tiles.on('tileerror', () => onError('Map tiles are unavailable. Use the approximate-area picker below instead.'));

  const pinLayer = L.layerGroup().addTo(map);
  map.on('click', (event) => onChoose?.(event.latlng.lat, event.latlng.lng));

  function renderPins(stories) {
    pinLayer.clearLayers();
    for (const story of stories) {
      if (!story.pin) continue;
      const marker = L.circleMarker([story.pin.lat, story.pin.lng], {
        radius: 8,
        color: '#173d31',
        weight: 2,
        fillColor: '#db8a52',
        fillOpacity: 0.9,
      }).addTo(pinLayer);
      // Leaflet treats a string as HTML; use a DOM element and textContent.
      const popup = document.createElement('span');
      popup.textContent = story.title;
      marker.bindPopup(popup);
    }
  }

  function centerOn(pin) {
    map.setView([pin.lat, pin.lng], 15);
  }

  // Leaflet needs an invalidate after a panel switches from hidden to visible.
  requestAnimationFrame(() => map.invalidateSize(false));
  return {
    renderPins,
    centerOn,
    destroy() {
      map.off();
      map.remove();
    },
  };
}
