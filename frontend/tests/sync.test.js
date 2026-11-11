import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryPayload, ApiError } from '../src/lib/api-client.js';

test('publication payload is explicit and excludes location unless permitted', () => {
  const story = {
    id: '8c41d96d-9863-4d41-a90f-a890d93c79a8',
    title: 'Story', durationMs: 3000, filename: 'test.webm',
    pin: { lat: -25.91, lng: 28.095, precision: 'approx-500m' },
  };
  const audio = new Blob(['audio'], { type: 'audio/webm' });
  const unshared = createStoryPayload(story, audio);
  assert.equal(unshared.get('shareLocation'), 'no');
  assert.equal(unshared.get('pin'), null);
  assert.equal(unshared.get('publishConsent'), 'yes');
  const shared = createStoryPayload(story, audio, { shareLocation: true });
  assert.equal(shared.get('shareLocation'), 'yes');
  assert.deepEqual(JSON.parse(shared.get('pin')), story.pin);
  assert.equal(new ApiError('Unauthorized', 401).status, 401);
});
