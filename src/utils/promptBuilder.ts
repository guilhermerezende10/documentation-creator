import type { ClarificationAnswer, InputData } from '../types';

export function buildClarificationPrompt(_input: InputData): string {
  throw new Error('buildClarificationPrompt not implemented');
}

export function buildDocPrompt(_input: InputData, _answers: ClarificationAnswer[]): string {
  throw new Error('buildDocPrompt not implemented');
}
