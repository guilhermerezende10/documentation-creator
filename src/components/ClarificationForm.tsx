import { useState } from "react";
import type { ClarificationAnswer, ClarificationFormProps } from "../types";

export function ClarificationForm({
  questions,
  onSubmit,
  onBack,
  isLoading = false,
  isSuggesting = false,
  onSuggestAnswers,
}: ClarificationFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSuggest = async () => {
    if (!onSuggestAnswers || isSuggesting || isLoading) return;
    const suggestions = await onSuggestAnswers();
    setAnswers((prev) => {
      const next = { ...prev };
      for (const q of questions) {
        const text = suggestions[q.id];
        if (typeof text === "string" && text.trim()) {
          next[q.id] = text;
        }
      }
      return next;
    });
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
    if (!ready || isLoading || isSuggesting) return;
    const payload: ClarificationAnswer[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
    }));
    onSubmit(payload);
  };

  const pad = (n: number) => String(n).padStart(2, "0");

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
              <span className="v">LLAMA 3.1</span>
            </div>
            <div>
              <span>STATUS</span>
              <span className="v ok">READY</span>
            </div>
          </div>

          {questions.length > 0 && onSuggestAnswers && (
            <button
              type="button"
              className="suggest-btn"
              onClick={handleSuggest}
              disabled={isSuggesting || isLoading}
              aria-busy={isSuggesting}
              title="Use the LLM to draft an answer for each question"
            >
              {isSuggesting && <span className="spinner" aria-hidden="true" />}
              Suggest AI answers
            </button>
          )}
        </aside>

        <section className="form-card">
          <div className="form-section-label">
            <em>QUESTIONS</em>
            <div className="line" />
          </div>

          {questions.length === 0 && (
            <div className="field-hint" style={{ padding: "12px 0" }}>
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
                    value={answers[q.id] ?? ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                  />
                </div>
              </div>
            );
          })}

          <div className="form-footer">
            <button
              type="button"
              className="btn-back"
              onClick={onBack}
              disabled={isLoading || isSuggesting}
            >
              ← BACK
            </button>
            <button
              type="button"
              className="btn-go"
              disabled={!ready || isLoading || isSuggesting}
              onClick={handleSubmit}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  GENERATING…
                </>
              ) : (
                "GENERATE →"
              )}
            </button>
          </div>
        </section>
      </div>

    </div>
  );
}
