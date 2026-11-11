# KasiVoices — system architecture through Phase 3

## Offline-first structure

- **Browser recording:** native MediaRecorder, a short recording cap, and no upload.
- **Local data:** Dexie.js v2. Story metadata and audio Blobs are stored separately in IndexedDB. Stories may optionally include `pin` (coarse coordinates and precision marker) and `pinUpdatedAt`.
- **Offline shell:** Vite outputs a versioned application shell precached by a service worker. Only eagerly imported CSS/JS, index HTML, manifest, icon and offline fallback are included.
- **Deferred map:** opening the map dynamically imports Leaflet + its CSS; a single OSM tile layer retrieves on-demand tiles, with attribution. The production service worker does not cache map tiles or deferred map assets.
- **No external AI or application APIs.** Backend remains a Phase 4 placeholder.

## Privacy contract

No GPS or browser geolocation request is used. Users opt in by choosing a pin location manually. Pin coordinates are snapped to a 0.005-degree grid, approximately 500–550 m per cell, and constrained to a 4.5 km editing radius around the Olievenhoutbosch reference center. The center and directional options are approximate orientation aids, not official administrative boundaries.

Only the coarse pin is saved locally; exact clicked coordinates are never persisted. Removing a pin retains the story and audio. Rendering markers uses DOM text nodes instead of interpreting story titles as HTML.

## Offline map fallback

A text list of saved pinned stories and a manual selection of nine approximate directional areas remains functional without tiles. The optional interactive map consumes mobile data when opened; public OSM tiles must not be bulk fetched or used for offline pack generation.

## On-device storage and media

Audio Blobs remain in their own IndexedDB object store. Metadata-only indexed queries keep memory use low, with bounded lists. Storage might be evicted; encourage downloadable audio backups. Existing version-1 stories and recordings migrate to version 2 intact.

## Next phase (not implemented)

Phase 4 may introduce a conventional Express API, MongoDB metadata and separately secured media storage with clearly consented, idempotent sync. No AI functionality is permitted.
