'use strict';

const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  nativeTheme,
  globalShortcut,
  screen,
  dialog,
  shell,
  Notification
} = require('electron');
const path = require('path');
const fs = require('fs');
const store = require('./store');
const { effectiveTheme } = require('./theme');
const THEMES = require('../shared/themes');

app.setName('到点');
if (process.env.DAODIAN_USER_DATA) {
  app.setPath('userData', process.env.DAODIAN_USER_DATA);
}
app.setAppUserModelId('com.daodian.widget');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const WIDGET_WIDTH = 360;
const WIDGET_HEIGHT = 190;
const EDGE_MARGIN = 24;
const SNAP_DISTANCE = 20;
const TUCK_VISIBLE = 16;
const TUCK_DURATION = 200;

let cfg = null;
let win = null;
let setupWin = null;
let settingsWin = null;
let tray = null;
let quitting = false;
let lastSummary = '';
let boundsTimer = null;
let themeTimer = null;
let lastThemeKey = '';
let tuckTimer = null;
let tuckAnim = null;
let tuckPaused = false;
let suppressBoundsUntil = 0;
let lastMenuShown = 0;
const tuck = {
  collapsed: false,
  side: 'right',
  expanded: null,
  lastInside: Date.now(),
  moving: false
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function logTuckError(kind, data) {
  try {
    const line =
      new Date().toISOString() + ' ' + kind + ' ' + JSON.stringify(data || {}) + '\n';
    fs.appendFileSync(path.join(app.getPath('userData'), 'tuck-error.log'), line);
  } catch (_) {
    /* logging must never break the app */
  }
}

function safeSetPosition(x, y, where) {
  if (!win || win.isDestroyed()) return false;
  const nx = Number(x);
  const ny = Number(y);
  if (!Number.isFinite(nx) || !Number.isFinite(ny)) {
    logTuckError('invalid-position', { where: where || 'unknown', x, y });
    return false;
  }
  try {
    win.setPosition(Math.round(nx), Math.round(ny));
    return true;
  } catch (error) {
    logTuckError('set-position-failed', {
      where: where || 'unknown',
      x: nx,
      y: ny,
      error: String(error && error.message ? error.message : error)
    });
    return false;
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!cfg || !cfg.onboarded) {
      showSetup();
      return;
    }
    showWidget(true);
  });
}

function asset(name) {
  return path.join(__dirname, '..', 'assets', name);
}

function preload() {
  return path.join(__dirname, 'preload.js');
}

function allWindows() {
  return BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed());
}

function sendToAll(channel, payload) {
  for (const w of allWindows()) {
    try {
      w.webContents.send(channel, payload);
    } catch (e) {
      /* window is going away */
    }
  }
}

function broadcastConfig(exceptWebContents) {
  for (const w of allWindows()) {
    if (exceptWebContents && w.webContents === exceptWebContents) continue;
    try {
      w.webContents.send('config:changed', cfg);
    } catch (e) {
      /* ignore */
    }
  }
}

function currentTheme() {
  return effectiveTheme(cfg);
}

function broadcastTheme(force) {
  const eff = currentTheme();
  const key = eff.id + '|' + eff.source;
  if (!force && key === lastThemeKey) return;
  lastThemeKey = key;
  sendToAll('theme:effective', eff);
  refreshMenus();
}

function refreshMenus() {
  if (tray) tray.setContextMenu(buildMenu('tray'));
}

function opacitySubmenu() {
  const values = [100, 95, 90, 85, 80, 70, 60, 50];
  const current = Math.round((cfg.opacity || 1) * 100);
  return values.map((percent) => ({
    label: percent + '%',
    type: 'radio',
    checked: current === percent,
    click: () => saveConfig({ opacity: percent / 100 })
  }));
}

function themeSubmenu() {
  const eff = currentTheme();
  return [
    {
      label: '恢复自动切换',
      enabled: !!cfg.themeOverride || cfg.themeMode !== 'time',
      click: () => restoreAutoTheme()
    },
    { type: 'separator' },
    ...THEMES.map((theme) => ({
      label: theme.name,
      type: 'radio',
      checked: eff.id === theme.id,
      click: () => applyTheme(theme.id)
    }))
  ];
}

function buildMenu(kind) {
  const visible = win && !win.isDestroyed() && win.isVisible();
  return Menu.buildFromTemplate([
    {
      label: visible ? '隐藏小组件' : '显示小组件',
      click: () => toggleWidget()
    },
    { label: '打开设置…', click: () => openSettings() },
    { type: 'separator' },
    { label: '皮肤', submenu: themeSubmenu() },
    { label: '透明度', submenu: opacitySubmenu() },
    {
      label: '边缘自动收纳',
      type: 'checkbox',
      checked: !!cfg.autoTuck,
      click: () => saveConfig({ autoTuck: !cfg.autoTuck })
    },
    {
      label: '现在收纳到边缘',
      visible: !!cfg.autoTuck,
      enabled: !!(win && win.isVisible() && !tuck.collapsed),
      click: () => tuckCollapse(true)
    },
    {
      label: '隐私模式',
      type: 'checkbox',
      checked: !!cfg.privacy,
      click: () => saveConfig({ privacy: !cfg.privacy })
    },
    { type: 'separator' },
    {
      label: '窗口置顶',
      type: 'checkbox',
      checked: !!cfg.alwaysOnTop,
      click: () => saveConfig({ alwaysOnTop: !cfg.alwaysOnTop })
    },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: !!cfg.autostart,
      click: () => saveConfig({ autostart: !cfg.autostart })
    },
    { type: 'separator' },
    { label: '退出到点', click: () => quitApp() }
  ]);
}

function createTray() {
  let icon = nativeImage.createFromPath(asset('tray.png'));
  if (icon.isEmpty()) {
    icon = nativeImage.createFromPath(asset('icon.png'));
  }
  tray = new Tray(icon);
  tray.setToolTip('到点 · 今日已赚');
  tray.on('click', () => toggleWidget());
  refreshMenus();
}

function isOnScreen(bounds) {
  return screen.getAllDisplays().some((display) => {
    const wa = display.workArea;
    return (
      bounds.x < wa.x + wa.width - 60 &&
      bounds.x + bounds.width > wa.x + 60 &&
      bounds.y < wa.y + wa.height - 40 &&
      bounds.y + bounds.height > wa.y + 20
    );
  });
}

function defaultPosition() {
  const wa = screen.getPrimaryDisplay().workArea;
  return {
    x: wa.x + wa.width - WIDGET_WIDTH - EDGE_MARGIN,
    y: wa.y + wa.height - WIDGET_HEIGHT - EDGE_MARGIN
  };
}

function createWidget() {
  const saved = cfg.bounds && isOnScreen({ ...cfg.bounds, width: WIDGET_WIDTH, height: WIDGET_HEIGHT })
    ? cfg.bounds
    : defaultPosition();

  tuck.expanded = { x: saved.x, y: saved.y };
  tuck.lastInside = Date.now();

  win = new BrowserWindow({
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    x: saved.x,
    y: saved.y,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: !!cfg.alwaysOnTop,
    hasShadow: false,
    show: false,
    title: '到点',
    icon: asset('icon.png'),
    webPreferences: {
      preload: preload(),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  win.setMenu(null);
  win.setAlwaysOnTop(!!cfg.alwaysOnTop, 'floating');
  win.setOpacity(cfg.opacity);
  if (typeof win.setHasShadow === 'function') win.setHasShadow(false);
  win.loadFile(path.join(__dirname, '..', 'src', 'index.html'));

  win.once('ready-to-show', () => {
    if (cfg.onboarded) {
      win.showInactive();
      broadcastTheme();
    }
  });

  win.on('show', () => refreshMenus());
  win.on('hide', () => refreshMenus());

  win.on('close', (event) => {
    if (!quitting) {
      event.preventDefault();
      win.hide();
    }
  });

  win.on('system-context-menu', (event) => {
    event.preventDefault();
    showWidgetMenu(win);
  });

  win.webContents.on('did-finish-load', () => {
    sendTuckState();
  });

  win.on('moved', () => {
    if (boundsTimer) clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => {
      if (!win || win.isDestroyed()) return;
      if (tuck.collapsed || tuck.moving || Date.now() < suppressBoundsUntil) return;
      const b = win.getBounds();
      const display = screen.getDisplayMatching(b);
      const wa = display.workArea;
      let nx = b.x;
      let ny = b.y;
      if (Math.abs(b.x - wa.x) < SNAP_DISTANCE) nx = wa.x;
      else if (Math.abs(b.x + b.width - (wa.x + wa.width)) < SNAP_DISTANCE) {
        nx = wa.x + wa.width - b.width;
      }
      if (Math.abs(b.y - wa.y) < SNAP_DISTANCE) ny = wa.y;
      else if (Math.abs(b.y + b.height - (wa.y + wa.height)) < SNAP_DISTANCE) {
        ny = wa.y + wa.height - b.height;
      }
      if (nx !== b.x || ny !== b.y) safeSetPosition(nx, ny, 'snap');
      cfg = store.save({ bounds: { x: nx, y: ny } });
      tuck.expanded = { x: nx, y: ny };
      tuck.lastInside = Date.now();
    }, 220);
  });

  win.webContents.on('render-process-gone', (event, details) => {
    console.error('widget renderer gone', details);
  });

  if (process.argv.includes('--dev')) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

function showWidget(focus) {
  if (!win || win.isDestroyed()) return;
  if (cfg && !cfg.onboarded) {
    showSetup();
    return;
  }
  if (tuck.collapsed) {
    tuck.collapsed = false;
    tuck.lastInside = Date.now();
    if (tuck.expanded) safeSetPosition(tuck.expanded.x, tuck.expanded.y, 'show-widget');
    sendTuckState();
  }
  win.show();
  tuck.lastInside = Date.now();
  if (focus) win.focus();
  broadcastTheme();
}

function toggleWidget() {
  if (!win || win.isDestroyed()) return;
  if (win.isVisible()) win.hide();
  else showWidget(false);
}

function sendTuckState() {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('tuck:changed', {
    collapsed: !!tuck.collapsed,
    side: tuck.side
  });
}

function animateWindow(target, done) {
  const finish = (ok) => {
    if (done) done(ok);
  };
  if (!win || win.isDestroyed()) {
    finish(false);
    return;
  }

  const targetX = Number(target && target.x);
  const targetY = Number(target && target.y);
  if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) {
    logTuckError('invalid-target', { target });
    finish(false);
    return;
  }

  let from;
  try {
    from = win.getBounds();
  } catch (error) {
    logTuckError('get-bounds-failed', { error: String(error) });
    finish(false);
    return;
  }
  const fromX = Number(from && from.x);
  const fromY = Number(from && from.y);
  if (!Number.isFinite(fromX) || !Number.isFinite(fromY)) {
    logTuckError('invalid-from', { from });
    finish(false);
    return;
  }

  if (tuckAnim) clearInterval(tuckAnim);
  const started = Date.now();
  suppressBoundsUntil = started + TUCK_DURATION + 320;
  tuck.moving = true;
  tuckAnim = setInterval(() => {
    if (!win || win.isDestroyed()) {
      clearInterval(tuckAnim);
      tuckAnim = null;
      tuck.moving = false;
      finish(false);
      return;
    }
    const t = Math.min(1, (Date.now() - started) / TUCK_DURATION);
    const eased = 1 - Math.pow(1 - t, 3);
    const x = Math.round(fromX + (targetX - fromX) * eased);
    const y = Math.round(fromY + (targetY - fromY) * eased);
    if (!safeSetPosition(x, y, 'animate')) {
      clearInterval(tuckAnim);
      tuckAnim = null;
      tuck.moving = false;
      finish(false);
      return;
    }
    if (t >= 1) {
      clearInterval(tuckAnim);
      tuckAnim = null;
      tuck.moving = false;
      suppressBoundsUntil = Date.now() + 150;
      finish(true);
    }
  }, 16);
}

function tuckCollapse(force) {
  if (!cfg || !cfg.autoTuck || !win || win.isDestroyed() || !win.isVisible()) return;
  if (tuck.collapsed || tuck.moving) return;
  if (!force && tuckPaused) return;

  let b;
  let wa;
  try {
    b = win.getBounds();
    wa = screen.getDisplayMatching(b).workArea;
  } catch (error) {
    logTuckError('collapse-bounds-failed', { error: String(error) });
    return;
  }

  const center = b.x + b.width / 2;
  const side = center < wa.x + wa.width / 2 ? 'left' : 'right';
  const y = clamp(b.y, wa.y, wa.y + wa.height - b.height);
  const x =
    side === 'right'
      ? wa.x + wa.width - TUCK_VISIBLE
      : wa.x - b.width + TUCK_VISIBLE;

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    logTuckError('invalid-collapse-target', { x, y, b, wa });
    return;
  }

  tuck.expanded = { x: b.x, y: b.y };
  tuck.side = side;
  tuck.collapsed = true;
  sendTuckState();
  refreshMenus();
  animateWindow({ x, y }, (ok) => {
    if (ok) return;
    tuck.collapsed = false;
    sendTuckState();
    refreshMenus();
    if (tuck.expanded) {
      safeSetPosition(tuck.expanded.x, tuck.expanded.y, 'collapse-fallback');
    }
  });
}

function tuckExpand() {
  if (!win || win.isDestroyed() || !tuck.collapsed) return;
  const fallback = defaultPosition();
  let base = fallback;
  if (
    tuck.expanded &&
    Number.isFinite(Number(tuck.expanded.x)) &&
    Number.isFinite(Number(tuck.expanded.y))
  ) {
    base = tuck.expanded;
  } else if (tuck.expanded) {
    logTuckError('invalid-expanded-bounds', { expanded: tuck.expanded });
  }

  let wa;
  try {
    wa = screen.getDisplayMatching({
      x: Number(base.x),
      y: Number(base.y),
      width: WIDGET_WIDTH,
      height: WIDGET_HEIGHT
    }).workArea;
  } catch (error) {
    logTuckError('expand-bounds-failed', { error: String(error) });
    return;
  }

  const target = {
    x: clamp(Number(base.x), wa.x, wa.x + wa.width - WIDGET_WIDTH),
    y: clamp(Number(base.y), wa.y, wa.y + wa.height - WIDGET_HEIGHT)
  };
  if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) {
    logTuckError('invalid-expand-target', { target, base, wa });
    return;
  }

  tuck.collapsed = false;
  tuck.lastInside = Date.now();
  sendTuckState();
  refreshMenus();
  animateWindow(target, (ok) => {
    if (ok) return;
    tuck.collapsed = true;
    sendTuckState();
    refreshMenus();
  });
}

function tuckTick() {
  if (!cfg || !cfg.autoTuck) return;
  if (!win || win.isDestroyed() || !win.isVisible()) return;
  if (tuckPaused || tuck.moving || !win.isVisible()) return;

  const point = screen.getCursorScreenPoint();
  const b = win.getBounds();
  const inside =
    point.x >= b.x &&
    point.x < b.x + b.width &&
    point.y >= b.y &&
    point.y < b.y + b.height;

  if (inside) {
    tuck.lastInside = Date.now();
    if (tuck.collapsed) tuckExpand();
    return;
  }

  const delay = Math.max(1, Number(cfg.tuckDelay) || 3) * 1000;
  if (!tuck.collapsed && Date.now() - (tuck.lastInside || 0) > delay) {
    tuckCollapse(false);
  }
}

function showWidgetMenu(source) {
  const now = Date.now();
  if (now - lastMenuShown < 280) return;
  lastMenuShown = now;
  tuckPaused = true;
  const menu = buildMenu('widget');
  menu.popup({
    window: source && !source.isDestroyed() ? source : win,
    callback: () => {
      tuckPaused = false;
      tuck.lastInside = Date.now();
    }
  });
}

function applyWindowFlags(patch) {
  if (!win || win.isDestroyed()) return;
  if (patch && Object.prototype.hasOwnProperty.call(patch, 'opacity')) {
    win.setOpacity(cfg.opacity);
  }
  if (patch && Object.prototype.hasOwnProperty.call(patch, 'alwaysOnTop')) {
    win.setAlwaysOnTop(!!cfg.alwaysOnTop, 'floating');
  }
}

function applyAutostart(enabled) {
  try {
    if (app.isPackaged) {
      app.setLoginItemSettings({ openAtLogin: !!enabled });
    } else {
      app.setLoginItemSettings({
        openAtLogin: !!enabled,
        path: process.execPath,
        args: [app.getAppPath()]
      });
    }
  } catch (e) {
    console.error('autostart failed', e);
  }
}

function saveConfig(patch, exceptWebContents) {
  const wasOnboarded = cfg.onboarded;
  cfg = store.save(patch);
  applyWindowFlags(patch);
  if (patch && Object.prototype.hasOwnProperty.call(patch, 'autostart')) {
    applyAutostart(cfg.autostart);
  }
  if (patch && Object.prototype.hasOwnProperty.call(patch, 'autoTuck')) {
    if (cfg.autoTuck) {
      tuck.lastInside = Date.now();
    } else if (tuck.collapsed) {
      tuckExpand();
    }
    sendTuckState();
  }
  broadcastConfig(exceptWebContents);
  broadcastTheme();
  refreshMenus();
  if (!wasOnboarded && cfg.onboarded) {
    closeSetup();
    showWidget(false);
  }
  return cfg;
}

function applyTheme(id) {
  const exists = THEMES.some((t) => t.id === id);
  if (!exists) return currentTheme();
  cfg = store.save({ manualTheme: id, themeOverride: true });
  broadcastConfig();
  broadcastTheme();
  refreshMenus();
  return currentTheme();
}

function restoreAutoTheme() {
  const patch = { themeOverride: false };
  if (cfg.themeMode === 'manual') patch.themeMode = 'time';
  cfg = store.save(patch);
  broadcastConfig();
  broadcastTheme();
  refreshMenus();
  return currentTheme();
}

function openSettings() {
  if (!cfg.onboarded) {
    showSetup();
    return;
  }
  if (settingsWin && !settingsWin.isDestroyed()) {
    if (settingsWin.isMinimized()) settingsWin.restore();
    settingsWin.show();
    settingsWin.focus();
    return;
  }
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  settingsWin = new BrowserWindow({
    width: Math.min(800, Math.max(620, workArea.width - 60)),
    height: Math.min(780, Math.max(560, workArea.height - 80)),
    minWidth: 620,
    minHeight: 520,
    title: '到点 · 设置',
    icon: asset('icon.png'),
    backgroundColor: '#f3ede2',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: preload(),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });
  settingsWin.setMenu(null);
  settingsWin.loadFile(path.join(__dirname, '..', 'src', 'settings.html'));
  settingsWin.once('ready-to-show', () => {
    settingsWin.show();
    settingsWin.focus();
  });
  settingsWin.on('closed', () => {
    settingsWin = null;
  });
}

function showSetup() {
  if (setupWin && !setupWin.isDestroyed()) {
    setupWin.show();
    setupWin.focus();
    return;
  }
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  setupWin = new BrowserWindow({
    width: Math.min(720, Math.max(600, workArea.width - 60)),
    height: Math.min(800, Math.max(560, workArea.height - 60)),
    minWidth: 600,
    minHeight: 520,
    title: '到点 · 第一次设置',
    icon: asset('icon.png'),
    backgroundColor: '#f3ede2',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: preload(),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });
  setupWin.setMenu(null);
  setupWin.loadFile(path.join(__dirname, '..', 'src', 'setup.html'));
  setupWin.once('ready-to-show', () => {
    setupWin.show();
    setupWin.focus();
  });
  setupWin.on('closed', () => {
    setupWin = null;
  });
}

function closeSetup() {
  if (setupWin && !setupWin.isDestroyed()) setupWin.close();
  setupWin = null;
}

function closeWindowOf(sender) {
  const target = BrowserWindow.fromWebContents(sender);
  if (target && !target.isDestroyed()) target.close();
}

function togglePrivacy() {
  saveConfig({ privacy: !cfg.privacy });
}

function imageData(filePath) {
  try {
    const assetsDir = path.resolve(app.getPath('userData'), 'assets');
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(assetsDir + path.sep) && resolved !== assetsDir) return null;
    const stat = fs.statSync(resolved);
    if (!stat.isFile() || stat.size > 16 * 1024 * 1024) return null;
    const ext = path.extname(resolved).slice(1).toLowerCase();
    const mime =
      ext === 'png'
        ? 'image/png'
        : ext === 'webp'
          ? 'image/webp'
          : ext === 'gif'
            ? 'image/gif'
            : ext === 'bmp'
              ? 'image/bmp'
              : 'image/jpeg';
    return 'data:' + mime + ';base64,' + fs.readFileSync(resolved).toString('base64');
  } catch (e) {
    return null;
  }
}

function quitApp() {
  quitting = true;
  app.quit();
}

function registerIpc() {
  ipcMain.handle('config:get', () => cfg);

  ipcMain.handle('config:save', (event, patch) => {
    const safe = patch && typeof patch === 'object' ? patch : {};
    return saveConfig(safe, event.sender);
  });

  ipcMain.handle('theme:get', () => currentTheme());
  ipcMain.handle('theme:apply', (event, id) => applyTheme(id));
  ipcMain.handle('theme:auto', () => restoreAutoTheme());
  ipcMain.handle('tuck:get', () => ({
    collapsed: !!tuck.collapsed,
    side: tuck.side
  }));

  ipcMain.handle('settings:open', () => {
    openSettings();
    return true;
  });

  ipcMain.handle('setup:finish', (event, patch) => {
    const safe = patch && typeof patch === 'object' ? patch : {};
    cfg = store.save({ ...safe, onboarded: true });
    broadcastConfig();
    broadcastTheme();
    refreshMenus();
    closeSetup();
    showWidget(false);
    return cfg;
  });

  ipcMain.on('window:close', (event) => closeWindowOf(event.sender));

  ipcMain.handle('context:menu', (event) => {
    const source = BrowserWindow.fromWebContents(event.sender);
    showWidgetMenu(source);
    return true;
  });

  ipcMain.handle('dialog:image', async (event) => {
    const parent = BrowserWindow.fromWebContents(event.sender) || undefined;
    const result = await dialog.showOpenDialog(parent, {
      title: '选择背景图片',
      properties: ['openFile'],
      filters: [
        { name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }
      ]
    });
    if (result.canceled || !result.filePaths.length) return null;
    const src = result.filePaths[0];
    try {
      const stat = fs.statSync(src);
      if (stat.size > 16 * 1024 * 1024) {
        return { error: '图片超过 16MB，换一张小一点的吧' };
      }
      const ext = path.extname(src).toLowerCase() || '.png';
      const dir = path.join(app.getPath('userData'), 'assets');
      fs.mkdirSync(dir, { recursive: true });
      const dest = path.join(dir, 'bg-' + Date.now() + ext);
      fs.copyFileSync(src, dest);
      const dataUrl = imageData(dest);
      if (!dataUrl) return { error: '这张图片读不出来' };
      return { path: dest, dataUrl };
    } catch (e) {
      return { error: '复制图片失败：' + e.message };
    }
  });

  ipcMain.handle('image:data', (event, filePath) => imageData(filePath));

  ipcMain.handle('notify', (event, payload) => {
    if (!Notification.isSupported()) return false;
    const title = String(payload && payload.title ? payload.title : '到点');
    const body = String(payload && payload.body ? payload.body : '');
    try {
      new Notification({
        title,
        body,
        icon: asset('icon.png'),
        silent: true
      }).show();
      return true;
    } catch (e) {
      return false;
    }
  });

  ipcMain.on('summary:update', (event, text) => {
    lastSummary = typeof text === 'string' ? text : '';
    if (tray) tray.setToolTip(lastSummary || '到点');
  });

  ipcMain.handle('window:toggle', () => {
    toggleWidget();
    return win ? win.isVisible() : false;
  });

  ipcMain.handle('window:hide', () => {
    if (win) win.hide();
    return true;
  });

  ipcMain.handle('window:opacity', (event, value) => {
    const v = Math.max(0.4, Math.min(1, Number(value) || 1));
    cfg = store.save({ opacity: v });
    if (win && !win.isDestroyed()) win.setOpacity(v);
    return v;
  });

  ipcMain.handle('data:open', () => {
    shell.openPath(app.getPath('userData'));
    return true;
  });

  ipcMain.handle('app:quit', () => {
    quitApp();
    return true;
  });

  ipcMain.handle('privacy:toggle', () => {
    togglePrivacy();
    return cfg.privacy;
  });
}

function tickTheme() {
  broadcastTheme();
}

app.whenReady().then(() => {
  cfg = store.init();

  registerIpc();
  createWidget();
  createTray();

  globalShortcut.register('CommandOrControl+Shift+H', () => toggleWidget());

  if (!cfg.onboarded) showSetup();

  themeTimer = setInterval(tickTheme, 20000);
  tuckTimer = setInterval(tuckTick, 400);

  nativeTheme.on('updated', () => {
    if (cfg.themeMode === 'system' && !cfg.themeOverride) {
      broadcastTheme();
      refreshMenus();
    }
  });

  screen.on('display-metrics-changed', () => {
    if (tuck.collapsed || tuck.moving) return;
    if (win && !win.isDestroyed() && !win.isVisible()) return;
    if (win && !win.isDestroyed() && !isOnScreen(win.getBounds())) {
      const pos = defaultPosition();
      safeSetPosition(pos.x, pos.y, 'display-change');
      cfg = store.save({ bounds: pos });
    }
  });

  app.on('activate', () => {
    if (!cfg.onboarded) showSetup();
    else showWidget(false);
  });
});

app.on('before-quit', () => {
  quitting = true;
});

app.on('will-quit', () => {
  if (themeTimer) clearInterval(themeTimer);
  if (tuckTimer) clearInterval(tuckTimer);
  if (tuckAnim) clearInterval(tuckAnim);
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  /* stay in tray */
});
