import type {
  ClarificationAnswer,
  ClarificationQuestion,
  GeneratedDoc,
  InputData,
  Progress,
} from '../types';

export interface UseDocGeneratorResult {
  progress: Progress | null;
  questions: ClarificationQuestion[];
  doc: GeneratedDoc | null;
  startGeneration: (data: InputData) => Promise<void>;
  submitAnswers: (answers: ClarificationAnswer[]) => Promise<void>;
  reset: () => void;
}

export function useDocGenerator(): UseDocGeneratorResult {
  throw new Error('useDocGenerator not implemented');
}
