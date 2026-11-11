import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';

const { createArchiveDatabase, createLocalArchive } = await import('../src/lib/db.js');

async function withArchive(callback) {
  const db = createArchiveDatabase('kasivoices-test-' + crypto.randomUUID());
  const archive = createLocalArchive(db);
  try {
    await callback(archive, db);
  } finally {
    db.close();
    await db.delete();
  }
}

test('audio and metadata are saved atomically and remain local', async () => {
  await withArchive(async (archive) => {
    const blob = new Blob(['test-audio'], { type: 'audio/webm' });
    const story = await archive.saveRecording(blob, { durationMs: 4800, title: 'My village' });
    assert.equal(story.title, 'My village');
    assert.equal(story.durationMs, 4800);
    assert.equal(story.syncStatus, 'local');
    assert.equal(story.bytes, blob.size);

    const listing = await archive.listStories();
    assert.equal(listing.count, 1);
    assert.equal(listing.stories[0].id, story.id);
    assert.ok(!('audioBlob' in listing.stories[0]));
    const savedBlob = await archive.getRecording(story.id);
    assert.equal(await savedBlob.text(), 'test-audio');
  });
});

test('title updates and deletion remove both metadata and blob', async () => {
  await withArchive(async (archive) => {
    const story = await archive.saveRecording(new Blob(['voice'], { type: 'audio/webm' }));
    assert.equal(await archive.renameStory(story.id, '  Story of home  '), 1);
    assert.equal((await archive.listStories()).stories[0].title, 'Story of home');
    await archive.removeStory(story.id);
    assert.equal((await archive.listStories()).count, 0);
    assert.equal(await archive.getRecording(story.id), null);
  });
});

test('rejects empty recordings and empty titles without changing storage', async () => {
  await withArchive(async (archive) => {
    await assert.rejects(archive.saveRecording(new Blob()), TypeError);
    const story = await archive.saveRecording(new Blob(['voice']));
    await assert.rejects(archive.renameStory(story.id, '  '), /title/);
    assert.equal((await archive.listStories()).count, 1);
  });
});

test('story list is bounded for low-memory devices', async () => {
  await withArchive(async (archive) => {
    for (let i = 0; i < 4; i++) {
      await archive.saveRecording(new Blob([String(i)]), { title: 'Story ' + i });
    }
    const result = await archive.listStories({ limit: 2 });
    assert.equal(result.stories.length, 2);
    assert.equal(result.count, 4);
  });
});
