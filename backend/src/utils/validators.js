export const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
export const MAX_DURATION_MS = 3 * 60 * 1000;
const ID_PATTERN = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const CENTER = { lat: -25.90944, lng: 28.09278 };

export function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export function isStoryId(id) {
  return typeof id === 'string' && ID_PATTERN.test(id);
}

export function validatePin(value) {
  if (value === null || value === undefined || value === '') return null;
  let pin;
  try { pin = typeof value === 'string' ? JSON.parse(value) : value; } catch {
    throw badRequest('Invalid pin information.');
  }
  if (!pin || typeof pin !== 'object' || Array.isArray(pin) ||
      pin.precision !== 'approx-500m' ||
      !Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) {
    throw badRequest('Only approximate 500 m location pins are supported.');
  }
  if (Number((Math.round(pin.lat / 0.005) * 0.005).toFixed(3)) !== pin.lat ||
      Number((Math.round(pin.lng / 0.005) * 0.005).toFixed(3)) !== pin.lng) {
    throw badRequest('Pin coordinates must be rounded to the approximate grid.');
  }
  const radians = (degrees) => degrees * Math.PI / 180;
  const a = Math.sin(radians(pin.lat - CENTER.lat) / 2) ** 2 +
    Math.cos(radians(CENTER.lat)) * Math.cos(radians(pin.lat)) *
    Math.sin(radians(pin.lng - CENTER.lng) / 2) ** 2;
  if (6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a))) > 4.5) {
    throw badRequest('Pin is outside the supported story area.');
  }
  return { lat: pin.lat, lng: pin.lng, precision: 'approx-500m' };
}

export function validateUploadFields(body) {
  if (!isStoryId(body.clientStoryId)) throw badRequest('Invalid story identifier.');
  const title = String(body.title || '').trim();
  if (!title || title.length > 80) throw badRequest('Story title must be 1–80 characters.');
  const durationMs = Number(body.durationMs);
  if (!Number.isInteger(durationMs) || durationMs < 0 || durationMs > MAX_DURATION_MS) {
    throw badRequest('Invalid recording duration.');
  }
  if (body.publishConsent !== 'yes') throw badRequest('Explicit publication consent is required.');
  if (body.shareLocation !== 'yes' && body.shareLocation !== 'no') {
    throw badRequest('Location-sharing choice is required.');
  }
  const pin = body.shareLocation === 'yes' ? validatePin(body.pin) : null;
  if (body.shareLocation === 'yes' && !pin) {
    throw badRequest('Select an approximate location before sharing it.');
  }
  return { clientStoryId: body.clientStoryId, title, durationMs, pin };
}

export function baseMime(value = '') {
  return value.split(';', 1)[0].toLowerCase().trim();
}
