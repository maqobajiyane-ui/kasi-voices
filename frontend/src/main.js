import './styles/tailwind.css';
import './styles/main.css';
import { mountAudioRecorder } from './components/audio-recorder.js';
import { mountStoryLibrary } from './components/story-card.js';
import { mountConnection } from './components/connectivity-banner.js';
import { registerOfflineShell } from './lib/offline.js';

// Phase 2: local-first Dexie drafts and bounded production app-shell caching.
// No map tiles, backend calls, uploads or AI.
const library = mountStoryLibrary(document.querySelector('#story-library'));
mountAudioRecorder(document.querySelector('#audio-recorder'), { onSaved: () => library.refresh() });
mountConnection(document.querySelector('#connectivity-banner'));

const cacheNote = document.querySelector('[data-offline-shell-status]');
void registerOfflineShell().then(({ message }) => {
  cacheNote.textContent = message;
});
