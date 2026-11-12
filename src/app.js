'use strict';

const {
  computeState,
  formatMoney,
  formatDuration,
  formatOvertime,
  timeLabel,
  isoDate
} = window.DaodianCalc;
const THEMES = window.THEMES;
const bridge = window.api;

const app = document.getElementById('app');
const widget = document.getElementById('widget');
const content = document.getElementById('content');
const btnEye = document.getElementById('btn-eye');
const btnTuck = document.getElementById('btn-tuck');
const btnSettings = document.getElementById('btn-settings');
const btnPunch = document.getElementById('punchBtn');

const FONT_STACKS = {
  system: '-apple-system, "Segoe UI", "Microsoft YaHei", sans-serif',
  serif: 'Georgia, "Songti SC", "SimSun", serif',
  mono: 'ui-monospace, Consolas, "Microsoft YaHei", monospace'
};

const ICON_EYE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_EYE_OFF =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 6.1A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.9"/><path d="M6.3 6.8A17 17 0 0 0 2.5 12S6 18 12 18a10 10 0 0 0 4.2-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
const ICON_GEAR =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>';
const ICON_TUCK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4v16"/><path d="M4 12h7"/><path d="M8 8.5l3.5 3.5L8 15.5"/></svg>';

const PIXEL_ART =
  '<svg class="pxart" viewBox="0 0 12 12" width="16" height="16" shape-rendering="crispEdges"><rect x="3" y="1" width="6" height="2" fill="#6ee787"/><rect x="3" y="3" width="6" height="3" fill="#f2c9a0"/><rect x="4" y="4" width="1" height="1" fill="#11151c"/><rect x="7" y="4" width="1" height="1" fill="#11151c"/><rect x="2" y="6" width="8" height="4" fill="#4d9fff"/><rect x="1" y="6" width="1" height="3" fill="#f2c9a0"/><rect x="10" y="6" width="1" height="3" fill="#f2c9a0"/><rect x="3" y="10" width="2" height="2" fill="#2b3a55"/><rect x="7" y="10" width="2" height="2" fill="#2b3a55"/></svg>';

const CAT_ART =
  '<svg class="cat-svg" viewBox="0 0 64 44" aria-hidden="true"><ellipse cx="32" cy="39" rx="24" ry="4" fill="rgba(107,74,134,.14)"/><path d="M14 34 Q10 24 20 22 Q24 14 34 16 Q44 12 48 22 Q58 24 54 34 Q52 38 44 38 L20 38 Q14 38 14 34 Z" fill="#9b82c4"/><path d="M18 22 L17 12 L26 18 Z" fill="#9b82c4"/><path d="M44 18 L50 10 L51 20 Z" fill="#9b82c4"/><path d="M24 28 q3 2.5 6 0" stroke="#463454" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M38 28 q3 2.5 6 0" stroke="#463454" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M31 31 q2 1.6 4 0" stroke="#463454" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M56 32 q7 -2 5 -9" stroke="#9b82c4" stroke-width="5" fill="none" stroke-linecap="round"/><text x="49" y="13" font-size="7" fill="#b9a3ff" font-family="sans-serif">z</text><text x="55" y="8" font-size="5" fill="#b9a3ff" font-family="sans-serif">z</text></svg>';

const JAR_ART = `
<svg class="jar-svg" viewBox="0 0 70 86" aria-hidden="true">
  <defs>
    <clipPath id="jarClip"><path d="M12 20 h46 a6 6 0 0 1 6 6 v48 a8 8 0 0 1 -8 8 h-42 a8 8 0 0 1 -8 -8 v-48 a6 6 0 0 1 6 -6 z"/></clipPath>
    <linearGradient id="jarGlass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eaf8ff" stop-opacity=".9"/>
      <stop offset="1" stop-color="#cfe9f5" stop-opacity=".35"/>
    </linearGradient>
    <linearGradient id="jarCoins" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd977"/>
      <stop offset="1" stop-color="#e0a53c"/>
    </linearGradient>
  </defs>
  <path d="M12 20 h46 a6 6 0 0 1 6 6 v48 a8 8 0 0 1 -8 8 h-42 a8 8 0 0 1 -8 -8 v-48 a6 6 0 0 1 6 -6 z" fill="url(#jarGlass)" stroke="#a9cfdd" stroke-width="1.5"/>
  <g clip-path="url(#jarClip)">
    <rect data-el="jarFill" x="8" y="82" width="54" height="0" fill="url(#jarCoins)"/>
    <g fill="url(#jarCoins)" stroke="#c98f2e" stroke-width="1">
      <circle data-el="coin1" cx="17" cy="82" r="5.5"/>
      <circle data-el="coin2" cx="31" cy="82" r="5.5"/>
      <circle data-el="coin3" cx="45" cy="82" r="5.5"/>
      <circle data-el="coin4" cx="57" cy="82" r="5.5"/>
    </g>
  </g>
  <rect x="18" y="12" width="34" height="9" rx="3" fill="#c9a24a"/>
  <rect x="16" y="9" width="38" height="6" rx="3" fill="#e0bb6e"/>
  <path d="M18 32 q2 -6 8 -7" stroke="#ffffff" stroke-opacity=".72" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;

let cfg = null;
let themeId = 'cream';
let themeSource = 'time';
let state = null;
let lastPhase = null;
let lastBuiltTheme = null;
let imageToken = 0;
let loadedBgPath = null;
let fadeTimer = null;
let summaryCounter = 0;
let statsCounter = 0;

function themeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

function el(name) {
  return content.querySelector('[data-el="' + name + '"]');
}

function setText(name, value) {
  const node = el(name);
  if (node) node.textContent = value;
}

function applyFontSize() {
  const scale = cfg && cfg.fontSize ? cfg.fontSize : 1;
  document.documentElement.style.fontSize = (16 * scale).toFixed(2) + 'px';
}

function updateEye() {
  if (!btnEye) return;
  btnEye.innerHTML = cfg && cfg.privacy ? ICON_EYE_OFF : ICON_EYE;
  btnEye.classList.toggle('active', !!(cfg && cfg.privacy));
}

function updateTuckButton() {
  if (!btnTuck) return;
  const on = !!(cfg && cfg.autoTuck);
  btnTuck.classList.toggle('on', on);
  btnTuck.title = on ? '关闭边缘自动收纳' : '自动收纳到边缘';
}

function applyUpdateInfo(info) {
  if (!btnSettings) return;
  const ready = !!info && info.status === 'downloaded';
  btnSettings.classList.toggle('has-update', ready);
  btnSettings.title = ready ? '设置（有新版本待安装）' : '设置';
}

function setTuckUi(payload) {
  if (payload && payload.collapsed) {
    app.dataset.tuck = payload.side || 'right';
  } else {
    app.removeAttribute('data-tuck');
  }
}

function applyCustomization(id) {
  const vars = (cfg.themeVars && cfg.themeVars[id]) || {};
  app.style.removeProperty('--accent');
  app.style.removeProperty('--radius');
  app.style.removeProperty('--font');
  app.style.removeProperty('--amount-font');

  if (vars.accent) app.style.setProperty('--accent', vars.accent);
  if (typeof vars.radius === 'number') app.style.setProperty('--radius', vars.radius + 'px');
  if (vars.font && FONT_STACKS[vars.font]) {
    app.style.setProperty('--font', FONT_STACKS[vars.font]);
    app.style.setProperty('--amount-font', FONT_STACKS[vars.font]);
  }

  const path = vars.bgImagePath;
  if (!path) {
    loadedBgPath = null;
    app.style.removeProperty('--bg-image');
    widget.classList.remove('has-bg');
    return;
  }
  if (path === loadedBgPath && widget.classList.contains('has-bg')) return;

  loadedBgPath = path;
  app.style.removeProperty('--bg-image');
  widget.classList.remove('has-bg');
  const token = ++imageToken;
  bridge.imageData(path).then((url) => {
    if (!url || token !== imageToken || themeId !== id) return;
    app.style.setProperty('--bg-image', 'url("' + url + '")');
    widget.classList.add('has-bg');
  });
}

function topRow(theme) {
  return `
    <div class="top">
      <div class="brand">
        ${theme.mascot === 'pixel' ? PIXEL_ART : ''}
        <span class="brand-dot"></span>到点
      </div>
      <div class="pill" data-el="pill">工作中</div>
    </div>`;
}

function barTemplate(theme) {
  return `
    ${topRow(theme)}
    <div class="body">
      <div class="label" data-el="label">今日已赚</div>
      <div class="amount-row">
        <span class="amount" data-el="amount">¥0.00</span>
        <span class="target" data-el="target">/ ¥0.00</span>
        <span class="pct" data-el="pct">0%</span>
      </div>
      <div class="bar"><i data-el="barFill"></i></div>
      <div class="ot-strip" data-el="otStrip">
        <div class="ot-row">
          <span data-el="effLabel">实际时薪</span>
          <b data-el="effRate">¥0.00</b>
          <em data-el="effDelta"></em>
        </div>
        <div class="ot-bar"><i data-el="otFill"></i></div>
      </div>
    </div>
    <div class="foot">
      <span data-el="footLeft"></span>
      <span data-el="footRight"></span>
    </div>
    ${theme.mascot === 'cat' ? CAT_ART : ''}`;
}

function jarTemplate(theme) {
  return `
    ${topRow(theme)}
    <div class="jar-row">
      <div class="jar-main">
        <div class="label" data-el="label">今日已赚</div>
        <div class="amount-row">
          <span class="amount" data-el="amount">¥0.00</span>
        </div>
        <div class="goal">
          <span data-el="target">目标 ¥0.00</span>
          <span class="pct" data-el="pct">0%</span>
        </div>
        <div class="ot-mini" data-el="otStrip">
          <span data-el="effLabel">实际时薪</span>
          <b data-el="effRate">¥0.00</b>
          <em data-el="effDelta"></em>
        </div>
      </div>
      <div class="jar-box">${JAR_ART}</div>
    </div>
    <div class="foot">
      <span data-el="footLeft"></span>
      <span data-el="footRight"></span>
    </div>`;
}

function receiptTemplate() {
  return `
    <div class="rtop">
      <span>到点 · 今日工资单</span>
      <span class="pill" data-el="pill">工作中</span>
    </div>
    <div class="rdash"></div>
    <div class="rline"><span>今日已赚</span><i class="dots"></i><b data-el="amount">¥0.00</b></div>
    <div class="rline" data-el="targetRow"><span>今日目标</span><i class="dots"></i><span data-el="target">¥0.00</span></div>
    <div class="rbar"><i data-el="barFill"></i></div>
    <div class="ot-line" data-el="otStrip">
      <span data-el="effLabel">实际时薪</span>
      <b data-el="effRate">¥0.00</b>
      <em data-el="effDelta"></em>
    </div>
    <div class="rfoot" data-el="footLeft"></div>
    <div class="rstamp" data-el="stamp">0%</div>`;
}

function build() {
  if (!cfg) return;
  const theme = themeById(themeId);
  app.dataset.theme = theme.id;
  app.dataset.layout = theme.layout;
  applyFontSize();
  applyCustomization(theme.id);
  content.innerHTML =
    theme.layout === 'jar'
      ? jarTemplate(theme)
      : theme.layout === 'receipt'
        ? receiptTemplate()
        : barTemplate(theme);
  lastBuiltTheme = theme.id;
  updateEye();
  state = null;
  tick();
}

function transitionBuild() {
  widget.style.opacity = '0';
  if (fadeTimer) clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => {
    build();
    requestAnimationFrame(() => {
      widget.style.opacity = '1';
    });
  }, 230);
}

function pillText(s) {
  if (s.phase === 'rest') return '休息日';
  if (s.phase === 'before') return '未上班';
  if (s.phase === 'lunch') return '午休中';
  if (s.phase === 'done') return '已下班';
  if (s.phase === 'overtime') return s.overtimeSec < 60 ? '已下班' : '加班中';
  if (s.punched && s.punchIn != null) return '工作中 · ' + timeLabel(s.punchIn);
  return '工作中';
}

function footLeft(s) {
  if (s.phase === 'rest') {
    return s.nextWorkday ? '下次上班 ' + s.nextWorkday.label : '好好休息';
  }
  if (s.phase === 'done') {
    if (s.punchIn == null) return '今日已下班';
    let text = '上班 ' + timeLabel(s.punchIn);
    if (s.punchOut != null) text += ' · 下班 ' + timeLabel(s.punchOut);
    if (s.overtimeSec >= 60) {
      text += ' · 加班 ' + formatOvertime(s.overtimeSec);
    } else if (s.punchOut != null && s.punchOut < s.endM) {
      text += ' · 早退 ' + formatDuration((s.endM - s.punchOut) * 60);
    }
    return text;
  }
  if (!cfg.showRemaining) return '';
  if (s.phase === 'before') return '距离上班 ' + formatDuration(s.remainingSec);
  if (s.phase === 'lunch') return '午休中 · ' + timeLabel(s.lunchEndM) + ' 结束';
  if (s.phase === 'overtime') {
    return s.overtimeSec < 60 ? '准时下班' : '加班 ' + formatOvertime(s.overtimeSec);
  }
  return '距离下班 ' + formatDuration(s.remainingSec);
}

function footRight(s) {
  if (s.phase === 'rest') return '';
  if (!cfg.showHourly) return '';
  const money = (v) => (cfg.privacy ? '¥•••' : formatMoney(v));
  if (s.phase === 'overtime' || (s.phase === 'done' && s.overtimeSec >= 60)) {
    if (s.overtimeMode === 'pay') {
      return '加班费 +' + money(s.overtimePay);
    }
    return '准点下班 ' + money(s.hourly);
  }
  return '时薪 ' + money(s.hourly);
}

function punchKind(s) {
  if (!s || !s.workday || s.phase === 'rest') return null;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  if (!s.punched) {
    if (nowM >= s.startM - 60 && nowM <= s.startM + 120) return 'in';
    return null;
  }
  if (s.punchOut == null && nowM >= s.endM - 60) return 'out';
  return null;
}

function updatePunch(s) {
  if (!btnPunch) return;
  const kind = punchKind(s);
  if (kind) {
    if (btnPunch.dataset.kind !== kind) {
      btnPunch.dataset.kind = kind;
      btnPunch.textContent = kind === 'in' ? '打卡上班' : '打卡下班';
    }
    if (btnPunch.hidden) btnPunch.hidden = false;
    if (app.dataset.punch !== kind) app.dataset.punch = kind;
  } else {
    if (!btnPunch.hidden) btnPunch.hidden = true;
    if (app.dataset.punch) app.removeAttribute('data-punch');
  }
}

function updateJar(progress) {
  const fill = el('jarFill');
  if (!fill) return;
  const h = 62 * Math.max(0, Math.min(1, progress));
  fill.setAttribute('y', String(82 - h));
  fill.setAttribute('height', String(h));
  for (let i = 1; i <= 4; i += 1) {
    const coin = el('coin' + i);
    if (coin) coin.setAttribute('cy', String(82 - h + 1));
  }
}

function render(s) {
  if (!s || !cfg) return;
  const layout = app.dataset.layout;
  const isRest = s.phase === 'rest';
  const isOvertime = s.phase === 'overtime';
  const isDone = s.phase === 'done';
  const privacy = !!cfg.privacy;
  const money = (v) => (privacy ? '¥•••' : formatMoney(v));
  const percent = Math.round(s.progress * 100);

  widget.classList.toggle('is-rest', isRest);
  widget.classList.toggle('is-overtime', isOvertime);
  widget.classList.toggle('privacy', privacy);

  setText('pill', pillText(s));

  let label = '今日已赚';
  if (isRest) label = layout === 'receipt' ? '' : '工资条今天放假';
  else if (isOvertime) {
    const full = s.earned >= s.target - 0.005;
    label =
      s.overtimeMode === 'pay'
        ? '今日已赚 · 含加班'
        : full
          ? '今日工资已到账'
          : '今日已赚';
  } else if (isDone) {
    const full = s.earned >= s.target - 0.005;
    label =
      s.overtimeMode === 'pay' && s.overtimeSec >= 60
        ? '今日已赚 · 含加班'
        : full
          ? '今日工资已到账'
          : '今日已赚';
  }
  setText('label', label);

  setText(
    'amount',
    isRest ? (layout === 'receipt' ? '—' : '今天休息') : money(s.earned)
  );

  const targetVisible =
    !isRest &&
    !privacy &&
    cfg.showTarget &&
    (layout === 'receipt' || !isOvertime);

  const target = el('target');
  if (target) {
    target.textContent =
      layout === 'jar'
        ? '目标 ' + money(s.target)
        : layout === 'receipt'
          ? money(s.target)
          : '/ ' + money(s.target);
    target.style.display = targetVisible ? '' : 'none';
  }
  const targetRow = el('targetRow');
  if (targetRow) {
    targetRow.style.display = targetVisible ? 'flex' : 'none';
  }

  const pct = el('pct');
  if (pct) {
    pct.textContent = percent + '%';
    pct.style.display = isRest || !cfg.showPercent ? 'none' : '';
  }

  const fill = el('barFill');
  if (fill) fill.style.width = isRest ? '0%' : (s.progress * 100).toFixed(2) + '%';
  const bar = content.querySelector('.bar, .rbar');
  if (bar) bar.style.display = isRest ? 'none' : '';

  if (layout === 'jar') updateJar(isRest ? 0 : s.progress);

  const stamp = el('stamp');
  if (stamp) {
    stamp.textContent = isRest ? '休息' : percent + '%';
    stamp.style.display = isRest || !cfg.showPercent ? 'none' : 'flex';
  }

  const otVisible =
    (isOvertime || (isDone && s.overtimeSec >= 60)) && !isRest && cfg.showOvertime;
  const strip = el('otStrip');
  if (strip) {
    strip.classList.toggle('show', otVisible);
    strip.classList.toggle('warn', otVisible && s.retention < 0.9 && s.retention >= 0.8);
    strip.classList.toggle('bad', otVisible && s.retention < 0.8);
  }
  if (otVisible) {
    setText('effLabel', s.overtimeMode === 'pay' ? '加班时薪' : '实际时薪');
    setText('effRate', money(s.effHourly));
    setText(
      'effDelta',
      s.overtimeMode === 'pay'
        ? '×1.5'
        : s.delta < 0.005
          ? ''
          : '↓ ' + money(s.delta) + '/h'
    );
    const otFill = el('otFill');
    if (otFill) otFill.style.width = (s.retention * 100).toFixed(1) + '%';
  }

  const left = footLeft(s);
  const right = footRight(s);
  if (layout === 'receipt') {
    setText('footLeft', [left, right].filter(Boolean).join(' · '));
  } else {
    setText('footLeft', left);
    setText('footRight', right);
  }
  updatePunch(s);
}

function celebrate() {
  widget.classList.add('celebrate');
  const colors = ['#f2c14e', '#7ec49a', '#e0796a', '#b9a3ff', '#00e5ff'];
  for (let i = 0; i < 30; i += 1) {
    const piece = document.createElement('i');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = Math.random() * 0.35 + 's';
    piece.style.animationDuration = 1.7 + Math.random() * 0.9 + 's';
    widget.appendChild(piece);
    setTimeout(() => piece.remove(), 3200);
  }
  setTimeout(() => widget.classList.remove('celebrate'), 2800);
  if (cfg.sound) playChime();
}

function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const start = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = start + index * 0.09;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
    setTimeout(() => ctx.close(), 1600);
  } catch (e) {
    /* audio is optional */
  }
}

function checkCelebration(s) {
  const today = isoDate(new Date());
  if (
    s.phase === 'overtime' &&
    s.overtimeSec < 180 &&
    lastPhase &&
    lastPhase !== 'overtime' &&
    cfg.lastCelebrated !== today
  ) {
    cfg.lastCelebrated = today;
    bridge.saveConfig({ lastCelebrated: today }).then((next) => {
      cfg = next;
    });
    celebrate();
  }
  lastPhase = s.phase;
}

function checkNotification(s) {
  if (s.phase !== 'overtime' || !cfg.notify || !cfg.onboarded) return;
  const today = isoDate(new Date());
  if (cfg.lastNotified === today) return;
  cfg.lastNotified = today;
  bridge.saveConfig({ lastNotified: today }).then((next) => {
    cfg = next;
  });
  const body = cfg.privacy
    ? '今日工资已到账，准点下班。'
    : s.overtimeMode === 'pay'
      ? '加班费 +' + formatMoney(s.overtimePay) + '，别太晚。'
      : s.overtimeSec > 600
        ? '已经加班 ' +
          formatOvertime(s.overtimeSec) +
          '，实际时薪 ' +
          formatMoney(s.effHourly) +
          '。'
        : s.earned >= s.target - 0.005
          ? '今日 ' + formatMoney(s.target) + ' 已赚满，准点下班。'
          : '已下班，今日已赚 ' + formatMoney(s.earned) + '。';
  bridge.notify('到点 · 今日工资已到账', body);
}

function tick() {
  if (!cfg) return;
  state = computeState(cfg, new Date());
  render(state);
  checkCelebration(state);
  checkNotification(state);
  summaryCounter += 1;
  if (summaryCounter >= 50) {
    summaryCounter = 0;
    sendSummary();
  }
  statsCounter += 1;
  if (statsCounter >= 600) {
    statsCounter = 0;
    recordStats();
  }
}

function recordStats() {
  if (!state || !state.workday) return;
  bridge.recordStats({
    date: isoDate(state.now),
    workday: true,
    earned: state.earned,
    target: state.target,
    workedSec: Math.round(state.paidSec || 0),
    overtimeSec: Math.round(state.overtimeSec || 0),
    punchIn: state.punchIn,
    punchOut: state.punchOut
  });
}

function sendSummary() {
  if (!state) return;
  let text;
  if (cfg.privacy) {
    if (state.phase === 'rest') text = '到点 · 今天休息';
    else if (state.phase === 'done') text = '到点 · 已下班';
    else if (state.phase === 'overtime') text = '到点 · 已下班';
    else if (state.phase === 'before') text = '到点 · 还没上班';
    else text = '到点 · 工作中';
    bridge.summary(text);
    return;
  }
  if (state.phase === 'rest') text = '到点 · 今天休息';
  else if (state.phase === 'done') {
    text =
      state.overtimeMode === 'pay' && state.overtimeSec >= 60
        ? '到点 · 已下班 · 加班费 +' + formatMoney(state.overtimePay)
        : '到点 · 已下班 · 今日 ' + formatMoney(state.earned);
  } else if (state.phase === 'overtime') {
    text =
      state.overtimeMode === 'pay'
        ? '到点 · 已下班 · 加班费 +' + formatMoney(state.overtimePay)
        : '到点 · 已下班 · 实际时薪 ' + formatMoney(state.effHourly);
  } else if (state.phase === 'before') text = '到点 · 还没上班';
  else text = '到点 · 今日已赚 ' + formatMoney(state.earned);
  bridge.summary(text);
}

async function handleConfig(next) {
  if (!next) return;
  const prev = cfg;
  cfg = next;
  if (!prev || prev.fontSize !== next.fontSize) applyFontSize();
  updateEye();
  updateTuckButton();
  applyCustomization(themeId);
  if (state) render(state);
}

function handleTheme(eff) {
  if (!eff || !eff.id) return;
  themeSource = eff.source;
  if (eff.id === themeId && lastBuiltTheme === eff.id) return;
  themeId = eff.id;
  transitionBuild();
}

async function init() {
  cfg = await bridge.getConfig();
  const eff = await bridge.getTheme();
  themeId = (eff && eff.id) || 'cream';
  themeSource = (eff && eff.source) || 'time';
  const tucked = await bridge.getTuck();
  setTuckUi(tucked);
  applyFontSize();
  build();
  setInterval(tick, 100);
  setInterval(sendSummary, 5000);

  bridge.onConfig(handleConfig);
  bridge.onTheme(handleTheme);

  updateEye();
  updateTuckButton();
  btnTuck.innerHTML = ICON_TUCK;
  btnSettings.innerHTML = ICON_GEAR;

  btnTuck.addEventListener('click', async (event) => {
    event.stopPropagation();
    cfg = await bridge.saveConfig({ autoTuck: !cfg.autoTuck });
    updateTuckButton();
    if (!cfg.autoTuck) setTuckUi(null);
  });

  bridge.onTuck((payload) => setTuckUi(payload));
  bridge.onUpdate((info) => applyUpdateInfo(info));
  bridge.getUpdateInfo().then((info) => applyUpdateInfo(info)).catch(() => {});

  btnEye.addEventListener('click', async (event) => {
    event.stopPropagation();
    cfg = await bridge.saveConfig({ privacy: !cfg.privacy });
    updateEye();
    if (state) render(state);
    sendSummary();
  });
  btnSettings.addEventListener('click', (event) => {
    event.stopPropagation();
    bridge.openSettings();
  });

  if (btnPunch) {
    btnPunch.addEventListener('click', async (event) => {
      event.stopPropagation();
      const kind = btnPunch.dataset.kind;
      if (kind !== 'in' && kind !== 'out') return;
      const next = await bridge.punch(kind);
      if (next) {
        cfg = next;
        state = computeState(cfg, new Date());
        render(state);
        recordStats();
        sendSummary();
      }
    });
  }

  setTimeout(recordStats, 1500);

  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    bridge.contextMenu();
  });

  sendSummary();
}

init().catch((err) => {
  console.error('init failed', err);
});
