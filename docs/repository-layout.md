# Complete Phase 0 repository file layout

All JavaScript modules are nonfunctional placeholders at Phase 0. Future-phase file names reserve boundaries only; neither implementations nor dependencies are installed.

```text
kasi-voices/
├── .editorconfig
├── .gitignore
├── .nvmrc
├── package.json
├── docs/architecture.md
├── docs/repository-layout.md
├── docs/privacy-and-consent.md
├── docs/phase-status.md
├── frontend/package.json
├── frontend/index.html
├── frontend/vite.config.js
├── frontend/postcss.config.js
├── frontend/tailwind.config.js
├── frontend/public/manifest.webmanifest
├── frontend/public/favicon.svg
├── frontend/public/icons/README.md
├── frontend/public/offline.html
├── frontend/public/map-assets/README.md
├── frontend/src/main.js
├── frontend/src/styles/main.css
├── frontend/src/styles/tailwind.css
├── frontend/src/components/audio-recorder.js
├── frontend/src/components/story-card.js
├── frontend/src/components/connectivity-banner.js
├── frontend/src/components/map-view.js
├── frontend/src/pages/home.js
├── frontend/src/pages/record.js
├── frontend/src/pages/archive.js
├── frontend/src/pages/map.js
├── frontend/src/lib/db.js
├── frontend/src/lib/offline.js
├── frontend/src/lib/audio.js
├── frontend/src/lib/geolocation.js
├── frontend/src/lib/sync.js
├── frontend/src/lib/api-client.js
├── frontend/src/lib/story-validation.js
├── frontend/src/sw.js
├── frontend/tests/README.md
├── backend/package.json
├── backend/.env.example
├── backend/src/server.js
├── backend/src/app.js
├── backend/src/config/env.js
├── backend/src/config/db.js
├── backend/src/routes/health.routes.js
├── backend/src/routes/stories.routes.js
├── backend/src/routes/media.routes.js
├── backend/src/controllers/stories.controller.js
├── backend/src/controllers/media.controller.js
├── backend/src/models/story.model.js
├── backend/src/middleware/error-handler.js
├── backend/src/middleware/upload-limits.js
├── backend/src/services/story.service.js
├── backend/src/services/media-storage.service.js
├── backend/src/utils/validators.js
├── backend/tests/README.md
├── backend/storage/README.md
└── README.md
```

## Responsibilities
- `frontend/src/components/audio-recorder.js` and `frontend/src/lib/audio.js`: Phase 1 browser media capture.
- `frontend/src/lib/db.js`, `offline.js`, `src/sw.js`: Phase 2 Dexie draft storage, connectivity and service-worker caching.
- `frontend/src/components/map-view.js`, `lib/geolocation.js`, `pages/map.js`: Phase 3 Leaflet maps and careful location handling.
- `frontend/src/lib/api-client.js`, `sync.js` and `backend/src/**`: Phase 4 conventional HTTP sync and MongoDB integration.
- `frontend/public/map-assets/`: static lightweight map styles/attribution if needed later; do not bundle large tile datasets.
- `backend/storage/`: local-development media storage only; never commit recordings.
