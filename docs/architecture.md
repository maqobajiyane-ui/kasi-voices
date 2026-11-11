# KasiVoices system design — all four phases implemented

## Trust and data boundaries

```text
Mobile PWA (Vite, Vanilla JS, Tailwind)
   | native MediaRecorder
   | Dexie / IndexedDB: local story metadata, audio Blob, optional ~500 m pin
   | service worker: eager app shell ONLY
   | Leaflet: on-demand OSM tiles; no offline tile prefetch
   |
   | ONLY after explicit consent + Publish click + curator key
   v
HTTPS reverse proxy (required for network deployment)
   v
Express /api/v1
   | key authentication, request rate and upload limits
   | consent, metadata, and audio header validation
   | same-story idempotent multipart publication
   +--> MongoDB: metadata, SHA-256 digest, media filename
   +--> protected server filesystem: actual audio bytes
```

No third-party AI engines, AI APIs, AI features, or models.

## Public vs curator interface

This is a curator-only archive pilot. The shared `PUBLISH_ACCESS_KEY` is a powerful administrator/curator secret, not a per-story user identity. It enables publication and reading metadata/audio. A separate withdrawal capability is provided to the browser for its publication and held in IndexedDB. Server deletion capability is derived with HMAC from the master secret; thus a curator holding that master secret has administrative-level power. Protect and rotate it accordingly. No public access to uploaded recordings has been enabled.

## Local schema

Dexie v1 stored story metadata and audio in separate stores; v2 added approximate pinned locations. v3 adds `syncStatus` index and publication metadata fields without changing audio objects. Uploads require explicit consent in UI and API validation. Optional pin sharing is a separate choice and coordinates remain on a ~500 m approximate grid.

## Failure/retry contract

Uploading marks local metadata as `uploading`, then `published` with a deletion capability, or `failed` on error. Users retry explicitly. A replay with the same client story UUID and unchanged content succeeds without another Mongo document; changing a previously published UUID returns conflict. The backend removes temporary files on failure. Service worker never stores API data, credentials or user recordings. Because the server's MongoDB and filesystem are distinct stores, deployment monitoring/reconciliation is still required for catastrophic failures.

## Security and bandwidth notes

- HTTP security headers from Helmet, API rate limiting, private same-origin API routes and bounded metadata listings.
- Authentication required for list and audio. Per-story withdrawal token required for deletion.
- Maximum media size 15 MiB, intended maximum duration 3 minutes, audio format allowlist, signature validation, and minimal memory overhead from streaming to disk.
- Curator secret loaded from environment and not included in browser source or persistent browser storage.
- Location pins are strictly opt-in; no GPS permission.
- Media downloads support byte ranges; uploading full audio is still required on manual retry (no resumable chunks).
- Production reverse-proxy TLS, access auditing, MIME validation depth, MongoDB media reconciliation, revocation/legal retention process, and multi-user roles need a security and operational review before public launch.
