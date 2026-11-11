# Phase status

- [x] Phase 0 — System architecture and folder layout [COMPLETED]
- [x] Phase 1 — Local HTML5 audio recorder (browser-only UI) [COMPLETED]
- [ ] Phase 2 — IndexedDB and offline caching [PENDING]
- [ ] Phase 3 — Leaflet map [PENDING]
- [ ] Phase 4 — Express, MongoDB and sync [PENDING]

## Phase 1 boundaries

- Only Vite, Vanilla JS and Tailwind are active.
- Native MediaRecorder captures up to three minutes and stops if chunk data exceeds 15 MiB.
- Recordings are kept only in live page memory until downloaded; navigating away discards the recording.
- No Dexie, IndexedDB, service worker, Leaflet, Express, MongoDB, sync or AI functionality is active.
