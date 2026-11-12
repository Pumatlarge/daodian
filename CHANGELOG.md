# Changelog

## 0.3.0 — 2026-11-12

### Added

- **Clock in / clock out on the panel.** On a workday the card footer carries a punch button: it reads “打卡上班” until you clock in and “打卡下班” until you clock out. It stays available all day, not only around the shift edges, so no menu is needed. Clocking out opens a confirmation window with editable clock-in and clock-out times; confirming saves the day and plays a confetti celebration (plus the chime when sound is enabled). The tray and widget menus also offer punch, edit and undo. Only the current day is stored; a new day starts fresh.
- **Three ways to pay a punched day.** Settings → “Clock & pay”:
  - **Scheduled shift (default):** punches are recorded and shown, but the money follows the configured hours.
  - **Actual punches:** pay starts at the clock-in time, stops at clock-out, late arrival and early leave reduce the amount, and staying late adds overtime.
  - **Custom:** choose whether late arrival and early leave affect pay, set a 0–30 minute grace period, and decide whether time after the shift counts as overtime.
- **A separate Work statistics window.** Open “工作统计…” from the widget or tray menu. It has day / month / year views: a month calendar with earnings heat and mood emojis, a year wall of 12 mini calendars, and a day detail with a completion ring, punch times, overtime and a workday ribbon. Today updates live.
- **Mood and notes per day.** In the day view, pick one of six moods (😄 🙂 😐 😫 😴 🔥) and write a short note. It is saved in `stats.json` and the emoji appears in the month calendar.
- **English / Chinese interface.** The whole UI is translated: setup, widget, settings, statistics, confirmation dialog, tray menus, dialogs and notifications. Choose English or 中文 in the first-run setup or from the switch in the Settings header. Chinese remains the default.
- Settings → About & updates has a **GitHub project home** row with an “Open GitHub” button.

### Fixed

- The top-right tools (eye, auto-tuck, gear) and the punch button sit outside the draggable card body. The whole card is an `-webkit-app-region: drag` area, and on Windows it could swallow clicks on its `no-drag` children (seen with the neon skin); the controls are now siblings of the card with a dedicated no-drag hover zone.
- Clicking the panel's “打卡下班” button reliably opens the confirmation and records the clock-out; the button state is recomputed from the saved config after every punch.
- A punch-in after the scheduled end no longer invents overtime from the scheduled end; overtime starts at the actual punch-in. The overtime strip is hidden when there is no base work.
- Correcting an existing punch from the menu does not replay the celebration.
- The punch button label updates immediately after a language switch.

### Changed

- The config gains `clockMode`, `clockLate`, `clockEarly`, `clockOvertime`, `clockGraceMin`, `punchDate`, `punchIn` and `punchOut`; older configs default to the scheduled-shift mode.
- The daily work statistics are recorded about once a minute while the app is running and immediately when punching, so closing the app loses at most the last minute of the current day. Mood and notes survive those snapshots.
- Statistics moved out of Settings into its own window.
- README: added the clock-in, statistics, moods and language features, `stats.json`, and updated the “no attendance tracking” limitation.

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
