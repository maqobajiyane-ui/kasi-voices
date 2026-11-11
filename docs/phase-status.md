# KasiVoices phase tracker

- [x] Phase 0 — System architecture & folder layout [COMPLETED]
- [x] Phase 1 — Browser-native HTML5 audio recording [COMPLETED]
- [x] Phase 2 — Dexie.js/IndexedDB & offline shell [COMPLETED]
- [x] Phase 3 — Interactive Leaflet and approximate local pinning [COMPLETED]
- [x] Phase 4 — Express.js, MongoDB & manual frontend publishing/withdrawal [COMPLETED]

Phase 4 adds an authenticated curator-only pilot API, protected audio upload, MongoDB metadata, bounded media files, idempotent publication, optional approximate pin sharing, and per-story withdrawal. Uploads are initiated by the storyteller; there are no background or automatic sync operations. Published stories are not publicly listed or playable without the curator key.

## Verification

GitHub Actions installs workspaces, runs Node unit/API integration-style tests using an in-memory Mongo collection test double, and builds the production frontend. True MongoDB/database deployment and live phone testing remain unverified until performed in a secured environment.

## Launch gate — not yet approved for public use

- HTTPS reverse proxy and configured private MongoDB
- Durable, access-controlled media storage and operational backups
- Strong curator-key lifecycle, abuse handling and public/user access model
- Browser/device end-to-end tests on low-end Android and slow/expensive data
- POPIA compliance, publication consent, withdrawal and retention review
- Observability, backup recovery drills and upload/withdrawal incident response
