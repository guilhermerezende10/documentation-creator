import { useEffect, useState } from 'react';
import type { LLMConfig, LLMStatus } from '../types';
import { checkLLMHealth } from '../services/llmService';

export function useLLMStatus(config: LLMConfig, intervalMs = 15000): LLMStatus {
  const [status, setStatus] = useState<LLMStatus>('unknown');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function probe() {
      const ok = await checkLLMHealth(config, { signal: controller.signal });
      if (cancelled) return;
      setStatus(ok ? 'online' : 'offline');
    }

    probe();
    const id = setInterval(probe, intervalMs);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
    };
  }, [config.provider, config.ollamaBaseUrl, config.ollamaModel, intervalMs]);

  return status;
}
