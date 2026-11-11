import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { deletionCapability } from '../src/services/story.service.js';
import { validateUploadFields, validatePin } from '../src/utils/validators.js';
import { matchesAudioHeader } from '../src/services/media-storage.service.js';

const secret = 'f8f794cfe5bd00df35d68ce1604305a1fac8fdd9ecb9091d2a2b0c56e4c098aa';
const storyId = '8c41d96d-9863-4d41-a90f-a890d93c79a8';
const validAudio = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(20)]);

function fakeCollection() {
  const entries = new Map();
  return {
    async findOne(query) { return entries.get(query.clientStoryId) || null; },
    async insertOne(doc) {
      if (entries.has(doc.clientStoryId)) {
        const error = new Error('Duplicate key'); error.code = 11000; throw error;
      }
      entries.set(doc.clientStoryId, doc);
      return { acknowledged: true };
    },
    async deleteOne(query) { return { deletedCount: entries.delete(query.clientStoryId) ? 1 : 0 }; },
    find() {
      return {
        sort() { return this; },
        limit(n) { this.n = n; return this; },
        async toArray() { return [...entries.values()].slice(0, this.n); },
      };
    },
  };
}

async function withServer(callback) {
  const mediaDir = await mkdtemp(join(tmpdir(), 'kv-api-'));
  const app = await createApp({ collection: fakeCollection(), mediaDir, secret });
  try { await callback(request(app), mediaDir); }
  finally { await rm(mediaDir, { recursive: true, force: true }); }
}

function submit(client, { consent = 'yes', shareLocation = 'no', pin = '', id = storyId, title = 'Olieven story', file = validAudio } = {}) {
  let req = client.post('/api/v1/stories')
    .set('Authorization', 'Bearer ' + secret)
    .field('clientStoryId', id)
    .field('title', title)
    .field('durationMs', '2500')
    .field('publishConsent', consent)
    .field('shareLocation', shareLocation);
  if (pin) req = req.field('pin', pin);
  return req.attach('audio', file, { filename: 'story.webm', contentType: 'audio/webm' });
}

test('health endpoint is available and publishing requires a curator key', async () => {
  await withServer(async (client) => {
    assert.equal((await client.get('/api/health')).status, 200);
    assert.equal((await client.get('/api/v1/stories')).status, 401);
    assert.equal((await client.get('/api/v1/stories').set('Authorization', 'Bearer ' + secret)).status, 200);
  });
});

test('consent, idempotency, private media, and withdrawal are enforced', async () => {
  await withServer(async (client) => {
    assert.equal((await submit(client, { consent: 'no' })).status, 400);
    const first = await submit(client);
    assert.equal(first.status, 201);
    assert.equal(first.body.story.title, 'Olieven story');
    assert.ok(first.body.deleteToken);
    const replay = await submit(client);
    assert.equal(replay.status, 200);
    assert.equal(replay.body.story.id, storyId);
    assert.equal((await submit(client, { title: 'Changed payload' })).status, 409);
    assert.equal((await client.get('/api/v1/stories/' + storyId + '/audio')).status, 401);
    const audio = await client.get('/api/v1/stories/' + storyId + '/audio').set('Authorization', 'Bearer ' + secret);
    assert.equal(audio.status, 200);
    assert.equal(audio.body.length, validAudio.length);
    assert.equal((await client.delete('/api/v1/stories/' + storyId).set('X-Delete-Token', 'bad')).status, 403);
    assert.equal((await client.delete('/api/v1/stories/' + storyId).set('X-Delete-Token', first.body.deleteToken)).status, 204);
    assert.equal((await client.get('/api/v1/stories/' + storyId + '/audio').set('Authorization', 'Bearer ' + secret)).status, 404);
  });
});

test('invalid media signatures and too-large metadata are rejected', async () => {
  await withServer(async (client) => {
    assert.equal((await submit(client, { file: Buffer.from('not real webm') })).status, 400);
    assert.equal((await submit(client, { title: 'x'.repeat(81) })).status, 400);
  });
});

test('metadata validators reject exact, out-of-area, and unconsented pin sharing', () => {
  assert.throws(() => validatePin({ lat: -25.90944, lng: 28.09278, precision: 'exact' }));
  assert.throws(() => validatePin({ lat: 0, lng: 0, precision: 'approx-500m' }));
  assert.throws(() => validateUploadFields({ clientStoryId: storyId, title: 'Hi', durationMs: '5', publishConsent: 'yes', shareLocation: 'yes' }));
  assert.equal(validateUploadFields({ clientStoryId: storyId, title: 'Hi', durationMs: '5', publishConsent: 'yes', shareLocation: 'no' }).pin, null);
  assert.equal(matchesAudioHeader(validAudio, 'audio/webm'), true);
  assert.notEqual(deletionCapability(secret, storyId), deletionCapability(secret, '21c23e57-9999-4111-a111-999999999999'));
});
