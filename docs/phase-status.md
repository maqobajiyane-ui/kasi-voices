# Development status

- [x] Phase 0 — System architecture and folder layout [COMPLETED]
- [x] Phase 1 — Local HTML5 audio recorder [COMPLETED]
- [x] Phase 2 — Dexie IndexedDB story storage, offline detection and caching [COMPLETED]
- [ ] Phase 3 — Leaflet map visualizer [PENDING]
- [ ] Phase 4 — Express, MongoDB and frontend sync [PENDING]

## Delivered in Phase 2

- Browser-local recording persistence with metadata and audio Blob stored in separate IndexedDB object stores via an atomic transaction.
- Local archive listing, listening, renaming, deletion, file download and save retry.
- Connection-status indicator; no network probes or uploads.
- Production-only, build-versioned service-worker cache for the small app shell.
- Optional storage persistence request, storage estimates and explicit warnings about browser eviction.
- Automated database and connectivity helper tests.

## Deferred by design

- Map views, coordinates, pinning and Leaflet (Phase 3).
- Server API, MongoDB, upload queue and synchronization (Phase 4).
- All AI and AI-linked functionality (excluded from entire product).

## Verification criteria

Automated GitHub Actions runs `npm install`, `npm test` and `npm run build`. Real-browser microphone permission, offline reload, storage eviction and device behavior should be validated manually on representative low-end Android devices before any public deployment.
