// Only first-party, same-origin routes. No AI, external analytics, or background uploads.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function requestAPI(path, { key, method = 'GET', body, deleteToken, signal } = {}) {
  if (!path.startsWith('/api/v1/stories')) throw new TypeError('Unsupported API path.');
  const headers = {};
  if (key) headers.Authorization = 'Bearer ' + key;
  if (deleteToken) headers['X-Delete-Token'] = deleteToken;
  const response = await fetch(path, {
    method, headers, body, signal, cache: 'no-store', credentials: 'omit',
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || 'Server request failed.', response.status);
  return data;
}

export function createStoryPayload(story, blob, { shareLocation = false } = {}) {
  if (!story || !blob || !(blob instanceof Blob)) throw new TypeError('Saved audio is required.');
  const form = new FormData();
  form.set('clientStoryId', story.id);
  form.set('title', story.title);
  form.set('durationMs', String(story.durationMs));
  form.set('publishConsent', 'yes');
  form.set('shareLocation', shareLocation ? 'yes' : 'no');
  if (shareLocation && story.pin) form.set('pin', JSON.stringify(story.pin));
  form.set('audio', blob, story.filename || 'recording.webm');
  return form;
}
