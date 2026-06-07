// Kidzvidz desktop app — a native shell (Electron) around the Kidzvidz website.
// The website is the single source of truth; every feature there shows up here.

const { app, BrowserWindow, Menu, shell, nativeImage } = require("electron");
const path = require("path");

// The live site. Override for local testing, e.g. KIDZVIDZ_URL=http://localhost:3000
const APP_URL = process.env.KIDZVIDZ_URL || "https://kidzvidz.uk";
const APP_HOST = (() => {
  try { return new URL(APP_URL).host; } catch { return "kidzvidz.uk"; }
})();

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 820,
    minHeight: 600,
    backgroundColor: "#0b1020",
    title: "Kidzvidz",
    show: false,
    autoHideMenuBar: false,
    icon: path.join(__dirname, "build", process.platform === "win32" ? "icon.ico" : "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  // Avoid a white flash — show only once the first paint is ready.
  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.loadURL(APP_URL);

  // If the site can't load (offline / server down), show the local fallback.
  mainWindow.webContents.on("did-fail-load", (_e, errorCode, _desc, validatedURL, isMainFrame) => {
    // -3 == aborted (e.g. a redirect) — ignore.
    if (isMainFrame && errorCode !== -3 && validatedURL.startsWith(APP_URL)) {
      mainWindow.loadFile(path.join(__dirname, "renderer", "offline.html"));
    }
  });

  // Open external links (anything not on the Kidzvidz host) in the system browser.
  const isExternal = (url) => {
    try { return new URL(url).host !== APP_HOST; } catch { return false; }
  };

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternal(url)) { shell.openExternal(url); return { action: "deny" }; }
    return { action: "allow" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isExternal(url)) { event.preventDefault(); shell.openExternal(url); }
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const go = (p) => () => { if (mainWindow) mainWindow.loadURL(APP_URL + p); };

  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    { role: "editMenu" },
    {
      label: "Go",
      submenu: [
        { label: "Home", accelerator: "CmdOrCtrl+1", click: go("/") },
        { label: "Favorites", accelerator: "CmdOrCtrl+2", click: go("/favorites") },
        { label: "Parent Area", accelerator: "CmdOrCtrl+3", click: go("/parent") },
        { label: "Account", accelerator: "CmdOrCtrl+4", click: go("/account") },
        { type: "separator" },
        { label: "Back", accelerator: "CmdOrCtrl+[", click: () => mainWindow?.webContents.navigationHistory.goBack() },
        { label: "Forward", accelerator: "CmdOrCtrl+]", click: () => mainWindow?.webContents.navigationHistory.goForward() },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(process.env.KIDZVIDZ_DEV ? [{ role: "toggleDevTools" }] : []),
      ],
    },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        { label: "How Kidzvidz Works", click: () => shell.openExternal(APP_URL + "/howkidzvidzworks") },
        { label: "Kidzvidz Website", click: () => shell.openExternal(APP_URL) },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  if (process.platform === "darwin") {
    const icon = nativeImage.createFromPath(path.join(__dirname, "build", "icon.png"));
    if (!icon.isEmpty()) app.dock?.setIcon(icon);
  }
  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
