'use strict';

const { t: translate, apply: applyLanguage } = window.DaodianI18n;
const bridge = window.api;
const $ = (id) => document.getElementById(id);

const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_ZH = ['日', '一', '二', '三', '四', '五', '六'];

let lang = 'zh';

function tr(zh, vars) {
  return translate(lang, zh, vars);
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function minutesToTime(minutes) {
  const value = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
  return pad2(Math.floor(value / 60)) + ':' + pad2(value % 60);
}

function timeToMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatDate(key) {
  const parts = String(key || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return String(key || '');
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
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
    '日 · 周' +
    WEEK_ZH[date.getDay()]
  );
}

function showError(message) {
  $('punchError').textContent = message || '';
}

function setBusy(busy) {
  $('btnConfirm').disabled = !!busy;
  $('btnCancel').disabled = !!busy;
}

async function confirm() {
  const punchIn = timeToMinutes($('punchIn').value);
  const punchOut = timeToMinutes($('punchOut').value);
  if (punchIn == null || punchOut == null) {
    showError(tr('请选择有效的上下班时间'));
    return;
  }
  if (punchOut < punchIn) {
    showError(tr('下班时间不能早于上班时间'));
    return;
  }
  showError('');
  setBusy(true);
  let result = null;
  try {
    result = await bridge.confirmPunch({ punchIn, punchOut });
  } catch (error) {
    result = { ok: false, error: String(error && error.message ? error.message : error) };
  }
  if (result && result.ok) return;
  setBusy(false);
  const code = result && result.error;
  if (code === 'PUNCH_ORDER') showError(tr('下班时间不能早于上班时间'));
  else if (code === 'PUNCH_INVALID') showError(tr('请选择有效的上下班时间'));
  else if (code === 'PUNCH_MISSING') showError(tr('打卡记录已失效，请重新打开'));
  else showError(tr('保存失败'));
}

function bind() {
  $('btnCancel').addEventListener('click', () => bridge.closeSelf());
  $('btnConfirm').addEventListener('click', confirm);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      bridge.closeSelf();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      confirm();
    }
  });
}

async function init() {
  const draft = await bridge.getPunchDraft();
  if (!draft) {
    showError(tr('打卡记录已失效，请重新打开'));
    $('btnConfirm').disabled = true;
    $('btnCancel').addEventListener('click', () => bridge.closeSelf());
    return;
  }
  lang = draft.language === 'en' ? 'en' : 'zh';
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.title = tr('到点 · 确认打卡');
  applyLanguage(document.body, lang);

  $('punchDate').textContent = formatDate(draft.date);
  $('punchIn').value = minutesToTime(draft.punchIn);
  $('punchOut').value = minutesToTime(draft.punchOut);
  $('punchTitle').textContent = tr(draft.existing ? '修改今日打卡' : '确认下班打卡');
  $('punchSub').textContent = tr('核对一下今天的打卡时间');
  $('btnCancel').textContent = tr('取消');
  $('btnConfirm').textContent = tr('确认打卡');
  bind();
  $('punchIn').focus();
}

init().catch((error) => {
  console.error(error);
  showError(String(error && error.message ? error.message : error));
});
