'use strict';

const {
  validateSchedule,
  schedule,
  computeState,
  formatMoney,
  mondayOf,
  isoDate,
  addDays,
  parseISODate,
  parseTime,
  timeLabel
} = window.DaodianCalc;
const THEMES = window.THEMES;
const bridge = window.api;
const $ = (id) => document.getElementById(id);

let cfg = null;
let effective = null;
let updateState = null;
let customizeId = 'cream';
let toastTimer = null;
let varTimer = null;
let pendingVars = null;
let fontSizeTimer = null;
let opacityTimer = null;
let tuckDelayTimer = null;
let clockGraceTimer = null;
let statsDays = {};
let statsMode = 'day';
let statsAnchor = new Date();

function themeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

function toast(message) {
  const node = $('toast');
  node.textContent = message;
  node.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 1400);
}

function sourceLabel(source) {
  if (source === 'system') return '跟随系统';
  if (source === 'manual') return '手动模式';
  if (source === 'override') return '手动锁定';
  return '跟随时间';
}

function isBigWeek(config) {
  const anchor = parseISODate(config.bigSmallAnchor);
  if (!anchor) return false;
  const diff = Math.round((mondayOf(new Date()) - mondayOf(anchor)) / (7 * 86400000));
  return (((diff % 2) + 2) % 2) === 0;
}

function populateSelects() {
  const options = THEMES.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
  $('dayTheme').innerHTML = options;
  $('nightTheme').innerHTML = options;
  $('customizeTheme').innerHTML = options;
}

function setValueIfIdle(id, value) {
  const node = $(id);
  if (!node) return;
  if (document.activeElement === node) return;
  node.value = value;
}

function fillForm() {
  setValueIfIdle('salary', cfg.salary);
  setValueIfIdle('payDays', cfg.payDays);
  setValueIfIdle('workPattern', cfg.workPattern);
  setValueIfIdle('overtimeMode', cfg.overtimeMode);
  setValueIfIdle('workStart', cfg.workStart);
  setValueIfIdle('workEnd', cfg.workEnd);
  setValueIfIdle('lunchStart', cfg.lunchStart);
  setValueIfIdle('lunchMinutes', cfg.lunchMinutes);
  setValueIfIdle('themeMode', cfg.themeMode);
  setValueIfIdle('dayTheme', cfg.dayTheme);
  setValueIfIdle('nightTheme', cfg.nightTheme);
  setValueIfIdle('dayStart', cfg.dayStart);
  setValueIfIdle('dayEnd', cfg.dayEnd);
  setValueIfIdle('clockMode', cfg.clockMode);

  const toggles = [
    'showTarget',
    'showPercent',
    'showRemaining',
    'showHourly',
    'showOvertime',
    'privacy',
    'alwaysOnTop',
    'autostart',
    'autoTuck',
    'autoUpdate',
    'notify',
    'sound',
    'clockLate',
    'clockEarly',
    'clockOvertime'
  ];
  for (const id of toggles) {
    const node = $(id);
    if (node) node.checked = !!cfg[id];
  }

  $('fontSize').value = cfg.fontSize;
  $('fontSizeOut').textContent = Math.round(cfg.fontSize * 100) + '%';
  $('opacity').value = cfg.opacity;
  $('opacityOut').textContent = Math.round(cfg.opacity * 100) + '%';
  $('tuckDelay').value = cfg.tuckDelay;
  $('tuckDelayOut').textContent = cfg.tuckDelay + 's';
  $('clockGrace').value = cfg.clockGraceMin;
  $('clockGraceOut').textContent = cfg.clockGraceMin + ' 分钟';

  showModeFields();
  showClockFields();
  updateBigWeek();
  syncTuckDelay();
  loadCustomize();
}

function showClockFields() {
  const custom = cfg.clockMode === 'custom';
  $('clockCustom').hidden = !custom;
  const hint = $('clockHint');
  if (cfg.clockMode === 'punch') {
    hint.textContent =
      '金额从上班打卡开始，下班打卡后停止；迟到、早退会少算，晚走继续按加班计算。';
  } else if (custom) {
    hint.textContent =
      '分别选择迟到、早退和加班怎么算；宽限时间内的迟到 / 早退不扣，未打卡时仍按班次计算。';
  } else {
    hint.textContent =
      '打卡只记录上下班时间，金额始终按设置的班次计算；打卡按钮会出现在上班 / 下班时间附近。';
  }
}

function syncTuckDelay() {
  $('tuckDelayField').hidden = !$('autoTuck').checked;
}

function showModeFields() {
  $('dayRangeField').style.display = cfg.themeMode === 'time' ? 'flex' : 'none';
}

function updateBigWeek() {
  const show = cfg.workPattern === 'big_small';
  $('bigWeekRow').style.display = show ? 'flex' : 'none';
  if (show) $('bigWeek').checked = isBigWeek(cfg);
}

function loadCustomize() {
  const theme = themeById(customizeId);
  const vars = (cfg.themeVars && cfg.themeVars[customizeId]) || {};
  $('accent').value = vars.accent || theme.accent;
  $('font').value = vars.font || '';
  const radius = typeof vars.radius === 'number' ? vars.radius : theme.radius;
  $('radius').value = radius;
  $('radiusOut').textContent = radius + 'px';

  const preview = $('bgPreview');
  if (vars.bgImagePath) {
    preview.textContent = '…';
    bridge.imageData(vars.bgImagePath).then((url) => {
      if (customizeId !== theme.id) return;
      if (!url) {
        preview.textContent = '无';
        preview.style.backgroundImage = 'none';
        return;
      }
      preview.style.backgroundImage = 'url("' + url + '")';
      preview.textContent = '';
    });
  } else {
    preview.style.backgroundImage = 'none';
    preview.textContent = '无';
  }
}

function updatePreview() {
  const sc = schedule(cfg);
  const hours = sc.workMinutes / 60;
  const hoursText = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  $('previewText').textContent =
    '日薪 ' + formatMoney(sc.dailyPay) + ' · 每天有效工时 ' + hoursText + ' 小时';
  $('previewHourly').textContent = formatMoney(sc.hourly) + ' / 小时';

  const errors = validateSchedule(cfg);
  const list = Object.values(errors);
  $('scheduleError').textContent = list.length ? list[0] : '';
  const map = {
    salary: 'salary',
    payDays: 'payDays',
    workStart: 'workStart',
    workEnd: 'workEnd',
    lunchStart: 'lunchStart',
    lunchMinutes: 'lunchMinutes'
  };
  for (const [key, id] of Object.entries(map)) {
    $(id).classList.toggle('invalid', !!errors[key]);
  }
}

async function updateEffective() {
  effective = await bridge.getTheme();
  const theme = themeById(effective.id);
  $('effectiveChip').textContent = '当前：' + theme.name;
  $('effectiveText').innerHTML =
    '当前生效：<b>' + theme.name + '</b> · ' + sourceLabel(effective.source);
  $('btnAuto').style.display =
    cfg.themeOverride || cfg.themeMode !== 'time' ? '' : 'none';
  markActive();
}

function renderThemeGrid() {
  const grid = $('themeGrid');
  grid.innerHTML = THEMES.map(
    (t) => `
      <div class="theme-card" data-theme="${t.id}">
        <div class="swatches">${t.swatch
          .map((color) => `<i style="background:${color}"></i>`)
          .join('')}</div>
        <div class="tc-name">${t.name}<span class="tc-badge" hidden>当前</span></div>
        <div class="tc-desc">${t.desc}</div>
        <div class="tc-actions">
          <button type="button" data-act="day" data-id="${t.id}">设为白天</button>
          <button type="button" data-act="night" data-id="${t.id}">设为夜间</button>
          <button type="button" data-act="use" data-id="${t.id}">立即使用</button>
        </div>
      </div>`
  ).join('');
}

function markActive() {
  const activeId = effective ? effective.id : null;
  document.querySelectorAll('.theme-card').forEach((card) => {
    const active = card.dataset.theme === activeId;
    card.classList.toggle('active', active);
    const badge = card.querySelector('.tc-badge');
    if (badge) badge.hidden = !active;
  });
}

function renderUpdate() {
  const info = updateState;
  if (!info) return;
  $('appVersion').textContent = info.currentVersion || '—';
  const status = info.status;
  let text = '尚未检查更新';
  if (status === 'dev') {
    text = '开发模式：自动更新仅在打包后的安装版中启用';
  } else if (status === 'portable') {
    text = '便携版：请手动下载新版本';
  } else if (status === 'checking') {
    text = '正在检查更新…';
  } else if (status === 'available') {
    text = '发现 v' + info.version + '，准备下载…';
  } else if (status === 'downloading') {
    text = '正在下载 v' + info.version + ' · ' + info.percent + '%';
  } else if (status === 'downloaded') {
    text = 'v' + info.version + ' 已下载，点击「安装更新」后才会安装';
  } else if (status === 'current') {
    text = '已是最新版本 v' + info.currentVersion;
  } else if (status === 'error') {
    text = '检查失败：' + (info.error || '网络错误');
  }
  $('updateStatus').textContent = text;
  $('btnInstallUpdate').hidden = status !== 'downloaded';
  $('btnCheckUpdate').disabled = status === 'checking' || status === 'downloading';
  $('btnCheckUpdate').textContent = info.portable
    ? '打开下载页'
    : status === 'error'
      ? '重试'
      : '检查更新';
}

async function save(patch, options) {
  const opts = options || {};
  try {
    cfg = await bridge.saveConfig(patch);
    updatePreview();
    updateEffective();
    if (!opts.quiet) toast('已保存');
    return cfg;
  } catch (e) {
    toast('保存失败：' + e.message);
    return cfg;
  }
}

function queueVar(key, value) {
  if (!pendingVars) pendingVars = JSON.parse(JSON.stringify(cfg.themeVars || {}));
  pendingVars[customizeId] = pendingVars[customizeId] || {};
  if (value == null || value === '') delete pendingVars[customizeId][key];
  else pendingVars[customizeId][key] = value;
  if (varTimer) clearTimeout(varTimer);
  varTimer = setTimeout(() => {
    const vars = pendingVars;
    pendingVars = null;
    varTimer = null;
    save({ themeVars: vars }, { quiet: true });
  }, 260);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

async function loadStats() {
  try {
    const data = await bridge.getStats();
    statsDays = (data && data.days) || {};
  } catch (e) {
    statsDays = {};
  }
}

function liveStatsDay() {
  if (!cfg) return null;
  const s = computeState(cfg, new Date());
  if (!s.workday) return null;
  return {
    date: isoDate(s.now),
    workday: true,
    earned: s.earned,
    target: s.target,
    workedSec: s.paidSec,
    overtimeSec: s.overtimeSec,
    punchIn: s.punchIn,
    punchOut: s.punchOut
  };
}

function mergedStatsDays() {
  const days = { ...statsDays };
  const live = liveStatsDay();
  if (live) days[live.date] = live;
  return days;
}

function statHours(seconds) {
  return (Math.max(0, Number(seconds) || 0) / 3600).toFixed(1) + ' h';
}

function statCard(label, value) {
  return '<div class="stat-card"><span>' + label + '</span><b>' + value + '</b></div>';
}

function statBarChart(items) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    '<div class="stat-bars">' +
    items
      .map((item) => {
        const height = item.value > 0 ? Math.max(2, (item.value / max) * 100) : 0;
        return (
          '<div class="stat-bar" title="' +
          item.title +
          '"><div class="stat-bar-track"><i style="height:' +
          height.toFixed(1) +
          '%"></i></div><em>' +
          item.display +
          '</em></div>'
        );
      })
      .join('') +
    '</div>'
  );
}

function statsPeriodText() {
  const y = statsAnchor.getFullYear();
  const m = statsAnchor.getMonth() + 1;
  if (statsMode === 'day') return y + '年' + m + '月' + statsAnchor.getDate() + '日';
  if (statsMode === 'month') return y + '年' + m + '月';
  return y + '年';
}

function canGoNext() {
  const now = new Date();
  if (statsMode === 'day') return startOfDay(statsAnchor) < startOfDay(now);
  if (statsMode === 'month') return startOfMonth(statsAnchor) < startOfMonth(now);
  return statsAnchor.getFullYear() < now.getFullYear();
}

function renderStats() {
  if (!cfg) return;
  const days = mergedStatsDays();
  const cards = [];
  let chart = '';

  $('statsPeriod').textContent = statsPeriodText();
  $('statsNext').disabled = !canGoNext();
  for (const btn of $('statsMode').querySelectorAll('button')) {
    btn.classList.toggle('on', btn.dataset.mode === statsMode);
  }

  if (statsMode === 'day') {
    const rec = days[isoDate(statsAnchor)];
    const target = rec ? rec.target : schedule(cfg).dailyPay;
    const earned = rec ? Number(rec.earned) || 0 : 0;
    cards.push(statCard('已赚', formatMoney(earned)));
    cards.push(statCard('目标', formatMoney(target)));
    cards.push(statCard('计薪工时', statHours(rec ? rec.workedSec : 0)));
    cards.push(statCard('加班', statHours(rec ? rec.overtimeSec : 0)));
    cards.push(statCard('上班', rec && rec.punchIn != null ? timeLabel(rec.punchIn) : '未打卡'));
    cards.push(statCard('下班', rec && rec.punchOut != null ? timeLabel(rec.punchOut) : '未打卡'));
    const pct = target > 0 ? Math.min(100, (earned / target) * 100) : 0;
    chart = rec
      ? '<div class="stat-progress"><i style="width:' +
        pct.toFixed(1) +
        '%"></i></div><div class="stat-progress-label">' +
        pct.toFixed(0) +
        '% · ' +
        formatMoney(earned) +
        ' / ' +
        formatMoney(target) +
        '</div>'
      : '<div class="stat-empty">这一天还没有打卡或工资记录</div>';
  } else {
    const from =
      statsMode === 'month' ? startOfMonth(statsAnchor) : new Date(statsAnchor.getFullYear(), 0, 1);
    const to =
      statsMode === 'month'
        ? endOfMonth(statsAnchor)
        : new Date(statsAnchor.getFullYear(), 11, 31);
    const records = Object.values(days).filter(
      (d) => d.workday && d.date >= isoDate(from) && d.date <= isoDate(to)
    );
    const totalEarned = records.reduce((sum, d) => sum + (Number(d.earned) || 0), 0);
    const totalWorked = records.reduce((sum, d) => sum + (Number(d.workedSec) || 0), 0);
    const totalOt = records.reduce((sum, d) => sum + (Number(d.overtimeSec) || 0), 0);
    const totalTarget = records.reduce((sum, d) => sum + (Number(d.target) || 0), 0);
    const count = records.length;

    cards.push(
      statCard(statsMode === 'month' ? '本月已赚' : '本年已赚', formatMoney(totalEarned))
    );
    cards.push(statCard('日均', count ? formatMoney(totalEarned / count) : '—'));
    cards.push(statCard('记录天数', count + ' 天'));
    cards.push(statCard('计薪工时', statHours(totalWorked)));
    cards.push(statCard('加班', statHours(totalOt)));
    cards.push(
      statCard(
        '目标完成',
        totalTarget > 0 ? Math.round((totalEarned / totalTarget) * 100) + '%' : '—'
      )
    );

    if (statsMode === 'month') {
      const total = endOfMonth(statsAnchor).getDate();
      const items = [];
      for (let day = 1; day <= total; day += 1) {
        const key = isoDate(new Date(statsAnchor.getFullYear(), statsAnchor.getMonth(), day));
        const rec = days[key];
        items.push({
          value: rec ? Number(rec.earned) || 0 : 0,
          display: day === 1 || day % 5 === 0 ? String(day) : '',
          title: key + ' · ' + (rec ? formatMoney(rec.earned) : '无记录')
        });
      }
      chart = statBarChart(items);
    } else {
      const year = statsAnchor.getFullYear();
      const items = [];
      for (let month = 1; month <= 12; month += 1) {
        const prefix = year + '-' + String(month).padStart(2, '0');
        let sum = 0;
        let countDays = 0;
        for (const rec of Object.values(days)) {
          if (rec.workday && rec.date.slice(0, 7) === prefix) {
            sum += Number(rec.earned) || 0;
            countDays += 1;
          }
        }
        items.push({
          value: sum,
          display: String(month),
          title: month + '月 · ' + formatMoney(sum) + ' · ' + countDays + ' 天'
        });
      }
      chart = statBarChart(items);
    }

    if (!records.length) {
      chart +=
        '<div class="stat-empty">这段时间还没有记录，工资统计会在使用后逐步累积。</div>';
    }
  }

  $('statsCards').innerHTML = cards.join('');
  $('statsChart').innerHTML = chart;
}

function bind() {
  $('salary').addEventListener('change', () => {
    const v = Number($('salary').value);
    if (!(v > 0)) return updatePreview();
    save({ salary: v });
  });
  $('payDays').addEventListener('change', () => {
    const v = Number($('payDays').value);
    if (!(v > 0)) return updatePreview();
    save({ payDays: v });
  });
  $('lunchMinutes').addEventListener('change', () => {
    const v = Number($('lunchMinutes').value);
    if (!(v >= 0 && v <= 480)) return updatePreview();
    save({ lunchMinutes: v });
  });

  for (const id of ['workStart', 'workEnd', 'lunchStart']) {
    $(id).addEventListener('change', () => {
      const value = $(id).value;
      if (parseTime(value) == null) return updatePreview();
      save({ [id]: value });
    });
  }

  $('workPattern').addEventListener('change', async () => {
    const pattern = $('workPattern').value;
    const patch = { workPattern: pattern };
    if (pattern === 'big_small' && !cfg.bigSmallAnchor) {
      patch.bigSmallAnchor = isoDate(addDays(mondayOf(new Date()), 7));
    }
    await save(patch);
    updateBigWeek();
  });

  $('bigWeek').addEventListener('change', () => {
    const monday = mondayOf(new Date());
    const anchor = $('bigWeek').checked ? monday : addDays(monday, 7);
    save({ bigSmallAnchor: isoDate(anchor) });
  });

  $('overtimeMode').addEventListener('change', () => {
    save({ overtimeMode: $('overtimeMode').value });
  });

  $('themeMode').addEventListener('change', async () => {
    const mode = $('themeMode').value;
    const patch = { themeMode: mode, themeOverride: false };
    if (mode === 'manual') patch.manualTheme = effective ? effective.id : cfg.dayTheme;
    await save(patch);
    showModeFields();
  });

  $('dayTheme').addEventListener('change', () => save({ dayTheme: $('dayTheme').value }));
  $('nightTheme').addEventListener('change', () => save({ nightTheme: $('nightTheme').value }));
  $('dayStart').addEventListener('change', () => {
    if (parseTime($('dayStart').value) == null) return;
    save({ dayStart: $('dayStart').value });
  });
  $('dayEnd').addEventListener('change', () => {
    if (parseTime($('dayEnd').value) == null) return;
    save({ dayEnd: $('dayEnd').value });
  });

  $('themeGrid').addEventListener('click', async (event) => {
    const btn = event.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'day') {
      $('dayTheme').value = id;
      await save({ dayTheme: id });
      toast('白天将使用「' + themeById(id).name + '」');
    } else if (act === 'night') {
      $('nightTheme').value = id;
      await save({ nightTheme: id });
      toast('夜间将使用「' + themeById(id).name + '」');
    } else {
      await bridge.applyTheme(id);
      cfg = await bridge.getConfig();
      customizeId = id;
      $('customizeTheme').value = id;
      loadCustomize();
      await updateEffective();
      toast('已切换到「' + themeById(id).name + '」');
    }
  });

  $('btnAuto').addEventListener('click', async () => {
    await bridge.restoreAuto();
    cfg = await bridge.getConfig();
    effective = await bridge.getTheme();
    fillForm();
    updateEffective();
    toast('已恢复自动切换');
  });

  $('customizeTheme').addEventListener('change', () => {
    customizeId = $('customizeTheme').value;
    loadCustomize();
  });

  $('accent').addEventListener('input', () => queueVar('accent', $('accent').value));
  $('btnAccentReset').addEventListener('click', () => {
    const theme = themeById(customizeId);
    $('accent').value = theme.accent;
    queueVar('accent', null);
  });

  $('radius').addEventListener('input', () => {
    const value = Number($('radius').value);
    $('radiusOut').textContent = value + 'px';
    queueVar('radius', value);
  });

  $('font').addEventListener('change', () => {
    queueVar('font', $('font').value || null);
    toast('已保存');
  });

  $('btnPickBg').addEventListener('click', async () => {
    const result = await bridge.pickImage();
    if (!result) return;
    if (result.error) {
      toast(result.error);
      return;
    }
    queueVar('bgImagePath', result.path);
    const preview = $('bgPreview');
    preview.style.backgroundImage = 'url("' + result.dataUrl + '")';
    preview.textContent = '';
    toast('背景已更新');
  });

  $('btnClearBg').addEventListener('click', () => {
    queueVar('bgImagePath', null);
    $('bgPreview').style.backgroundImage = 'none';
    $('bgPreview').textContent = '无';
    toast('已清除背景');
  });

  $('fontSize').addEventListener('input', () => {
    const value = Number($('fontSize').value);
    $('fontSizeOut').textContent = Math.round(value * 100) + '%';
    if (fontSizeTimer) clearTimeout(fontSizeTimer);
    fontSizeTimer = setTimeout(() => save({ fontSize: value }, { quiet: true }), 260);
  });

  $('opacity').addEventListener('input', () => {
    const value = Number($('opacity').value);
    $('opacityOut').textContent = Math.round(value * 100) + '%';
    if (opacityTimer) clearTimeout(opacityTimer);
    opacityTimer = setTimeout(() => save({ opacity: value }, { quiet: true }), 200);
  });

  $('tuckDelay').addEventListener('input', () => {
    const value = Number($('tuckDelay').value);
    $('tuckDelayOut').textContent = value + 's';
    if (tuckDelayTimer) clearTimeout(tuckDelayTimer);
    tuckDelayTimer = setTimeout(() => save({ tuckDelay: value }, { quiet: true }), 220);
  });

  const toggles = [
    'showTarget',
    'showPercent',
    'showRemaining',
    'showHourly',
    'showOvertime',
    'privacy',
    'alwaysOnTop',
    'autostart',
    'autoTuck',
    'autoUpdate',
    'notify',
    'sound',
    'clockLate',
    'clockEarly',
    'clockOvertime'
  ];
  for (const id of toggles) {
    $(id).addEventListener('change', () => {
      save({ [id]: $(id).checked });
    });
  }

  $('autoTuck').addEventListener('change', syncTuckDelay);

  $('clockMode').addEventListener('change', async () => {
    await save({ clockMode: $('clockMode').value });
    showClockFields();
  });

  $('clockGrace').addEventListener('input', () => {
    const value = Number($('clockGrace').value);
    $('clockGraceOut').textContent = value + ' 分钟';
    if (clockGraceTimer) clearTimeout(clockGraceTimer);
    clockGraceTimer = setTimeout(() => save({ clockGraceMin: value }, { quiet: true }), 240);
  });

  $('statsMode').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-mode]');
    if (!btn) return;
    statsMode = btn.dataset.mode;
    statsAnchor = new Date();
    renderStats();
  });

  $('statsPrev').addEventListener('click', () => {
    if (statsMode === 'day') statsAnchor = addDays(statsAnchor, -1);
    else if (statsMode === 'month') {
      statsAnchor = new Date(statsAnchor.getFullYear(), statsAnchor.getMonth() - 1, 1);
    } else {
      statsAnchor = new Date(statsAnchor.getFullYear() - 1, 0, 1);
    }
    renderStats();
  });

  $('statsNext').addEventListener('click', () => {
    if (!canGoNext()) return;
    if (statsMode === 'day') statsAnchor = addDays(statsAnchor, 1);
    else if (statsMode === 'month') {
      statsAnchor = new Date(statsAnchor.getFullYear(), statsAnchor.getMonth() + 1, 1);
    } else {
      statsAnchor = new Date(statsAnchor.getFullYear() + 1, 0, 1);
    }
    renderStats();
  });

  $('btnCheckUpdate').addEventListener('click', async () => {
    $('updateStatus').textContent = '正在检查更新…';
    $('btnCheckUpdate').disabled = true;
    const info = await bridge.checkForUpdates();
    if (info) {
      updateState = info;
      renderUpdate();
    }
  });

  $('btnInstallUpdate').addEventListener('click', () => {
    bridge.installUpdate();
  });

  $('btnGithub').addEventListener('click', () => {
    bridge.openRepository();
  });

  bridge.onUpdate((info) => {
    updateState = info;
    renderUpdate();
  });

  $('btnClose').addEventListener('click', () => bridge.closeSelf());
  $('btnData').addEventListener('click', () => bridge.openDataDir());
  $('btnQuit').addEventListener('click', () => bridge.quit());

  bridge.onConfig((next) => {
    if (!next) return;
    cfg = next;
    fillForm();
    renderStats();
  });

  bridge.onTheme((theme) => {
    effective = theme;
    updateEffective();
  });
}

async function init() {
  cfg = await bridge.getConfig();
  effective = await bridge.getTheme();
  customizeId = effective.id;
  populateSelects();
  $('customizeTheme').value = customizeId;
  renderThemeGrid();
  fillForm();
  updatePreview();
  await updateEffective();
  updateState = await bridge.getUpdateInfo();
  await loadStats();
  bind();
  renderUpdate();
  renderStats();
  setInterval(async () => {
    if (document.hidden) return;
    await loadStats();
    renderStats();
  }, 30000);
}

init().catch((err) => {
  console.error(err);
  document.body.innerHTML =
    '<pre style="padding:24px;color:#b5544a">设置页加载失败：' +
    String(err && err.message ? err.message : err) +
    '</pre>';
});
