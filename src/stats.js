'use strict';

const {
  computeState,
  schedule,
  isWorkday,
  isoDate,
  addDays,
  parseISODate,
  timeLabel,
  formatMoney,
  formatOvertime
} = window.DaodianCalc;

const bridge = window.api;
const { t: translate, apply: applyLanguage } = window.DaodianI18n;
const $ = (id) => document.getElementById(id);

const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MOODS = [
  { id: 'happy', emoji: '😄', label: '开心' },
  { id: 'calm', emoji: '🙂', label: '平静' },
  { id: 'meh', emoji: '😐', label: '一般' },
  { id: 'tired', emoji: '😫', label: '累' },
  { id: 'sleepy', emoji: '😴', label: '困' },
  { id: 'fired', emoji: '🔥', label: '拼' }
];
const MOOD_BY_ID = {};
for (const mood of MOODS) MOOD_BY_ID[mood.id] = mood;

let cfg = null;
let days = {};
let view = 'month';
let anchor = startOfDay(new Date());
let selected = startOfDay(new Date());
let lang = 'zh';
let toastTimer = null;

function tr(zh, vars) {
  return translate(lang, zh, vars);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function esc(text) {
  return String(text == null ? '' : text).replace(/[&<>"']/g, (c) => {
    if (c === '&') return '&amp;';
    if (c === '<') return '&lt;';
    if (c === '>') return '&gt;';
    if (c === '"') return '&quot;';
    return '&#39;';
  });
}

function shortMoney(value) {
  const v = Number(value) || 0;
  if (v >= 1000) return '¥' + (v / 1000).toFixed(1) + 'k';
  return '¥' + Math.round(v);
}

function monthDay(key) {
  const date = parseISODate(key);
  if (!date) return key;
  return lang === 'en'
    ? MONTH_EN[date.getMonth()] + ' ' + date.getDate()
    : date.getMonth() + 1 + '月' + date.getDate() + '日';
}

function weekdayName(date) {
  if (lang === 'en') return WEEK_EN[date.getDay()];
  return '周' + ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
}

function monthTitle(date) {
  return lang === 'en'
    ? MONTH_EN[date.getMonth()] + ' ' + date.getFullYear()
    : date.getFullYear() + '年' + (date.getMonth() + 1) + '月';
}

function dayTitle(date) {
  if (lang === 'en') {
    return (
      WEEK_EN[date.getDay()] +
      ', ' +
      MONTH_EN[date.getMonth()] +
      ' ' +
      date.getDate() +
      ', ' +
      date.getFullYear()
    );
  }
  return (
    date.getFullYear() +
    '年' +
    (date.getMonth() + 1) +
    '月' +
    date.getDate() +
    '日 · ' +
    weekdayName(date)
  );
}

function dayHeading(date) {
  if (lang === 'en') {
    return MONTH_EN[date.getMonth()] + ' ' + date.getDate() + ' · ' + weekdayName(date);
  }
  return date.getMonth() + 1 + '月' + date.getDate() + '日 · ' + weekdayName(date);
}

function liveRecord() {
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
    punchOut: s.punchOut,
    live: true
  };
}

function dayFor(date) {
  const key = isoDate(date);
  const stored = days[key] || null;
  const live = key === isoDate(new Date()) ? liveRecord() : null;
  if (!live) return stored;
  return {
    ...(stored || {}),
    ...live,
    mood: stored ? stored.mood || null : null,
    note: stored ? stored.note || '' : ''
  };
}

function allDays() {
  const map = { ...days };
  const live = liveRecord();
  if (live) map[live.date] = dayFor(new Date());
  return map;
}

function hasWork(day) {
  return !!(
    day &&
    (day.punchIn != null ||
      Number(day.earned) > 0 ||
      Number(day.workedSec) > 0 ||
      Number(day.overtimeSec) > 0)
  );
}

function recordsBetween(from, to) {
  const start = isoDate(from);
  const end = isoDate(to);
  return Object.values(allDays()).filter(
    (day) => day.date >= start && day.date <= end && hasWork(day)
  );
}

function summarize(records) {
  const result = {
    earned: 0,
    target: 0,
    worked: 0,
    overtime: 0,
    count: records.length,
    avg: 0,
    pct: 0
  };
  for (const day of records) {
    result.earned += Number(day.earned) || 0;
    result.target += Number(day.target) || 0;
    result.worked += Number(day.workedSec) || 0;
    result.overtime += Number(day.overtimeSec) || 0;
  }
  result.avg = result.count ? result.earned / result.count : 0;
  result.pct = result.target > 0 ? Math.round((result.earned / result.target) * 100) : 0;
  return result;
}

function statHours(seconds) {
  return ((Number(seconds) || 0) / 3600).toFixed(1) + ' h';
}

function moodSummary(items) {
  const counts = {};
  for (const day of items) {
    if (day && day.mood) counts[day.mood] = (counts[day.mood] || 0) + 1;
  }
  const parts = MOODS.filter((mood) => counts[mood.id]).map(
    (mood) => mood.emoji + ' ' + counts[mood.id]
  );
  return parts.length ? parts.join(' · ') : tr('还没有记录心情');
}

function moodItemsBetween(from, to) {
  const start = isoDate(from);
  const end = isoDate(to);
  return Object.values(allDays()).filter(
    (day) => day.date >= start && day.date <= end && day.mood
  );
}

function toast(message) {
  const node = $('toast');
  node.textContent = message;
  node.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 1500);
}

function summaryCards(stats, earnedLabel) {
  const recorded =
    lang === 'en'
      ? stats.count + ' recorded ' + (stats.count === 1 ? 'day' : 'days')
      : tr('{n} 个记录日', { n: stats.count });
  return `
    <section class="summary">
      <div class="sum-card"><span>${tr(earnedLabel)}</span><b>${formatMoney(
        stats.earned
      )}</b><em>${tr('完成 {p}%', { p: stats.pct })}</em></div>
      <div class="sum-card"><span>${tr('日均')}</span><b>${
        stats.count ? formatMoney(stats.avg) : '—'
      }</b><em>${recorded}</em></div>
      <div class="sum-card"><span>${tr('计薪工时')}</span><b>${statHours(
        stats.worked
      )}</b><em>${tr('不含加班')}</em></div>
      <div class="sum-card"><span>${tr('加班')}</span><b>${statHours(
        stats.overtime
      )}</b><em>${stats.count ? tr('按打卡与班次') : tr('暂无记录')}</em></div>
    </section>`;
}

function monthCell(date, key) {
  const rec = dayFor(date);
  const rest = !isWorkday(cfg, date);
  const target = Number(rec && rec.target) || schedule(cfg).dailyPay;
  const earned = Number(rec && rec.earned) || 0;
  const heat = !rest && target > 0 ? Math.min(100, (earned / target) * 100) : 0;
  const today = key === isoDate(new Date());
  const mood = rec && rec.mood ? MOOD_BY_ID[rec.mood] : null;
  const overtime = rec && Number(rec.overtimeSec) >= 60;
  const classes = [
    'day-cell',
    rest ? 'is-rest' : '',
    today ? 'is-today' : '',
    mood ? 'has-mood' : ''
  ]
    .filter(Boolean)
    .join(' ');
  const title = [
    key,
    mood ? tr(mood.label) : '',
    rec ? formatMoney(earned) : '',
    rec && rec.note ? rec.note : ''
  ]
    .filter(Boolean)
    .join(' · ');
  return `
    <button class="${classes}" data-date="${key}" style="--heat:${heat.toFixed(
      1
    )}%" title="${esc(title)}">
      <span class="dnum">${date.getDate()}</span>
      ${mood ? `<span class="mood-dot">${mood.emoji}</span>` : ''}
      ${earned > 0 && !rest ? `<span class="de">${shortMoney(earned)}</span>` : ''}
      ${overtime ? `<span class="ot-mark">+${Math.round(rec.overtimeSec / 60)}m</span>` : ''}
    </button>`;
}

function renderMonth() {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  const records = recordsBetween(from, to);
  const stats = summarize(records);
  const best = records.slice().sort((a, b) => b.earned - a.earned)[0];
  const otBest = records
    .filter((day) => Number(day.overtimeSec) > 0)
    .sort((a, b) => b.overtimeSec - a.overtimeSec)[0];

  const offset = (from.getDay() + 6) % 7;
  const total = to.getDate();
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push('<div class="day-cell is-empty"></div>');
  for (let day = 1; day <= total; day += 1) {
    const date = new Date(year, month, day);
    cells.push(monthCell(date, isoDate(date)));
  }
  while (cells.length % 7 !== 0) cells.push('<div class="day-cell is-empty"></div>');

  const week =
    lang === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return `
    ${summaryCards(stats, '本月已赚')}
    <section class="calendar-card">
      <div class="week-head">${week.map((w) => `<span>${w}</span>`).join('')}</div>
      <div class="cal-grid">${cells.join('')}</div>
      <div class="cal-legend">
        <span>${tr('颜色越深 = 当天工资越高')}</span>
        <span class="legend-bar"></span>
        <span>${tr('右上角是当天心情，右下角 +m 是加班')}</span>
      </div>
    </section>
    <section class="highlights">
      <div class="hl"><span>${tr('最努力的一天')}</span><b>${
        best
          ? monthDay(best.date) + ' · ' + formatMoney(best.earned)
          : tr('这个月还没有工资记录')
      }</b></div>
      <div class="hl"><span>${tr('加班最多')}</span><b>${
        otBest
          ? monthDay(otBest.date) + ' · ' + formatOvertime(otBest.overtimeSec)
          : tr('这个月没有加班')
      }</b></div>
      <div class="hl"><span>${tr('心情分布')}</span><b>${moodSummary(
        moodItemsBetween(from, to)
      )}</b></div>
    </section>`;
}

function miniMonth(month, year) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  const records = recordsBetween(from, to);
  const total = records.reduce((sum, day) => sum + (Number(day.earned) || 0), 0);
  const offset = (from.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push('<i class="mini-dot is-empty"></i>');
  const target = schedule(cfg).dailyPay;
  for (let day = 1; day <= to.getDate(); day += 1) {
    const date = new Date(year, month, day);
    const key = isoDate(date);
    const rec = dayFor(date);
    const rest = !isWorkday(cfg, date);
    const earned = Number(rec && rec.earned) || 0;
    const heat = !rest && earned > 0 ? Math.min(100, (earned / target) * 100) : 0;
    const classes = [
      'mini-dot',
      rest ? 'is-rest' : '',
      key === isoDate(new Date()) ? 'is-today' : '',
      rec && rec.mood ? 'has-mood' : ''
    ]
      .filter(Boolean)
      .join(' ');
    const title = [
      key,
      rec ? formatMoney(earned) : '',
      rec && rec.mood ? tr(MOOD_BY_ID[rec.mood].label) : ''
    ]
      .filter(Boolean)
      .join(' · ');
    cells.push(
      `<i class="${classes}" style="--heat:${heat.toFixed(1)}%" title="${esc(title)}"></i>`
    );
  }
  const now = new Date();
  const current = year === now.getFullYear() && month === now.getMonth();
  return `
    <button class="mini ${current ? 'is-current' : ''}" data-month="${month}">
      <div class="mini-head"><b>${
        lang === 'en' ? MONTH_EN[month] : month + 1 + ' 月'
      }</b><span>${
        total > 0 ? formatMoney(total) : '—'
      }</span></div>
      <div class="mini-grid">${cells.join('')}</div>
    </button>`;
}

function renderYear() {
  const year = anchor.getFullYear();
  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31);
  const records = recordsBetween(from, to);
  const stats = summarize(records);

  const monthly = [];
  for (let month = 0; month < 12; month += 1) {
    const monthFrom = new Date(year, month, 1);
    const monthTo = new Date(year, month + 1, 0);
    const monthRecords = recordsBetween(monthFrom, monthTo);
    monthly.push({
      month,
      earned: monthRecords.reduce((sum, day) => sum + (Number(day.earned) || 0), 0),
      overtime: monthRecords.reduce((sum, day) => sum + (Number(day.overtimeSec) || 0), 0)
    });
  }
  const best = monthly.slice().sort((a, b) => b.earned - a.earned)[0];
  const otBest = monthly.slice().sort((a, b) => b.overtime - a.overtime)[0];

  return `
    ${summaryCards(stats, '本年已赚')}
    <section class="year-grid">${monthly.map((item) => miniMonth(item.month, year)).join('')}</section>
    <section class="highlights">
      <div class="hl"><span>${tr('最努力的月份')}</span><b>${
        best && best.earned > 0
          ? (lang === 'en' ? MONTH_EN[best.month] : best.month + 1 + ' 月') +
            ' · ' +
            formatMoney(best.earned)
          : tr('今年还没有工资记录')
      }</b></div>
      <div class="hl"><span>${tr('加班最多')}</span><b>${
        otBest && otBest.overtime > 0
          ? (lang === 'en' ? MONTH_EN[otBest.month] : otBest.month + 1 + ' 月') +
            ' · ' +
            formatOvertime(otBest.overtime)
          : tr('今年还没有加班记录')
      }</b></div>
      <div class="hl"><span>${tr('心情分布')}</span><b>${moodSummary(
        moodItemsBetween(from, to)
      )}</b></div>
    </section>`;
}

function ribbon(rec) {
  const sc = schedule(cfg);
  const start = sc.startM;
  let end = sc.endM;
  if (rec && rec.punchOut != null && rec.punchOut > end) end = rec.punchOut;
  const span = Math.max(1, end - start);
  const pct = (minute) => ((minute - start) / span) * 100;
  const segments = [];
  const lunchStart = Math.max(sc.lunchStartM, start);
  const lunchEnd = Math.min(sc.lunchEndM, end);
  if (lunchEnd > lunchStart) {
    segments.push(
      `<i class="seg-work" style="left:0;width:${pct(lunchStart).toFixed(1)}%"></i>`
    );
    segments.push(
      `<i class="seg-lunch" style="left:${pct(lunchStart).toFixed(
        1
      )}%;width:${(pct(lunchEnd) - pct(lunchStart)).toFixed(1)}%"></i>`
    );
    segments.push(
      `<i class="seg-work" style="left:${pct(lunchEnd).toFixed(
        1
      )}%;width:${(100 - pct(lunchEnd)).toFixed(1)}%"></i>`
    );
  } else {
    segments.push('<i class="seg-work" style="left:0;width:100%"></i>');
  }
  if (rec && rec.punchOut != null && rec.punchOut > sc.endM) {
    segments.push(
      `<i class="seg-ot" style="left:${pct(sc.endM).toFixed(
        1
      )}%;width:${(pct(rec.punchOut) - pct(sc.endM)).toFixed(1)}%"></i>`
    );
  }
  const markers = [];
  if (rec && rec.punchIn != null) {
    markers.push(
      `<i class="marker" style="left:${Math.min(100, Math.max(0, pct(rec.punchIn))).toFixed(
        1
      )}%"></i>`
    );
  }
  if (rec && rec.punchOut != null) {
    markers.push(
      `<i class="marker" style="left:${Math.min(100, Math.max(0, pct(rec.punchOut))).toFixed(
        1
      )}%"></i>`
    );
  }
  return `
    <div class="ribbon">
      <span class="ribbon-label">${timeLabel(sc.startM)}</span>
      <div class="ribbon-track">${segments.join('')}${markers.join('')}</div>
      <span class="ribbon-label">${timeLabel(sc.endM)}</span>
    </div>`;
}

function moodPicker(rec) {
  const current = rec && rec.mood ? rec.mood : null;
  return `
    <div class="mood-picker">
      ${MOODS.map(
        (mood) => `
        <button type="button" class="mood-btn ${current === mood.id ? 'on' : ''}" data-mood="${
          mood.id
        }">
          <span>${mood.emoji}</span>${tr(mood.label)}
        </button>`
      ).join('')}
    </div>`;
}

function renderDay() {
  const key = isoDate(selected);
  const rec = dayFor(selected);
  const rest = !isWorkday(cfg, selected);
  const target = Number(rec && rec.target) || schedule(cfg).dailyPay;
  const earned = Number(rec && rec.earned) || 0;
  const pct = target > 0 ? Math.min(100, (earned / target) * 100) : 0;
  const sc = schedule(cfg);
  const punchIn = rec && rec.punchIn != null ? timeLabel(rec.punchIn) : tr('未打卡');
  const punchOut = rec && rec.punchOut != null ? timeLabel(rec.punchOut) : tr('未打卡');
  const late = rec && rec.punchIn != null && rec.punchIn > sc.startM ? rec.punchIn - sc.startM : 0;
  const early =
    rec && rec.punchOut != null && rec.punchOut < sc.endM ? sc.endM - rec.punchOut : 0;
  let punchStatus = tr('未打卡');
  if (rec && rec.punchIn != null) {
    if (rec.punchOut == null) punchStatus = tr('未下班');
    else if (late > 0) punchStatus = tr('迟到 {n} 分钟', { n: late });
    else if (early > 0) punchStatus = tr('早退 {n} 分钟', { n: early });
    else punchStatus = tr('准时');
  }
  const today = key === isoDate(new Date());

  return `
    <section class="day-hero">
      <div class="ring-wrap">
        <div class="ring" style="--p:${pct.toFixed(1)}">
          <div class="ring-inner"><b>${Math.round(pct)}%</b><span>${tr('完成')}</span></div>
        </div>
        <span class="ring-label">${formatMoney(earned)} / ${formatMoney(target)}</span>
      </div>
      <div>
        <div class="day-title">
          <h2>${dayHeading(selected)}</h2>
          <span class="chip ${rest ? 'rest' : ''}">${tr(
    rest ? '休息日' : '工作日'
  )}</span>
          ${today ? `<span class="chip today">${tr('今天')}</span>` : ''}
        </div>
        <div class="day-amount">${formatMoney(earned)}<small> / ${formatMoney(target)}</small></div>
        <div class="day-line">${tr('上班 {in} · 下班 {out} · 计薪 {t}', {
          in: punchIn,
          out: punchOut,
          t: statHours(rec ? rec.workedSec : 0)
        })}</div>
        ${ribbon(rec)}
      </div>
    </section>
    <section class="day-cards">
      <div class="day-card"><span>${tr('目标')}</span><b>${formatMoney(target)}</b></div>
      <div class="day-card"><span>${tr('计薪工时')}</span><b>${statHours(
        rec ? rec.workedSec : 0
      )}</b></div>
      <div class="day-card"><span>${tr('加班')}</span><b>${
        rec && rec.overtimeSec >= 60 ? formatOvertime(rec.overtimeSec) : tr('无')
      }</b></div>
      <div class="day-card"><span>${tr('打卡状态')}</span><b>${punchStatus}</b></div>
    </section>
    <section class="mood-card">
      <div class="mood-head">
        <h3>${tr('这一天的心情')}</h3>
        <span>${tr('心情只保存在本机，会显示在月历里')}</span>
      </div>
      ${moodPicker(rec)}
      <textarea id="moodNote" class="mood-note" maxlength="160" placeholder="${tr(
        '写一句当天的心情或备注…'
      )}">${esc(rec ? rec.note : '')}</textarea>
      <div class="mood-actions">
        <button class="save-mood" id="saveMood" type="button">${tr('保存心情')}</button>
        <span>${rec && rec.punchIn == null ? tr('这一天还没有打卡，也可以先记下心情') : ''}</span>
      </div>
    </section>
    ${
      !rec || (!hasWork(rec) && !rec.mood)
        ? `<p class="empty">${tr(
            '这一天还没有工资记录。上班打卡后，收入会自动记录在这里。'
          )}</p>`
        : ''
    }`;
}

function periodText() {
  if (view === 'day') return dayTitle(selected);
  if (view === 'month') return monthTitle(anchor);
  return lang === 'en' ? String(anchor.getFullYear()) : anchor.getFullYear() + '年';
}

function periodSub() {
  if (view === 'day') {
    const rec = dayFor(selected);
    const rest = !isWorkday(cfg, selected);
    if (rest) return tr('休息日');
    return rec && rec.punchIn != null ? tr('已打卡') : tr('未打卡');
  }
  const from =
    view === 'month' ? new Date(anchor.getFullYear(), anchor.getMonth(), 1) : new Date(anchor.getFullYear(), 0, 1);
  const to =
    view === 'month'
      ? new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
      : new Date(anchor.getFullYear(), 11, 31);
  const stats = summarize(recordsBetween(from, to));
  if (lang === 'en') {
    return (
      stats.count +
      ' ' +
      (stats.count === 1 ? 'day' : 'days') +
      ' · ' +
      stats.pct +
      '% complete'
    );
  }
  return tr('记录 {n} 天 · 完成 {p}%', { n: stats.count, p: stats.pct });
}

function canNext() {
  const now = startOfDay(new Date());
  if (view === 'day') return startOfDay(selected) < now;
  if (view === 'month') {
    return (
      new Date(anchor.getFullYear(), anchor.getMonth(), 1) <
      new Date(now.getFullYear(), now.getMonth(), 1)
    );
  }
  return anchor.getFullYear() < now.getFullYear();
}

function render() {
  if (!cfg) return;
  for (const btn of $('viewTabs').querySelectorAll('button')) {
    btn.classList.toggle('on', btn.dataset.view === view);
  }
  $('periodTitle').textContent = periodText();
  $('periodSub').textContent = periodSub();
  $('next').disabled = !canNext();
  $('content').innerHTML =
    view === 'month' ? renderMonth() : view === 'year' ? renderYear() : renderDay();
}

async function saveMood(mood, options) {
  const opts = options || {};
  const noteEl = $('moodNote');
  const note = noteEl ? noteEl.value : '';
  const rec = dayFor(selected);
  const finalMood = mood || (rec && rec.mood) || null;
  try {
    const data = await bridge.setStatsMood({
      date: isoDate(selected),
      mood: finalMood,
      note
    });
    if (data && data.days) days = data.days;
  } catch (error) {
    toast(tr('保存失败'));
    return;
  }
  if (!opts.silent) {
    toast(mood ? tr('心情已记下') : tr('已保存'));
    render();
  }
}

function setView(next) {
  view = next;
  if (next === 'day') anchor = startOfDay(selected);
  else if (next === 'month')
    anchor = new Date(selected.getFullYear(), selected.getMonth(), 1);
  else anchor = new Date(selected.getFullYear(), 0, 1);
  render();
}

function shift(direction) {
  if (view === 'day') {
    selected = addDays(selected, direction);
    anchor = selected;
  } else if (view === 'month') {
    anchor = new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
    selected = anchor;
  } else {
    anchor = new Date(anchor.getFullYear() + direction, 0, 1);
    selected = anchor;
  }
  render();
}

function isTyping() {
  const active = document.activeElement;
  return !!active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT');
}

async function refresh() {
  if (document.hidden || isTyping()) return;
  try {
    cfg = await bridge.getConfig();
    const data = await bridge.getStats();
    days = (data && data.days) || {};
  } catch (error) {
    return;
  }
  render();
}

function bind() {
  $('viewTabs').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-view]');
    if (!btn) return;
    setView(btn.dataset.view);
  });

  $('prev').addEventListener('click', () => shift(-1));
  $('next').addEventListener('click', () => {
    if (canNext()) shift(1);
  });
  $('todayBtn').addEventListener('click', () => {
    selected = startOfDay(new Date());
    anchor = selected;
    render();
  });

  $('content').addEventListener('click', (event) => {
    const dayCell = event.target.closest('[data-date]');
    if (dayCell) {
      const date = parseISODate(dayCell.dataset.date);
      if (date) {
        selected = date;
        view = 'day';
        anchor = date;
        render();
      }
      return;
    }
    const mini = event.target.closest('[data-month]');
    if (mini) {
      anchor = new Date(anchor.getFullYear(), Number(mini.dataset.month), 1);
      selected = anchor;
      view = 'month';
      render();
      return;
    }
    const moodBtn = event.target.closest('[data-mood]');
    if (moodBtn) {
      saveMood(moodBtn.dataset.mood);
      return;
    }
    if (event.target.closest('#saveMood')) {
      saveMood(null);
    }
  });

  $('content').addEventListener(
    'blur',
    (event) => {
      if (event.target && event.target.id === 'moodNote') {
        saveMood(null, { silent: true });
      }
    },
    true
  );

  $('btnClose').addEventListener('click', () => bridge.closeSelf());
  $('btnSettings').addEventListener('click', () => bridge.openSettings());

  bridge.onConfig((next) => {
    if (!next) return;
    if (next.language && next.language !== lang) {
      location.reload();
      return;
    }
    cfg = next;
    if (!isTyping()) render();
  });
}

async function init() {
  cfg = await bridge.getConfig();
  lang = cfg.language === 'en' ? 'en' : 'zh';
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.title = tr('到点 · 工作统计');
  applyLanguage(document.body, lang);
  const data = await bridge.getStats();
  days = (data && data.days) || {};
  const now = startOfDay(new Date());
  anchor = now;
  selected = now;
  bind();
  render();
  setInterval(refresh, 30000);
}

init().catch((error) => {
  console.error(error);
  document.body.innerHTML =
    '<pre style="padding:24px;color:#b5544a">' +
    tr('统计页加载失败：') +
    (error && error.message ? error.message : String(error)) +
    '</pre>';
});
