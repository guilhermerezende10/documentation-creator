import type { LLMConfig } from '../types';

export async function callLLM(_prompt: string, _config: LLMConfig): Promise<string> {
  throw new Error('llmService.callLLM not implemented');
}
