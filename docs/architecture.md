# KasiVoices architecture — updated through Phase 2

## Local-first boundaries

```text
Browser-native microphone (MediaRecorder)
              |
              v
Audio Blob + story metadata
              |
              v
Dexie.js / IndexedDB
  | stories: metadata only
  | recordings: Blobs, keyed by story ID
              |
              +--> Story list / audio playback / local download
              |
              +--> Future sync, strictly user-controlled (Phase 4)

Production service worker --> app-shell HTML, JS, CSS and small local assets only
Connection banner --> browser online/offline events (advisory, not a ping)
```

Vite + Vanilla JS + Tailwind CSS make up the client. Leaflet, OpenStreetMap, Express, and MongoDB remain reserved for subsequent phases. No AI.

## Data model version 1

`stories` object store has `id` as primary key, `createdAt` and `updatedAt` indexes. Each story has a title, media type, filename, bytes, duration, and a `syncStatus: local` marker. `recordings` contains `{ id, audioBlob }`. A single transaction inserts/removes related rows.

This data model does not initiate uploading or imply user consent for publication. The `syncStatus` field is informational for future migration only.

## Cache policy

The build generates `dist/sw.js` with a fingerprinted cache name based on compiled shell assets. The worker precaches only production `index.html`, `offline.html`, `manifest.webmanifest`, `favicon.svg`, and built CSS/JS. It intercepts same-origin navigation for shell fallback and only serves explicitly allowlisted resources from the cache. It never caches audio Blobs, story data, API responses, or map tiles. Old versioned shell caches are deleted on activation.

Service workers are registered only in production (preview/build output) and only in secure contexts. No browser-based caching is registered during Vite dev.

## Low bandwidth and device safeguards

The recorder uses a short duration cap, requests a compact audio bitrate where supported, limits total collected chunk bytes, and avoids loading every saved Blob into the archive list. The story list displays a bounded first page. Blob URLs are revoked when no longer needed. No analytics or CDN runtime requests.

## Storage and consent risks

Browser IndexedDB may be unavailable or evicted under space pressure. Show a recoverable error, offer downloads, and permit requesting persistent storage where supported. Users should export important files. Recordings must not silently sync. Consent to record, publish, and disclose locations must be addressed before Phase 4.

## Future boundaries

- Phase 3: consent-first optional approximate location pins; Leaflet dynamically loaded; tile terms and attribution respected.
- Phase 4: conventional first-party HTTPS API; MongoDB metadata; separate media storage; explicit, idempotent, resumable uploads.

No AI engines, APIs, models, or features are permitted.
