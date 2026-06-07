// Minimal, secure preload. Context isolation is on and Node is off in the page,
// so we only expose a tiny, read-only bridge the website can optionally use.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("kidzvidz", {
  isDesktop: true,
  platform: process.platform,
});
