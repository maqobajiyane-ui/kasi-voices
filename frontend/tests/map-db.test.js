import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import Dexie from 'dexie';
import { approximatePin } from '../src/lib/geolocation.js';

const { createArchiveDatabase, createLocalArchive } = await import('../src/lib/db.js');

async function withArchive(callback) {
  const databaseName = 'kasivoices-map-test-' + crypto.randomUUID();
  const db = createArchiveDatabase(databaseName);
  try {
    await callback(createLocalArchive(db), db);
  } finally {
    db.close();
    await db.delete();
  }
}

test('pins are optional, quantized, saved locally, and removed without removing audio', async () => {
  await withArchive(async (archive) => {
    const story = await archive.saveRecording(new Blob(['local voice'], { type: 'audio/webm' }));
    assert.equal((await archive.getPinnedStories()).length, 0);
    const saved = await archive.setStoryPin(story.id, -25.90944, 28.09278);
    assert.deepEqual(saved.pin, approximatePin(-25.90944, 28.09278));
    assert.equal((await archive.getPinnedStories()).length, 1);
    await archive.clearStoryPin(story.id);
    assert.equal((await archive.getPinnedStories()).length, 0);
    assert.equal(await (await archive.getRecording(story.id)).text(), 'local voice');
  });
});

test('rejects out-of-area pinning and missing stories', async () => {
  await withArchive(async (archive) => {
    const story = await archive.saveRecording(new Blob(['x']));
    await assert.rejects(archive.setStoryPin(story.id, 0, 0), RangeError);
    await assert.rejects(archive.setStoryPin('missing', -25.90944, 28.09278), /not found/);
    await assert.rejects(archive.clearStoryPin('missing'), /not found/);
    assert.equal((await archive.getStory(story.id)).pin, undefined);
  });
});

test('v1 local recordings remain readable after version 2 migration', async () => {
  const name = 'kasivoices-v1-upgrade-' + crypto.randomUUID();
  const oldDb = new Dexie(name);
  oldDb.version(1).stores({ stories: 'id, createdAt, updatedAt', recordings: 'id' });
  await oldDb.open();
  await oldDb.stories.add({ id: 'legacy', title: 'Older recording', createdAt: 1, updatedAt: 1 });
  await oldDb.recordings.add({ id: 'legacy', audioBlob: new Blob(['before phase 3']) });
  oldDb.close();

  const db = createArchiveDatabase(name);
  const archive = createLocalArchive(db);
  try {
    assert.equal((await archive.getStory('legacy')).title, 'Older recording');
    assert.equal(await (await archive.getRecording('legacy')).text(), 'before phase 3');
    const pinned = await archive.setStoryPin('legacy', -25.90944, 28.09278);
    assert.equal(pinned.pin.precision, 'approx-500m');
  } finally {
    db.close();
    await db.delete();
  }
});

test('deleted pinned stories lose metadata and audio', async () => {
  await withArchive(async (archive) => {
    const story = await archive.saveRecording(new Blob(['some audio']));
    await archive.setStoryPin(story.id, -25.90944, 28.09278);
    await archive.removeStory(story.id);
    assert.equal((await archive.getPinnedStories()).length, 0);
    assert.equal(await archive.getRecording(story.id), null);
  });
});
