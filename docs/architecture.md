# System architecture — Phase 0

## Boundaries
Browser PWA (Vite + vanilla JS + Tailwind) → local IndexedDB via Dexie → optional explicit sync over HTTPS → first-party Express server → MongoDB metadata + server-side audio storage.

## Offline-first contract
- Recording and story drafts must work without connectivity after the application shell has been loaded at least once (future phases).
- Store audio as browser Blob objects; store story metadata and pending states in IndexedDB.
- Audio uploads are optional and must not run without user consent.
- Use a bounded service-worker shell cache; exclude recordings, personal information, and bulk map tiles from shell precaching.
- Retry uploads safely with idempotency and explicit queued/failed/synced states.
- Maps must have a textual fallback when tile connectivity is unavailable; never promise offline tiles unless separately cached with appropriate permission.

## Data and trust boundaries
- Express is a conventional application server; no third-party AI calls or AI code.
- MongoDB holds story metadata, consent state, and media references, not large audio binaries.
- Media is stored separately with access controls, upload size/time limits, and validated types.
- Olievenhoutbosch story locations should default to approximate, opt-in positions. Exact private locations must not be public by default.

## Payload and accessibility budgets
- Avoid runtime CDNs; self-host production dependencies and static assets.
- Load Leaflet only on map views; defer noncritical assets and restrict cache growth.
- Use compressed responsive assets, minimal fonts, keyboard-operable controls and clear offline/error states.

This document is a design specification, not a claim that these features currently work.
