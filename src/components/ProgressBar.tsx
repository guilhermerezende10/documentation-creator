import type { ProgressBarProps } from "../types";

type SectionStatus = "done" | "running" | "pending" | "skipped";

interface SectionState {
  name: string;
  desc: string;
  status: SectionStatus;
}

const STATUS_META: Record<SectionStatus, { icon: string; label: string }> = {
  done: { icon: "✓", label: "DONE" },
  running: { icon: "▸", label: "RUNNING" },
  pending: { icon: "○", label: "PENDING" },
  skipped: { icon: "—", label: "SKIPPED" },
};

const SECTIONS: SectionState[] = [
  { name: "README", desc: "Project overview", status: "done" },
  { name: "API", desc: "API documentation", status: "running" },
  { name: "USAGE", desc: "Examples & flows", status: "pending" },
  { name: "ARCHITECTURE", desc: "High-level structure", status: "pending" },
  { name: "CONTRIBUTING", desc: "Contribution guide", status: "skipped" },
];

export function ProgressBar({ progress, onComplete }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, progress.percent));

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
          {SECTIONS.map((s) => {
            const meta = STATUS_META[s.status];
            return (
              <div key={s.name} className={`section-row ${s.status}`}>
                <span className="icon">{meta.icon}</span>
                <div className="info">
                  <div className="name">{s.name}</div>
                  <div className="desc">{s.desc}</div>
                </div>
                <div className="status">{meta.label}</div>
              </div>
            );
          })}
        </div>

        <div className="console">
          <div className="line">
            <span className="ok">→</span> {progress.step}
            <span className="cursor" />
          </div>
        </div>

        {onComplete && (
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
