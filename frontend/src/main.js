import './styles/tailwind.css';
import './styles/main.css';
import { mountAudioRecorder } from './components/audio-recorder.js';
import { mountStoryLibrary } from './components/story-card.js';
import { mountConnection } from './components/connectivity-banner.js';
import { mountMapPage } from './pages/map.js';
import { mountSyncPanel } from './components/sync-panel.js';
import { registerOfflineShell } from './lib/offline.js';

// Phase 4: publishing is explicit and only to first-party routes; no automatic uploads.
const library = mountStoryLibrary(document.querySelector('#story-library'));
const publishing = mountSyncPanel(document.querySelector('#story-publishing'), { onChange: () => library.refresh() });
const map = mountMapPage(document.querySelector('#story-map'), {
  onChange: () => library.refresh(),
});
mountAudioRecorder(document.querySelector('#audio-recorder'), {
  onSaved: async () => {
    await library.refresh();
    await map.refresh();
    await publishing.refresh();
  },
});
mountConnection(document.querySelector('#connectivity-banner'));

const cacheNote = document.querySelector('[data-offline-shell-status]');
void registerOfflineShell().then(({ message }) => {
  cacheNote.textContent = message;
});
