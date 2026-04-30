import type { ClarificationAnswer, InputData } from '../types';

function describeSource(input: InputData): string {
  if (input.mode === 'link' && input.url) {
    return 'Source URL: ' + input.url + '\n\nFetched code:\n```\n' + (input.code || '') + '\n```';
  }
  return 'Pasted code:\n```\n' + (input.code || '') + '\n```';
}

export function buildClarificationPrompt(input: InputData): string {
  return (
    'You are a technical writer preparing to document the codebase below. ' +
    'Generate 3 to 5 clarifying questions whose answers will let you write a high-quality README, API reference, and deployment guide.\n\n' +
    describeSource(input) +
    '\n\nReturn ONLY a JSON array, no prose. Each item must have shape {"id": "q1", "question": "..."}.\n' +
    'Example: [{"id": "q1", "question": "Who is the target audience?"}]'
  );
}

export function buildDocPrompt(input: InputData, answers: ClarificationAnswer[]): string {
  const answerLines = answers.map(a => '- ' + a.questionId + ': ' + a.answer).join('\n');
  return (
    'You are a technical writer. Produce complete project documentation in markdown for the codebase below.\n\n' +
    describeSource(input) +
    '\n\nClarification answers:\n' + (answerLines || '(none provided)') +
    '\n\nProduce a single markdown document with these top-level sections (use "## " headers):\n' +
    '## Overview\n## Installation\n## Usage\n## API Reference\n## Deployment\n## Troubleshooting\n\n' +
    'Return ONLY the markdown content, no surrounding prose, no code fences around the whole thing.'
  );
}
