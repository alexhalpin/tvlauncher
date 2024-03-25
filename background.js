console.log("background.js");

function spawnHomeTab() {
  chrome.tabs.query({ title: "📺" }).then((tabs) => {
    if (tabs.length == 0) {
      chrome.tabs.create({
        url: chrome.runtime.getURL("index.html"),
        pinned: true,
      });
    }
  });
}

spawnHomeTab();
chrome.tabs.onRemoved.addListener(spawnHomeTab);
