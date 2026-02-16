import { highlightCode, escapeHtml } from '../src/core/highlight.js';

describe('escapeHtml', () => {
    test('should escape special characters', () => {
        // Mock document for JSDOM
        const text = '<div>Test & "quote"</div>';
        const escaped = escapeHtml(text);
        expect(escaped).toBe('&lt;div&gt;Test &amp; "quote"&lt;/div&gt;');
    });
});

describe('highlightCode', () => {
    test('should escape HTML if no language found', () => {
        const code = 'const x = 1;';
        const result = highlightCode(code, 'unknown');
        expect(result).toBe('const x = 1;');
    });

    test('should highlight javascript', () => {
        const code = 'const x = 1;';
        const result = highlightCode(code, 'js');
        expect(result).toContain('hljs-keyword');
        expect(result).toContain('const');
    });

    test('should highlight python', () => {
        const code = 'def test(): pass';
        const result = highlightCode(code, 'py');
        expect(result).toContain('hljs-keyword');
        expect(result).toContain('def');
    });

    test('should highlight twig', () => {
        const code = '{{ variable }}';
        const result = highlightCode(code, 'twig');
        expect(result).toContain('hljs-template-variable');
    });

    test('should highlight omnis studio (omh)', () => {
        const code = 'Begin critical block kTrue';
        const result = highlightCode(code, 'omh');
        expect(result).toContain('hljs-keyword');
        expect(result).toContain('Begin critical block');
        expect(result).toContain('hljs-literal');
        expect(result).toContain('kTrue');
    });

    test('should use fileLanguageMapping for .gitignore', () => {
        const code = '*.log\nnode_modules/';
        const result = highlightCode(code, 'gitignore', '.gitignore');
        // Should return escaped code or highlighted, not throw
        expect(result).toBeDefined();
    });

    test('should use fileLanguageMapping for package-lock.json', () => {
        const code = '{ "name": "test", "version": "1.0.0" }';
        const result = highlightCode(code, 'json', 'package-lock.json');
        // json is always loaded, should have highlighting
        expect(result).toContain('hljs-');
        expect(result).toContain('&quot;name&quot;');
    });

    test('should use fileLanguageMapping for .env', () => {
        const code = 'DATABASE_URL=postgres://localhost';
        const result = highlightCode(code, 'env', '.env');
        expect(result).toBeDefined();
    });

    test('should use fileLanguageMapping for Dockerfile', () => {
        const code = 'FROM node:18\nRUN npm install';
        const result = highlightCode(code, 'Dockerfile', 'Dockerfile');
        expect(result).toBeDefined();
    });

    test('should use fileLanguageMapping for yarn.lock', () => {
        const code = '# yarn lockfile v1\npackage@^1.0.0:';
        const result = highlightCode(code, 'lock', 'yarn.lock');
        expect(result).toBeDefined();
    });

    test('should use fileLanguageMapping for Makefile', () => {
        const code = 'all:\n\techo "test"';
        const result = highlightCode(code, 'Makefile', 'Makefile');
        expect(result).toBeDefined();
    });

    test('should escape if extension not found and no mapping', () => {
        const code = 'some random text';
        const result = highlightCode(code, 'unknown', 'file.unknown');
        expect(result).toBe('some random text');
    });

    test('should escape if mapped language not supported by hljs', () => {
        const code = 'some code';
        const result = highlightCode(code, 'xyz', 'test.xyz');
        expect(result).toBe('some code');
    });

    test('should return empty string for empty content', () => {
        const result = highlightCode('', 'js');
        expect(result).toBe('');
    });

    test('should return escaped content for whitespace-only content', () => {
        const result = highlightCode('   \n  \t  ', 'js');
        // Whitespace is considered "not trim" so it gets escaped
        expect(result).toContain(' ');
    });
});
