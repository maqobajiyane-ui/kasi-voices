import { createHmac, timingSafeEqual } from 'node:crypto';
import { discardFile, commitAudio, finalMediaPath, inspectAudio } from './media-storage.service.js';
import { badRequest, validateUploadFields, isStoryId } from '../utils/validators.js';
import { publishedStorySummary } from '../models/story.model.js';

function samePayload(previous, fields, info, size) {
  return previous.sha256 === info.sha256 && previous.bytes === size &&
    previous.title === fields.title && previous.durationMs === fields.durationMs &&
    JSON.stringify(previous.pin || null) === JSON.stringify(fields.pin);
}

export function deletionCapability(secret, id) {
  return createHmac('sha256', secret).update('delete:' + id).digest('base64url');
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export function createStoryService({ collection, mediaDir, secret }) {
  return {
    async publish(body, file) {
      try {
        const fields = validateUploadFields(body);
        const info = await inspectAudio(file);
        const original = await collection.findOne({ clientStoryId: fields.clientStoryId });
        if (original) {
          if (!samePayload(original, fields, info, file.size)) {
            const err = badRequest('This story identifier was already published with different content.');
            err.status = 409;
            throw err;
          }
          return { created: false, story: publishedStorySummary(original),
            deleteToken: deletionCapability(secret, fields.clientStoryId) };
        }

        let filename;
        try {
          filename = await commitAudio(mediaDir, file.path, info.extension);
          const document = {
            ...fields, bytes: file.size, mimeType: info.mimeType,
            filename, sha256: info.sha256, publishedAt: new Date().toISOString(),
          };
          await collection.insertOne(document);
          return { created: true, story: publishedStorySummary(document),
            deleteToken: deletionCapability(secret, fields.clientStoryId) };
        } catch (error) {
          if (filename) await discardFile(finalMediaPath(mediaDir, filename));
          if (error.code === 11000) {
            const winner = await collection.findOne({ clientStoryId: fields.clientStoryId });
            if (winner && samePayload(winner, fields, info, file.size)) {
              return { created: false, story: publishedStorySummary(winner),
                deleteToken: deletionCapability(secret, fields.clientStoryId) };
            }
            const conflict = badRequest('This story identifier was already published with different content.');
            conflict.status = 409;
            throw conflict;
          }
          throw error;
        }
      } finally {
        await discardFile(file?.path);
      }
    },

    async list(limit = 20) {
      const safeLimit = Math.max(1, Math.min(50, Number(limit) || 20));
      const rows = await collection.find({}, { projection: { _id: 0, filename: 0, sha256: 0 } })
        .sort({ publishedAt: -1 }).limit(safeLimit).toArray();
      return rows.map(publishedStorySummary);
    },

    async get(id) {
      if (!isStoryId(id)) throw badRequest('Invalid story identifier.');
      return collection.findOne({ clientStoryId: id });
    },

    async withdraw(id, providedToken) {
      if (!isStoryId(id)) throw badRequest('Invalid story identifier.');
      if (!safeEqual(providedToken, deletionCapability(secret, id))) {
        const error = new Error('Invalid deletion token.');
        error.status = 403;
        throw error;
      }
      const story = await collection.findOne({ clientStoryId: id });
      if (!story) return false;
      await collection.deleteOne({ clientStoryId: id });
      await discardFile(finalMediaPath(mediaDir, story.filename));
      return true;
    },
  };
}
