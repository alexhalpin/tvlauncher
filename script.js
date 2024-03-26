console.log("script.js");

window.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "h") {
    console.log("homing");
    chrome.runtime.sendMessage({ command: "home" });
  }
});
