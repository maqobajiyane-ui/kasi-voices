// Pure recording helpers: no storage, uploads, network requests, or AI.
export const MAX_RECORDING_MS = 3 * 60 * 1000;
export const MAX_RECORDING_BYTES = 15 * 1024 * 1024;

// The browser decides the actual format; never assume WebM is universal.
const PREFERRED_TYPES = [
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/webm',
  'audio/ogg;codecs=opus',
];

export function chooseSupportedMimeType(RecorderClass) {
  if (!RecorderClass || typeof RecorderClass.isTypeSupported !== 'function') {
    return '';
  }
  return PREFERRED_TYPES.find((type) => RecorderClass.isTypeSupported(type)) || '';
}

export function fileExtensionForMime(mimeType = '') {
  const type = mimeType.toLowerCase().split(';', 1)[0].trim();
  if (type === 'audio/mp4' || type === 'audio/x-m4a' || type === 'audio/aac') {
    return 'm4a';
  }
  if (type === 'audio/ogg') return 'ogg';
  if (type === 'audio/wav' || type === 'audio/wave') return 'wav';
  return 'webm';
}

export function formatDuration(milliseconds) {
  const safeSeconds = Math.floor(Math.max(0, Number(milliseconds) || 0) / 1000);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

export function recordingFilename(date = new Date(), mimeType = '') {
  const stamp = date.toISOString().replace(/[:.]/g, '-');
  return 'kasivoices-' + stamp + '.' + fileExtensionForMime(mimeType);
}
