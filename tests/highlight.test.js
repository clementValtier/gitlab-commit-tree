import { highlightCode, escapeHtml } from '../src/commit-tree-highlight.js';

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
});
