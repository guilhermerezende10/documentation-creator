import { describe, it, expect } from 'vitest';
import { parseRepoUrl, shouldKeepEntry, priorityScore } from './githubFetcher';

describe('parseRepoUrl', () => {
  it('parses a plain GitHub URL', () => {
    expect(parseRepoUrl('https://github.com/owner/repo')).toEqual({
      owner: 'owner',
      repo: 'repo',
    });
  });

  it('strips a trailing slash', () => {
    expect(parseRepoUrl('https://github.com/owner/repo/')).toEqual({
      owner: 'owner',
      repo: 'repo',
    });
  });

  it('strips the .git suffix', () => {
    expect(parseRepoUrl('https://github.com/owner/repo.git')).toEqual({
      owner: 'owner',
      repo: 'repo',
    });
  });

  it('accepts owners and repos with dots, dashes, and underscores', () => {
    expect(parseRepoUrl('https://github.com/some-org.foo/my_repo.bar')).toEqual({
      owner: 'some-org.foo',
      repo: 'my_repo.bar',
    });
  });

  it('throws on a non-GitHub host', () => {
    expect(() => parseRepoUrl('https://gitlab.com/owner/repo')).toThrow(
      /valid GitHub repository URL/,
    );
  });

  it('throws on a malformed URL', () => {
    expect(() => parseRepoUrl('not-a-url')).toThrow(/valid GitHub repository URL/);
  });

  it('throws when the path has no repo segment', () => {
    expect(() => parseRepoUrl('https://github.com/owner')).toThrow(
      /valid GitHub repository URL/,
    );
  });
});

describe('shouldKeepEntry', () => {
  it('keeps blob entries with a known source extension', () => {
    expect(shouldKeepEntry({ path: 'src/index.ts', type: 'blob' })).toBe(true);
    expect(shouldKeepEntry({ path: 'src/main.py', type: 'blob' })).toBe(true);
  });

  it('keeps known extensionless source filenames', () => {
    expect(shouldKeepEntry({ path: 'Dockerfile', type: 'blob' })).toBe(true);
    expect(shouldKeepEntry({ path: 'docker/Makefile', type: 'blob' })).toBe(true);
  });

  it('rejects non-blob entries', () => {
    expect(shouldKeepEntry({ path: 'src', type: 'tree' })).toBe(false);
  });

  it('rejects entries inside a skip directory', () => {
    expect(shouldKeepEntry({ path: 'node_modules/foo/bar.ts', type: 'blob' })).toBe(false);
    expect(shouldKeepEntry({ path: 'dist/app.js', type: 'blob' })).toBe(false);
    expect(shouldKeepEntry({ path: '.git/HEAD', type: 'blob' })).toBe(false);
  });

  it('rejects lock files explicitly listed in SKIP_FILENAMES', () => {
    expect(shouldKeepEntry({ path: 'package-lock.json', type: 'blob' })).toBe(false);
    expect(shouldKeepEntry({ path: 'yarn.lock', type: 'blob' })).toBe(false);
    expect(shouldKeepEntry({ path: 'subdir/Cargo.lock', type: 'blob' })).toBe(false);
  });

  it('rejects any file whose name starts with .env', () => {
    expect(shouldKeepEntry({ path: '.env', type: 'blob' })).toBe(false);
    expect(shouldKeepEntry({ path: '.env.example', type: 'blob' })).toBe(false);
    expect(shouldKeepEntry({ path: '.env.local', type: 'blob' })).toBe(false);
  });

  it('rejects extensionless files that are not in SOURCE_FILENAMES', () => {
    expect(shouldKeepEntry({ path: 'LICENSE', type: 'blob' })).toBe(false);
    expect(shouldKeepEntry({ path: 'CHANGELOG', type: 'blob' })).toBe(false);
  });

  it('rejects files with unknown extensions', () => {
    expect(shouldKeepEntry({ path: 'logo.png', type: 'blob' })).toBe(false);
    expect(shouldKeepEntry({ path: 'data.bin', type: 'blob' })).toBe(false);
  });
});

describe('priorityScore', () => {
  it('puts README files at the front', () => {
    expect(priorityScore('README.md')).toBe(0);
    expect(priorityScore('readme')).toBe(0);
    expect(priorityScore('Readme.md')).toBe(0);
  });

  it('gives manifest files priority 1', () => {
    expect(priorityScore('package.json')).toBe(1);
    expect(priorityScore('pyproject.toml')).toBe(1);
    expect(priorityScore('Cargo.toml')).toBe(1);
    expect(priorityScore('go.mod')).toBe(1);
    expect(priorityScore('pom.xml')).toBe(1);
    expect(priorityScore('Gemfile')).toBe(1);
  });

  it('gives src/lib/app source paths priority 2', () => {
    expect(priorityScore('src/index.ts')).toBe(2);
    expect(priorityScore('lib/utils.js')).toBe(2);
    expect(priorityScore('app/server.py')).toBe(2);
  });

  it('gives other markdown docs priority 3', () => {
    expect(priorityScore('docs/guide.md')).toBe(3);
    expect(priorityScore('CONTRIBUTING.md')).toBe(3);
  });

  it('gives everything else priority 4', () => {
    expect(priorityScore('config/server.yaml')).toBe(4);
    expect(priorityScore('scripts/release.sh')).toBe(4);
  });
});
