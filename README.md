# Kidzvidz Desktop

A native desktop app for **macOS** and **Windows** that wraps the live Kidzvidz
website (https://kidzvidz.uk). The website is the single source of truth, so
every feature there appears in the app automatically — plus native extras:

- Native app window, menu bar and dock/taskbar icon
- **Go** menu with shortcuts: Home (⌘1), Favorites (⌘2), Parent Area (⌘3), Account (⌘4)
- External links open in the system browser; Kidzvidz pages stay in the app
- Friendly **offline** screen when there's no connection

This is a standalone project; it is intentionally separate from the Next.js web
app and is excluded from the website's build/lint.

## Develop

```bash
cd desktop
npm install
npm start                 # opens the app pointing at https://kidzvidz.uk
KIDZVIDZ_URL=http://localhost:3000 npm start   # point at a local dev site
KIDZVIDZ_DEV=1 npm start  # also enables the DevTools menu item
```

## Build installers

```bash
cd desktop
npm install
npm run dist:mac   # → release/Kidzvidz-<ver>.dmg + .zip   (build on macOS)
npm run dist:win   # → release/Kidzvidz Setup <ver>.exe    (build on Windows)
```

> Cross-building the Windows `.exe` from macOS needs Wine; the simplest path is
> to run `npm run dist:win` on a Windows machine or in CI.

## Icons

`build/icon.icns` (macOS), `build/icon.ico` (Windows) and `build/icon.png`
(dock/fallback) are generated from the Kidzvidz logo. Replace them to rebrand.
