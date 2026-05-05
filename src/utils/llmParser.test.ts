import { describe, it, expect } from 'vitest';
import { parseQuestions, parseSuggestions, parseDoc } from './llmParser';

describe('parseQuestions', () => {
  it('strips ```json fences before parsing', () => {
    const raw = '```json\n[{"id":"q1","question":"What is the target audience?"}]\n```';
    const result = parseQuestions(raw);
    expect(result).toEqual([{ id: 'q1', question: 'What is the target audience?' }]);
  });

  it('strips bare ``` fences', () => {
    const raw = '```\n[{"id":"q1","question":"x"}]\n```';
    expect(parseQuestions(raw)).toEqual([{ id: 'q1', question: 'x' }]);
  });

  it('extracts the array even when the LLM adds prose around it', () => {
    const raw = 'Here are the questions:\n[{"id":"q1","question":"x"}]\nHope that helps!';
    expect(parseQuestions(raw)).toEqual([{ id: 'q1', question: 'x' }]);
  });

  it('throws when no JSON array is present', () => {
    expect(() => parseQuestions('Sorry, I cannot help with that.')).toThrow(
      /JSON array of questions/,
    );
  });

  it('throws when the bracketed text is not valid JSON', () => {
    expect(() => parseQuestions('[{"id":"q1",}]')).toThrow(
      /Could not parse questions JSON/,
    );
  });

  it('throws when the array contains no usable questions', () => {
    expect(() => parseQuestions('[]')).toThrow(/No valid questions found/);
    expect(() => parseQuestions('[{"id":"q1","question":""}]')).toThrow(
      /No valid questions found/,
    );
  });

  it('renumbers duplicate ids so each question gets a unique id', () => {
    const raw =
      '[{"id":"q1","question":"a"},{"id":"q1","question":"b"},{"id":"q3","question":"c"}]';
    expect(parseQuestions(raw)).toEqual([
      { id: 'q1', question: 'a' },
      { id: 'q2', question: 'b' },
      { id: 'q3', question: 'c' },
    ]);
  });

  it('synthesises an id when the LLM omits one', () => {
    const raw = '[{"question":"a"},{"id":"","question":"b"}]';
    expect(parseQuestions(raw)).toEqual([
      { id: 'q1', question: 'a' },
      { id: 'q2', question: 'b' },
    ]);
  });

  it('skips items that are missing a question string', () => {
    const raw = '[{"id":"q1","question":"keep"},{"id":"q2"},{"id":"q3","question":"   "}]';
    expect(parseQuestions(raw)).toEqual([{ id: 'q1', question: 'keep' }]);
  });
});

describe('parseSuggestions', () => {
  it('returns a questionId → answer map', () => {
    const raw = '[{"questionId":"q1","answer":"hello"},{"questionId":"q2","answer":"world"}]';
    expect(parseSuggestions(raw)).toEqual({ q1: 'hello', q2: 'world' });
  });

  it('returns an empty object for an empty array', () => {
    expect(parseSuggestions('[]')).toEqual({});
  });

  it('ignores entries that are missing fields', () => {
    const raw = '[{"questionId":"q1"},{"answer":"orphan"},{"questionId":"q2","answer":"keep"}]';
    expect(parseSuggestions(raw)).toEqual({ q2: 'keep' });
  });

  it('throws when the JSON is malformed', () => {
    expect(() => parseSuggestions('[not json]')).toThrow(/Could not parse suggestions JSON/);
  });
});

describe('parseDoc', () => {
  it('splits markdown by ## headers', () => {
    const md = '## Overview\nHello world.\n\n## Usage\nRun it.';
    const result = parseDoc(md);
    expect(result.sections).toEqual([
      { title: 'Overview', content: 'Hello world.' },
      { title: 'Usage', content: 'Run it.' },
    ]);
    expect(result.markdown).toBe(md);
  });

  it('falls back to # headers when no ## headers are present', () => {
    const md = '# Top\nFirst para.\n\n# Second\nMore.';
    const result = parseDoc(md);
    expect(result.sections.map(s => s.title)).toEqual(['Top', 'Second']);
  });

  it('unwraps a markdown code fence around the whole document', () => {
    const md = '```markdown\n## Overview\nHi.\n```';
    const result = parseDoc(md);
    expect(result.markdown).toBe('## Overview\nHi.');
    expect(result.sections).toEqual([{ title: 'Overview', content: 'Hi.' }]);
  });

  it('returns an empty section list when the document has no headers', () => {
    const result = parseDoc('plain prose with no headers');
    expect(result.sections).toEqual([]);
    expect(result.markdown).toBe('plain prose with no headers');
  });
});
