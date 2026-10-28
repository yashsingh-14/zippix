import { ElementInspector } from './inspector';
import { scanPageDesignTokens } from './extractor';
import {
  downloadPageAsZip,
  downloadPageAsHtml,
  generateClonedPackage,
} from './wobloCloner';
import { cloneFullPageHtml } from './cloner';
import type { ExtensionMessage, InspectedElement } from '../types';

let inspector: ElementInspector | null = null;

function getInspector(): ElementInspector {
  if (!inspector) {
    inspector = new ElementInspector((selected: InspectedElement) => {
      // Send selected element details to extension runtime / sidepanel
      chrome.runtime.sendMessage<ExtensionMessage>({
        type: 'ELEMENT_SELECTED',
        payload: selected,
      });
      // Inform inspector stopped
      chrome.runtime.sendMessage<ExtensionMessage>({
        type: 'INSPECTOR_STATE_UPDATE',
        payload: { isInspecting: false },
      });
    });
  }
  return inspector;
}

// Listen for messages from SidePanel or Background worker
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'START_INSPECT': {
      getInspector().start();
      sendResponse({ status: 'ok', inspecting: true });
      break;
    }

    case 'STOP_INSPECT': {
      getInspector().stop();
      sendResponse({ status: 'ok', inspecting: false });
      break;
    }

    case 'SCAN_PAGE':
    case 'GET_PAGE_DATA': {
      try {
        const tokens = scanPageDesignTokens();
        sendResponse({ status: 'ok', tokens });
      } catch (err: any) {
        sendResponse({ status: 'error', error: err?.message || 'Failed to scan page' });
      }
      break;
    }

    case 'GET_LIVE_CLONE': {
      generateClonedPackage()
        .then(({ html, css, siteName }) => {
          sendResponse({ status: 'ok', html, css, siteName });
        })
        .catch((err: any) => {
          sendResponse({ status: 'error', error: err?.message || 'Failed to clone page' });
        });
      return true;
    }

    case 'DOWNLOAD_PAGE_ZIP': {
      downloadPageAsZip()
        .then(() => {
          sendResponse({ status: 'ok' });
        })
        .catch((err: any) => {
          console.error('Zippix ZIP download error:', err);
          sendResponse({ status: 'error', error: err?.message || 'Failed to download ZIP' });
        });
      return true;
    }

    case 'DOWNLOAD_PAGE_HTML': {
      downloadPageAsHtml()
        .then(() => {
          sendResponse({ status: 'ok' });
        })
        .catch((err: any) => {
          console.error('Zippix HTML download error:', err);
          sendResponse({ status: 'error', error: err?.message || 'Failed to download HTML' });
        });
      return true;
    }

    default:
      break;
  }
  return true; // Keep channel open for async response
});

// Auto-scan once DOM is ready so data is instantly available
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  // ready
} else {
  window.addEventListener('DOMContentLoaded', () => {
    // ready
  });
}
