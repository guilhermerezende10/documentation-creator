export type Phase = 'input' | 'clarification' | 'running' | 'output';

export type LLMProvider = 'ollama';

export type LLMStatus = 'unknown' | 'online' | 'offline';

export interface LLMConfig {
  provider: LLMProvider;
  ollamaModel?: string;
  ollamaBaseUrl?: string;
}

export type InputMode = 'paste' | 'link';

export interface InputData {
  mode: InputMode;
  code?: string;
  url?: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
}

export interface ClarificationAnswer {
  questionId: string;
  answer: string;
}

export interface DocSection {
  title: string;
  content: string;
}

export interface GeneratedDoc {
  sections: DocSection[];
  markdown: string;
}

export interface Progress {
  step: string;
  percent: number;
}

export interface FileInputDraft {
  mode: InputMode;
  code: string;
  url: string;
}

export interface FileInputProps {
  onSubmit: (data: InputData) => void;
  isLoading?: boolean;
  initialDraft?: FileInputDraft;
  onDraftChange?: (draft: FileInputDraft) => void;
}

export interface ClarificationFormProps {
  questions: ClarificationQuestion[];
  onSubmit: (answers: ClarificationAnswer[]) => void;
  onBack?: () => void;
  isLoading?: boolean;
  isSuggesting?: boolean;
  onSuggestAnswers?: () => Promise<Record<string, string>>;
  initialAnswers?: Record<string, string>;
  onAnswersChange?: (answers: Record<string, string>) => void;
}

export interface DocOutputProps {
  doc: GeneratedDoc | null;
  onReset: () => void;
  onToast?: (message: string) => void;
}

export interface ProgressBarProps {
  progress: Progress;
  onComplete?: () => void;
}
