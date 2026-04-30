import { useState } from 'react';
import type { ClarificationAnswer, ClarificationFormProps } from '../types';

const SAMPLE_ANSWERS: string[] = [
  'Beginner Python students learning control flow and basic numeric algorithms. The docs should explain each menu option in plain language without assuming prior CS background.',
  'menu-numerico — a small interactive CLI that lets the user pick from six classic numeric exercises (factorial, Fibonacci, digit reversal, geometric progression, palindrome check, digit sum) via a numbered menu.',
  'No installation. Requires Python 3.7+. Run with "python menu_numerico.py". Standard library only — uses "time" for cosmetic delays between menu screens.',
  'Six standalone functions exposed via the menu: calcular_fatorial, gerar_fibonacci, inverter_digitos, progressao_geometrica, verificar_palindromo, soma_digitos. All take input from stdin interactively — no parameters, no return values. main() is the entry loop; exibe_menu() prints the option list.',
  'Inputs are not validated for negative numbers (factorial and palindrome silently misbehave for non-positive input). time.sleep calls add ~3s between actions and are not configurable. UI text is in Portuguese. No tests, no logging. Interactive input() requires a TTY — will not run in non-interactive environments.',
];

export function ClarificationForm({ questions, onSubmit, onBack }: ClarificationFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const fillSampleData = () => {
    const filled: Record<string, string> = {};
    questions.forEach((q, i) => {
      filled[q.id] =
        SAMPLE_ANSWERS[i] ?? SAMPLE_ANSWERS[SAMPLE_ANSWERS.length - 1];
    });
    setAnswers(filled);
  };

  const answeredCount = questions.reduce(
    (acc, q) => acc + (answers[q.id]?.trim() ? 1 : 0),
    0,
  );
  const ready = questions.length > 0 && answeredCount === questions.length;

  const handleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    if (!ready) return;
    const payload: ClarificationAnswer[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? '',
    }));
    onSubmit(payload);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="phase-enter">
      <nav className="crumb">
        <span>SOURCE</span>
        <span className="sep">/</span>
        <span className="cur">CLARIFY</span>
        <span className="sep">/</span>
        <span>GENERATE</span>
      </nav>

      <div className="three">
        <aside className="rail">
          <div className="rail-label">PROGRESS</div>
          <div className="steps">
            <button type="button" className="step done">
              <span className="num">01</span>
              <span className="label">SOURCE</span>
            </button>
            <button type="button" className="step cur">
              <span className="num">02</span>
              <span className="label">CLARIFY</span>
            </button>
            <button type="button" className="step">
              <span className="num">03</span>
              <span className="label">GENERATE</span>
            </button>
          </div>
          <div className="rail-foot">
            <div>
              <span>MODEL</span>
              <span className="v">CLAUDE-H-4</span>
            </div>
            <div>
              <span>STATUS</span>
              <span className="v ok">READY</span>
            </div>
          </div>
        </aside>

        <section className="form-card">
          <div className="form-section-label">
            <em>QUESTIONS</em>
            <div className="line" />
          </div>

          {questions.length === 0 && (
            <div className="field-hint" style={{ padding: '12px 0' }}>
              No questions returned by the model.
            </div>
          )}

          {questions.map((q, i) => {
            const inputId = `cf-${q.id}`;
            return (
              <div key={q.id} className="field">
                <span className="num">{pad(i + 1)}</span>
                <div>
                  <label className="field-lbl" htmlFor={inputId}>
                    {q.question}
                    <span className="req">*</span>
                  </label>
                  <textarea
                    id={inputId}
                    className="text-input ta"
                    placeholder="Your answer..."
                    value={answers[q.id] ?? ''}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                  />
                </div>
              </div>
            );
          })}

          <div className="form-footer">
            <button type="button" className="btn-back" onClick={onBack}>
              ← BACK
            </button>
            <button type="button" className="btn-go" disabled={!ready} onClick={handleSubmit}>
              GENERATE →
            </button>
          </div>
        </section>

        <aside className="right-rail-card">
          <div className="right-label">PREVIEW</div>
          <div className="preview-section">
            <div className="k">QUESTIONS</div>
            <div className="v">
              <span className="pill">{questions.length}</span>
            </div>
          </div>
          <div className="preview-section">
            <div className="k">ANSWERED</div>
            <div className="v">
              <span className={`pill ${answeredCount === questions.length ? '' : 'muted'}`}>
                {answeredCount}/{questions.length}
              </span>
            </div>
          </div>
          {questions.map((q, i) => (
            <div key={q.id} className="preview-section">
              <div className="k">Q{pad(i + 1)}</div>
              <div className={`v ${answers[q.id]?.trim() ? '' : 'empty'}`}>
                {answers[q.id]?.trim() || 'Unanswered'}
              </div>
            </div>
          ))}
        </aside>
      </div>

      {import.meta.env.DEV && questions.length > 0 && (
        <button
          type="button"
          onClick={fillSampleData}
          title="Fill all answers with sample test data"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            padding: '12px 18px',
            border: '1px solid #6c8',
            background: 'rgba(20, 40, 30, 0.95)',
            color: '#9fc',
            fontFamily: 'monospace',
            fontSize: 12,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          🧪 FILL TEST DATA
        </button>
      )}
    </div>
  );
}
