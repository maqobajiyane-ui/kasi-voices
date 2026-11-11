import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AREA_CENTER, APPROXIMATE_AREAS, APPROXIMATE_GRID_DEGREES,
  approximatePin, distanceFromCenterKm, formatApproximatePin,
  isStoredPin, pinForAreaKey,
} from '../src/lib/geolocation.js';

test('uses approximate privacy grid instead of exact location', () => {
  assert.equal(APPROXIMATE_GRID_DEGREES, 0.005);
  const first = approximatePin(-25.90944, 28.09278);
  const moved = approximatePin(-25.9099, 28.0919);
  assert.deepEqual(first, moved);
  assert.equal(first.precision, 'approx-500m');
  assert.equal(isStoredPin(first), true);
  assert.match(formatApproximatePin(first), /approx\. 500 m/);
});

test('refuses invalid, out-of-vicinity, and falsely precise coordinates', () => {
  assert.throws(() => approximatePin(NaN, AREA_CENTER.lng), RangeError);
  assert.throws(() => approximatePin(-26.4, 28.4), /near Olievenhoutbosch/);
  assert.equal(distanceFromCenterKm(AREA_CENTER.lat, AREA_CENTER.lng), 0);
  assert.equal(isStoredPin({ lat: AREA_CENTER.lat, lng: AREA_CENTER.lng, precision: 'exact' }), false);
  assert.equal(isStoredPin({ lat: -25.911, lng: 28.093, precision: 'approx-500m' }), false);
});

test('manual area options are all local and reversible by key', () => {
  assert.equal(APPROXIMATE_AREAS.length, 9);
  for (const area of APPROXIMATE_AREAS) {
    assert.equal(isStoredPin(area.pin), true);
    assert.deepEqual(pinForAreaKey(area.key), area.pin);
  }
  assert.throws(() => pinForAreaKey('outside'), RangeError);
});
