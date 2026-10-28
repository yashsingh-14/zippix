// Zippix - Background Service Worker (Manifest V3)

function setupSidePanel() {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
}

chrome.runtime.onInstalled.addListener(() => {
  setupSidePanel();
});

chrome.runtime.onStartup.addListener(() => {
  setupSidePanel();
});

// Fallback click listener to guarantee sidepanel opens on icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab?.id && chrome.sidePanel && chrome.sidePanel.open) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  }
});

// Relay messages between content script and sidepanel + CORS-free Resource Fetcher
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_URL') {
    chrome.downloads.download({
      url: message.payload.url,
      filename: message.payload.filename || 'asset',
      saveAs: false,
    });
    sendResponse({ status: 'started' });
    return true;
  }

  // Background fetcher that bypasses CSP and CORS restrictions
  if (message.type === 'FETCH_RESOURCE') {
    fetch(message.url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (message.asDataUrl) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => sendResponse({ status: 'ok', data: reader.result });
          reader.onerror = () => sendResponse({ status: 'error', error: 'read error' });
          reader.readAsDataURL(blob);
        } else {
          const text = await res.text();
          sendResponse({ status: 'ok', data: text });
        }
      })
      .catch((err) => {
        sendResponse({ status: 'error', error: err?.message || 'Fetch failed' });
      });
    return true; // Keep message channel open for async response
  }

  return true;
});
