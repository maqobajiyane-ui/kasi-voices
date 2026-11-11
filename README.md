# KasiVoices

KasiVoices is a lightweight, offline-first digital community archive for local storytellers in Olievenhoutbosch, South Africa. **No AI engines, AI APIs, AI features or AI models.**

## Current stage: Phase 3

The mobile-first Vite + Vanilla JS + Tailwind PWA includes:
- Native HTML5 audio recording with time and memory safeguards (Phase 1).
- Dexie.js/IndexedDB saved recordings, playback, rename, download, delete, network indication, and a production offline shell (Phase 2).
- On-demand Leaflet/OpenStreetMap viewing and privacy-preserving approximate pins for existing local stories (Phase 3).

**Nothing is uploaded.** Story audio and approximate map pins remain in the browser's local IndexedDB. No Express or MongoDB functionality is active.

## Run locally

Prerequisites: Node.js 22.12+ and npm.

```sh
git clone https://github.com/maqobajiyane-ui/kasi-voices.git
cd kasi-voices
npm install
npm run dev
```

Vite prints a local URL, normally `http://localhost:5173`. Microphone permission requires HTTPS or localhost; connecting to the dev server from a phone over a non-secure LAN IP can prevent recording.

To test the build and offline shell:

```sh
npm test
npm run build
npm run preview
```

Load the production preview online once and wait for the offline app status. Then disconnect and reload. The recorder, local archive and **text-based pinning area chooser** remain available. Map tiles are network-dependent: we never pre-cache tiles or bulk-download from public OpenStreetMap servers.

## Using the Phase 3 map

1. Create a recording and let it finish saving in the local archive.
2. Open **Story locations** and tap **Open local story map**.
3. Select a story. Tap an approximate location on the map while online, or use the broad area dropdown even while offline.
4. Choose **Save approximate pin**. The location is snapped to roughly a 500 m grid before it is stored in IndexedDB.
5. The pinned-story list stays usable without tile access. You can select a story, move its pin, or remove the pin without deleting the audio.

No GPS is requested. Map tile requests to the public OpenStreetMap tile server reveal normal network metadata such as IP address to that service; **the user's stored story pins and recordings are never sent**. Map tile requests can incur mobile data usage.

## Offline and privacy limitations

- The map is loaded only on demand to keep initial bundle size small.
- To conserve data, the offline service worker caches only the core app shell, not the deferred Leaflet bundle or OSM map tiles.
- The nine broad directional area choices work offline. The interactive Leaflet map requires network access unless the browser happens to have its code and map tiles cached independently; this is not guaranteed.
- Approximate pins are for community storytelling only, not navigation or exact addresses.
- Existing recordings survive the IndexedDB v1 to v2 schema upgrade. Browser storage can still be cleared or evicted; always download backups of important audio.
- The app has no backend and no upload behavior in this phase.

## Monorepo

- `frontend/`: Vite/Vanilla JS/Tailwind, Dexie, audio recorder, Leaflet map, and offline shell.
- `backend/`: reserved placeholders for Phase 4.
- `docs/`: architecture, data/privacy and phase status.

## Roadmap

- [x] Phase 0 — Architecture / monorepo
- [x] Phase 1 — HTML5 recorder
- [x] Phase 2 — IndexedDB / offline caching
- [x] Phase 3 — Leaflet map / local approximate pinning
- [ ] Phase 4 — Express / MongoDB / user-controlled sync
