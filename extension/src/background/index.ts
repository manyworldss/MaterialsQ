console.log("MaterialIQ Background Script Loaded");

// We can handle background tasks here, like caching, or proxying API requests if needed to avoid CORS.
// For now, the popup will handle sending the scraped data to the backend.

chrome.runtime.onInstalled.addListener(() => {
  console.log("MaterialIQ extension installed.");
});
