// DevLens Chrome Developer Tools Registrar
'use strict';

// Creates a dedicated "DevLens" panel directly inside Chrome DevTools (F12)
chrome.devtools.panels.create(
  "DevLens",
  "../icons/icon16.png",
  "devtools/panel.html",
  function(panel) {
    console.log("[DevLens] Developer Tools panel registered successfully.");
  }
);
