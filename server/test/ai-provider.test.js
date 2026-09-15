import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGeminiRequest, extractGeminiText } from '../src/ai/provider.js';

test('Gemini request contains only the supplied role-scoped facts and redacts credential-like question text', () => {
  const payload = buildGeminiRequest({
    question: 'api_key=never-share-me Qaysi mahsulot kam?',
    facts: { lowStock: [{ sku: 'SKU-10', available: 2 }] },
    context: { role: 'warehouse' },
  });
  const serialized = JSON.stringify(payload);
  assert.match(serialized, /\[REDACTED\]/);
  assert.doesNotMatch(serialized, /never-share-me/);
  assert.match(serialized, /SKU-10/);
  assert.equal(payload.contents[0].role, 'user');
  assert.equal(payload.generationConfig.temperature, 0.2);
});

test('Gemini response text is read from candidate parts and empty responses stay empty', () => {
  assert.equal(extractGeminiText({ candidates: [{ content: { parts: [{ text: 'Tahlil' }, { text: 'Tavsiya' }] } }] }), 'Tahlil\nTavsiya');
  assert.equal(extractGeminiText({ candidates: [] }), '');
});
