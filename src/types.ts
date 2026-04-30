export type Phase = 'input' | 'clarification' | 'output';

export type LLMProvider = 'ollama' | 'claude';

export interface LLMConfig {
  provider: LLMProvider;
  ollamaModel?: string;
  claudeApiKey?: string;
}

export interface InputData {
  files: File[];
  description: string;
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

export interface FileInputProps {
  onSubmit: (data: InputData) => void;
}

export interface ClarificationFormProps {
  questions: ClarificationQuestion[];
  onSubmit: (answers: ClarificationAnswer[]) => void;
}

export interface DocOutputProps {
  doc: GeneratedDoc;
  onReset: () => void;
}

export interface ProgressBarProps {
  progress: Progress;
}
