import { localArchive } from './db.js';
import { createStoryPayload, requestAPI } from './api-client.js';

// Sync is MANUAL. No automatic online listener, service-worker upload or token persistence.
export async function publishLocalStory(id, { key, consent, shareLocation = false, signal } = {}) {
  if (!consent) throw new Error('Permission to publish must be explicitly selected.');
  if (typeof key !== 'string' || key.length < 32) throw new Error('Enter a valid archive access key.');
  if (navigator.onLine === false) throw new Error('You are offline. Your story remains saved locally.');
  const story = await localArchive.getStory(id);
  if (!story) throw new Error('This story was not found on your device.');
  if (story.syncStatus === 'published') throw new Error('This story is already published. Withdraw it before republishing.');
  if (shareLocation && !story.pin) throw new Error('Choose an approximate location before sharing it.');

  const audio = await localArchive.getRecording(id);
  if (!audio) throw new Error('The local recording could not be found.');
  const payload = createStoryPayload(story, audio, { shareLocation });
  await localArchive.updatePublication(id, { syncStatus: 'uploading' });

  try {
    const response = await requestAPI('/api/v1/stories', {
      method: 'POST', key, body: payload, signal,
    });
    await localArchive.updatePublication(id, {
      syncStatus: 'published',
      deleteToken: response.deleteToken,
      publishedAt: response.story.publishedAt,
      sharedPin: shareLocation,
      publishedTitle: story.title,
      // Allows the UI to identify that a later local edit differs from published data.
      publishedUpdatedAt: story.updatedAt,
    });
    return response.story;
  } catch (error) {
    try { await localArchive.updatePublication(id, { syncStatus: 'failed' }); } catch { /* IndexedDB may be unavailable. */ }
    throw error;
  }
}

export async function withdrawPublishedStory(id, { signal } = {}) {
  const story = await localArchive.getStory(id);
  if (!story?.deleteToken) throw new Error('No withdrawal credential exists for this story.');
  if (navigator.onLine === false) throw new Error('Connect to the network to withdraw the published copy.');
  await requestAPI('/api/v1/stories/' + encodeURIComponent(id), {
    method: 'DELETE', deleteToken: story.deleteToken, signal,
  }).catch((error) => {
    if (error.status !== 404) throw error;
  });
  await localArchive.updatePublication(id, {
    syncStatus: 'local', deleteToken: null, publishedAt: null,
    sharedPin: false, publishedTitle: null, publishedUpdatedAt: null,
  });
}
