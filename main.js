// Kidzvidz desktop app (Electron). The app opens on its own native home screen
// and streams Kidzvidz content inside the app window.

const { app, BrowserWindow, Menu, shell, nativeImage, session } = require("electron");
const path = require("path");

const CONTENT_ORIGIN = process.env.KIDZVIDZ_URL || "https://kidzvidz.uk";
const CONTENT_HOST = (() => {
  try { return new URL(CONTENT_ORIGIN).host; } catch { return "kidzvidz.uk"; }
})();
const HOME = path.join(__dirname, "renderer", "home.html");
const SIGNIN = `${CONTENT_ORIGIN}/auth/signin?callbackUrl=/`;

let mainWindow = null;

// A signed-in user has a persisted NextAuth session cookie. Cookies live in the
// default session and survive restarts, so this gates the app on each launch.
async function isSignedIn() {
  try {
    const cookies = await session.defaultSession.cookies.get({ url: CONTENT_ORIGIN });
    return cookies.some((c) => /session-token/i.test(c.name) && c.value);
  } catch {
    return false;
  }
}

// Signed in → the app's home screen; otherwise → the website's sign-in page.
async function loadStart() {
  if (!mainWindow) return;
  if (await isSignedIn()) mainWindow.loadFile(HOME);
  else mainWindow.loadURL(SIGNIN);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 820,
    minHeight: 600,
    backgroundColor: "#0b1020",
    title: "Kidzvidz",
    show: false,
    icon: path.join(__dirname, "build", process.platform === "win32" ? "icon.ico" : "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  loadStart();

  // If content can't load (offline / server down), show the local fallback.
  mainWindow.webContents.on("did-fail-load", (_e, errorCode, _desc, validatedURL, isMainFrame) => {
    if (isMainFrame && errorCode !== -3 && validatedURL.startsWith(CONTENT_ORIGIN)) {
      mainWindow.loadFile(path.join(__dirname, "renderer", "offline.html"));
    }
  });

  // Keep the app self-contained: strip in-app references that point back out of it.
  mainWindow.webContents.on("did-finish-load", () => {
    const url = mainWindow.webContents.getURL();
    if (url.includes(CONTENT_HOST)) {
      mainWindow.webContents.insertCSS('a[href="/download"],a[href$="/download"]{display:none!important}').catch(() => {});
    }
  });

  const isExternal = (url) => {
    try { return new URL(url).host !== CONTENT_HOST && !url.startsWith("file:"); } catch { return false; }
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
  const home = () => loadStart();
  const go = (p) => () => mainWindow?.loadURL(CONTENT_ORIGIN + p);

  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    { label: "File", submenu: [isMac ? { role: "close" } : { role: "quit" }] },
    { role: "editMenu" },
    {
      label: "Go",
      submenu: [
        { label: "Home", accelerator: "CmdOrCtrl+1", click: home },
        { label: "Watch", accelerator: "CmdOrCtrl+2", click: go("/") },
        { label: "Music", accelerator: "CmdOrCtrl+3", click: go("/music") },
        { label: "Favorites", accelerator: "CmdOrCtrl+4", click: go("/liked") },
        { type: "separator" },
        { label: "Back", accelerator: "CmdOrCtrl+[", click: () => mainWindow?.webContents.navigationHistory.goBack() },
        { label: "Forward", accelerator: "CmdOrCtrl+]", click: () => mainWindow?.webContents.navigationHistory.goForward() },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" }, { role: "forceReload" }, { type: "separator" },
        { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" },
        { role: "togglefullscreen" },
        ...(process.env.KIDZVIDZ_DEV ? [{ role: "toggleDevTools" }] : []),
      ],
    },
    { role: "windowMenu" },
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
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
