'use strict';

const assert = require('assert');
const calc = require('../shared/calc');

const cfg = {
  salary: 8000,
  payDays: 21.75,
  workStart: '09:00',
  workEnd: '18:30',
  lunchStart: '12:00',
  lunchMinutes: 90,
  workPattern: 'five_two',
  overtimeMode: 'dilute',
  bigSmallAnchor: '2026-11-09'
};

function at(day, hour, minute) {
  return new Date(2026, 10, day, hour, minute, 0, 0);
}

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok  ' + name);
  } catch (e) {
    console.error('  FAIL ' + name);
    console.error(e.stack || e);
    process.exitCode = 1;
  }
}

console.log('schedule');
test('daily pay and hourly rate', () => {
  const sc = calc.schedule(cfg);
  assert.strictEqual(sc.workMinutes, 480);
  assert.ok(Math.abs(sc.dailyPay - 367.8161) < 0.001);
  assert.ok(Math.abs(sc.hourly - 45.977) < 0.01);
});

console.log('workday states');
test('before work', () => {
  const s = calc.computeState(cfg, at(9, 8, 0));
  assert.strictEqual(s.phase, 'before');
  assert.strictEqual(s.earned, 0);
  assert.strictEqual(s.remainingSec, 3600);
});

test('10:00 has earned 1 hour', () => {
  const s = calc.computeState(cfg, at(9, 10, 0));
  assert.strictEqual(s.phase, 'working');
  assert.ok(Math.abs(s.earned - 45.977) < 0.01);
  assert.ok(Math.abs(s.progress - 0.125) < 0.0001);
});

test('lunch freezes earnings', () => {
  const s = calc.computeState(cfg, at(9, 12, 30));
  assert.strictEqual(s.phase, 'lunch');
  assert.ok(Math.abs(s.earned - 137.931) < 0.01);
  assert.ok(Math.abs(s.progress - 0.375) < 0.0001);
});

test('after lunch keeps the same 3 hours', () => {
  const s = calc.computeState(cfg, at(9, 13, 30));
  assert.strictEqual(s.phase, 'working');
  assert.ok(Math.abs(s.earned - 137.931) < 0.01);
});

test('15:00 counts 4.5 worked hours', () => {
  const s = calc.computeState(cfg, at(9, 15, 0));
  assert.ok(Math.abs(s.earned - 206.897) < 0.01);
});

test('18:30 is full pay', () => {
  const s = calc.computeState(cfg, at(9, 18, 30));
  assert.strictEqual(s.phase, 'overtime');
  assert.ok(Math.abs(s.earned - 367.8161) < 0.001);
  assert.ok(Math.abs(s.progress - 1) < 1e-9);
  assert.ok(Math.abs(s.effHourly - s.hourly) < 1e-9);
  assert.strictEqual(s.overtimeSec, 0);
});

test('overtime dilutes the hourly rate', () => {
  const s = calc.computeState(cfg, at(9, 19, 0));
  assert.strictEqual(s.phase, 'overtime');
  assert.strictEqual(s.overtimeSec, 1800);
  assert.ok(Math.abs(s.effHourly - 43.2725) < 0.01);
  assert.ok(Math.abs(s.retention - 8 / 8.5) < 1e-9);
  assert.ok(Math.abs(s.delta - 2.7045) < 0.01);
  assert.ok(Math.abs(s.earned - 367.8161) < 0.001);
});

test('overtime pay mode adds 1.5x instead of diluting', () => {
  const s = calc.computeState({ ...cfg, overtimeMode: 'pay' }, at(9, 19, 0));
  assert.ok(Math.abs(s.overtimePay - 34.4828) < 0.01);
  assert.ok(Math.abs(s.earned - 402.2989) < 0.01);
  assert.ok(Math.abs(s.effHourly - 68.9655) < 0.01);
});

console.log('rest days');
test('five-two rests on Saturday', () => {
  const s = calc.computeState(cfg, at(14, 10, 0));
  assert.strictEqual(s.workday, false);
  assert.strictEqual(s.phase, 'rest');
  assert.strictEqual(s.earned, 0);
  assert.ok(s.nextWorkday);
  assert.strictEqual(s.nextWorkday.label, '后天 09:00');
});

test('six-one works on Saturday', () => {
  const s = calc.computeState({ ...cfg, workPattern: 'six_one' }, at(14, 10, 0));
  assert.strictEqual(s.workday, true);
  assert.strictEqual(s.phase, 'working');
});

test('big-small alternates Saturdays', () => {
  const big = calc.computeState(
    { ...cfg, workPattern: 'big_small', bigSmallAnchor: '2026-11-09' },
    at(14, 10, 0)
  );
  const small = calc.computeState(
    { ...cfg, workPattern: 'big_small', bigSmallAnchor: '2026-11-09' },
    at(21, 10, 0)
  );
  assert.strictEqual(big.workday, true);
  assert.strictEqual(small.workday, false);
});

test('next workday skips Friday evening to Monday', () => {
  const fridayEvening = new Date(2026, 10, 13, 20, 0, 0);
  const s = calc.computeState(cfg, fridayEvening);
  assert.strictEqual(s.phase, 'overtime');
  assert.strictEqual(calc.isWorkday(cfg, calc.addDays(fridayEvening, 1)), false);
});

console.log('punch clock');
const punchCfg = {
  ...cfg,
  clockMode: 'punch',
  clockLate: true,
  clockEarly: true,
  clockOvertime: true,
  clockGraceMin: 0,
  punchDate: '2026-11-09'
};

test('schedule mode records a punch but keeps plan-based pay', () => {
  const s = calc.computeState(
    { ...cfg, clockMode: 'schedule', punchDate: '2026-11-09', punchIn: 600, punchOut: 1020 },
    at(9, 15, 0)
  );
  assert.strictEqual(s.phase, 'working');
  assert.strictEqual(s.punched, true);
  assert.strictEqual(s.punchIn, 600);
  assert.ok(Math.abs(s.earned - 206.897) < 0.01);
});

test('late punch-in starts earning at the punch time', () => {
  const s = calc.computeState({ ...punchCfg, punchIn: 570 }, at(9, 10, 30));
  assert.strictEqual(s.phase, 'working');
  assert.strictEqual(s.payStartM, 570);
  assert.ok(Math.abs(s.earned - 45.977) < 0.01);
  assert.ok(Math.abs(s.progress - 0.125) < 0.0001);
});

test('early punch-out stops the day and reduces pay', () => {
  const s = calc.computeState({ ...punchCfg, punchIn: 540, punchOut: 1050 }, at(9, 19, 0));
  assert.strictEqual(s.phase, 'done');
  assert.ok(Math.abs(s.earned - 321.839) < 0.01);
  assert.strictEqual(s.overtimeSec, 0);
  assert.strictEqual(s.remainingSec, 0);
});

test('punch-out after the end earns overtime and freezes', () => {
  const s = calc.computeState({ ...punchCfg, punchIn: 540, punchOut: 1140 }, at(9, 20, 0));
  assert.strictEqual(s.phase, 'done');
  assert.strictEqual(s.overtimeSec, 1800);
  assert.ok(Math.abs(s.earned - 367.8161) < 0.001);
  assert.ok(Math.abs(s.effHourly - 43.2725) < 0.01);
});

test('punch overtime in pay mode adds 1.5x', () => {
  const s = calc.computeState(
    { ...punchCfg, overtimeMode: 'pay', punchIn: 540, punchOut: 1140 },
    at(9, 20, 0)
  );
  assert.ok(Math.abs(s.overtimePay - 34.4828) < 0.01);
  assert.ok(Math.abs(s.earned - 402.2989) < 0.01);
});

test('early punch-in does not exceed the daily target', () => {
  const s = calc.computeState({ ...punchCfg, punchIn: 510, punchOut: 1110 }, at(9, 20, 0));
  assert.ok(Math.abs(s.earned - 367.8161) < 0.001);
  assert.ok(Math.abs(s.progress - 1) < 1e-9);
});

test('a punch during lunch starts after the lunch window', () => {
  const s = calc.computeState({ ...punchCfg, punchIn: 750 }, at(9, 14, 30));
  assert.ok(Math.abs(s.earned - 45.977) < 0.01);
});

test('a punch-in and punch-out in the same minute ends the day', () => {
  const s = calc.computeState({ ...punchCfg, punchIn: 600, punchOut: 600 }, at(9, 10, 5));
  assert.strictEqual(s.phase, 'done');
  assert.strictEqual(s.earned, 0);
});

test('custom mode can ignore a late punch', () => {
  const s = calc.computeState(
    { ...punchCfg, clockMode: 'custom', clockLate: false, punchIn: 580 },
    at(9, 10, 30)
  );
  assert.strictEqual(s.payStartM, 540);
  assert.ok(Math.abs(s.earned - 68.9655) < 0.01);
});

test('custom grace forgives a small late punch', () => {
  const s = calc.computeState(
    { ...punchCfg, clockMode: 'custom', clockLate: true, clockGraceMin: 10, punchIn: 550 },
    at(9, 10, 0)
  );
  assert.strictEqual(s.payStartM, 540);
  assert.ok(Math.abs(s.earned - 45.977) < 0.01);
});

test('custom mode can ignore an early punch-out', () => {
  const s = calc.computeState(
    { ...punchCfg, clockMode: 'custom', clockEarly: false, punchIn: 540, punchOut: 1020 },
    at(9, 17, 30)
  );
  assert.strictEqual(s.phase, 'done');
  assert.ok(Math.abs(s.earned - 367.8161) < 0.001);
  assert.strictEqual(s.overtimeSec, 0);
});

test('custom mode can end the day at the scheduled time without overtime', () => {
  const s = calc.computeState(
    { ...cfg, clockMode: 'custom', clockOvertime: false },
    at(9, 19, 0)
  );
  assert.strictEqual(s.phase, 'done');
  assert.strictEqual(s.overtimeSec, 0);
  assert.ok(Math.abs(s.earned - 367.8161) < 0.001);
});

test('a punch from another day is ignored', () => {
  const s = calc.computeState(
    { ...punchCfg, punchDate: '2026-11-08', punchIn: 600, punchOut: 1020 },
    at(9, 10, 0)
  );
  assert.strictEqual(s.punched, false);
  assert.strictEqual(s.payStartM, 540);
  assert.ok(Math.abs(s.earned - 45.977) < 0.01);
});

console.log('validation');
test('rejects reversed work hours', () => {
  const errors = calc.validateSchedule({ ...cfg, workStart: '18:00', workEnd: '09:00' });
  assert.ok(errors.workEnd);
});

test('rejects lunch outside work hours', () => {
  const errors = calc.validateSchedule({ ...cfg, lunchStart: '17:30' });
  assert.ok(errors.lunchStart);
});

test('rejects zero salary', () => {
  const errors = calc.validateSchedule({ ...cfg, salary: 0 });
  assert.ok(errors.salary);
});

test('zero lunch adds to the work day', () => {
  const sc = calc.schedule({ ...cfg, lunchMinutes: 0 });
  assert.strictEqual(sc.workMinutes, 570);
});

console.log('\n' + passed + ' tests passed');
