import { revokePdfBlobUrl, fullFileCache, renderFullFileContent } from '../src/components/preview/file-renderer.js';
import { setProjectContext } from '../src/core/context.js';

// Mock API client so tests don't make real network calls
jest.mock('../src/api/client.js', () => ({
    fetchFileContent: jest.fn(),
    fetchDiffForPath: jest.fn(),
}));

// Mock highlight to isolate renderer logic from syntax-highlighting
jest.mock('../src/core/highlight.js', () => ({
    highlightCode: (code) => code,
    escapeHtml: (text) => text,
}));

// Provide minimal URL.createObjectURL / revokeObjectURL stubs for jsdom
beforeAll(() => {
    if (!global.URL.createObjectURL) {
        global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    }
    if (!global.URL.revokeObjectURL) {
        global.URL.revokeObjectURL = jest.fn();
    }
});

afterEach(() => {
    setProjectContext(null, null);
    fullFileCache.clear();
    jest.clearAllMocks();
});

// ─── revokePdfBlobUrl ─────────────────────────────────────────────────────────

describe('revokePdfBlobUrl', () => {
    test('does nothing and does not throw when no PDF URL is stored', () => {
        expect(() => revokePdfBlobUrl()).not.toThrow();
    });
});

// ─── fullFileCache ────────────────────────────────────────────────────────────

describe('fullFileCache', () => {
    test('is a Map', () => {
        expect(fullFileCache).toBeInstanceOf(Map);
    });

    test('starts empty (or is cleared between tests)', () => {
        expect(fullFileCache.size).toBe(0);
    });

    test('can be populated and queried manually', () => {
        fullFileCache.set('key', 'value');
        expect(fullFileCache.get('key')).toBe('value');
    });
});

// ─── renderFullFileContent ────────────────────────────────────────────────────

describe('renderFullFileContent — no project context', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
    });

    test('shows an error message when project context is not set', async () => {
        const fileNode = { name: 'test.js', path: 'src/test.js' };
        await renderFullFileContent(container, fileNode);

        expect(container.textContent).toContain('Contexte du projet non disponible');
    });
});

describe('renderFullFileContent — text file from cache', () => {
    let container;
    const projectInfo = { projectPath: 'ns/repo', sourceBranch: 'main' };

    beforeEach(() => {
        container = document.createElement('div');
        setProjectContext(projectInfo);
    });

    test('renders one line element per line in the cached content', async () => {
        const fileNode = { name: 'app.js', path: 'src/app.js' };
        const cacheKey = `${projectInfo.projectPath}:${fileNode.path}@main`;
        fullFileCache.set(cacheKey, 'const a = 1;\nconst b = 2;\nconst c = 3;');

        await renderFullFileContent(container, fileNode);

        const lines = container.querySelectorAll('.ct-full-file-line');
        expect(lines.length).toBe(3);
    });

    test('renders line numbers starting at 1', async () => {
        const fileNode = { name: 'app.js', path: 'src/app.js' };
        const cacheKey = `${projectInfo.projectPath}:${fileNode.path}@main`;
        fullFileCache.set(cacheKey, 'line one\nline two');

        await renderFullFileContent(container, fileNode);

        const lineNums = container.querySelectorAll('.ct-full-file-line-num');
        expect(lineNums[0].textContent).toBe('1');
        expect(lineNums[1].textContent).toBe('2');
    });

    test('uses refOverride to build the cache key', async () => {
        const fileNode = { name: 'app.js', path: 'src/app.js' };
        const cacheKey = `${projectInfo.projectPath}:${fileNode.path}@feature-branch`;
        fullFileCache.set(cacheKey, 'overridden content');

        await renderFullFileContent(container, fileNode, 'feature-branch');

        const lines = container.querySelectorAll('.ct-full-file-line');
        expect(lines.length).toBe(1);
    });

    test('uses fileNode.ref when no refOverride is provided', async () => {
        const fileNode = { name: 'app.js', path: 'src/app.js', ref: 'v2.0' };
        const cacheKey = `${projectInfo.projectPath}:${fileNode.path}@v2.0`;
        fullFileCache.set(cacheKey, 'ref-based content');

        await renderFullFileContent(container, fileNode);

        const lines = container.querySelectorAll('.ct-full-file-line');
        expect(lines.length).toBe(1);
    });
});

describe('renderFullFileContent — fetch on cache miss', () => {
    let container;
    const { fetchFileContent } = require('../src/api/client.js');
    const projectInfo = { projectPath: 'ns/repo', sourceBranch: 'main' };

    beforeEach(() => {
        container = document.createElement('div');
        setProjectContext(projectInfo);
    });

    test('calls fetchFileContent when the content is not cached', async () => {
        fetchFileContent.mockResolvedValueOnce({ content: 'fetched line' });

        const fileNode = { name: 'new.js', path: 'src/new.js' };
        await renderFullFileContent(container, fileNode);

        expect(fetchFileContent).toHaveBeenCalledTimes(1);
        const lines = container.querySelectorAll('.ct-full-file-line');
        expect(lines.length).toBe(1);
    });

    test('populates the cache after a successful fetch', async () => {
        fetchFileContent.mockResolvedValueOnce({ content: 'cached after fetch' });

        const fileNode = { name: 'new2.js', path: 'src/new2.js' };
        await renderFullFileContent(container, fileNode);

        const cacheKey = `${projectInfo.projectPath}:${fileNode.path}@main`;
        expect(fullFileCache.has(cacheKey)).toBe(true);
    });

    test('shows error message when fetch fails', async () => {
        fetchFileContent.mockRejectedValueOnce(new Error('Network error'));

        const fileNode = { name: 'bad.js', path: 'src/bad.js' };
        await renderFullFileContent(container, fileNode);

        expect(container.textContent).toContain('Erreur');
        expect(container.textContent).toContain('Network error');
    });
});

describe('renderFullFileContent — binary / image / pdf dispatch', () => {
    let container;
    const { fetchFileContent } = require('../src/api/client.js');
    const projectInfo = { projectPath: 'ns/repo', sourceBranch: 'main' };

    beforeEach(() => {
        container = document.createElement('div');
        setProjectContext(projectInfo);
    });

    test('renders image wrapper for PNG files', async () => {
        fetchFileContent.mockResolvedValueOnce({ content: 'base64data==' });

        const fileNode = { name: 'logo.png', path: 'assets/logo.png' };
        await renderFullFileContent(container, fileNode);

        expect(container.querySelector('.ct-preview-image-wrapper')).not.toBeNull();
        const img = container.querySelector('img.ct-preview-image');
        expect(img).not.toBeNull();
        expect(img.getAttribute('src')).toContain('image/png');
    });

    test('renders PDF embed for PDF files', async () => {
        fetchFileContent.mockResolvedValueOnce({ content: 'pdfbase64==' });

        // Minimal atob mock — jsdom may not have a complete implementation
        global.atob = (str) => str;

        const fileNode = { name: 'doc.pdf', path: 'docs/doc.pdf' };
        await renderFullFileContent(container, fileNode);

        expect(container.querySelector('.ct-preview-pdf-wrapper')).not.toBeNull();
    });

    test('renders binary placeholder for .exe files', async () => {
        const fileNode = { name: 'app.exe', path: 'bin/app.exe' };
        await renderFullFileContent(container, fileNode);

        // Should show the binary placeholder (no fetch needed)
        expect(fetchFileContent).not.toHaveBeenCalled();
        expect(container.querySelector('.ct-diff-empty')).not.toBeNull();
        expect(container.textContent).toContain('binaire');
    });
});
