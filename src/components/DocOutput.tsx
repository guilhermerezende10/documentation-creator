import { useState } from 'react';
import type { DocOutputProps } from '../types';

interface DocTab {
  id: string;
  label: string;
  filename: string;
  skipped?: boolean;
}

const TABS: DocTab[] = [
  { id: 'readme', label: 'README', filename: '.md' },
  { id: 'api', label: 'API', filename: '.md' },
  { id: 'usage', label: 'USAGE', filename: '.md' },
  { id: 'architecture', label: 'ARCHITECTURE', filename: '.md' },
  { id: 'contributing', label: 'CONTRIBUTING', filename: '', skipped: true },
];

export function DocOutput({ onReset }: DocOutputProps) {
  const [activeTab, setActiveTab] = useState('readme');

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
          <div className="sub">5 sections · ready to export</div>
        </div>
        <div className="actions">
          <button type="button" className="btn-out" onClick={onReset}>
            ↻ START OVER
          </button>
          <button type="button" className="btn-out">COPY</button>
          <button type="button" className="btn-out primary">↓ DOWNLOAD</button>
        </div>
      </header>

      <div className="output-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`output-tab ${activeTab === t.id ? 'active' : ''} ${t.skipped ? 'skipped' : ''}`}
            onClick={() => !t.skipped && setActiveTab(t.id)}
            disabled={t.skipped}
          >
            <span>{t.label}</span>
            {t.skipped ? (
              <span className="skip-tag">SKIPPED</span>
            ) : (
              <span className="filename">{t.filename}</span>
            )}
          </button>
        ))}
      </div>

      <div className="output-body">
        <article className="doc">
          <div className="file-header">
            <span>
              <em>{activeTab.toUpperCase()}.md</em>
            </span>
            <span>1.2 KB · 184 LINES</span>
          </div>

          <h1>Project Overview</h1>
          <p>
            A short, opinionated description of the project, written for developers reading the
            source for the first time. Generated from your code and clarification answers.
          </p>

          <h2>Installation</h2>
          <p>Install via npm:</p>
          <pre>
            <code>
              <span className="com"># install the package</span>
              {'\n'}
              <span className="kw">npm install</span> your-package
            </code>
          </pre>

          <h2>Quick start</h2>
          <p>
            Import the module and call <code>init()</code> with your configuration:
          </p>
          <pre>
            <code>
              <span className="kw">import</span> {'{ '}
              <span className="fn">init</span>
              {' }'} <span className="kw">from</span>{' '}
              <span className="str">&apos;your-package&apos;</span>;{'\n\n'}
              <span className="fn">init</span>({'{'}
              {'\n  '}endpoint: <span className="str">&apos;https://api.example.com&apos;</span>,
              {'\n  '}timeout: <span className="kw">5000</span>,
              {'\n'}
              {'}'});
            </code>
          </pre>

          <h2>Features</h2>
          <ul>
            <li>Zero-config defaults that work out of the box</li>
            <li>Composable middleware with strict typing</li>
            <li>First-class support for streaming responses</li>
            <li>Tree-shakeable — pay only for what you import</li>
          </ul>

          <hr className="hr" />

          <h3>Next</h3>
          <p>
            See the <code>API</code> tab for a complete reference of exports and types.
          </p>
        </article>

        <aside className="doc-toc">
          <div className="label">CONTENTS</div>
          <ol>
            <li>Project Overview</li>
            <li>Installation</li>
            <li>Quick start</li>
            <li>Features</li>
            <li>Next</li>
          </ol>
        </aside>
      </div>

      <div className="regen-row">
        <div className="left">
          <span className="ok">✓</span> ALL SECTIONS GENERATED
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
