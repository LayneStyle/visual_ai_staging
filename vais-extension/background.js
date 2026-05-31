chrome.action.onClicked.addListener((tab) => {
  if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
    return;
  }
  chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_PANEL" }).catch((err) => {
    console.warn("Could not send TOGGLE_PANEL message to active tab:", err);
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_PROXY") {
    const { url, method, headers, bodyArrayBuffer, bodyText } = request;
    
    const fetchOptions = {
      method: method || 'GET',
      headers: headers || {}
    };

    if (bodyArrayBuffer) {
      fetchOptions.body = bodyArrayBuffer;
    } else if (bodyText) {
      fetchOptions.body = bodyText;
    }

    // Set 1 second abort timeout for scanning to prevent hanging requests
    const controller = new AbortController();
    const isScan = url.includes('/api/session-info');
    const timeoutId = setTimeout(() => controller.abort(), isScan ? 1000 : 5000);
    fetchOptions.signal = controller.signal;

    fetch(url, fetchOptions)
      .then(response => {
        clearTimeout(timeoutId);
        return response.text().then(text => {
          sendResponse({
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            text: text
          });
        });
      })
      .catch(error => {
        clearTimeout(timeoutId);
        sendResponse({
          ok: false,
          error: error.message
        });
      });
      
    return true; // Keep message channel open for async response
  }
});
