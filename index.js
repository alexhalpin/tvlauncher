console.log("index.js");

refresh();
chrome.tabs.onUpdated.addListener(refresh);
chrome.tabs.onRemoved.addListener(refresh);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "home")
    refresh().then((homeTab) => focusTab(homeTab.id)); // #eh is neccessary for this to work
});

createShortcuts();

export async function refresh() {
  return resetHomeTab()
    .then(getTabs)
    .then((tabs) => renderWidgets(tabs))
    .then(resetHomeTab); // #eh
}

async function getTabs(homeTab) {
  return chrome.tabs.query({ currentWindow: true }).then((tabs) =>
    tabs.flatMap((tab) => {
      return tab.id == homeTab.id ? [] : [tab];
    })
  );
}

function renderWidgets(tabs) {
  let widgets = [];
  for (const tab of tabs) {
    let widgetDiv = createWidget(tab);
    widgets.push(widgetDiv);
  }

  widgets = widgets.slice().sort((a, b) => {
    return b.tab.lastAccessed - a.tab.lastAccessed;
  });

  let widgetContainerDiv = clearWidgets();
  for (const widget of widgets) {
    widgetContainerDiv.appendChild(widget);
  }
}

function clearWidgets() {
  let widgetContainerDiv = document.querySelector("#widgetContainer");
  while (widgetContainerDiv.firstChild) {
    widgetContainerDiv.firstChild.remove();
  }
  return widgetContainerDiv;
}

function createWidget(tab) {
  let widgetDiv = document.createElement("div");
  widgetDiv.classList.add("widget");
  widgetDiv.tab = tab;

  widgetDiv.focusTab = () => {
    focusTab(widgetDiv.tab.id);
  };

  widgetDiv.closeTab = () => {
    chrome.tabs.remove(widgetDiv.tab.id);
  };

  widgetDiv.onclick = widgetDiv.focusTab;

  let widgetImage = document.createElement("img");
  widgetImage.classList.add("widgetImage");
  widgetImage.src = tab.favIconUrl ? tab.favIconUrl : "globe.png";

  widgetDiv.appendChild(widgetImage);

  widgetDiv.addEventListener("mouseenter", (e) => {
    e.target.hover = true;
  });
  widgetDiv.addEventListener("mouseleave", (e) => {
    e.target.hover = false;
  });

  const closeListener = (e) => {
    if (widgetDiv.hover && e.key == "Backspace") {
      widgetDiv.closeTab();
      document.removeEventListener("keydown", closeListener);
    }
  };

  document.addEventListener("keydown", closeListener);

  let widgetTitle = document.createElement("div");
  widgetTitle.classList.add("widgetTitle");
  widgetTitle.innerText = tab.title;

  widgetDiv.appendChild(widgetTitle);

  return widgetDiv;
}

export async function focusTab(tabid) {
  return chrome.tabs.update(tabid, {
    active: true,
  });
}

async function resetHomeTab() {
  return chrome.tabs.query({ title: "📺" }).then((tabs) => {
    if (tabs.length == 0) {
      return spawnHomeTab();
    }

    let homeTab = tabs[0];
    if (tabs.length > 1) {
      return chrome.tabs
        .remove(tabs.slice(1).map((tab) => tab.id))
        .then(() => {
          pinTab(homeTab.id);
        })
        .then(() => homeTab);
    }
    // there is one home tab
    return pinTab(homeTab.id).then(() => homeTab);
  });
}

function delay(ms) {
  return function (x) {
    return new Promise((resolve) => setTimeout(() => resolve(x), ms));
  };
}

async function spawnHomeTab() {
  return chrome.tabs.create({
    url: chrome.runtime.getURL("index.html"),
    pinned: true,
  });
}

async function pinTab(tabid) {
  return chrome.tabs.update(tabid, {
    pinned: true,
  });
}

async function createShortcuts() {
  var shortcutContainer = document.querySelector("#shortcutContainer");
  const createShortcut = (shortcutConfig) => {
    var shortcutDiv = document.createElement("div");
    shortcutDiv.classList.add("shortcut", "widget");
    shortcutDiv.id = shortcutConfig.id;
    shortcutDiv.name = shortcutConfig.name;

    var shortcutIcon = document.createElement("img");
    shortcutIcon.classList.add("shortcutIcon");
    shortcutIcon.src = shortcutConfig.iconUrl;

    shortcutDiv.onclick = () => {
      chrome.tabs.create({
        url: shortcutConfig.linkUrl,
        active: true,
      });
    };

    shortcutDiv.appendChild(shortcutIcon);
    shortcutContainer.appendChild(shortcutDiv);
  };

  return fetch(chrome.runtime.getURL("shortcuts.json"))
    .then((resp) => resp.json())
    .then((data) => {
      for (const shortcutConfig of data.shortcuts) {
        createShortcut(shortcutConfig);
      }
    });
}
