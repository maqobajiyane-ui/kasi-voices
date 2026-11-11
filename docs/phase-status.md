# KasiVoices development status

- [x] Phase 0 — System architecture & folder layout [COMPLETED]
- [x] Phase 1 — Native HTML5 audio recorder [COMPLETED]
- [x] Phase 2 — Dexie IndexedDB storage & offline shell [COMPLETED]
- [x] Phase 3 — Leaflet interactive map & approximate local pinning [COMPLETED]
- [ ] Phase 4 — Express, MongoDB & optional explicit sync [PENDING]

## Phase 3 delivered

- An on-demand interactive Leaflet.js map of the Olievenhoutbosch vicinity.
- OpenStreetMap tiles with visible attribution, fetched only when the map is opened. Public OSM tiles are never bulk downloaded or cached in the service worker.
- Users can manually choose a broad position by tapping the map, or choose one of nine offline-friendly approximate areas.
- All coordinates are snapped to a coarse approximately 500 m grid and restricted to a 4.5 km vicinity of the community center. The radius is an editing convenience, not an official locality boundary.
- Users opt in per saved story; no browser geolocation/GPS permission is requested.
- IndexedDB schema version 2 adds a pin timestamp index without replacing existing audio. Pins can be changed and removed.
- Pinned stories are shown on the map using lightweight circle markers and in a text list that works offline. A capped local story query avoids reading audio blobs or an unbounded archive.
- Leaflet and its CSS are dynamically imported only when the user opens the map. The production offline shell build deliberately excludes deferred map chunks.

## Testing

GitHub Actions runs `npm install`, `npm test`, and `npm run build`. Tests cover privacy rounding, invalid positions, Dexie migration, pin lifecycle, and the existing recording / offline features.

On-device testing of real map tile connectivity, map accessibility, mobile bandwidth, and offline behavior remains necessary before public launch.

## Still out of scope

Express routing, MongoDB, authentication, API uploads and synchronization are reserved strictly for Phase 4. No AI components, engines, models, APIs or AI-based features are used.
