import { useState } from 'react';
import type { ClarificationFormProps } from '../types';

type Audience = 'developers' | 'maintainers' | 'end-users';

const AUDIENCE_OPTIONS: Audience[] = ['developers', 'maintainers', 'end-users'];

export function ClarificationForm({ onSubmit, onBack }: ClarificationFormProps) {
  const [projectName, setProjectName] = useState('');
  const [audience, setAudience] = useState<Audience>('developers');
  const [notes, setNotes] = useState('');
  const [includeExamples, setIncludeExamples] = useState(true);

  const ready = projectName.trim().length > 0;

  const handleSubmit = () => {
    if (!ready) return;
    onSubmit([]);
  };

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

          <div className="field">
            <span className="num">01</span>
            <div>
              <label className="field-lbl" htmlFor="cf-project">
                Project name<span className="req">*</span>
              </label>
              <div className="field-hint">A short identifier we&apos;ll use across the generated docs.</div>
              <input
                id="cf-project"
                className="text-input"
                placeholder="e.g. parallax-cli"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <span className="num">02</span>
            <div>
              <label className="field-lbl">Primary audience</label>
              <div className="field-hint">Who is this documentation written for?</div>
              <div className="picker">
                {AUDIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`pick ${audience === opt ? 'selected' : ''}`}
                    onClick={() => setAudience(opt)}
                  >
                    <span className="bx">[{audience === opt ? 'x' : ' '}]</span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <span className="num">03</span>
            <div>
              <label className="field-lbl" htmlFor="cf-notes">
                Additional context
              </label>
              <div className="field-hint">
                Anything important about the codebase that won&apos;t be obvious from the source?
              </div>
              <textarea
                id="cf-notes"
                className="text-input ta"
                placeholder="e.g. uses a custom event bus, ships as both CLI and library..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <span className="num">04</span>
            <div>
              <label className="field-lbl">Include code examples</label>
              <div className="field-hint">When relevant, embed snippets in the generated docs.</div>
              <div className="toggle-row">
                <span className={`toggle-label ${!includeExamples ? 'active' : ''}`}>OFF</span>
                <button
                  type="button"
                  className={`toggle ${includeExamples ? 'on' : ''}`}
                  onClick={() => setIncludeExamples((v) => !v)}
                  aria-pressed={includeExamples}
                >
                  <span className="toggle-knob" />
                </button>
                <span className={`toggle-label ${includeExamples ? 'active' : ''}`}>ON</span>
                <span className="toggle-aux">RECOMMENDED</span>
              </div>
            </div>
          </div>

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
            <div className="k">PROJECT</div>
            <div className={`v ${projectName ? '' : 'empty'}`}>{projectName || 'Unnamed'}</div>
          </div>
          <div className="preview-section">
            <div className="k">AUDIENCE</div>
            <div className="v">
              <span className="pill">{audience}</span>
            </div>
          </div>
          <div className="preview-section">
            <div className="k">CODE EXAMPLES</div>
            <div className="v">
              <span className={`pill ${includeExamples ? '' : 'muted'}`}>
                {includeExamples ? 'INCLUDED' : 'OMITTED'}
              </span>
            </div>
          </div>
          <div className="preview-section">
            <div className="k">NOTES</div>
            <div className={`v ${notes ? '' : 'empty'}`}>{notes || 'No additional context'}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
