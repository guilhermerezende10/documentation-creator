import JSZip from 'jszip';
import type { GeneratedDoc } from '../types';

export async function copyMarkdown(doc: GeneratedDoc): Promise<void> {
  await navigator.clipboard.writeText(doc.markdown);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(doc: GeneratedDoc, filename = 'documentation.md'): void {
  const blob = new Blob([doc.markdown], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, filename);
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'section';
}

export async function downloadZip(doc: GeneratedDoc, filename = 'documentation.zip'): Promise<void> {
  const zip = new JSZip();
  zip.file('README.md', doc.markdown);
  doc.sections.forEach((section, i) => {
    const name = `${String(i + 1).padStart(2, '0')}-${slugify(section.title)}.md`;
    zip.file(name, `# ${section.title}\n\n${section.content}\n`);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, filename);
}
