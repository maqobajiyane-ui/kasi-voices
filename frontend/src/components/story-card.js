import { formatDuration } from '../lib/audio.js';
import { localArchive } from '../lib/db.js';
import { formatApproximatePin, isStoredPin } from '../lib/geolocation.js';
import { storageEstimate, requestStorageProtection } from '../lib/offline.js';

const PAGE_SIZE = 12;

function readableBytes(bytes) {
  if (bytes < 1024 * 1024) return Math.ceil(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function mountStoryLibrary(root) {
  if (!root) throw new Error('Story library root is missing.');

  const list = root.querySelector('[data-story-list]');
  const empty = root.querySelector('[data-story-empty]');
  const status = root.querySelector('[data-story-status]');
  const more = root.querySelector('[data-show-more]');
  const preview = root.querySelector('[data-library-preview]');
  const audio = root.querySelector('[data-library-audio]');
  const download = root.querySelector('[data-library-download]');
  const previewTitle = root.querySelector('[data-library-title]');
  const closeButton = root.querySelector('[data-library-close]');
  const quota = root.querySelector('[data-storage-usage]');
  const protect = root.querySelector('[data-storage-protect]');

  let visibleCount = PAGE_SIZE;
  let activeObjectUrl = null;
  let activeStoryId = null;
  let loadToken = 0;
  let renderToken = 0;

  function setStatus(message, error = false) {
    status.textContent = message;
    status.dataset.error = String(error);
  }

  function closePreview() {
    ++loadToken;
    activeStoryId = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    download.removeAttribute('href');
    download.removeAttribute('download');
    preview.hidden = true;
    if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }

  async function openStory(story) {
    const token = ++loadToken;
    closePreview();
    // closePreview increments the token, so use the new current token.
    const currentToken = loadToken;
    setStatus('Opening recording from local storage…');
    try {
      const blob = await localArchive.getRecording(story.id);
      if (currentToken !== loadToken) return;
      if (!blob) {
        setStatus('The audio file could not be found on this device.', true);
        return;
      }
      const url = URL.createObjectURL(blob);
      activeObjectUrl = url;
      activeStoryId = story.id;
      audio.src = url;
      download.href = url;
      download.download = story.filename;
      previewTitle.textContent = story.title;
      preview.hidden = false;
      setStatus('Audio opened locally. No mobile data was used.');
      preview.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch {
      if (token <= loadToken) setStatus('Could not open this audio file.', true);
    }
  }

  function actionButton(label, handler, danger = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.className = danger
      ? 'min-h-11 rounded-xl border border-[#e1bfb5] px-3 py-2 text-sm font-semibold text-[#9f3d28]'
      : 'min-h-11 rounded-xl border border-[#bdd0c2] px-3 py-2 text-sm font-semibold text-[#315d46]';
    button.addEventListener('click', handler);
    return button;
  }

  function storyElement(story) {
    const li = document.createElement('li');
    li.className = 'rounded-2xl border border-[#e1e7df] bg-[#f9fbf7] p-4';

    const title = document.createElement('h3');
    title.className = 'break-words font-extrabold text-[#173d31]';
    title.textContent = story.title;

    const details = document.createElement('p');
    details.className = 'mt-1 text-xs leading-6 text-[#668070]';
    details.textContent = [
      new Date(story.createdAt).toLocaleDateString(),
      formatDuration(story.durationMs),
      readableBytes(story.bytes),
      story.syncStatus === 'published' ? 'Published copy exists' : story.syncStatus === 'uploading' ? 'Uploading' : story.syncStatus === 'failed' ? 'Upload failed: retry manually' : 'Local only',
      isStoredPin(story.pin) ? formatApproximatePin(story.pin) : 'Not pinned',
    ].join(' · ');

    const actions = document.createElement('div');
    actions.className = 'mt-3 flex flex-wrap gap-2';

    actions.append(
      actionButton('Listen / download', () => void openStory(story)),
      actionButton('Rename', async () => {
        const text = window.prompt('Name this story (up to 80 characters):', story.title);
        if (text === null) return;
        try {
          await localArchive.renameStory(story.id, text);
          await refresh();
        } catch {
          setStatus('A story needs a title. Please try again.', true);
        }
      }),
      actionButton('Delete', async () => {
        if (story.syncStatus === 'published' || story.syncStatus === 'uploading' || story.deleteToken) {
          setStatus('Withdraw the published copy in the Publish section before deleting the local recording.', true);
          return;
        }
        if (!window.confirm('Permanently delete this recording from this device? Download it first if you need a copy.')) return;
        try {
          if (activeStoryId === story.id) closePreview();
          await localArchive.removeStory(story.id);
          setStatus('Recording permanently deleted from this browser.');
          await refresh();
        } catch {
          setStatus('Could not delete this recording. If it was published, withdraw the remote copy first.', true);
        }
      }, true),
    );
    li.append(title, details, actions);
    return li;
  }

  async function updateStorageStatus() {
    const estimate = await storageEstimate();
    if (!estimate) {
      quota.textContent = 'Storage estimate unavailable. Keep a downloaded backup of important stories.';
      protect.hidden = true;
      return;
    }
    quota.textContent = 'Browser storage: about ' +
      readableBytes(estimate.usedBytes) + ' used' +
      (estimate.quotaBytes ? ' of ' + readableBytes(estimate.quotaBytes) + ' available' : '') +
      '. Browser storage can be cleared by your device.';
    protect.hidden = estimate.persisted || !navigator.storage?.persist;
  }

  async function refresh() {
    const run = ++renderToken;
    try {
      const { stories, count } = await localArchive.listStories({ limit: visibleCount });
      if (run !== renderToken) return;
      list.replaceChildren(...stories.map(storyElement));
      empty.hidden = count > 0;
      more.hidden = count <= stories.length;
      await updateStorageStatus();
    } catch {
      if (run !== renderToken) return;
      list.replaceChildren();
      more.hidden = true;
      empty.hidden = true;
      setStatus('This browser could not access local recordings. Check storage permissions or available space.', true);
    }
  }

  more.addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    void refresh();
  });
  closeButton.addEventListener('click', closePreview);
  protect.addEventListener('click', async () => {
    const granted = await requestStorageProtection();
    setStatus(granted
      ? 'Your browser granted persistent storage. Downloaded backups are still recommended.'
      : 'Your browser did not grant persistent storage. Download important stories as backups.');
    await updateStorageStatus();
  });

  void refresh();
  window.addEventListener('pagehide', closePreview, { once: true });
  return { refresh, closePreview };
}
