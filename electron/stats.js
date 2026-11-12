'use strict';

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// One record per day, kept in a separate file so the config stays small.
// The renderer sends a snapshot about once a minute; this module only writes
// when something actually changed.
const MAX_DAYS = 900;
const SAVE_DELAY = 900;
const MOODS = ['happy', 'calm', 'meh', 'tired', 'sleepy', 'fired'];

let filePath = null;
let days = {};
let saveTimer = null;

function nonNegative(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function round2(value) {
  return Math.round(nonNegative(value) * 100) / 100;
}

function cleanMinute(value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(1439, Math.max(0, Math.round(n)));
}

function sanitize(record) {
  return {
    date: record.date,
    workday: record.workday !== false,
    earned: round2(record.earned),
    target: round2(record.target),
    workedSec: Math.round(nonNegative(record.workedSec)),
    overtimeSec: Math.round(nonNegative(record.overtimeSec)),
    punchIn: cleanMinute(record.punchIn),
    punchOut: cleanMinute(record.punchOut)
  };
}

function init() {
  filePath = path.join(app.getPath('userData'), 'stats.json');
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
    if (raw && raw.days && typeof raw.days === 'object') {
      days = raw.days;
    }
  } catch (error) {
    days = {};
  }
}

function record(entry) {
  if (!entry || typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    return false;
  }
  const prev = days[entry.date];
  const next = prev ? { ...prev, ...sanitize(entry) } : sanitize(entry);
  if (prev && JSON.stringify(prev) === JSON.stringify(next)) return false;
  days[next.date] = next;
  scheduleSave();
  return true;
}

function setMood(payload) {
  const date = payload && payload.date;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return list();
  const prev = days[date];
  const mood = MOODS.includes(payload.mood) ? payload.mood : null;
  const note =
    typeof payload.note === 'string' ? payload.note.slice(0, 160) : (prev && prev.note) || '';
  if (!prev && !mood && !note) return list();
  if (prev && (prev.mood || null) === mood && (prev.note || '') === note) return list();
  const base = prev || {
    date,
    workday: false,
    earned: 0,
    target: 0,
    workedSec: 0,
    overtimeSec: 0,
    punchIn: null,
    punchOut: null
  };
  days[date] = { ...base, date, mood, note };
  scheduleSave();
  return list();
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, SAVE_DELAY);
  if (saveTimer.unref) saveTimer.unref();
}

function flush() {
  if (!filePath) return;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const keys = Object.keys(days).sort();
  if (keys.length > MAX_DAYS) {
    for (const key of keys.slice(0, keys.length - MAX_DAYS)) {
      delete days[key];
    }
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify({ version: 1, days }, null, 2));
  } catch (error) {
    /* stats must never break the app */
  }
}

function list() {
  return { version: 1, days };
}

module.exports = {
  init,
  record,
  setMood,
  flush,
  list
};
