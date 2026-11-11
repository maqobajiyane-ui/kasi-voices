# KasiVoices

An offline-first, mobile-first community storytelling archive for Olievenhoutbosch, South Africa.

**Phase 0: System architecture and repository structure only.** No application features are implemented yet.

## Technology

- Frontend: Vite, Vanilla JavaScript, Tailwind CSS, Leaflet with OpenStreetMap data, Dexie/IndexedDB.
- Backend: Node.js, Express, MongoDB.
- Architecture: local-first recording and drafts; user-controlled, network-aware synchronization in a later phase.
- No AI models, AI engines, AI APIs, or AI features. The planned Express endpoints are conventional first-party application routes.

## Workspaces

- `frontend/`: offline-capable PWA UI, recorder, local IndexedDB, maps, and sync components (planned; placeholders only).
- `backend/`: Express HTTP endpoints, MongoDB metadata, and audio file handling (planned; placeholders only).
- `docs/`: architecture decisions, privacy/consent, offline policy, and phase tracking.

## Development phases

- [x] Phase 0 — Architecture and monorepo layout
- [ ] Phase 1 — Local HTML5 audio recorder (browser-only UI)
- [ ] Phase 2 — IndexedDB storage and offline detection/caching
- [ ] Phase 3 — Interactive Leaflet map and local pinning
- [ ] Phase 4 — Express API, MongoDB, and frontend sync

## Principles

1. Keep initial network and JavaScript payloads small, without CDN dependencies at runtime.
2. Treat user-generated audio as local until the user explicitly chooses to sync it.
3. Do not pre-cache audio recordings or an entire map tile region.
4. Respect informed consent, attribution, location privacy and the right to withdraw community stories.
5. Keep each phase separate; placeholder files do not constitute an implemented feature.

See `docs/architecture.md` for the system boundary and `docs/repository-layout.md` for the complete file map.
