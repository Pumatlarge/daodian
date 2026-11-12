'use strict';

const {
  validateSchedule,
  schedule,
  formatMoney,
  mondayOf,
  isoDate,
  addDays,
  parseISODate,
  parseTime
} = window.DaodianCalc;
const THEMES = window.THEMES;
const bridge = window.api;
const $ = (id) => document.getElementById(id);

let cfg = null;
let step = 1;

function themeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

function isBigWeek(config) {
  const anchor = parseISODate(config.bigSmallAnchor);
  if (!anchor) return false;
  const diff = Math.round((mondayOf(new Date()) - mondayOf(anchor)) / (7 * 86400000));
  return (((diff % 2) + 2) % 2) === 0;
}

function read() {
  return {
    salary: Number($('sSalary').value),
    payDays: Number($('sPayDays').value),
    workPattern: $('sPattern').value,
    workStart: $('sStart').value,
    workEnd: $('sEnd').value,
    lunchStart: $('sLunch').value,
    lunchMinutes: Number($('sLunchMin').value),
    themeMode: $('sMode').value,
    dayTheme: $('sDayTheme').value,
    nightTheme: $('sNightTheme').value,
    dayStart: $('sDayStart').value,
    dayEnd: $('sDayEnd').value
  };
}

function current() {
  return { ...cfg, ...read() };
}

function fill() {
  $('sSalary').value = cfg.salary;
  $('sPayDays').value = cfg.payDays;
  $('sPattern').value = cfg.workPattern;
  $('sStart').value = cfg.workStart;
  $('sEnd').value = cfg.workEnd;
  $('sLunch').value = cfg.lunchStart;
  $('sLunchMin').value = cfg.lunchMinutes;
  $('sMode').value = cfg.themeMode;
  $('sDayStart').value = cfg.dayStart;
  $('sDayEnd').value = cfg.dayEnd;
  $('sBigWeek').checked = isBigWeek(cfg);
}

function buildSelects() {
  const options = THEMES.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
  $('sDayTheme').innerHTML = options;
  $('sNightTheme').innerHTML = options;
  $('sManualTheme').innerHTML = options;
  $('sDayTheme').value = cfg.dayTheme;
  $('sNightTheme').value = cfg.nightTheme;
  $('sManualTheme').value = cfg.manualTheme || cfg.dayTheme;
}

function buildStrip() {
  $('sThemeStrip').innerHTML = THEMES.map(
    (t) =>
      `<span class="theme-chip"><i style="background:${t.accent}"></i>${t.name}</span>`
  ).join('');
}

function syncBigRow() {
  $('sBigRow').style.display = $('sPattern').value === 'big_small' ? 'flex' : 'none';
}

function syncMode() {
  const mode = $('sMode').value;
  $('sRangeField').style.display = mode === 'time' ? 'flex' : 'none';
  const showDayNight = mode !== 'manual';
  $('sDayField').style.display = showDayNight ? 'flex' : 'none';
  $('sNightField').style.display = showDayNight ? 'flex' : 'none';
  $('sManualField').style.display = mode === 'manual' ? 'flex' : 'none';
}

function clearInvalid() {
  for (const id of ['sSalary', 'sPayDays', 'sStart', 'sEnd', 'sLunch', 'sLunchMin']) {
    $(id).classList.remove('invalid');
  }
}

function showError(message) {
  $('sError').textContent = message || '';
}

function updatePreview() {
  const data = current();
  const sc = schedule(data);
  $('sSalaryPreview').textContent = '日薪 ' + formatMoney(sc.dailyPay);
  $('sHourlyPreview').textContent = formatMoney(sc.hourly) + ' / 小时';
  const hours = sc.workMinutes / 60;
  $('sPreviewText').textContent =
    '每天有效工时 ' + (Number.isInteger(hours) ? hours : hours.toFixed(1)) + ' 小时';
  $('sPreviewHourly').textContent = formatMoney(sc.hourly) + ' / 小时';

  const errors = validateSchedule(data);
  clearInvalid();
  if (errors.salary) $('sSalary').classList.add('invalid');
  if (errors.payDays) $('sPayDays').classList.add('invalid');
  if (errors.workStart) $('sStart').classList.add('invalid');
  if (errors.workEnd) $('sEnd').classList.add('invalid');
  if (errors.lunchStart) $('sLunch').classList.add('invalid');
  if (errors.lunchMinutes) $('sLunchMin').classList.add('invalid');

  if (step === 1) {
    showError(errors.salary || errors.payDays || '');
  } else if (step === 2) {
    showError(
      errors.workStart || errors.workEnd || errors.lunchStart || errors.lunchMinutes || ''
    );
  } else {
    showError('');
  }
}

function go(nextStep) {
  step = nextStep;
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.hidden = Number(panel.dataset.panel) !== step;
  });
  document.querySelectorAll('.step').forEach((dot) => {
    const value = Number(dot.dataset.step);
    dot.classList.toggle('active', value === step);
    dot.classList.toggle('done', value < step);
  });
  $('btnBack').disabled = step === 1;
  $('btnNext').textContent = step === 3 ? '开始到点' : '下一步';
  $('sHint').textContent = '第 ' + step + ' 步，共 3 步';
  updatePreview();
}

function validateStep() {
  const data = current();
  const errors = validateSchedule(data);
  if (step === 1) {
    if (errors.salary) return errors.salary;
    if (errors.payDays) return errors.payDays;
    return '';
  }
  if (step === 2) {
    return (
      errors.workStart || errors.workEnd || errors.lunchStart || errors.lunchMinutes || ''
    );
  }
  return '';
}

async function finish() {
  const data = read();
  if (data.themeMode === 'time') {
    if (parseTime(data.dayStart) == null || parseTime(data.dayEnd) == null) {
      showError('白天时段格式不对');
      return;
    }
  }
  const monday = mondayOf(new Date());
  data.bigSmallAnchor = isoDate($('sBigWeek').checked ? monday : addDays(monday, 7));
  data.manualTheme =
    data.themeMode === 'manual'
      ? $('sManualTheme').value
      : cfg.manualTheme || data.dayTheme;
  data.themeOverride = false;
  data.onboarded = true;

  $('btnNext').disabled = true;
  $('btnNext').textContent = '正在开工…';
  try {
    await bridge.finishSetup(data);
  } catch (e) {
    $('btnNext').disabled = false;
    $('btnNext').textContent = '开始到点';
    showError('保存失败：' + (e && e.message ? e.message : e));
  }
}

function bind() {
  ['sSalary', 'sPayDays', 'sStart', 'sEnd', 'sLunch', 'sLunchMin', 'sDayStart', 'sDayEnd'].forEach(
    (id) => {
      $(id).addEventListener('input', () => {
        if (id === 'sSalary' || id === 'sPayDays' || id === 'sLunchMin') {
          $('sPayDays').classList.remove('invalid');
        }
        updatePreview();
      });
    }
  );

  $('sPattern').addEventListener('change', () => {
    syncBigRow();
    updatePreview();
  });

  $('sMode').addEventListener('change', () => {
    syncMode();
    updatePreview();
  });

  $('btnBack').addEventListener('click', () => {
    if (step > 1) go(step - 1);
  });

  $('btnNext').addEventListener('click', async () => {
    const error = validateStep();
    if (error) {
      showError(error);
      return;
    }
    if (step < 3) {
      go(step + 1);
      return;
    }
    await finish();
  });
}

async function init() {
  cfg = await bridge.getConfig();
  fill();
  buildSelects();
  buildStrip();
  syncBigRow();
  syncMode();
  updatePreview();
  bind();
  go(1);
}

init().catch((err) => {
  console.error(err);
  showError('加载失败：' + (err && err.message ? err.message : err));
});
