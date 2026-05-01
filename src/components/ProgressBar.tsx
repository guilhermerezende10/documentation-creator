import { useEffect, useState } from "react";
import type { ProgressBarProps } from "../types";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function ProgressBar({ progress, onComplete }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, progress.percent));
  const [elapsed, setElapsed] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowFallback(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="phase-enter run-shell">
      <nav className="crumb">
        <span>SOURCE</span>
        <span className="sep">/</span>
        <span>CLARIFY</span>
        <span className="sep">/</span>
        <span className="cur">GENERATE</span>
      </nav>

      <div className="run-card">
        <div className="run-header">
          <div>
            <h1 className="h1">
              Generating <em>documentation</em>
            </h1>
            <div className="run-meta" style={{ marginTop: 12 }}>
              <span>
                STEP <span className="v">{progress.step}</span>
              </span>
              <span>
                ELAPSED <span className="v">{formatElapsed(elapsed)}</span>
              </span>
              <span>
                MODEL <span className="v">LLAMA 3.1</span>
              </span>
            </div>
          </div>
        </div>

        <div className="progress-row">
          <span>PROGRESS — {progress.step}</span>
          <span className="v">{percent}%</span>
        </div>
        <div className="progress" style={{ marginBottom: 24 }}>
          <div className="bar" style={{ width: `${percent}%` }} />
        </div>

        <div className="section-list">
          <div className="section-row running">
            <span className="spinner" aria-hidden="true" />
            <div className="info">
              <div className="name">GENERATING DOCUMENTATION</div>
              <div className="desc">{progress.step}</div>
            </div>
            <div className="status">RUNNING</div>
          </div>
        </div>

        <div className="console">
          <div className="line">
            <span className="ok">→</span> {progress.step}
            <span className="cursor" />
          </div>
        </div>

        {onComplete && showFallback && (
          <div className="form-footer">
            <button type="button" className="btn-go" onClick={onComplete}>
              VIEW OUTPUT →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
