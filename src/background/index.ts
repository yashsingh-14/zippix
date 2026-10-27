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

// Relay messages between content script and sidepanel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_URL') {
    chrome.downloads.download({
      url: message.payload.url,
      filename: message.payload.filename || 'asset',
      saveAs: false,
    });
    sendResponse({ status: 'started' });
  }
  return true;
});
