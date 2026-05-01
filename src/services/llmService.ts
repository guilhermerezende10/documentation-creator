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

export async function callLLM(prompt: string, config: LLMConfig): Promise<string> {
  if (config.provider === 'ollama') {
    return callOllama(
      prompt,
      config.ollamaModel || 'llama3.1:8b',
      config.ollamaBaseUrl || 'http://localhost:11434',
    );
  }
  throw new Error('Unknown provider: ' + (config as { provider: string }).provider);
}
