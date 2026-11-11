import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_RECORDING_MS,
  MAX_RECORDING_BYTES,
  chooseSupportedMimeType,
  fileExtensionForMime,
  formatDuration,
  recordingFilename,
} from '../src/lib/audio.js';

test('a recording is bounded in time and bytes', () => {
  assert.equal(MAX_RECORDING_MS, 180000);
  assert.equal(MAX_RECORDING_BYTES, 15728640);
});

test('formatDuration uses minutes and seconds safely', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(59999), '00:59');
  assert.equal(formatDuration(180000), '03:00');
  assert.equal(formatDuration(-3000), '00:00');
});

test('chooses the first supported browser audio format', () => {
  const browser = { isTypeSupported: (type) => type === 'audio/mp4' };
  assert.equal(chooseSupportedMimeType(browser), 'audio/mp4');
  assert.equal(chooseSupportedMimeType({ isTypeSupported: () => false }), '');
  assert.equal(chooseSupportedMimeType(undefined), '');
});

test('download extension tracks the media container', () => {
  assert.equal(fileExtensionForMime('audio/webm;codecs=opus'), 'webm');
  assert.equal(fileExtensionForMime('audio/mp4'), 'm4a');
  assert.equal(fileExtensionForMime('audio/ogg;codecs=opus'), 'ogg');
  assert.equal(fileExtensionForMime('audio/wav'), 'wav');
});

test('download filename is portable and date-labelled', () => {
  const date = new Date('2026-11-11T12:03:04.000Z');
  assert.equal(recordingFilename(date, 'audio/mp4'), 'kasivoices-2026-11-11T12-03-04-000Z.m4a');
});
