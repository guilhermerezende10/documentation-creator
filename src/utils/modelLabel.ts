const DEFAULT_OLLAMA_MODEL = 'llama3.1:8b';

export function getModelLabel(): string {
  const model = import.meta.env.VITE_OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
  return model.toUpperCase();
}
