# Changelog

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
