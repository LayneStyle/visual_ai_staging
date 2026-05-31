chrome.action.onClicked.addListener((tab) => {
  if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
    return;
  }
  chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_PANEL" }).catch((err) => {
    console.warn("Could not send TOGGLE_PANEL message to active tab:", err);
  });
});
