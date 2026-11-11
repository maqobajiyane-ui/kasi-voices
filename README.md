# KasiVoices

A lightweight community storytelling archive for Olievenhoutbosch, South Africa.

## Current build: Phase 1 browser-only audio recorder

The first functional slice supports microphone permission on user action, audio recording, elapsed time, stop, local playback, download, and discard. It uses **Vite + Vanilla JS + Tailwind CSS**, with no runtime CDN dependencies and no framework.

## Get started

Prerequisite: **Node.js 22.12+** and npm.

```sh
git clone https://github.com/maqobajiyane-ui/kasi-voices.git
cd kasi-voices
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

Run checks:

```sh
npm test
npm run build
```

Microphone capture requires a **secure browser context** (localhost or HTTPS). Opening a Vite development URL from a different phone over ordinary HTTP may not permit microphone access; use HTTPS when testing on a phone. The browser chooses the available recording format. On mobile, downloading may use the device's Share/Save flow.

### What Phase 1 does and does not do

- **Does:** browser-native recording, three-minute maximum, 15 MiB collected audio cap, instant local playback and optional file download.
- **Does not:** automatically persist drafts. If you close/reload the tab or discard the clip without downloading, it is lost.
- **Does not:** use APIs to upload data, a backend server, service worker, Dexie, Leaflet or AI. Browser-native `getUserMedia` and `MediaRecorder` are used solely for device-local capture.

## Monorepo layout

- `frontend/`: browser UI and recorder implementation.
- `backend/`: reserved for Phase 4 (nonfunctional placeholders).
- `docs/`: architecture, consent, repository layout and phase tracking.

## Planned next phases

- [x] Phase 0 — System architecture and folder layout
- [x] Phase 1 — Local HTML5 audio recorder
- [ ] Phase 2 — IndexedDB storage and offline detection/caching
- [ ] Phase 3 — Interactive Leaflet map
- [ ] Phase 4 — Express, MongoDB and optional sync

The product will not use AI engines, models, AI APIs or AI features.
