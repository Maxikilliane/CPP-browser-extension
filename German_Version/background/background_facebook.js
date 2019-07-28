/**
 * Support different browsers with namespace definitions
 */
window.browser = (function() {
  return window.msBrowser ||
    window.browser ||
    window.chrome;
})();


const onUpdatedFilter = {
  urls: ["*://*.facebook.com/*"]
};

function handleUpdated(tabId, changeInfo, tabInfo) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      data: "urlPathChanged"
    }, function(response) {});
  });
}

window.browser.tabs.onUpdated.addListener(handleUpdated);
