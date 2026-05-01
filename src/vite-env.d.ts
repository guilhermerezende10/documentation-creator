/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LLM_PROVIDER: 'ollama';
  readonly VITE_OLLAMA_MODEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
