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

export async function checkLLMHealth(
  config: LLMConfig,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<boolean> {
  if (config.provider !== 'ollama') return false;
  const baseUrl = (config.ollamaBaseUrl || 'http://localhost:11434').replace(/\/$/, '');
  const url = baseUrl + '/api/tags';
  const timeoutMs = options.timeoutMs ?? 4000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onParentAbort = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', onParentAbort);
  }

  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    if (!res.ok) return false;
    await res.json();
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    if (options.signal) options.signal.removeEventListener('abort', onParentAbort);
  }
}
