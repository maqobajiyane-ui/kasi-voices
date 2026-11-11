// Connection events are advisory: navigator.onLine cannot prove the internet works.
export function connectionStatus(isOnline) {
  return isOnline
    ? { label: 'Network detected', detail: 'Your stories stay on this device. Uploads require an explicit Publish action.' }
    : { label: 'Offline mode', detail: 'Record and open saved stories without mobile data.' };
}

export function mountConnectivityBanner(root) {
  if (!root) return () => {};

  const title = root.querySelector('[data-connection-label]');
  const detail = root.querySelector('[data-connection-detail]');

  function update() {
    const online = navigator.onLine !== false;
    const status = connectionStatus(online);
    root.dataset.connection = online ? 'online' : 'offline';
    title.textContent = status.label;
    detail.textContent = status.detail;
  }

  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  window.addEventListener('pageshow', update);
  update();

  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
    window.removeEventListener('pageshow', update);
  };
}

export async function registerOfflineShell() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    return { ok: false, message: 'Offline app caching is not supported in this browser or context.' };
  }

  // Vite's dev module graph changes constantly and must never be precached.
  if (import.meta.env.DEV) {
    return { ok: false, message: 'Offline shell caching is available in the production preview.' };
  }

  try {
    const base = import.meta.env.BASE_URL;
    await navigator.serviceWorker.register(base + 'sw.js', { scope: base });
    await navigator.serviceWorker.ready;
    return { ok: true, message: 'Offline app files are prepared for the next visit.' };
  } catch {
    return { ok: false, message: 'App caching was unavailable. Local story storage still works.' };
  }
}

export async function storageEstimate() {
  if (!navigator.storage?.estimate) return null;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    return {
      usedBytes: Number.isFinite(usage) ? usage : 0,
      quotaBytes: Number.isFinite(quota) ? quota : 0,
      persisted: navigator.storage.persisted ? await navigator.storage.persisted() : false,
    };
  } catch {
    return null;
  }
}

export async function requestStorageProtection() {
  if (!navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
