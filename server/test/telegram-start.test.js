import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCommandGuide, buildStartMessage, formatTelegramAiAnswer, sanitizeTelegramPrompt } from '../src/telegram/bot.js';

test('linked /start greets the user and documents every Telegram command', () => {
  const message = buildStartMessage({ name: '<Ali>', role: 'admin' });
  assert.match(message, /Akkauntingiz ulangan/);
  assert.match(message, /&lt;Ali&gt;/);
  for (const command of ['/start', '/help', '/login KOD', '/profile', '/status', '/orders', '/order Z-2026-0001', '/shortages', '/stock', '/shipments', '/report', '/ai savol', '/settings', '/logout']) assert.ok(message.includes(command), `Missing ${command}`);
  assert.doesNotMatch(message, /\/login 123456/);
});

test('unlinked /start explains how to pair the account and lists commands', () => {
  const message = buildStartMessage(null);
  assert.match(message, /Akkaunt ulanmagan/);
  assert.match(message, /\/login 123456/);
  assert.match(buildCommandGuide(null), /\/help/);
});

test('ordinary Telegram text is scrubbed before it is sent to the AI', () => {
  assert.equal(sanitizeTelegramPrompt('ombor holatini ko‘rsat'), 'ombor holatini ko‘rsat');
  assert.equal(sanitizeTelegramPrompt('token: abc123 parol=meningparolim'), 'token=[REDACTED] parol=[REDACTED]');
  assert.ok(sanitizeTelegramPrompt('a'.repeat(1100)).length <= 1000);
});

test('Telegram AI answer is readable and escapes HTML from database values', () => {
  const text = formatTelegramAiAnswer({ summary: '<script>', metrics: [{ label: 'Mahsulot', value: '2 dona' }], problems: ['X < Y'], recommendation: 'Tekshiring', asOf: '2026-09-15T10:00:00.000Z' });
  assert.match(text, /&lt;script&gt;/);
  assert.match(text, /Mahsulot: 2 dona/);
  assert.match(text, /X &lt; Y/);
  assert.match(text, /Tavsiya/);
});
