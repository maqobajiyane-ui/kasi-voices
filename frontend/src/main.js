import './styles/tailwind.css';
import './styles/main.css';
import { mountAudioRecorder } from './components/audio-recorder.js';

// Phase 1: browser-only recording; no SW registration, Dexie, maps, or API calls.
mountAudioRecorder(document.querySelector('#audio-recorder'));
