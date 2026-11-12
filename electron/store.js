'use strict';

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const THEMES = require('../shared/themes');
const { parseTime, clamp, mondayOf, isoDate, addDays } = require('../shared/calc');

const THEME_IDS = THEMES.map((t) => t.id);
const PATTERNS = ['five_two', 'big_small', 'six_one'];
const THEME_MODES = ['time', 'system', 'manual'];
const FONTS = ['system', 'serif', 'mono'];

const DEFAULTS = {
  version: 1,
  language: 'zh',
  onboarded: false,
  salary: 8000,
  payDays: 21.75,
  workStart: '09:00',
  workEnd: '18:30',
  lunchStart: '12:00',
  lunchMinutes: 90,
  workPattern: 'five_two',
  bigSmallAnchor: null,
  overtimeMode: 'dilute',
  clockMode: 'schedule',
  clockLate: true,
  clockEarly: true,
  clockOvertime: true,
  clockGraceMin: 0,
  punchDate: null,
  punchIn: null,
  punchOut: null,

  themeMode: 'time',
  dayTheme: 'cream',
  nightTheme: 'neon',
  dayStart: '07:00',
  dayEnd: '19:00',
  manualTheme: 'cream',
  themeOverride: false,
  themeVars: {},

  opacity: 1,
  alwaysOnTop: true,
  autostart: false,
  autoTuck: false,
  tuckDelay: 3,
  autoUpdate: true,
  fontSize: 1,
  privacy: false,
  showTarget: true,
  showPercent: true,
  showRemaining: true,
  showHourly: true,
  showOvertime: true,
  notify: true,
  sound: true,

  bounds: null,
  lastCelebrated: null,
  lastNotified: null
};

let configPath = null;
let cfg = null;

function pickTheme(value, fallback) {
  return THEME_IDS.includes(value) ? value : fallback;
}

function pickTime(value, fallback) {
  return parseTime(value) == null ? fallback : value;
}

function sanitizeThemeVars(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, vars] of Object.entries(raw)) {
    if (!THEME_IDS.includes(id) || !vars || typeof vars !== 'object') continue;
    const next = {};
    if (typeof vars.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(vars.accent)) {
      next.accent = vars.accent.toLowerCase();
    }
    if (vars.radius != null && Number.isFinite(Number(vars.radius))) {
      next.radius = clamp(Math.round(Number(vars.radius)), 0, 30);
    }
    if (FONTS.includes(vars.font)) next.font = vars.font;
    if (typeof vars.bgImagePath === 'string' && vars.bgImagePath.trim()) {
      next.bgImagePath = vars.bgImagePath;
    }
    out[id] = next;
  }
  return out;
}

function sanitizeBounds(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const x = Number(raw.x);
  const y = Number(raw.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: Math.round(x), y: Math.round(y) };
}

function normalize(raw) {
  const merged = { ...DEFAULTS, ...(raw || {}) };
  const out = {
    ...merged,
    language: merged.language === 'en' ? 'en' : 'zh',
    salary: clamp(Number(merged.salary) || 0, 0, 100000000),
    payDays: clamp(Number(merged.payDays) || 21.75, 0.01, 31),
    lunchMinutes: clamp(Math.round(Number(merged.lunchMinutes) || 0), 0, 480),
    workStart: pickTime(merged.workStart, DEFAULTS.workStart),
    workEnd: pickTime(merged.workEnd, DEFAULTS.workEnd),
    lunchStart: pickTime(merged.lunchStart, DEFAULTS.lunchStart),
    workPattern: PATTERNS.includes(merged.workPattern) ? merged.workPattern : DEFAULTS.workPattern,
    overtimeMode: merged.overtimeMode === 'pay' ? 'pay' : 'dilute',
    clockMode:
      merged.clockMode === 'punch' || merged.clockMode === 'custom'
        ? merged.clockMode
        : 'schedule',
    clockLate: merged.clockLate !== false,
    clockEarly: merged.clockEarly !== false,
    clockOvertime: merged.clockOvertime !== false,
    clockGraceMin: clamp(Math.round(Number(merged.clockGraceMin) || 0), 0, 60),
    punchDate:
      typeof merged.punchDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(merged.punchDate)
        ? merged.punchDate
        : null,
    punchIn:
      merged.punchIn != null && Number.isFinite(Number(merged.punchIn))
        ? clamp(Math.round(Number(merged.punchIn)), 0, 1439)
        : null,
    punchOut:
      merged.punchOut != null && Number.isFinite(Number(merged.punchOut))
        ? clamp(Math.round(Number(merged.punchOut)), 0, 1439)
        : null,
    themeMode: THEME_MODES.includes(merged.themeMode) ? merged.themeMode : 'time',
    dayTheme: pickTheme(merged.dayTheme, DEFAULTS.dayTheme),
    nightTheme: pickTheme(merged.nightTheme, DEFAULTS.nightTheme),
    manualTheme: pickTheme(merged.manualTheme, DEFAULTS.manualTheme),
    dayStart: pickTime(merged.dayStart, DEFAULTS.dayStart),
    dayEnd: pickTime(merged.dayEnd, DEFAULTS.dayEnd),
    opacity: clamp(Number(merged.opacity) || 1, 0.5, 1),
    fontSize: clamp(Number(merged.fontSize) || 1, 0.85, 1.15),
    themeVars: sanitizeThemeVars(merged.themeVars),
    bounds: sanitizeBounds(merged.bounds),
    onboarded: !!merged.onboarded,
    themeOverride: !!merged.themeOverride,
    alwaysOnTop: merged.alwaysOnTop !== false,
    autostart: !!merged.autostart,
    autoTuck: !!merged.autoTuck,
    tuckDelay: clamp(Number(merged.tuckDelay) || 3, 1, 10),
    autoUpdate: merged.autoUpdate !== false,
    privacy: !!merged.privacy,
    showTarget: merged.showTarget !== false,
    showPercent: merged.showPercent !== false,
    showRemaining: merged.showRemaining !== false,
    showHourly: merged.showHourly !== false,
    showOvertime: merged.showOvertime !== false,
    notify: merged.notify !== false,
    sound: merged.sound !== false,
    bigSmallAnchor:
      typeof merged.bigSmallAnchor === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(merged.bigSmallAnchor)
        ? merged.bigSmallAnchor
        : null,
    lastCelebrated: typeof merged.lastCelebrated === 'string' ? merged.lastCelebrated : null,
    lastNotified: typeof merged.lastNotified === 'string' ? merged.lastNotified : null
  };
  delete out.__proto__;
  return out;
}

function readConfigFile(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  } catch (e) {
    return null;
  }
}

function write() {
  const dir = app.getPath('userData');
  fs.mkdirSync(dir, { recursive: true });
  try {
    const current = fs.readFileSync(configPath, 'utf8');
    JSON.parse(current.replace(/^\uFEFF/, ''));
    fs.writeFileSync(configPath + '.bak', current, 'utf8');
  } catch (e) {
    /* no valid previous config to back up */
  }
  const tmp = configPath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), 'utf8');
  try {
    fs.renameSync(tmp, configPath);
  } catch (e) {
    fs.copyFileSync(tmp, configPath);
    try {
      fs.unlinkSync(tmp);
    } catch (_) {}
  }
}

function init() {
  configPath = path.join(app.getPath('userData'), 'config.json');
  let raw = readConfigFile(configPath);
  if (!raw) raw = readConfigFile(configPath + '.bak');
  if (!raw || typeof raw !== 'object') raw = {};
  cfg = normalize(raw);
  if (!cfg.onboarded && !cfg.bigSmallAnchor) {
    cfg.bigSmallAnchor = isoDate(addDays(mondayOf(new Date()), 7));
  }
  write();
  return cfg;
}

function get() {
  return cfg;
}

function save(patch) {
  const next = { ...cfg, ...(patch || {}) };
  if (patch && Object.prototype.hasOwnProperty.call(patch, 'themeVars')) {
    next.themeVars = patch.themeVars;
  }
  cfg = normalize(next);
  write();
  return cfg;
}

module.exports = {
  DEFAULTS,
  init,
  get,
  save,
  get path() {
    return configPath;
  }
};
