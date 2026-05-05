import type { LLMConfig } from '../types';

export function getLLMConfig(): LLMConfig {
  return {
    provider: import.meta.env.VITE_LLM_PROVIDER || 'ollama',
    ollamaModel: import.meta.env.VITE_OLLAMA_MODEL,
    ollamaBaseUrl: import.meta.env.VITE_OLLAMA_BASE_URL,
  };
}
