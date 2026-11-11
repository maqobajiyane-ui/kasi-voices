# KasiVoices

KasiVoices is a lightweight, offline-first Progressive Web App for community storytellers in Olievenhoutbosch, South Africa. **No AI engines, AI APIs, AI features or AI models.**

## Development roadmap

- [x] Phase 0 — Architecture / monorepo
- [x] Phase 1 — HTML5 audio recorder
- [x] Phase 2 — Dexie/IndexedDB archive and offline shell
- [x] Phase 3 — Leaflet / OpenStreetMap approximate pinning
- [x] Phase 4 — Express/MongoDB authenticated API and explicit publishing/withdrawal

**Status:** functional development prototype. Automated checks do not replace on-device, privacy, deployment and security reviews. This is a curated pilot, not an open public publishing platform.

## Frontend

Node.js 22.12+ and npm are required:

```sh
git clone https://github.com/maqobajiyane-ui/kasi-voices.git
cd kasi-voices
npm install
npm run dev
```

Vite normally serves `http://localhost:5173`. Microphone access requires HTTPS or localhost.

```sh
npm test
npm run build
npm run preview
```

The browser saves recordings and optional approximate story pins in Dexie/IndexedDB. The core PWA shell works offline after the production app is loaded once. Leaflet and map tiles are loaded on demand and aren't bulk cached.

## Backend: local pilot setup

Start MongoDB locally, then copy `backend/.env.example` to `backend/.env` and replace the example publishing secret with a unique, cryptographically random key (32+ characters). Keep this key **private**. The server refuses to start without a valid secret or MongoDB URL. Use `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` to generate a secret locally.

From the monorepo root:

```sh
npm install
npm run build
npm run start:backend
```

By default, the Express server listens on `127.0.0.1:3000` and connects to MongoDB at `mongodb://127.0.0.1:27017`. Set `NODE_ENV=production` in `backend/.env` to serve the built frontend alongside the API. Open **http://localhost:3000** for the local pilot (localhost is a secure browser context). The Vite dev server on port 5173 does **not** proxy the API; use the same-origin production build for publishing.

For an internet deployment, configure **HTTPS at a trusted reverse proxy**, set `HOST` appropriately, restrict MongoDB to private networking, use durable protected media storage with backups and upload monitoring, rotate the curator key, and review the POPIA/privacy/consent model. **Do not expose the development server directly to the public internet.**

## Publishing flow (manual)

1. Record a story, wait for it to save, and optionally choose a coarse area pin.
2. Open **Publish a local story**, choose a story, enter the private curator access key, and explicitly consent.
3. Optionally tick a separate location-sharing choice. Only then will the app include the approximate pin.
4. Confirm the publication. The client sends one on-demand multipart HTTPS/localhost request with audio and metadata.
5. The server validates the key, metadata, consent, audio signature and 15 MiB limit. MongoDB stores the metadata, while the filesystem stores the audio outside the public static directory.
6. A per-story withdrawal credential is retained in the same browser's IndexedDB and can be used through **Withdraw server copy**. Local audio remains. If the browser storage or withdrawal credential is lost, ask the curator/operator to resolve withdrawal manually.

No automatic reconnection uploads, no background sync, no third-party analytics, no AI. The first-party API is conventional software. The shared curator key gates uploading and reading; **anyone with this key is a curator**, not an untrusted end user. This pilot is not a complete multi-user authentication system.

**Important:** Editing a local story after publishing does not alter its server copy. Withdraw before republishing. Local-only deletion is blocked for published stories until withdrawal. Once published, audio exists on the server and cannot be removed simply by clearing the local browser.

## Backend routes

| Method | Route | Access | Use |
|---|---|---|---|
| GET | `/api/health` | Public | Service health |
| POST | `/api/v1/stories` | Curator bearer key | Consent-checked multipart audio upload |
| GET | `/api/v1/stories` | Curator bearer key | Bounded metadata list |
| GET | `/api/v1/stories/:id/audio` | Curator bearer key | Audio retrieval, including byte ranges |
| DELETE | `/api/v1/stories/:id` | Per-story deletion token | Withdraw media and metadata |

There is **no public archive browse endpoint** yet. Publication here means sending to the restricted curator-held archive, not making a recording publicly available.

## Constraints and limitations

- Browser storage can be evicted. Download backup copies of important stories.
- Public OpenStreetMap tiles load only on demand; they use some mobile data and can reveal routine network metadata.
- The local save and server metadata are separate copies. File/database operations are not one distributed transaction; operators should monitor and reconcile disk failures.
- Sync retries retransmit the entire audio file; resumable chunk transport is not implemented. Idempotent replay prevents duplicate records when the same upload is repeated unchanged.
- No production account recovery, public moderation dashboard, consent audit workflows, deployment automation, CDN, AI or AI-based features are present.
- Before community deployment, perform real low-end Android testing, server security and privacy assessment, operational backups, key rotation planning, retention and deletion verification.

See `docs/phase-status.md` and `docs/architecture.md` for details.
