import { useEffect, useMemo, useRef, useState } from 'react';
import type { UIEventHandler } from 'react';
import type { FileInputProps, InputMode } from '../types';

const GITHUB_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/i;

export function FileInput({ onSubmit }: FileInputProps) {
  const [tab, setTab] = useState<InputMode>('paste');
  const [code, setCode] = useState('');
  const [url, setUrl] = useState('');
  const [urlTouched, setUrlTouched] = useState(false);

  const trimmedUrl = url.trim();
  const urlValid = GITHUB_URL.test(trimmedUrl);
  const codeValid = code.trim().length > 0;
  const ready = tab === 'paste' ? codeValid : urlValid;
  const showUrlError = tab === 'link' && urlTouched && trimmedUrl.length > 0 && !urlValid;

  const gutter = useMemo(() => {
    const lineCount = Math.max(code.split('\n').length, 14);
    return Array.from({ length: lineCount }, (_, i) => String(i + 1)).join('\n');
  }, [code]);

  const gutterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    const gutter = gutterRef.current;
    if (!ta || !gutter) return;
    const update = () => {
      const scrollbarHeight = ta.offsetHeight - ta.clientHeight;
      gutter.style.paddingBottom = `${16 + scrollbarHeight}px`;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(ta);
    return () => ro.disconnect();
  }, [code]);

  const handleGutterSync: UIEventHandler<HTMLTextAreaElement> = (e) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleSubmit = () => {
    if (!ready) return;
    if (tab === 'paste') {
      onSubmit({ mode: 'paste', code: code.trim() });
    } else {
      onSubmit({ mode: 'link', url: trimmedUrl });
    }
  };

  return (
    <div className="phase-enter">
      <nav className="crumb">
        <span className="cur">SOURCE</span>
        <span className="sep">/</span>
        <span>CLARIFY</span>
        <span className="sep">/</span>
        <span>GENERATE</span>
      </nav>

      <div className="hero">
        <h1>
          Generate <em>documentation</em> from your code.
        </h1>
        <p>
          Paste a snippet or point at a GitHub repository — we&apos;ll read your code, ask a few
          clarifying questions, and produce clean, opinionated docs you can ship.
        </p>
      </div>

      <div className="card">
        <div className="tabs">
          <button
            type="button"
            className={`tab ${tab === 'paste' ? 'active' : ''}`}
            onClick={() => setTab('paste')}
          >
            PASTE CODE
          </button>
          <button
            type="button"
            className={`tab ${tab === 'link' ? 'active' : ''}`}
            onClick={() => setTab('link')}
          >
            UPLOAD LINK
          </button>
          <div className="tab-spacer" />
          <div className="tab-meta">
            <span className={`dot ${ready ? 'ok' : ''}`} />
            {ready ? 'READY' : 'WAITING'}
          </div>
        </div>

        {tab === 'paste' ? (
          <div className="code-area">
            <div className="gutter" ref={gutterRef} aria-hidden="true">
              <div className="gutter-inner">{gutter}</div>
            </div>
            <textarea
              ref={textareaRef}
              className="code-input"
              placeholder="// paste your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleGutterSync}
              spellCheck={false}
              wrap="off"
            />
          </div>
        ) : (
          <div className="drop">
            <div className="arr">↗</div>
            <div className="lbl">Paste a GitHub repository URL</div>
            <input
              type="url"
              className="text-input"
              style={{ maxWidth: 520, width: '90%' }}
              placeholder="https://github.com/owner/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setUrlTouched(true)}
              spellCheck={false}
            />
            <div className="hint">PUBLIC REPOSITORIES · HTTPS ONLY</div>
            {urlValid && (
              <span className="pill">
                <span className="ok-dot" />
                URL ACCEPTED
              </span>
            )}
          </div>
        )}

        <div className="foot">
          <span>
            {tab === 'paste'
              ? `${code.length} CHARS`
              : trimmedUrl
                ? 'URL DETECTED'
                : 'AWAITING URL'}
          </span>
          <span className={ready ? 'ok' : 'warn'}>
            {ready ? 'READY TO ANALYZE' : 'NO INPUT'}
          </span>
        </div>
      </div>

      {showUrlError && (
        <div className="error">
          URL must point to a GitHub repository (e.g. https://github.com/owner/repo)
        </div>
      )}

      <button
        type="button"
        className="cta"
        disabled={!ready}
        onClick={handleSubmit}
      >
        ANALYZE → CONTINUE
      </button>

      <div className="micro">
        <span>NO ACCOUNT REQUIRED</span>
        <span className="sep">·</span>
        <span>YOUR CODE STAYS LOCAL</span>
        <span className="sep">·</span>
        <span>OPEN MODEL</span>
      </div>
    </div>
  );
}
