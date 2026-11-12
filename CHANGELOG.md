# Changelog

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
