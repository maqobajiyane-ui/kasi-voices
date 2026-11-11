import { createReadStream } from 'node:fs';
import { open, rename, unlink, mkdir, stat } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { baseMime, badRequest, MAX_AUDIO_BYTES } from '../utils/validators.js';

const FORMATS = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
};

export function audioExtension(mime) {
  return FORMATS[baseMime(mime)] || null;
}

export function matchesAudioHeader(header, mime) {
  const extension = audioExtension(mime);
  if (extension === 'webm') return header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (extension === 'ogg') return header.subarray(0, 4).toString('ascii') === 'OggS';
  if (extension === 'm4a') return header.subarray(4, 8).toString('ascii') === 'ftyp';
  if (extension === 'wav') {
    return header.subarray(0, 4).toString('ascii') === 'RIFF' &&
      header.subarray(8, 12).toString('ascii') === 'WAVE';
  }
  return false;
}

export async function inspectAudio(file) {
  if (!file || !file.path || file.size < 1 || file.size > MAX_AUDIO_BYTES) {
    throw badRequest('Audio file is missing or exceeds 15 MiB.');
  }
  if (!audioExtension(file.mimetype)) throw badRequest('Unsupported audio format.');
  const handle = await open(file.path, 'r');
  let header;
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, 16, 0);
    header = buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
  if (!matchesAudioHeader(header, file.mimetype)) throw badRequest('Audio signature does not match the stated format.');
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(file.path)) digest.update(chunk);
  return { sha256: digest.digest('hex'), mimeType: baseMime(file.mimetype), extension: audioExtension(file.mimetype) };
}

export function finalMediaPath(mediaDir, filename) {
  // Never derive filesystem names from a client-controlled filename or URL.
  if (!/^[0-9a-f-]{36}\.(webm|ogg|m4a|wav)$/.test(filename)) {
    throw badRequest('Invalid media reference.');
  }
  return join(mediaDir, filename);
}

export async function commitAudio(mediaDir, tmpPath, extension) {
  await mkdir(mediaDir, { recursive: true });
  const filename = randomUUID() + '.' + extension;
  await rename(tmpPath, finalMediaPath(mediaDir, filename));
  return filename;
}

export async function discardFile(path) {
  if (!path) return;
  try { await unlink(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}

export async function mediaFileDetails(mediaDir, filename) {
  const filePath = finalMediaPath(mediaDir, filename);
  const info = await stat(filePath);
  return { filePath, size: info.size };
}
