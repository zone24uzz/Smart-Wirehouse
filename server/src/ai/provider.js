import { config } from '../config/env.js';

const redact = (text) => String(text)
  .replace(/\b(sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._-]{16,})\b/gi, '[REDACTED]')
  .replace(/(password|parol|api[_ -]?key|token)\s*[:=]\s*\S+/gi, '$1=[REDACTED]');

const systemPrompt = 'Sen Smart Warehouse Control tahlil yordamchisisan. Faqat berilgan JSON faktlardan xulosa qil. Mavjud bo‘lmagan raqam yoki nomni taxmin qilma; nomaʼlum bo‘lsa ayt. Parol, token va API kalitlarini so‘rama. JSON faktlar asosidagi qisqa tahlil va amaliy tavsiya ber.';

export function buildGeminiRequest({ question, facts, context }) {
  return {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: JSON.stringify({
      savol: redact(question),
      aniq_faktlar: facts,
      rolga_ruxsatli_kontekst: context,
    }) }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1200 },
  };
}

export function extractGeminiText(data) {
  return (data?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text || '')
    .join('\n').trim();
}

async function requestProvider({ question, facts, context }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    if (config.aiProvider === 'gemini') {
      const model = encodeURIComponent(config.aiModel);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': config.aiApiKey, 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(buildGeminiRequest({ question, facts, context })),
      });
      if (!response.ok) {
        console.error('Gemini provider returned HTTP', response.status);
        return { analysis: null, mode: 'mock-fallback' };
      }
      const analysis = extractGeminiText(await response.json());
      return { analysis: analysis.slice(0, 5000) || null, mode: 'gemini' };
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.aiApiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.aiModel,
        store: false,
        input: [
          { role: 'developer', content: [{ type: 'input_text', text: systemPrompt }] },
          { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({
            savol: redact(question), aniq_faktlar: facts, rolga_ruxsatli_kontekst: context,
          }) }] },
        ],
      }),
    });
    if (!response.ok) {
      console.error('OpenAI provider returned HTTP', response.status);
      return { analysis: null, mode: 'mock-fallback' };
    }
    const data = await response.json();
    const analysis = (data.output || []).flatMap((item) => item.content || [])
      .filter((item) => item.type === 'output_text').map((item) => item.text).join('\n').trim();
    return { analysis: analysis.slice(0, 5000) || null, mode: 'openai' };
  } catch (error) {
    console.error(`${config.aiProvider} provider request failed:`, error.name === 'AbortError' ? 'timeout' : 'network error');
    return { analysis: null, mode: 'mock-fallback' };
  } finally {
    clearTimeout(timer);
  }
}

export async function enrichWithProvider({ question, facts, context }) {
  if (!['openai', 'gemini'].includes(config.aiProvider) || !config.aiApiKey || !config.aiModel) {
    return { analysis: null, mode: 'mock' };
  }
  return requestProvider({ question, facts, context });
}
