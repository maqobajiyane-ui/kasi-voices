import test from 'node:test';
import assert from 'node:assert/strict';
import { connectionStatus } from '../src/lib/offline.js';

test('shows accurate advisory connection labels without calling any API', () => {
  assert.equal(connectionStatus(false).label, 'Offline mode');
  assert.equal(connectionStatus(true).label, 'Network detected');
  assert.match(connectionStatus(true).detail, /No uploads/);
});
