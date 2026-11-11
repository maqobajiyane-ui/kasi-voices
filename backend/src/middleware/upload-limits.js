import multer from 'multer';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { audioExtension, discardFile } from '../services/media-storage.service.js';
import { MAX_AUDIO_BYTES } from '../utils/validators.js';

export async function createAudioUpload(mediaDir) {
  const tmpDir = join(mediaDir, 'tmp');
  await mkdir(tmpDir, { recursive: true, mode: 0o700 });
  const upload = multer({
    storage: multer.diskStorage({
      destination: tmpDir,
      filename: (request, file, callback) => callback(null, randomUUID() + '.part'),
    }),
    limits: { fileSize: MAX_AUDIO_BYTES, files: 1, fields: 5, fieldSize: 1024, parts: 6 },
    fileFilter: (request, file, callback) => {
      if (!audioExtension(file.mimetype)) {
        const err = new Error('Unsupported audio format.');
        err.status = 400;
        callback(err);
      } else callback(null, true);
    },
  }).single('audio');

  return (req, res, next) => {
    upload(req, res, (error) => {
      if (!error) return next();
      void discardFile(req.file?.path).finally(() => next(error));
    });
  };
}
