(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DaodianCalc = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MINUTE = 60000;
  const DAY = 86400000;
  const pad2 = (n) => String(n).padStart(2, '0');
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const num = (v, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };

  function parseTime(value) {
    if (typeof value !== 'string') return null;
    const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!m) return null;
    const h = Number(m[1]);
    const mi = Number(m[2]);
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
  }

  function timeLabel(minutes) {
    const v = ((Math.round(minutes) % 1440) + 1440) % 1440;
    return pad2(Math.floor(v / 60)) + ':' + pad2(v % 60);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function atMinutes(base, minutes) {
    return new Date(startOfDay(base).getTime() + minutes * MINUTE);
  }

  function addDays(date, days) {
    const d = startOfDay(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function mondayOf(date) {
    const d = startOfDay(date);
    const dow = (d.getDay() + 6) % 7;
    return addDays(d, -dow);
  }

  function isoDate(date) {
    return (
      date.getFullYear() +
      '-' +
      pad2(date.getMonth() + 1) +
      '-' +
      pad2(date.getDate())
    );
  }

  function parseISODate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  function weekIndexFrom(anchor, date) {
    return Math.round((mondayOf(date).getTime() - mondayOf(anchor).getTime()) / (7 * DAY));
  }

  function isWorkday(cfg, date) {
    const dow = date.getDay();
    const pattern = cfg.workPattern || 'five_two';
    if (pattern === 'six_one') return dow !== 0;
    if (pattern === 'big_small') {
      if (dow === 0) return false;
      if (dow >= 1 && dow <= 5) return true;
      const anchor = parseISODate(cfg.bigSmallAnchor) || new Date(1970, 0, 5);
      return (((weekIndexFrom(anchor, date) % 2) + 2) % 2) === 0;
    }
    return dow >= 1 && dow <= 5;
  }

  function dayLabel(date, from) {
    const diff = Math.round((startOfDay(date) - startOfDay(from)) / DAY);
    if (diff === 1) return '明天';
    if (diff === 2) return '后天';
    if (diff === 0) return '今天';
    if (diff === -1) return '昨天';
    const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return names[date.getDay()];
  }

  function nextWorkday(cfg, now) {
    const startM = parseTime(cfg.workStart);
    const start = startM == null ? 540 : startM;
    for (let i = 1; i <= 21; i += 1) {
      const d = addDays(now, i);
      if (isWorkday(cfg, d)) {
        return {
          date: d,
          days: i,
          startAt: atMinutes(d, start),
          label: dayLabel(d, now) + ' ' + timeLabel(start)
        };
      }
    }
    return null;
  }

  function validateSchedule(cfg) {
    const errors = {};
    if (!(num(cfg.salary, 0) > 0)) errors.salary = '月薪需要大于 0';
    if (!(num(cfg.payDays, 0) > 0)) errors.payDays = '计薪天数需要大于 0';

    const s = parseTime(cfg.workStart);
    const e = parseTime(cfg.workEnd);
    const lunchS = parseTime(cfg.lunchStart);
    const lunchLen = num(cfg.lunchMinutes, 90);

    if (s == null) errors.workStart = '格式应为 HH:MM';
    if (e == null) errors.workEnd = '格式应为 HH:MM';
    if (lunchS == null) errors.lunchStart = '格式应为 HH:MM';
    if (lunchLen < 0 || lunchLen > 480) errors.lunchMinutes = '午休时长需在 0–480 分钟';

    if (s != null && e != null) {
      if (e <= s) {
        errors.workEnd = '下班时间要晚于上班时间';
      } else {
        const total = e - s;
        if (total < 30) errors.workEnd = '上下班间隔太短';
        if (lunchS != null && lunchLen > 0) {
          if (lunchS < s || lunchS + lunchLen > e) {
            errors.lunchStart = '午休需要落在上下班时间之内';
          } else if (total - lunchLen < 30) {
            errors.lunchMinutes = '扣掉午休后工时太短';
          }
        }
      }
    }
    return errors;
  }

  function schedule(cfg) {
    const startM = parseTime(cfg.workStart);
    const endM = parseTime(cfg.workEnd);
    const lunchM = parseTime(cfg.lunchStart);
    const start = startM == null ? 540 : startM;
    const end = endM == null || endM <= start ? start + 540 : endM;
    const lunchLen = clamp(num(cfg.lunchMinutes, 90), 0, 720);
    let lunchStart = lunchM == null ? Math.min(start + 180, end) : lunchM;
    lunchStart = clamp(lunchStart, start, end);
    let lunchEnd = Math.min(end, lunchStart + lunchLen);
    if (lunchEnd <= lunchStart) {
      lunchStart = start;
      lunchEnd = start;
    }
    const workMinutes = Math.max(1, end - start - (lunchEnd - lunchStart));
    const salary = Math.max(0, num(cfg.salary, 0));
    const payDays = Math.max(0.01, num(cfg.payDays, 21.75));
    const dailyPay = salary / payDays;
    return {
      startM: start,
      endM: end,
      lunchStartM: lunchStart,
      lunchEndM: lunchEnd,
      workMinutes,
      workSeconds: workMinutes * 60,
      dailyPay,
      hourly: dailyPay / (workMinutes / 60)
    };
  }

  function workedSecondsAt(now, startAt, lunchStartAt, lunchEndAt, endAt) {
    const cap = Math.min(now.getTime(), endAt.getTime());
    if (cap <= startAt.getTime()) return 0;
    const ls = Math.max(lunchStartAt.getTime(), startAt.getTime());
    const le = Math.min(lunchEndAt.getTime(), endAt.getTime());
    let overlap = 0;
    if (le > ls) overlap = Math.max(0, Math.min(cap, le) - ls);
    const total = cap - startAt.getTime() - overlap;
    const max = endAt.getTime() - startAt.getTime() - Math.max(0, le - ls);
    return clamp(total / 1000, 0, max / 1000);
  }

  function computeState(cfg, nowInput) {
    const now = nowInput instanceof Date ? nowInput : new Date();
    const sc = schedule(cfg);
    const startAt = atMinutes(now, sc.startM);
    const endAt = atMinutes(now, sc.endM);
    const lunchStartAt = atMinutes(now, sc.lunchStartM);
    const lunchEndAt = atMinutes(now, sc.lunchEndM);
    const workSec = sc.workSeconds;
    const perSec = sc.dailyPay / workSec;
    const workday = isWorkday(cfg, now);
    const mode = cfg.overtimeMode === 'pay' ? 'pay' : 'dilute';

    const state = {
      now,
      ...sc,
      workday,
      startAt,
      endAt,
      lunchStartAt,
      lunchEndAt,
      phase: 'rest',
      progress: 0,
      earned: 0,
      target: sc.dailyPay,
      overtimeSec: 0,
      overtimePay: 0,
      effHourly: sc.hourly,
      retention: 1,
      delta: 0,
      remainingSec: 0,
      nextWorkday: null,
      overtimeMode: mode
    };

    if (!workday) {
      const next = nextWorkday(cfg, now);
      state.nextWorkday = next;
      if (next) state.remainingSec = Math.max(0, (next.startAt - now) / 1000);
      return state;
    }

    const worked = workedSecondsAt(now, startAt, lunchStartAt, lunchEndAt, endAt);
    state.progress = clamp(worked / workSec, 0, 1);
    state.earned = Math.min(worked, workSec) * perSec;

    if (now < startAt) {
      state.phase = 'before';
      state.remainingSec = (startAt - now) / 1000;
    } else if (now >= endAt) {
      state.phase = 'overtime';
      state.overtimeSec = Math.max(0, (now.getTime() - endAt.getTime()) / 1000);
      state.remainingSec = 0;
    } else if (now >= lunchStartAt && now < lunchEndAt) {
      state.phase = 'lunch';
      state.remainingSec = (endAt - now) / 1000;
    } else {
      state.phase = 'working';
      state.remainingSec = (endAt - now) / 1000;
    }

    if (state.phase === 'overtime') {
      const ot = state.overtimeSec;
      if (mode === 'pay') {
        state.overtimePay = (ot / 3600) * sc.hourly * 1.5;
        state.earned = sc.dailyPay + state.overtimePay;
        state.effHourly = sc.hourly * 1.5;
        state.retention = 1;
        state.delta = 0;
      } else {
        const totalHours = (Math.min(worked, workSec) + ot) / 3600;
        state.effHourly = totalHours > 0 ? state.earned / totalHours : sc.hourly;
        state.retention = sc.hourly > 0 ? state.effHourly / sc.hourly : 1;
        state.delta = Math.max(0, sc.hourly - state.effHourly);
        state.overtimePay = 0;
      }
    }

    return state;
  }

  function formatMoney(value, opts) {
    const v = Number.isFinite(Number(value)) ? Number(value) : 0;
    let text;
    try {
      text = v.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (e) {
      text = v.toFixed(2);
    }
    return (opts && opts.bare ? '' : '¥') + text;
  }

  function formatDuration(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return h + 'h ' + pad2(m) + 'm';
    if (m > 0) return m + 'm';
    return s + 's';
  }

  function formatOvertime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h + 'h ' + pad2(m) + 'm';
  }

  function shiftLabel(cfg, date) {
    return dayLabel(date, new Date());
  }

  return {
    parseTime,
    timeLabel,
    startOfDay,
    atMinutes,
    addDays,
    mondayOf,
    isoDate,
    parseISODate,
    isWorkday,
    nextWorkday,
    dayLabel,
    validateSchedule,
    schedule,
    computeState,
    formatMoney,
    formatDuration,
    formatOvertime,
    shiftLabel,
    clamp
  };
});
