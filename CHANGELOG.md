# Changelog

## 0.2.5 — 2026-11-12

### Added

- Settings → About & updates now includes a **GitHub project home** row showing `github.com/Pumatlarge/daodian`, with an “Open GitHub” button that opens the repository in the default browser (source, changelog and issue tracker).

## 0.2.4 — 2026-11-12

### Changed

- Updates are no longer installed silently when the app quits. After an update finishes downloading, 到点 asks whether to install now or later. Choosing “later” never installs on its own; the update stays ready in the tray menu and in Settings → About & updates.
- Confirming an update now opens the installer window, so the installation is visible instead of happening in the background. `electron-updater` used to run the Setup with `/S` on quit.
- The ready notification, settings status text and tray item now describe the confirmation flow instead of promising an automatic install on exit.

## 0.2.3 — 2026-11-12

### Fixed

- Hovering the handle on the left edge no longer makes the card flash open and closed. The collapsed window is now physically docked as a small 32 × 64 px window at the screen edge instead of a full 360 × 190 px window slid mostly off-screen, so the cursor can never sit on an invisible part of the widget.
- Expanding now always docks the card flush against the edge it was tucked into and keeps the handle under the cursor, which removes the expand/collapse loop entirely.
- The right edge tucks again, including the inner boundary between two monitors. 0.2.2 skipped every edge that faced another display; that skip is gone because the collapsed window no longer spills onto the neighbouring display.
- The visible handle stays a compact 16 × 64 px tab that hugs the screen edge, while the extra 16 px required by the Windows minimum window width stays transparent and on-screen.

## 0.2.2 — 2026-11-12

### Fixed

- Dragging the widget to the right edge of a screen that faces another monitor no longer flips it to the opposite / left edge. The 0.2.1 “move to the outer edge” fallback was confusing and is removed; when the nearest edge is an internal boundary, auto-tuck simply stays expanded so the widget cannot hide under the neighbouring display.
- The compact 64 px handle and the strip-only hover target from 0.2.1 remain.

## 0.2.1 — 2026-11-12

### Fixed

- Edge auto-tuck no longer collapses into the inner boundary between two monitors, which could hide the window under the adjacent display and make the handle impossible to pull out.
- Only the visible 16 × 64 px handle counts as the hover target while tucked, so the transparent part of the window extending over another monitor can no longer trigger an expand/collapse loop.
- If a display has neighbors on both sides, auto-tuck stays expanded instead of hiding where it cannot be reached.
- When a tuck has to switch to the outer edge of the current display, the expanded position follows that edge so the handle can always be pulled out.
- The edge handle is now a centered 64 px handle instead of a full-height bar.

## 0.2.0 — 2026-11-12

### Added

- Automatic updates for installed (NSIS) builds via `electron-updater` and GitHub Releases: check on launch and every six hours, download in the background, install on quit, restart-and-install from Settings or the tray, progress in the tray menu, and a notification when the download is ready.
- “About & updates” settings section: current version, auto-check toggle, check-now and restart-to-install controls.
- Portable builds can check for updates and open the latest release page; they never self-update.
- `autoUpdate` setting (enabled by default).

### Changed

- Release builds now generate `latest.yml` and the installer blockmap; the project publishes through the GitHub provider.

### Notes

- The first updater-enabled release is 0.2.0; users on 0.1.x need to install it manually once.
- Updates are unsigned; a code-signing certificate is recommended for wider distribution.

## 0.1.1 — 2026-11-12

A small but important follow-up to the first release.

### Fixed

- Prevented an uncaught main-process exception from the edge auto-tuck animation when the window is closing or the display changes. Coordinates are now validated, `setPosition` is guarded, and failures are written to `tuck-error.log` instead of showing the Electron error dialog.

### Changed

- Redesigned the app and installer icon: a dark plate with a gold progress ring and a centered ¥ mark. The tray icon uses a simplified high-contrast mark for 16/32 px.
- The app icon is now generated from vector sources in `assets/icon.svg` and `assets/tray.svg`.

## 0.1.0 — 2026-11-12

The first public release.

### Added

- Real-time salary progress bar with configurable salary, pay days, work hours and lunch break.
- Overtime hourly-rate dilution: the effective rate is recalculated as daily pay ÷ total hours; an optional 1.5× overtime-pay mode is available.
- Six built-in skins: Cream Journal, Cyber Neon, Pixel Worker, Glass Jar, Retro Payslip and Cat Companion.
- Automatic day/night skins (07:00–19:00 Cream, otherwise Neon), system-theme mode and manual lock.
- Per-skin accent color, background image, corner radius and font; global font size and window opacity.
- Privacy mode that masks money amounts while keeping the progress bar.
- Edge auto-tuck with an adjustable 1–10 second delay and a glowing edge handle.
- Custom right-click menu with skins, opacity presets, auto-tuck, privacy, always-on-top, autostart and quit.
- Tray menu, global `Ctrl + Shift + H` shortcut, snap-to-edge, position memory and autostart.
- Celebration on a full bar: confetti, chime and a Windows notification.
- Local-only configuration with an automatic `config.json.bak` backup.

### Fixed

- Right-clicking the frameless card showed the Windows system menu (move / size / minimize); it now opens the app's own menu.
- A dark strip at the bottom of the card caused by the drop shadow being clipped by the transparent window; the shadow is now contained and the native window shadow is disabled.
- The Glass Jar skin now shows its percentage.

### Notes

- Windows 10 / 11, x64.
- The builds are unsigned; SmartScreen may warn on first launch.
- Public holidays are not built in yet.
