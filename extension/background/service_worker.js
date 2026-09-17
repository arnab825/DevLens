// DevLens Background Service Worker (Manifest V3)
'use strict';

const MAX_STORED_EVENTS = 100;

// Production & Development Auto-Updater Lifecycle
// 1. Chrome Web Store & Self-Hosted Production Updates
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log(`[DevLens] Production update available: v${details.version}. Applying update...`);
  // Automatically restarts the extension with the fresh production bundle
  chrome.runtime.reload();
});

// Periodic production update check (every few hours in prod, or on startup)
// Periodic production update check (every few hours in prod, or on startup)
function checkProductionUpdates() {
  if (chrome.runtime.requestUpdateCheck) {
    chrome.runtime.requestUpdateCheck((status, details) => {
      if (status === 'update_available') {
        console.log('[DevLens] New production version found:', details.version);
        chrome.runtime.reload();
      }
    });
  }

  // 2. Auto-check GitHub for new releases
  fetch('https://raw.githubusercontent.com/arnab825/DevLens/main/extension/manifest.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(remoteManifest => {
      const currentVer = chrome.runtime.getManifest().version;
      if (remoteManifest && remoteManifest.version && remoteManifest.version !== currentVer) {
        console.log(`[DevLens] New version on GitHub: v${remoteManifest.version} (current: v${currentVer})`);
        chrome.storage.local.set({
          update_available: {
            current: currentVer,
            latest: remoteManifest.version
          }
        });
      }
    })
    .catch(() => {});
}

// 3. Local Developer Hot-Reload (via local analysis backend)
function checkForDevUpdates() {
  fetch('http://127.0.0.1:8000/api/health', { method: 'GET', cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      chrome.storage.local.get(['backend_version'], (res) => {
        if (data.version && res.backend_version && data.version !== res.backend_version) {
          console.log('[DevLens] Developer push detected:', data.version, '- Hot reloading...');
          chrome.storage.local.set({ backend_version: data.version }, () => {
            chrome.runtime.reload();
          });
        } else if (data.version && !res.backend_version) {
          chrome.storage.local.set({ backend_version: data.version });
        }
      });
    })
    .catch(() => {});
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ errors: [], network: [], page_profiles: {} });
  console.log('[DevLens] Service worker initialized.');
  checkProductionUpdates();
  checkForDevUpdates();
});

// Watcher intervals: checks for developer pushes and production updates
setInterval(checkForDevUpdates, 10000);
setInterval(checkProductionUpdates, 60 * 60 * 1000); // hourly in production

// Update Badge counter specifically for the currently active tab
function updateBadgeForCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].url) {
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    try {
      const activeUrl = new URL(tabs[0].url);
      const activeHost = activeUrl.hostname;

      chrome.storage.local.get(['errors'], (res) => {
        const errors = res.errors || [];
        // Filter errors to this tab/host
        const tabErrors = errors.filter(e => {
          try {
            return new URL(e.url).hostname === activeHost;
          } catch (_) {
            return false;
          }
        });

        const count = tabErrors.length;
        if (count > 0) {
          chrome.action.setBadgeText({ text: String(count > 99 ? '99+' : count) });
          chrome.action.setBadgeBackgroundColor({ color: '#EF4444' }); // Red
        } else {
          chrome.action.setBadgeText({ text: '' });
        }
      });
    } catch (_) {
      chrome.action.setBadgeText({ text: '' });
    }
  });
}

// Listen for tab switches or updates to adjust badge
chrome.tabs.onActivated.addListener(() => updateBadgeForCurrentTab());
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') updateBadgeForCurrentTab();
});

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'DEV_LENS_ERROR') {
    chrome.storage.local.get(['errors'], (res) => {
      const errors = res.errors || [];
      const newError = {
        id: Date.now() + Math.random().toString(36).substring(2, 5),
        timestamp: request.timestamp,
        url: request.url,
        origin: request.origin,
        ...request.data
      };
      
      const existing = errors.find(e => e.message === newError.message && e.url === newError.url);
      if (existing) {
        existing.count = (existing.count || 1) + 1;
        existing.lastSeen = request.timestamp;
      } else {
        newError.count = 1;
        errors.unshift(newError);
      }

      if (errors.length > MAX_STORED_EVENTS) errors.pop();

      chrome.storage.local.set({ errors }, () => {
        updateBadgeForCurrentTab();
      });
    });
    sendResponse({ status: 'recorded' });
  }

  else if (request.type === 'DEV_LENS_NETWORK') {
    chrome.storage.local.get(['network'], (res) => {
      const network = res.network || [];
      const newNet = {
        id: Date.now() + Math.random().toString(36).substring(2, 5),
        timestamp: request.timestamp,
        page_url: request.url,
        origin: request.origin,
        ...request.data
      };
      network.unshift(newNet);
      if (network.length > MAX_STORED_EVENTS) network.pop();

      chrome.storage.local.set({ network });
    });
    sendResponse({ status: 'recorded' });
  }

  else if (request.type === 'DEV_LENS_PAGE_PROFILE') {
    chrome.storage.local.get(['page_profiles'], (res) => {
      const profiles = res.page_profiles || {};
      const host = request.data.hostname || 'unknown';
      profiles[host] = {
        ...request.data,
        updated_at: request.timestamp
      };
      chrome.storage.local.set({ page_profiles: profiles });
    });
    sendResponse({ status: 'profile_saved' });
  }

  else if (request.type === 'DEV_LENS_CLEAR') {
    chrome.storage.local.set({ errors: [], network: [] }, () => {
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ status: 'cleared' });
    });
    return true;
  }
});
