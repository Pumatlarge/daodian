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

  function workedSecondsBetween(fromAt, toAt, lunchStartAt, lunchEndAt) {
    if (!(toAt > fromAt)) return 0;
    const ls = Math.max(lunchStartAt.getTime(), fromAt.getTime());
    const le = Math.min(lunchEndAt.getTime(), toAt.getTime());
    const overlap = le > ls ? le - ls : 0;
    return Math.max(0, (toAt - fromAt - overlap) / 1000);
  }

  function computeState(cfg, nowInput) {
    const now = nowInput instanceof Date ? nowInput : new Date();
    const sc = schedule(cfg);
    const plannedStartAt = atMinutes(now, sc.startM);
    const plannedEndAt = atMinutes(now, sc.endM);
    const lunchStartAt = atMinutes(now, sc.lunchStartM);
    const lunchEndAt = atMinutes(now, sc.lunchEndM);
    const workSec = sc.workSeconds;
    const perSec = sc.dailyPay / workSec;
    const workday = isWorkday(cfg, now);
    const mode = cfg.overtimeMode === 'pay' ? 'pay' : 'dilute';
    const clockMode =
      cfg.clockMode === 'punch' || cfg.clockMode === 'custom' ? cfg.clockMode : 'schedule';
    const grace = clamp(num(cfg.clockGraceMin, 0), 0, 60);

    const today = isoDate(now);
    const punchedToday =
      cfg.punchDate === today &&
      cfg.punchIn != null &&
      Number.isFinite(Number(cfg.punchIn));
    const punchIn = punchedToday ? clamp(Math.round(Number(cfg.punchIn)), 0, 1439) : null;
    let punchOut = null;
    if (punchedToday && cfg.punchOut != null && Number.isFinite(Number(cfg.punchOut))) {
      const out = clamp(Math.round(Number(cfg.punchOut)), 0, 1439);
      if (out >= punchIn) punchOut = out;
    }

    let payStartM = sc.startM;
    if (clockMode !== 'schedule' && punchIn != null) {
      if (clockMode === 'punch') {
        payStartM = punchIn;
      } else if (cfg.clockLate !== false) {
        payStartM = punchIn > sc.startM + grace ? punchIn : sc.startM;
      }
    }

    let done = false;
    let baseEndM = sc.endM;
    if (clockMode !== 'schedule' && punchOut != null) {
      done = true;
      if (clockMode === 'punch') {
        baseEndM = Math.min(punchOut, sc.endM);
      } else if (cfg.clockEarly !== false) {
        baseEndM = punchOut < sc.endM - grace ? punchOut : sc.endM;
      }
    }

    const noOvertime = clockMode === 'custom' && cfg.clockOvertime === false;
    if (!done && noOvertime && now.getTime() >= plannedEndAt.getTime()) {
      done = true;
      baseEndM = sc.endM;
    }

    const payStartAt = atMinutes(now, payStartM);
    const baseEndAt = done
      ? atMinutes(now, baseEndM)
      : new Date(Math.min(now.getTime(), plannedEndAt.getTime()));
    const workedSec = workedSecondsBetween(payStartAt, baseEndAt, lunchStartAt, lunchEndAt);
    const paidSec = Math.min(workedSec, workSec);
    const overtimeStartAt = new Date(
      Math.max(plannedEndAt.getTime(), payStartAt.getTime())
    );
    const overtimeEndAt = done
      ? atMinutes(now, punchOut != null ? punchOut : baseEndM)
      : now;
    const overtimeSec = noOvertime
      ? 0
      : Math.max(0, (overtimeEndAt.getTime() - overtimeStartAt.getTime()) / 1000);

    const state = {
      now,
      ...sc,
      workday,
      clockMode,
      payStartM,
      startAt: payStartAt,
      endAt: plannedEndAt,
      plannedStartAt,
      plannedEndAt,
      lunchStartAt,
      lunchEndAt,
      punchIn,
      punchOut,
      punched: punchedToday,
      phase: 'rest',
      progress: 0,
      earned: 0,
      target: sc.dailyPay,
      workedSec,
      paidSec,
      overtimeSec,
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

    state.progress = clamp(paidSec / workSec, 0, 1);
    state.earned = paidSec * perSec;

    if (done) {
      state.phase = 'done';
      state.remainingSec = 0;
    } else if (now.getTime() < payStartAt.getTime()) {
      state.phase = 'before';
      state.remainingSec = (payStartAt - now) / 1000;
    } else if (now.getTime() >= plannedEndAt.getTime()) {
      state.phase = 'overtime';
      state.remainingSec = 0;
    } else if (
      now.getTime() >= lunchStartAt.getTime() &&
      now.getTime() < lunchEndAt.getTime()
    ) {
      state.phase = 'lunch';
      state.remainingSec = (plannedEndAt - now) / 1000;
    } else {
      state.phase = 'working';
      state.remainingSec = (plannedEndAt - now) / 1000;
    }

    if (state.overtimeSec > 0) {
      if (mode === 'pay') {
        state.overtimePay = (state.overtimeSec / 3600) * sc.hourly * 1.5;
        state.earned += state.overtimePay;
        state.effHourly = sc.hourly * 1.5;
        state.retention = 1;
        state.delta = 0;
      } else {
        const totalHours = (paidSec + state.overtimeSec) / 3600;
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
