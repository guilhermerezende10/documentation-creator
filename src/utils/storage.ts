import type {
  ClarificationQuestion,
  InputData,
  InputMode,
} from '../types';

const KEY = 'docgen:draft:v1';

export interface PersistedDraft {
  version: 1;
  phase: 'input' | 'clarification';
  inputMode: InputMode;
  code: string;
  url: string;
  questions: ClarificationQuestion[];
  answers: Record<string, string>;
  pendingInput: InputData | null;
}

function isInputMode(value: unknown): value is InputMode {
  return value === 'paste' || value === 'link';
}

function isQuestion(value: unknown): value is ClarificationQuestion {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.question === 'string';
}

function isAnswerMap(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object') return false;
  return Object.values(value as Record<string, unknown>).every(
    (v) => typeof v === 'string',
  );
}

function isPendingInput(value: unknown): value is InputData | null {
  if (value === null) return true;
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (!isInputMode(v.mode)) return false;
  if (v.code !== undefined && typeof v.code !== 'string') return false;
  if (v.url !== undefined && typeof v.url !== 'string') return false;
  return true;
}

function isDraft(value: unknown): value is PersistedDraft {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (v.version !== 1) return false;
  if (v.phase !== 'input' && v.phase !== 'clarification') return false;
  if (!isInputMode(v.inputMode)) return false;
  if (typeof v.code !== 'string') return false;
  if (typeof v.url !== 'string') return false;
  if (!Array.isArray(v.questions) || !v.questions.every(isQuestion)) return false;
  if (!isAnswerMap(v.answers)) return false;
  if (!isPendingInput(v.pendingInput)) return false;
  return true;
}

export function loadDraft(): PersistedDraft | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isDraft(parsed)) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(draft: PersistedDraft): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable (private mode) or quota exceeded — silently skip.
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}
