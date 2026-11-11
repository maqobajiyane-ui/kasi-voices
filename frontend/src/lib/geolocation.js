// Manual, privacy-preserving approximate pins. No browser GPS/geolocation API.
// Center follows the mapped Olievenhoutbosch settlement, not a surveyed boundary.
export const AREA_CENTER = Object.freeze({ lat: -25.90944, lng: 28.09278 });
export const APPROXIMATE_GRID_DEGREES = 0.005; // roughly a 500 m cell here
export const EDITING_RADIUS_KM = 4.5; // practical vicinity, NOT a municipal boundary
export const LOCATION_PRECISION = 'approx-500m';

const EARTH_RADIUS_KM = 6371;

export function distanceFromCenterKm(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Infinity;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat - AREA_CENTER.lat);
  const dLng = toRad(lng - AREA_CENTER.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(AREA_CENTER.lat)) * Math.cos(toRad(lat)) *
    Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function approximatePin(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new RangeError('Choose a valid location on the map.');
  }
  if (distanceFromCenterKm(lat, lng) > EDITING_RADIUS_KM) {
    throw new RangeError('Choose a place near Olievenhoutbosch.');
  }
  const roundedLat = Number(
    (Math.round(lat / APPROXIMATE_GRID_DEGREES) * APPROXIMATE_GRID_DEGREES).toFixed(3),
  );
  const roundedLng = Number(
    (Math.round(lng / APPROXIMATE_GRID_DEGREES) * APPROXIMATE_GRID_DEGREES).toFixed(3),
  );
  if (distanceFromCenterKm(roundedLat, roundedLng) > EDITING_RADIUS_KM) {
    throw new RangeError('This location is beyond the approximate map area.');
  }
  return { lat: roundedLat, lng: roundedLng, precision: LOCATION_PRECISION };
}

export function isStoredPin(value) {
  if (!value || typeof value !== 'object') return false;
  if (value.precision !== LOCATION_PRECISION) return false;
  if (!Number.isFinite(value.lat) || !Number.isFinite(value.lng)) return false;
  try {
    const normalized = approximatePin(value.lat, value.lng);
    return normalized.lat === value.lat && normalized.lng === value.lng;
  } catch {
    return false;
  }
}

export function formatApproximatePin(pin) {
  if (!isStoredPin(pin)) return 'No approximate pin';
  return pin.lat.toFixed(3) + ', ' + pin.lng.toFixed(3) + ' (approx. 500 m area)';
}

// Text-based area selection works even when map tiles or the map library are unavailable.
// These are broad orientation hints, not verified ward or street boundaries.
const OFFSETS = [
  [-0.01, -0.01, 'Southwest area'],
  [-0.01, 0, 'South area'],
  [-0.01, 0.01, 'Southeast area'],
  [0, -0.01, 'West area'],
  [0, 0, 'Central area'],
  [0, 0.01, 'East area'],
  [0.01, -0.01, 'Northwest area'],
  [0.01, 0, 'North area'],
  [0.01, 0.01, 'Northeast area'],
];

export const APPROXIMATE_AREAS = Object.freeze(OFFSETS.map(([north, east, label]) => ({
  key: label.toLowerCase().replaceAll(' ', '-'),
  label,
  pin: approximatePin(AREA_CENTER.lat + north, AREA_CENTER.lng + east),
})));

export function pinForAreaKey(key) {
  const found = APPROXIMATE_AREAS.find((area) => area.key === key);
  if (!found) throw new RangeError('Choose one of the approximate areas.');
  return { ...found.pin };
}
