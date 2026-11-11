import Dexie from 'dexie';
import { recordingFilename } from './audio.js';
import { approximatePin, isStoredPin } from './geolocation.js';

const DEFAULT_DATABASE_NAME = 'kasivoices-local-archive';

export function createArchiveDatabase(name = DEFAULT_DATABASE_NAME) {
  const database = new Dexie(name);
  database.version(1).stores({
    // Metadata stays separate so listing does not load audio Blobs into memory.
    stories: 'id, createdAt, updatedAt',
    recordings: 'id',
  });
  // v2 adds a small index for pinned-story metadata, without changing audio records.
  database.version(2).stores({
    stories: 'id, createdAt, updatedAt, pinUpdatedAt',
    recordings: 'id',
  });
  // Data-only version bump. Existing recordings and approximate pins are preserved.
  database.version(3).stores({
    stories: 'id, createdAt, updatedAt, pinUpdatedAt, syncStatus',
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

    async getStory(id) {
      return database.stories.get(id);
    },

    async getPinnedStories({ limit = 150 } = {}) {
      const safeLimit = Math.max(1, Math.min(150, Math.floor(limit) || 150));
      const candidates = await database.stories
        .where('pinUpdatedAt').above(0).reverse().limit(safeLimit).toArray();
      return candidates.filter((story) => isStoredPin(story.pin));
    },

    async setStoryPin(id, latitude, longitude) {
      const pin = approximatePin(latitude, longitude);
      return database.transaction('rw', database.stories, async () => {
        const story = await database.stories.get(id);
        if (!story) throw new Error('Story not found in this browser.');
        const now = Date.now();
        story.pin = pin;
        story.pinUpdatedAt = now;
        story.updatedAt = now;
        await database.stories.put(story);
        return story;
      });
    },

    async clearStoryPin(id) {
      return database.transaction('rw', database.stories, async () => {
        const story = await database.stories.get(id);
        if (!story) throw new Error('Story not found in this browser.');
        delete story.pin;
        delete story.pinUpdatedAt;
        story.updatedAt = Date.now();
        await database.stories.put(story);
        return story;
      });
    },

    async updatePublication(id, changes) {
      const allowed = [
        'syncStatus', 'deleteToken', 'publishedAt', 'sharedPin',
        'publishedTitle', 'publishedUpdatedAt',
      ];
      for (const key of Object.keys(changes)) {
        if (!allowed.includes(key)) throw new Error('Unsupported publication field.');
      }
      return database.transaction('rw', database.stories, async () => {
        const story = await database.stories.get(id);
        if (!story) throw new Error('Story not found in this browser.');
        Object.assign(story, changes);
        await database.stories.put(story);
        return story;
      });
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
        const story = await database.stories.get(id);
        if (story?.deleteToken || story?.syncStatus === 'published' || story?.syncStatus === 'uploading') {
          throw new Error('Withdraw the published copy before deleting this story locally.');
        }
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
