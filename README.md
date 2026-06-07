# Kidzvidz Desktop

The **Kidzvidz** app for **macOS** and **Windows** — bright, safe videos for
kids in a focused desktop app with its own home screen.

- Native app window, menu bar and dock/taskbar icon
- Its own welcome/home screen
- **Go** menu shortcuts: Home (⌘1), Watch (⌘2), Music (⌘3), Favorites (⌘4)
- A friendly **offline** screen when there's no connection

## Develop

```bash
npm install
npm start                 # launches the app
KIDZVIDZ_DEV=1 npm start  # also enables the DevTools menu item
```

## Build installers

```bash
npm install
npm run dist:mac   # → release/Kidzvidz-<ver>.dmg + .zip   (build on macOS)
npm run dist:win   # → release/Kidzvidz Setup <ver>.exe    (build on Windows)
```

The macOS build is ad-hoc signed automatically (`afterPack.js`) so it opens
without the "damaged" error. Cross-building the Windows `.exe` from macOS needs
Wine — the simplest path is to run `npm run dist:win` on Windows or in CI.

## Icons

`build/icon.icns` (macOS), `build/icon.ico` (Windows) and `build/icon.png`
(dock/fallback). Replace them to rebrand.
