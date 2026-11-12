'use strict';

const { nativeTheme } = require('electron');
const { parseTime } = require('../shared/calc');

function effectiveTheme(cfg) {
  if (cfg.themeMode === 'manual') {
    return { id: cfg.manualTheme || 'cream', source: 'manual' };
  }
  if (cfg.themeOverride) {
    return { id: cfg.manualTheme || 'cream', source: 'override' };
  }
  if (cfg.themeMode === 'system') {
    return {
      id: nativeTheme.shouldUseDarkColors ? cfg.nightTheme : cfg.dayTheme,
      source: 'system'
    };
  }
  const start = parseTime(cfg.dayStart);
  const end = parseTime(cfg.dayEnd);
  const s = start == null ? 420 : start;
  const e = end == null ? 1140 : end;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  let isDay;
  if (s === e) isDay = true;
  else if (s < e) isDay = minutes >= s && minutes < e;
  else isDay = minutes >= s || minutes < e;
  return { id: isDay ? cfg.dayTheme : cfg.nightTheme, source: 'time' };
}

module.exports = { effectiveTheme };
