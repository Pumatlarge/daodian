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
const { t: translate, apply: applyLanguage } = window.DaodianI18n;
const $ = (id) => document.getElementById(id);

let cfg = null;
let step = 1;
let lang = 'zh';
const DRAFT_KEY = 'daodian-setup-draft';

function tr(zh, vars) {
  return translate(lang, zh, vars);
}

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
  const options = THEMES.map(
    (theme) => `<option value="${theme.id}">${tr(theme.name)}</option>`
  ).join('');
  $('sDayTheme').innerHTML = options;
  $('sNightTheme').innerHTML = options;
  $('sManualTheme').innerHTML = options;
  $('sDayTheme').value = cfg.dayTheme;
  $('sNightTheme').value = cfg.nightTheme;
  $('sManualTheme').value = cfg.manualTheme || cfg.dayTheme;
}

function buildStrip() {
  $('sThemeStrip').innerHTML = THEMES.map(
    (theme) =>
      `<span class="theme-chip"><i style="background:${theme.accent}"></i>${tr(
        theme.name
      )}</span>`
  ).join('');
}

function saveDraft() {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(read()));
  } catch (error) {
    /* session storage is optional */
  }
}

function restoreDraft() {
  let draft = null;
  try {
    draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
  } catch (error) {
    draft = null;
  }
  if (!draft) return;
  const map = {
    sSalary: draft.salary,
    sPayDays: draft.payDays,
    sStart: draft.workStart,
    sEnd: draft.workEnd,
    sLunch: draft.lunchStart,
    sLunchMin: draft.lunchMinutes,
    sMode: draft.themeMode,
    sDayStart: draft.dayStart,
    sDayEnd: draft.dayEnd,
    sDayTheme: draft.dayTheme,
    sNightTheme: draft.nightTheme,
    sManualTheme: draft.manualTheme
  };
  for (const [id, value] of Object.entries(map)) {
    if (value != null && value !== '') $(id).value = value;
  }
  if (draft.workPattern) $('sPattern').value = draft.workPattern;
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
  $('sError').textContent = message ? tr(message) : '';
}

function updatePreview() {
  const data = current();
  const sc = schedule(data);
  $('sSalaryPreview').textContent = tr('日薪 {m}', { m: formatMoney(sc.dailyPay) });
  $('sHourlyPreview').textContent = tr('{m} / 小时', { m: formatMoney(sc.hourly) });
  const hours = sc.workMinutes / 60;
  $('sPreviewText').textContent = tr('每天有效工时 {h} 小时', {
    h: Number.isInteger(hours) ? hours : hours.toFixed(1)
  });
  $('sPreviewHourly').textContent = tr('{m} / 小时', { m: formatMoney(sc.hourly) });

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
  $('btnNext').textContent = step === 3 ? tr('开始到点') : tr('下一步');
  $('sHint').textContent = tr('第 {n} 步，共 3 步', { n: step });
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
  data.language = lang;
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
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    /* ignore */
  }

  $('btnNext').disabled = true;
  $('btnNext').textContent = tr('正在开工…');
  try {
    await bridge.finishSetup(data);
  } catch (e) {
    $('btnNext').disabled = false;
    $('btnNext').textContent = tr('开始到点');
    showError(tr('保存失败：') + (e && e.message ? e.message : e));
  }
}

function bind() {
  $('langSwitch').addEventListener('click', async (event) => {
    const btn = event.target.closest('button[data-lang]');
    if (!btn || btn.dataset.lang === lang) return;
    saveDraft();
    await bridge.saveConfig({ language: btn.dataset.lang });
    location.reload();
  });

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
  lang = cfg.language === 'en' ? 'en' : 'zh';
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.title = tr('到点 · 第一次设置');
  applyLanguage(document.body, lang);
  for (const btn of $('langSwitch').querySelectorAll('button')) {
    btn.classList.toggle('on', btn.dataset.lang === lang);
  }
  fill();
  buildSelects();
  buildStrip();
  restoreDraft();
  syncBigRow();
  syncMode();
  updatePreview();
  bind();
  go(1);
}

init().catch((err) => {
  console.error(err);
  showError(tr('加载失败：') + (err && err.message ? err.message : err));
});
