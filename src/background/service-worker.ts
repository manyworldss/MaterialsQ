/* MV3 service worker. Intentionally thin: it toggles the toolbar badge to signal
   "we have a verdict for this page" and opens the popup on demand. All scoring
   happens in the content script; nothing here needs network access. */

import { DEFAULT_SETTINGS } from '../lib/settings';

chrome.runtime.onInstalled.addListener(async () => {
  const cur = await chrome.storage.sync.get('miq_settings');
  if (!cur.miq_settings) await chrome.storage.sync.set({ miq_settings: DEFAULT_SETTINGS });
});

// Content scripts report their verdict here so we can show it on the toolbar icon.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === 'MIQ_VERDICT' && sender.tab?.id != null) {
    const tabId = sender.tab.id;
    const text: string = msg.verdict === 'worth' ? '✓' : msg.verdict === 'skip' ? '!' : '~';
    const color: string = msg.verdict === 'worth' ? '#34D399' : msg.verdict === 'skip' ? '#F87171' : '#8B5CF6';
    chrome.action.setBadgeText({ tabId, text });
    chrome.action.setBadgeBackgroundColor({ tabId, color });
  }
});

// Clear the badge when navigating away.
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === 'loading') chrome.action.setBadgeText({ tabId, text: '' });
});
