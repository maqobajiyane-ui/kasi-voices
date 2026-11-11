import Dexie from 'dexie';
import { recordingFilename } from './audio.js';

const DEFAULT_DATABASE_NAME = 'kasivoices-local-archive';

export function createArchiveDatabase(name = DEFAULT_DATABASE_NAME) {
  const database = new Dexie(name);
  database.version(1).stores({
    // Metadata stays separate so listing does not load audio Blobs into memory.
    stories: 'id, createdAt, updatedAt',
    recordings: 'id',
  });
  return database;
}

export function createLocalArchive(database = createArchiveDatabase()) {
  return {
    async saveRecording(audioBlob, { durationMs = 0, title = '' } = {}) {
      if (!(audioBlob instanceof Blob) || audioBlob.size < 1) {
        throw new TypeError('A non-empty audio recording is required.');
      }

      const now = Date.now();
      const id = crypto.randomUUID();
      const mimeType = audioBlob.type || 'application/octet-stream';
      const story = {
        id,
        title: title.trim().slice(0, 80) || 'Voice story — ' + new Date(now).toLocaleDateString(),
        createdAt: now,
        updatedAt: now,
        durationMs: Math.max(0, Math.floor(Number(durationMs) || 0)),
        bytes: audioBlob.size,
        mimeType,
        filename: recordingFilename(new Date(now), mimeType),
        syncStatus: 'local',
      };

      // Atomic: metadata and Blob must either both be present or neither.
      await database.transaction('rw', database.stories, database.recordings, async () => {
        await database.stories.add(story);
        await database.recordings.add({ id, audioBlob });
      });

      return story;
    },

    async listStories({ limit = 15 } = {}) {
      const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
      const [stories, count] = await Promise.all([
        database.stories.orderBy('createdAt').reverse().limit(safeLimit).toArray(),
        database.stories.count(),
      ]);
      return { stories, count };
    },

    async getRecording(id) {
      const entry = await database.recordings.get(id);
      return entry?.audioBlob || null;
    },

    async renameStory(id, name) {
      const title = String(name || '').trim().slice(0, 80);
      if (!title) throw new Error('Enter a story title.');
      return database.stories.update(id, { title, updatedAt: Date.now() });
    },

    async removeStory(id) {
      await database.transaction('rw', database.stories, database.recordings, async () => {
        await database.recordings.delete(id);
        await database.stories.delete(id);
      });
    },

    async open() {
      await database.open();
    },

    async close() {
      database.close();
    },
  };
}

export const localArchive = createLocalArchive();
