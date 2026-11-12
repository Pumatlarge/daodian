(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DaodianI18n = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LANGS = ['zh', 'en'];

  // Chinese is the source language: the UI is authored in Chinese and every
  // English string is keyed by the exact Chinese text (including {placeholders}).
  const EN = {
    // ── brand / window titles ─────────────────────────────
    '到点': 'Daodian',
    '到点 · 设置': 'Daodian · Settings',
    '到点 · 工作统计': 'Daodian · Work statistics',
    '到点 · 第一次设置': 'Daodian · Setup',
    '到点 · 今日已赚': "Daodian · Today's pay",
    '到点 · 今天休息': 'Daodian · Rest day',
    '到点 · 已下班': 'Daodian · Clocked out',
    '到点 · 还没上班': 'Daodian · Not at work yet',
    '到点 · 工作中': 'Daodian · Working',
    '到点 · 新版本已就绪': 'Daodian · Update ready',
    '到点 · 更新已就绪': 'Daodian · Update ready',
    '到点 · 所有数据仅保存在本机': 'Daodian · All data stays on this device',
    '到点 · 今日工资已到账': "Daodian · Today's pay is in",
    '到点 · 今日工资单': 'Daodian · Daily payslip',
    '今日目标': "Today's target",
    'DAODIAN · 工作统计': 'DAODIAN · WORK STATISTICS',

    // ── settings static ───────────────────────────────────
    '工资、工时、皮肤与显示都在这里。': 'Pay, hours, skins and display, all here.',
    '当前：{name}': 'Now: {name}',
    '当前：奶油手账': 'Now: Cream Journal',
    '当前生效：奶油手账 · 跟随时间': 'Active: Cream Journal · By time',
    '日薪 ¥367.82 · 每天有效工时 8 小时': 'Daily ¥367.82 · 8 paid hours per day',
    '日薪 ¥367.82': 'Daily ¥367.82',
    '每天有效工时 8 小时': '8 paid hours per day',
    '¥45.98 / 小时': '¥45.98 / hour',
    '0 分钟': '0 min',
    '第 1 步，共 3 步': 'Step 1 of 3',
    '关闭': 'Close',
    '收入与工时': 'Pay & hours',
    '税后月薪': 'Monthly take-home',
    '元': 'CNY',
    '每月计薪天数': 'Paid days / month',
    '天': 'days',
    '工作日模式': 'Work week',
    '固定双休（周一至周五）': 'Mon–Fri (two-day weekend)',
    '大小周': 'Alternating weeks (big / small)',
    '单休（周一至周六）': 'Mon–Sat (one-day weekend)',
    '加班计薪': 'Overtime pay',
    '时薪稀释（月薪制，推荐）': 'Dilute hourly rate (salaried, recommended)',
    '按 1.5 倍累计加班费': '1.5× overtime pay',
    '上班时间': 'Start time',
    '下班时间': 'End time',
    '午休开始': 'Lunch start',
    '午休时长': 'Lunch length',
    '分钟': 'min',
    '本周六上班（大周）': 'Work this Saturday (big week)',
    '日薪 {m} · 每天有效工时 {h} 小时': 'Daily {m} · {h} paid hours per day',
    '{m} / 小时': '{m} / hour',
    '打卡与计算': 'Clock & pay',
    '打卡后如何计薪': 'How punches affect pay',
    '按设置的班次计算（默认）': 'Scheduled shift (default)',
    '按实际打卡时间计算': 'Actual punch times',
    '自定义': 'Custom',
    '迟到 / 早退宽限': 'Late / early grace',
    '{n} 分钟': '{n} min',
    '迟到时从实际打卡时间开始计钱': 'Late arrival starts pay at the actual punch-in',
    '早退时在下班打卡时间停止计钱': 'Early leave stops pay at the actual punch-out',
    '班次结束后继续按加班计算': 'Time after the shift counts as overtime',
    '打卡按钮会出现在上班 / 下班时间附近；按班次计算时只记录打卡时间，不影响金额。':
      'Punch buttons appear around your start and end times; in scheduled mode they are recorded but do not change the pay.',
    '金额从上班打卡开始，下班打卡后停止；迟到、早退会少算，晚走继续按加班计算。':
      'Pay starts at clock-in and stops at clock-out; late arrival and early leave reduce it, and staying late adds overtime.',
    '分别选择迟到、早退和加班怎么算；宽限时间内的迟到 / 早退不扣，未打卡时仍按班次计算。':
      'Choose how late arrival, early leave and overtime count; grace minutes forgive small differences, and days without a punch still follow the schedule.',
    '打卡只记录上下班时间，金额始终按设置的班次计算；打卡按钮会出现在上班 / 下班时间附近。':
      'Punches only record your times; pay always follows the configured shift. The punch button appears around your start and end times.',
    '皮肤与切换': 'Skins & switching',
    '当前生效：{name} · {source}': 'Active: {name} · {source}',
    '恢复自动切换': 'Restore auto switch',
    '切换方式': 'Switching',
    '跟随时间（白天 / 夜间）': 'By time (day / night)',
    '跟随系统深浅色': 'Follow system theme',
    '手动锁定': 'Lock manually',
    '白天时段': 'Day hours',
    '到': 'to',
    '白天皮肤': 'Day skin',
    '夜间皮肤': 'Night skin',
    '跟随时间': 'By time',
    '手动模式': 'Manual',
    '跟随系统': 'Follow system',
    '外观自定义': 'Appearance',
    '自定义哪套皮肤': 'Skin to customize',
    '字体': 'Font',
    '跟随主题': 'Theme default',
    '系统无衬线': 'System sans',
    '衬线 / 宋体': 'Serif / Song',
    '等宽 / 代码': 'Mono / code',
    '强调色': 'Accent color',
    '圆角': 'Corner radius',
    '背景图片': 'Background image',
    '无': 'None',
    '选择图片': 'Choose image',
    '清除': 'Clear',
    '字号': 'Font size',
    '窗口透明度': 'Window opacity',
    '背景图片会复制到本地数据目录，原图移动或删除都不影响；每套皮肤单独记忆。':
      'Background images are copied into the local data folder, so moving or deleting the original is fine; each skin remembers its own.',
    '显示与隐私': 'Display & privacy',
    '显示目标金额': 'Show target amount',
    '金额旁边显示今日目标': "Show today's target next to the amount",
    '显示百分比': 'Show percentage',
    '进度条旁边显示完成比例': 'Show completion next to the progress bar',
    '显示剩余时间': 'Show remaining time',
    '距离下班、加班时长': 'Time to off-work and overtime',
    '显示时薪': 'Show hourly rate',
    '底部显示正常时薪 / 加班实际时薪': 'Show the normal hourly rate / effective overtime rate at the bottom',
    '显示加班时薪条': 'Show overtime hourly strip',
    '下班后显示时薪稀释进度': 'Show the hourly-rate dilution after hours',
    '隐私模式': 'Privacy mode',
    '把金额换成 ¥•••，只保留进度': 'Mask amounts as ¥••• but keep the progress',
    '桌面与提醒': 'Desktop & alerts',
    '窗口置顶': 'Always on top',
    '始终显示在其他窗口上方': 'Keep above other windows',
    '开机自启': 'Start with Windows',
    '登录 Windows 后自动打开到点（免安装版可能受路径限制）':
      'Open Daodian after Windows login (portable builds may be path-limited)',
    '到点通知': 'Off-work notification',
    '下班时发一条 Windows 通知': 'Send a Windows notification at off-work time',
    '到点音效': 'Off-work chime',
    '金币到账的三声轻响': 'A soft three-note chime',
    '边缘自动收纳': 'Edge auto-tuck',
    '鼠标离开后滑到最近的左 / 右屏幕边缘，只留一个小把手；移过去会重新展开':
      'After the pointer leaves, slide to the nearest screen edge and leave a small handle; hover it to expand',
    '收纳延迟': 'Tuck delay',
    '快捷键：': 'Shortcut:',
    '隐藏 / 显示小组件；右键小组件或托盘图标可以快速换肤、调透明度、切隐私模式。':
      'hide / show the widget; right-click the widget or tray icon for skins, opacity and privacy.',
    '关于与更新': 'About & updates',
    '自动检查更新': 'Check for updates automatically',
    '启动后与每 6 小时检查一次 GitHub Releases；仅安装版会自动下载':
      'Check GitHub Releases on launch and every 6 hours; only installed builds download automatically',
    '当前版本': 'Current version',
    '当前': 'Active',
    '设为白天': 'Set as day',
    '设为夜间': 'Set as night',
    '立即使用': 'Use now',
    '图片': 'Images',
    '正在读取…': 'Reading…',
    '检查更新': 'Check for updates',
    '安装更新': 'Install update',
    '安装版会在后台下载更新，下载完成后询问是否安装；安装时会打开安装程序窗口，不会在退出时静默安装。便携版不会自动更新，检查更新会打开 Releases 页面。':
      'Installed builds download in the background and ask before installing; the installer window is visible and nothing installs silently on quit. Portable builds never self-update; “check for updates” opens the Releases page.',
    'GitHub 项目主页': 'GitHub project',
    'github.com/Pumatlarge/daodian · 源码、更新日志与问题反馈':
      'github.com/Pumatlarge/daodian · source, changelog and issues',
    '打开 GitHub': 'Open GitHub',
    '打开数据目录': 'Open data folder',
    '退出到点': 'Quit Daodian',
    '已保存': 'Saved',
    '语言 / Language': 'Language',
    '界面语言 / Interface language': 'Interface language',
    '中文': '中文',
    'English': 'English',

    // ── setup static ──────────────────────────────────────
    '第一次见面': 'Hello there',
    '先认识一下你的工资': "Let's meet your paycheck",
    '填完这三步，“到点”就会在桌面替你数钱。所有数据只留在本机。':
      'Three quick steps and Daodian will count your pay on the desktop. Everything stays on this device.',
    '你的时间值多少钱': 'What is your time worth?',
    '21.75 是常用月计薪天数；按实际出勤算的话填 22 或当月工作日。':
      "21.75 is the common monthly paid-day count; use 22 or this month's workdays if you track attendance.",
    '几点上班，几点自由': "When work starts, when you're free",
    '午休期间工资暂停累计；加班后时薪会按“日薪 ÷ 总工时”自动稀释。':
      'Pay pauses during lunch; after hours the hourly rate dilutes as “daily pay ÷ total hours”.',
    '先挑一套气质': 'Pick a mood',
    '跟随时间（推荐）': 'By time (recommended)',
    '固定一套': 'One fixed skin',
    '固定皮肤': 'Fixed skin',
    '6 套皮肤都会内置，之后随时可以换；白天默认奶油手账，晚上默认赛博霓虹。':
      'All six skins are included and can be changed later; Cream Journal by day, Cyber Neon by night.',
    '上一步': 'Back',
    '下一步': 'Next',
    '第 {n} 步，共 3 步': 'Step {n} of 3',
    '开始到点': 'Start Daodian',
    '正在开工…': 'Starting…',
    '白天时段格式不对': 'Day hours are not valid',

    // ── stats static / dynamic ────────────────────────────
    '把每一天，存进日历。': 'Every day, kept in a calendar.',
    '记录收获，也记下当天的心情。': 'Log the wins, and how the day felt.',
    '日': 'Day',
    '月': 'Month',
    '年': 'Year',
    '回到今天': 'Today',
    '数据保存在本机 stats.json · 今天实时更新': 'Saved in stats.json on this device · Today updates live',
    '打开设置': 'Open settings',
    '上一段': 'Previous',
    '下一段': 'Next',
    '本月已赚': 'Earned this month',
    '本年已赚': 'Earned this year',
    '日均': 'Daily average',
    '计薪工时': 'Paid hours',
    '加班': 'Overtime',
    '目标完成': 'Target completion',
    '记录天数': 'Recorded days',
    '完成 {p}%': '{p}% complete',
    '{n} 个记录日': '{n} recorded days',
    '不含加班': 'excl. overtime',
    '按打卡与班次': 'From punches & schedule',
    '暂无记录': 'No records yet',
    '记录 {n} 天 · 完成 {p}%': '{n} days · {p}% complete',
    '最努力的一天': 'Best day',
    '最努力的月份': 'Best month',
    '加班最多': 'Most overtime',
    '心情分布': 'Moods',
    '这个月还没有工资记录': 'No pay records this month',
    '这个月没有加班': 'No overtime this month',
    '今年还没有工资记录': 'No pay records this year',
    '今年还没有加班记录': 'No overtime this year',
    '颜色越深 = 当天工资越高': 'Darker = higher pay',
    '右上角是当天心情，右下角 +m 是加班': 'Mood top-right; +m overtime bottom-right',
    '这一天的心情': 'The mood of this day',
    '心情只保存在本机，会显示在月历里': 'Saved on this device and shown in the month calendar',
    '保存心情': 'Save mood',
    '写一句当天的心情或备注…': 'A note about the day…',
    '这一天还没有打卡，也可以先记下心情': 'No punch yet; you can still save a mood',
    '这一天还没有工资记录。上班打卡后，收入会自动记录在这里。':
      'No pay record for this day. After you clock in, earnings are logged here.',
    '还没有记录心情': 'No moods yet',
    '心情已记下': 'Mood saved',
    '保存失败': 'Save failed',
    '未打卡': 'No punch',
    '未下班': 'Not clocked out',
    '迟到 {n} 分钟': 'Late {n} min',
    '早退 {n} 分钟': 'Left early {n} min',
    '准时': 'On time',
    '休息日': 'Rest day',
    '工作日': 'Workday',
    '今天': 'Today',
    '已打卡': 'Clocked in',
    '目标': 'Target',
    '打卡状态': 'Punch',
    '上班 {in} · 下班 {out} · 计薪 {t}': 'In {in} · Out {out} · Paid {t}',
    '上班 {in}': 'In {in}',
    '下班 {out}': 'Out {out}',
    '完成': 'complete',
    '开心': 'Happy',
    '平静': 'Calm',
    '一般': 'Meh',
    '累': 'Tired',
    '困': 'Sleepy',
    '拼': 'On fire',

    // widget
    '今日已赚': 'Earned today',
    '工资条今天放假': 'The payslip is off today',
    '今日已赚 · 含加班': 'Earned today · incl. OT',
    '今日工资已到账': "Today's pay is in",
    '今天休息': 'Rest today',
    '休息': 'Rest',
    '未上班': 'Not at work',
    '午休中': 'Lunch',
    '已下班': 'Off work',
    '加班中': 'Overtime',
    '工作中': 'Working',
    '工作中 · {t}': 'Working · {t}',
    '下次上班 {label}': 'Next shift {label}',
    '好好休息': 'Enjoy the break',
    '今日已下班': 'Off work today',
    '上班 {in} · 下班 {out}': 'In {in} · Out {out}',
    '上班 {in} · 下班 {out} · 加班 {t}': 'In {in} · Out {out} · OT {t}',
    '上班 {in} · 下班 {out} · 早退 {t}': 'In {in} · Out {out} · Left early {t}',
    '距离上班 {t}': 'Work starts in {t}',
    '午休中 · {t} 结束': 'Lunch until {t}',
    '加班 {t}': 'OT {t}',
    '早退 {t}': 'Left early {t}',
    '准时下班': 'Off on time',
    '距离下班 {t}': 'Off in {t}',
    '加班费 +{m}': 'OT pay +{m}',
    '准点下班 {m}': 'Base hourly {m}',
    '时薪 {m}': 'Hourly {m}',
    '目标 {m}': 'Target {m}',
    '实际时薪': 'Effective hourly',
    '加班时薪': 'OT hourly',
    '打卡上班': 'Clock in',
    '打卡下班': 'Clock out',
    '关闭边缘自动收纳': 'Turn off edge auto-tuck',
    '自动收纳到边缘': 'Tuck to the edge automatically',
    '设置（有新版本待安装）': 'Settings (update ready)',
    '设置': 'Settings',
    '最新版本': 'Latest',

    // notifications / widget summary
    '今日工资已到账，准点下班。': "Today's pay is in. Off on time.",
    '加班费 +{m}，别太晚。': 'Overtime pay +{m}; don\'t stay too late.',
    '已经加班 {t}，实际时薪 {m}。': 'Overtime {t}; effective hourly {m}.',
    '今日 {m} 已赚满，准点下班。': 'Today\'s {m} is complete. Off on time.',
    '已下班，今日已赚 {m}。': 'Clocked out. Earned {m} today.',
    '到点 · 已下班 · 加班费 +{m}': 'Daodian · Clocked out · OT pay +{m}',
    '到点 · 已下班 · 今日 {m}': 'Daodian · Clocked out · Today {m}',
    '到点 · 已下班 · 实际时薪 {m}': 'Daodian · Clocked out · Effective hourly {m}',
    '到点 · 今日已赚 {m}': 'Daodian · Earned today {m}',

    // ── main menus / dialogs ──────────────────────────────
    '隐藏小组件': 'Hide widget',
    '显示小组件': 'Show widget',
    '打开设置…': 'Settings…',
    '工作统计…': 'Work statistics…',
    '撤销今日打卡': "Undo today's punch",
    '今日已打卡 {in}–{out}': 'Today: {in}–{out}',
    '皮肤': 'Skins',
    '透明度': 'Opacity',
    '现在收纳到边缘': 'Tuck to edge now',
    '下载新版本…': 'Download update…',
    '检查更新…': 'Check for updates…',
    '安装更新 v{v}': 'Install update v{v}',
    '正在下载更新 {p}%': 'Downloading update {p}%',
    '退出到点': 'Quit Daodian',
    '现在安装': 'Install now',
    '稍后': 'Later',
    'v{v} 已下载完成': 'v{v} is ready',
    '现在安装会关闭到点，并打开安装程序完成更新。选择「稍后」不会自动安装，可以随时从托盘菜单或设置里的按钮安装。':
      'Install now closes Daodian and opens the installer. “Later” never installs on its own; use the tray menu or Settings when ready.',
    'v{v} 已下载，可在托盘或设置中确认安装。': 'v{v} is ready. Confirm the install from the tray or Settings.',
    '选择背景图片': 'Choose a background image',
    '图片超过 16MB，换一张小一点的吧': 'The image is over 16 MB; pick a smaller one.',
    '这张图片读不出来': 'This image cannot be read.',
    '复制图片失败：': 'Failed to copy the image: ',
    '下载新版本': 'Download update',

    // ── settings dynamic ─────────────────────────────────
    '尚未检查更新': 'Not checked yet',
    '开发模式：自动更新仅在打包后的安装版中启用':
      'Development mode: auto-update is only available in packaged installed builds.',
    '便携版：请手动下载新版本': 'Portable build: download the new version manually.',
    '正在检查更新…': 'Checking for updates…',
    '发现 v{v}，准备下载…': 'v{v} found, preparing download…',
    '正在下载 v{v} · {p}%': 'Downloading v{v} · {p}%',
    'v{v} 已下载，点击「安装更新」后才会安装':
      'v{v} is ready; it installs only after you click “Install update”',
    '已是最新版本 v{v}': 'You are on the latest version, v{v}',
    '检查失败：{e}': 'Check failed: {e}',
    '网络错误': 'Network error',
    '打开下载页': 'Open download page',
    '重试': 'Retry',
    '保存失败：{e}': 'Save failed: {e}',
    '白天将使用「{name}」': 'Day skin set to “{name}”',
    '夜间将使用「{name}」': 'Night skin set to “{name}”',
    '已切换到「{name}」': 'Switched to “{name}”',
    '已恢复自动切换': 'Auto switch restored',
    '背景已更新': 'Background updated',
    '已清除背景': 'Background cleared',
    '日薪 {m}': 'Daily {m}',
    '每天有效工时 {h} 小时': '{h} paid hours per day',

    // ── calc validation / labels ─────────────────────────
    '明天': 'Tomorrow',
    '后天': 'In two days',
    '昨天': 'Yesterday',
    '周日': 'Sun',
    '周一': 'Mon',
    '周二': 'Tue',
    '周三': 'Wed',
    '周四': 'Thu',
    '周五': 'Fri',
    '周六': 'Sat',
    '月薪需要大于 0': 'Salary must be greater than 0',
    '计薪天数需要大于 0': 'Paid days must be greater than 0',
    '格式应为 HH:MM': 'Use HH:MM',
    '午休时长需在 0–480 分钟': 'Lunch must be 0–480 minutes',
    '下班时间要晚于上班时间': 'Off-work time must be after the start time',
    '上下班间隔太短': 'The shift is too short',
    '午休需要落在上下班时间之内': 'Lunch must be inside the shift',
    '扣掉午休后工时太短': 'Too few hours after lunch',

    // ── themes ────────────────────────────────────────────
    '奶油手账': 'Cream Journal',
    '纸感暖色，白天久看不累': 'Warm paper that stays easy on the eyes by day.',
    '赛博霓虹': 'Cyber Neon',
    '深色桌面的科技感，夜班气质': 'Neon tech for a dark desktop and late shifts.',
    '像素打工人': 'Pixel Worker',
    '8-bit 游戏味，小人陪你上班': '8-bit charm with a little worker by your side.',
    '玻璃存钱罐': 'Glass Jar',
    '金币看得见地涨，最有存钱感': 'Watch the coins pile up; the strongest saving feeling.',
    '复古工资条': 'Retro Payslip',
    '把工资单做成梗，细节最多': 'A playful payslip with the most detail.',
    '猫咪陪伴': 'Cat Companion',
    '软萌治愈，猫替你熬着': 'Soft and soothing; the cat stays up with you.',

    // misc setup / stats errors
    '保存失败：': 'Save failed: ',
    '加载失败：': 'Failed to load: ',
    '设置页加载失败：': 'Settings failed to load: ',
    '统计页加载失败：': 'Statistics failed to load: '
  };

  function t(lang, zh, vars) {
    const template = lang === 'en' ? EN[zh] || zh : zh;
    if (!vars) return template;
    let text = template;
    for (const key of Object.keys(vars)) {
      text = text.split('{' + key + '}').join(String(vars[key]));
    }
    return text;
  }

  const SKIP_TAGS = { SCRIPT: true, STYLE: true, TEXTAREA: true };

  function apply(root, lang) {
    if (!root || lang !== 'en' || typeof document === 'undefined') return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const value = node.nodeValue;
        if (!value || !value.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || SKIP_TAGS[parent.tagName] || parent.closest('[data-no-i18n]')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const raw = node.nodeValue;
      const text = raw.trim();
      if (!EN[text]) continue;
      const at = raw.indexOf(text);
      node.nodeValue = raw.slice(0, at) + EN[text] + raw.slice(at + text.length);
    }
    for (const element of root.querySelectorAll('[title],[placeholder],[aria-label],[alt]')) {
      for (const attr of ['title', 'placeholder', 'aria-label', 'alt']) {
        const value = element.getAttribute(attr);
        if (value && EN[value]) element.setAttribute(attr, EN[value]);
      }
    }
  }

  return { LANGS, EN, t, apply };
});
