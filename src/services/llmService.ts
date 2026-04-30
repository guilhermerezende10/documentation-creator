import type { LLMConfig } from '../types';

async function callOllama(prompt: string, model: string, baseUrl: string): Promise<string> {
  const url = baseUrl.replace(/\/$/, '') + '/api/generate';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) {
    throw new Error('Ollama error: ' + res.status + ' ' + res.statusText);
  }
  const data = await res.json();
  return data.response as string;
}

async function callClaude(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Claude API error: ' + res.status + ' ' + JSON.stringify(err));
  }
  const data = await res.json();
  return data.content[0].text as string;
}

export async function callLLM(prompt: string, config: LLMConfig): Promise<string> {
  if (config.provider === 'ollama') {
    return callOllama(
      prompt,
      config.ollamaModel || 'llama3.1:8b',
      config.ollamaBaseUrl || 'http://localhost:11434',
    );
  }
  if (config.provider === 'claude') {
    if (!config.claudeApiKey) throw new Error('Claude API key not provided');
    return callClaude(prompt, config.claudeApiKey);
  }
  throw new Error('Unknown provider: ' + (config as { provider: string }).provider);
}
