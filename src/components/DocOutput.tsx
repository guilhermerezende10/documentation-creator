import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { DocOutputProps } from '../types';
import { copyMarkdown, downloadMarkdown, downloadZip } from '../utils/exporters';

const FULL_TAB_ID = '__full__';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function bytesLabel(text: string): string {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function DocOutput({ doc, onReset }: DocOutputProps) {
  const tabs = useMemo(() => {
    if (!doc) return [] as { id: string; label: string; markdown: string }[];
    const sectionTabs = doc.sections.map((s, i) => ({
      id: `${slugify(s.title)}-${i}`,
      label: s.title,
      markdown: `## ${s.title}\n\n${s.content}`,
    }));
    return [
      { id: FULL_TAB_ID, label: 'FULL', markdown: doc.markdown },
      ...sectionTabs,
    ];
  }, [doc]);

  const [activeTab, setActiveTab] = useState<string>(FULL_TAB_ID);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const active = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const sectionCount = doc?.sections.length ?? 0;
  const lineCount = doc?.markdown.split('\n').length ?? 0;
  const filename =
    active && active.id === FULL_TAB_ID
      ? 'README.md'
      : active
      ? `${slugify(active.label).toUpperCase()}.md`
      : '';

  const handleCopy = () => {
    if (doc) void copyMarkdown(doc);
  };
  const handleDownload = () => {
    if (doc) downloadMarkdown(doc);
  };
  const handleDownloadZip = () => {
    if (doc) void downloadZip(doc);
  };

  return (
    <div className="phase-enter output-shell">
      <nav className="crumb">
        <span>SOURCE</span>
        <span className="sep">/</span>
        <span>CLARIFY</span>
        <span className="sep">/</span>
        <span className="cur">GENERATE</span>
      </nav>

      <header className="output-header">
        <div>
          <h1 className="h1">
            Your <em>documentation</em>
          </h1>
          <div className="sub">{sectionCount} sections · ready to export</div>
        </div>
        <div className="actions">
          <button type="button" className="btn-out" onClick={onReset}>
            ↻ START OVER
          </button>
          <button type="button" className="btn-out" onClick={handleCopy} disabled={!doc}>COPY</button>
          <button type="button" className="btn-out" onClick={handleDownloadZip} disabled={!doc}>↓ ZIP</button>
          <button type="button" className="btn-out primary" onClick={handleDownload} disabled={!doc}>↓ DOWNLOAD</button>
        </div>
      </header>

      <div className="output-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`output-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span>{t.label.toUpperCase()}</span>
            <span className="filename">.md</span>
          </button>
        ))}
      </div>

      <div className="output-body">
        <article className="doc">
          <div className="file-header">
            <span>
              <em>{filename}</em>
            </span>
            <span>
              {active ? `${bytesLabel(active.markdown)} · ${active.markdown.split('\n').length} LINES` : ''}
            </span>
          </div>

          {active ? (
            <ReactMarkdown>{active.markdown}</ReactMarkdown>
          ) : (
            <p>No documentation generated.</p>
          )}
        </article>

        <aside className="doc-toc">
          <div className="label">CONTENTS</div>
          <ol>
            {doc?.sections.map((s) => (
              <li key={s.title}>{s.title}</li>
            )) ?? <li>—</li>}
          </ol>
        </aside>
      </div>

      <div className="regen-row">
        <div className="left">
          <span className="ok">✓</span> {sectionCount > 0 ? 'ALL SECTIONS GENERATED' : 'NO SECTIONS'}
          {lineCount > 0 ? ` · ${lineCount} LINES` : ''}
        </div>
        <div>
          <button type="button" className="btn-out" onClick={onReset}>
            ← START OVER
          </button>
        </div>
      </div>
    </div>
  );
}
