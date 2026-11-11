# KasiVoices

A lightweight, offline-first digital community archive for storytellers in Olievenhoutbosch, South Africa.

## Current build: Phase 2 — saved stories and offline access

KasiVoices now records locally and automatically stores completed audio and story metadata in **IndexedDB using Dexie.js**. Saved stories can be renamed, previewed, downloaded, or deleted without connecting to any server. The production build includes a small versioned service worker that caches just the application shell, not audio or map tiles.

No AI engines, AI APIs, AI features, backend network calls, or story uploads are present.

## Run locally

Install Node.js **22.12+** and npm. Then, from the monorepo root:

```sh
git clone https://github.com/maqobajiyane-ui/kasi-voices.git
cd kasi-voices
npm install
npm run dev
```

Vite normally prints `http://localhost:5173`. Microphone capture requires a secure context (localhost or HTTPS). A phone opening an HTTP LAN IP may not get microphone permission.

For automated checks:

```sh
npm test
npm run build
```

To test offline shell caching, use the **production preview**, not the Vite dev server:

```sh
npm run build
npm run preview
```

Open the preview URL while connected, wait for the message that app files are prepared, then use browser DevTools to switch offline and reload. Native microphone recording and the saved-story library should remain accessible. For real-phone testing, serve the preview over HTTPS. Test on-device microphone permissions and storage separately; automated tests cannot fully simulate them.

## Phase 2 behavior

- After recording stops, a non-empty Blob and metadata are saved together in one Dexie transaction.
- Saving failures show a **Retry saving** action; the user can still download a temporary recording before leaving the page.
- The local story list loads lightweight metadata first and retrieves a single Blob only when opened.
- Rename, playback, download, and permanent deletion work without server access.
- The network banner uses browser online/offline events. An “online” indicator does **not** guarantee internet reachability.
- The production service worker precaches the HTML shell, icons/manifest, locally bundled JavaScript/CSS, and an offline fallback. It does not cache user audio, map tiles, or API responses.
- Browser storage is not guaranteed: the browser or user may clear it. An optional persistent-storage permission button is offered when supported. **Download backups of important stories.**
- The existing three-minute limit and 15 MiB in-memory collection limit remain.

## Privacy

Recordings and metadata are **never uploaded** in this phase. Saved stories are private to the current browser profile and origin. Clearing site data, uninstalling the browser/PWA, device storage pressure, or switching devices can remove local data. Do not assume that browser storage is backed up. Avoid recording people without their informed consent.

## Project structure

- `frontend/`: Vite, Vanilla JS, Tailwind, Dexie, native MediaRecorder and offline service worker.
- `backend/`: untouched placeholders for Phase 4.
- `docs/`: architecture decisions and phase status.

## Roadmap

- [x] Phase 0 — Architecture and monorepo
- [x] Phase 1 — Local HTML5 audio recorder
- [x] Phase 2 — IndexedDB storage, local archive, offline detection and app-shell caching
- [ ] Phase 3 — Leaflet map and hyper-local story pinning
- [ ] Phase 4 — Express, MongoDB and explicitly authorized sync

KasiVoices uses conventional software only: **no AI**.
