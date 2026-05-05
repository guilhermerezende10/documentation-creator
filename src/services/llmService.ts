import type { LLMConfig } from '../types';

export interface LLMCallOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export const DEFAULT_LLM_TIMEOUT_MS = 120_000;

export class LLMAbortError extends Error {
  constructor(message = 'LLM request was cancelled') {
    super(message);
    this.name = 'LLMAbortError';
  }
}

export class LLMTimeoutError extends Error {
  constructor(message = 'LLM request timed out') {
    super(message);
    this.name = 'LLMTimeoutError';
  }
}

export function isLLMAbortError(err: unknown): err is LLMAbortError {
  return err instanceof Error && err.name === 'LLMAbortError';
}

export function isLLMTimeoutError(err: unknown): err is LLMTimeoutError {
  return err instanceof Error && err.name === 'LLMTimeoutError';
}

async function callOllama(
  prompt: string,
  model: string,
  baseUrl: string,
  options: LLMCallOptions = {},
): Promise<string> {
  const url = baseUrl.replace(/\/$/, '') + '/api/generate';
  const timeoutMs = options.timeoutMs ?? DEFAULT_LLM_TIMEOUT_MS;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onParentAbort = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', onParentAbort);
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error('Ollama error: ' + res.status + ' ' + res.statusText);
    }
    const data = await res.json();
    return data.response as string;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      if (timedOut) {
        throw new LLMTimeoutError(`Ollama request timed out after ${timeoutMs}ms`);
      }
      throw new LLMAbortError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (options.signal) options.signal.removeEventListener('abort', onParentAbort);
  }
}

export async function callLLM(
  prompt: string,
  config: LLMConfig,
  options: LLMCallOptions = {},
): Promise<string> {
  if (config.provider === 'ollama') {
    return callOllama(
      prompt,
      config.ollamaModel || 'llama3.1:8b',
      config.ollamaBaseUrl || 'http://localhost:11434',
      options,
    );
  }
  throw new Error('Unknown provider: ' + (config as { provider: string }).provider);
}

export async function checkLLMHealth(
  config: LLMConfig,
  options: LLMCallOptions = {},
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
