// Woblo Pro - Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('Woblo Pro extension installed successfully.');

  // Set side panel to open upon action click
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn('Could not set sidePanel behavior:', err);
    });
  }
});

// Relay messages if needed between content script and sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
