import { useEffect, useState } from "react";
import type { ProgressBarProps } from "../types";

const ROTATING_MESSAGES = [
  "Reading source structure",
  "Identifying public exports",
  "Drafting overview",
  "Writing installation guide",
  "Sketching usage examples",
  "Generating API reference",
  "Documenting deployment",
  "Compiling troubleshooting tips",
  "Polishing prose",
  "Formatting markdown",
];

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function ProgressBar({ progress, onComplete }: ProgressBarProps) {
  const [displayPercent, setDisplayPercent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const [rotatingIndex, setRotatingIndex] = useState(0);

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

  useEffect(() => {
    if (progress.percent >= 100) setDisplayPercent(100);
  }, [progress.percent]);

  useEffect(() => {
    const rot = setInterval(() => {
      setRotatingIndex((i) => (i + 1) % ROTATING_MESSAGES.length);
      setDisplayPercent((d) => {
        if (d >= 100) return 100;
        const jump = Math.random() < 0.5 ? 20 : 30;
        return Math.min(95, d + jump);
      });
    }, 2200);
    return () => clearInterval(rot);
  }, []);

  const rotatingMessage = ROTATING_MESSAGES[rotatingIndex];
  const shownPercent = Math.round(displayPercent);

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
          <span className="v">{shownPercent}%</span>
        </div>
        <div className="progress" style={{ marginBottom: 24 }}>
          <div
            className="bar"
            style={{ width: `${displayPercent}%`, transition: "width 180ms ease-out" }}
          />
        </div>

        <div className="section-list">
          <div className="section-row running">
            <span className="spinner" aria-hidden="true" />
            <div className="info">
              <div className="name">{rotatingMessage}</div>
              <div className="desc">{progress.step}</div>
            </div>
            <div className="status">RUNNING</div>
          </div>
        </div>

        <div className="console">
          <div className="line">
            <span className="ok">→</span> {rotatingMessage}
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
