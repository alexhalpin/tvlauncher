console.log("script.js");

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "h") {
    console.log("homing");
    chrome.runtime.sendMessage({ command: "home" });
  }
});
