const SOURCE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'py', 'go', 'rs', 'java', 'kt', 'swift', 'rb', 'php',
  'cs', 'cpp', 'cc', 'c', 'h', 'hpp',
  'md', 'mdx',
  'json', 'yaml', 'yml', 'toml',
  'html', 'css', 'scss', 'sass',
  'sh', 'bash', 'zsh',
  'sql', 'graphql', 'proto',
]);

const SOURCE_FILENAMES = new Set([
  'Dockerfile', 'Makefile', 'Procfile', 'Rakefile', 'Gemfile',
]);

const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', 'out', '.git', 'vendor', 'target',
  '__pycache__', '.next', '.nuxt', 'coverage', '.cache', '.turbo',
  '.venv', 'venv', '.idea', '.vscode',
]);

const SKIP_FILENAMES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock',
  'Cargo.lock', 'poetry.lock', 'Gemfile.lock',
]);

const MAX_FILE_BYTES = 50_000;
const MAX_TOTAL_BYTES = 200_000;

interface RepoCoords {
  owner: string;
  repo: string;
}

export interface TreeEntry {
  path: string;
  type: string;
  size?: number;
}

interface TreeResponse {
  tree?: TreeEntry[];
  truncated?: boolean;
}

export interface FetchResult {
  text: string;
  filesIncluded: string[];
  filesSkipped: string[];
  truncated: boolean;
}

export function parseRepoUrl(url: string): RepoCoords {
  const trimmed = url.trim().replace(/\/$/, '');
  const match = trimmed.match(
    /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i,
  );
  if (!match) throw new Error(`Not a valid GitHub repository URL: ${url}`);
  return { owner: match[1], repo: match[2] };
}

export function shouldKeepEntry(entry: TreeEntry): boolean {
  if (entry.type !== 'blob') return false;
  const parts = entry.path.split('/');
  for (let i = 0; i < parts.length - 1; i++) {
    if (SKIP_DIRS.has(parts[i])) return false;
  }
  const name = parts[parts.length - 1];
  if (SKIP_FILENAMES.has(name)) return false;
  if (name.startsWith('.env')) return false;
  if (SOURCE_FILENAMES.has(name)) return true;
  const dotIdx = name.lastIndexOf('.');
  if (dotIdx === -1) return false;
  const ext = name.slice(dotIdx + 1).toLowerCase();
  return SOURCE_EXTENSIONS.has(ext);
}

export function priorityScore(path: string): number {
  const lower = path.toLowerCase();
  if (lower === 'readme.md' || lower === 'readme') return 0;
  if (
    lower === 'package.json' ||
    lower === 'pyproject.toml' ||
    lower === 'cargo.toml' ||
    lower === 'go.mod' ||
    lower === 'pom.xml' ||
    lower === 'gemfile'
  ) return 1;
  if (lower.startsWith('src/') || lower.startsWith('lib/') || lower.startsWith('app/')) return 2;
  if (lower.endsWith('.md')) return 3;
  return 4;
}

async function fetchTree({ owner, repo }: RepoCoords): Promise<TreeResponse> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers: { Accept: 'application/vnd.github+json' } },
  );
  if (res.status === 404) {
    throw new Error(`Repository not found or private: ${owner}/${repo}`);
  }
  if (res.status === 403) {
    throw new Error('GitHub API rate limit reached. Try again later or use paste mode.');
  }
  if (!res.ok) {
    throw new Error(`GitHub tree fetch failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as TreeResponse;
}

async function fetchFile(coords: RepoCoords, path: string): Promise<string> {
  const { owner, repo } = coords;
  const res = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return await res.text();
}

export async function fetchGitHubRepoDetailed(url: string): Promise<FetchResult> {
  const coords = parseRepoUrl(url);
  const treeData = await fetchTree(coords);
  if (!treeData.tree) throw new Error('Empty tree response from GitHub');

  const candidates = treeData.tree
    .filter(shouldKeepEntry)
    .filter(e => e.size === undefined || e.size <= MAX_FILE_BYTES)
    .sort((a, b) => priorityScore(a.path) - priorityScore(b.path));

  const chunks: string[] = [];
  const filesIncluded: string[] = [];
  const filesSkipped: string[] = [];
  let total = 0;

  for (const entry of candidates) {
    if (total >= MAX_TOTAL_BYTES) {
      filesSkipped.push(entry.path);
      continue;
    }
    try {
      const content = await fetchFile(coords, entry.path);
      const size = content.length;
      if (size > MAX_FILE_BYTES || total + size > MAX_TOTAL_BYTES) {
        filesSkipped.push(entry.path);
        continue;
      }
      chunks.push(`=== ${entry.path} ===\n${content}`);
      total += size;
      filesIncluded.push(entry.path);
    } catch {
      filesSkipped.push(entry.path);
    }
  }

  const header =
    `Repository: ${coords.owner}/${coords.repo}\n` +
    `Files included: ${filesIncluded.length} (${total} bytes)\n` +
    (filesSkipped.length ? `Files omitted (size cap or fetch error): ${filesSkipped.length}\n` : '') +
    (treeData.truncated ? 'Note: repository tree was truncated by GitHub (very large repo)\n' : '');

  return {
    text: `${header}\n${chunks.join('\n\n')}`,
    filesIncluded,
    filesSkipped,
    truncated: treeData.truncated === true,
  };
}

export async function fetchGitHubRepo(url: string): Promise<string> {
  const result = await fetchGitHubRepoDetailed(url);
  return result.text;
}
