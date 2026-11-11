import { localArchive } from '../lib/db.js';
import { publishLocalStory, withdrawPublishedStory } from '../lib/sync.js';

export function mountSyncPanel(root, { onChange = () => {} } = {}) {
  const storySelect = root.querySelector('[data-publish-story]');
  const keyInput = root.querySelector('[data-publish-key]');
  const consent = root.querySelector('[data-publish-consent]');
  const locationConsent = root.querySelector('[data-publish-location]');
  const upload = root.querySelector('[data-publish-upload]');
  const withdraw = root.querySelector('[data-publish-withdraw]');
  const note = root.querySelector('[data-publish-note]');
  const open = root.querySelector('[data-publish-open]');
  const content = root.querySelector('[data-publish-content]');
  let busy = false;
  let sequence = 0;
  let active = null;
  let stories = [];

  function feedback(message, error = false) {
    note.textContent = message;
    note.dataset.error = String(error);
  }

  function selected() {
    return stories.find((story) => story.id === storySelect.value);
  }

  function controls() {
    const story = selected();
    const published = story?.syncStatus === 'published' || Boolean(story?.deleteToken);
    upload.disabled = busy || !story || published;
    withdraw.disabled = busy || !story || !story.deleteToken;
    locationConsent.disabled = !story?.pin || busy;
    if (!story?.pin) locationConsent.checked = false;
  }

  async function refresh() {
    const token = ++sequence;
    try {
      const { stories: items } = await localArchive.listStories({ limit: 200 });
      if (token !== sequence) return;
      stories = items;
      const previous = storySelect.value;
      storySelect.replaceChildren();
      for (const story of items) {
        const option = document.createElement('option');
        option.value = story.id;
        option.textContent = story.title + (story.syncStatus === 'published' ? ' — published' : '');
        storySelect.append(option);
      }
      if (items.some((s) => s.id === previous)) storySelect.value = previous;
      controls();
    } catch {
      feedback('Cannot read your local stories.', true);
    }
  }

  open.addEventListener('click', () => {
    content.hidden = !content.hidden;
    open.textContent = content.hidden ? 'Open optional publishing' : 'Hide publishing';
    open.setAttribute('aria-expanded', String(!content.hidden));
    if (!content.hidden) void refresh();
  });

  storySelect.addEventListener('change', controls);
  locationConsent.addEventListener('change', controls);

  upload.addEventListener('click', async () => {
    if (busy) return;
    const story = selected();
    if (!story) return feedback('Create a local recording first.', true);
    if (!consent.checked) return feedback('Tick the publication-consent box before publishing.', true);
    if (!window.confirm('Publish this story to the shared curator archive? This sends the audio and title' +
      (locationConsent.checked ? ' and its approximate location' : '') +
      ' to the server using mobile data.')) return;
    busy = true;
    controls();
    feedback('Uploading to your configured first-party archive. Stay on this page until it finishes…');
    try {
      await publishLocalStory(story.id, {
        key: keyInput.value, consent: consent.checked, shareLocation: locationConsent.checked,
      });
      consent.checked = false;
      locationConsent.checked = false;
      feedback('Published. Your local copy remains saved. Use Withdraw to remove the server copy.');
      await refresh();
      await onChange();
    } catch (error) {
      feedback('Publish failed: ' + error.message + '. Your local audio is unchanged. Retry manually.', true);
      await refresh();
    } finally {
      busy = false;
      keyInput.value = '';
      controls();
    }
  });

  withdraw.addEventListener('click', async () => {
    if (busy) return;
    const story = selected();
    if (!story?.deleteToken) return feedback('This story has no withdrawal credential.', true);
    if (!window.confirm('Permanently remove this published story and audio from the server? Your local recording stays.')) return;
    busy = true;
    controls();
    feedback('Withdrawing the published story…');
    try {
      await withdrawPublishedStory(story.id);
      feedback('Server copy withdrawn. Your local recording remains saved.');
      await refresh();
      await onChange();
    } catch (error) {
      feedback('Withdrawal failed: ' + error.message + '. Try again while connected.', true);
    } finally {
      busy = false;
      controls();
    }
  });

  void refresh();
  return { refresh };
}
