import hljs from 'highlight.js';
import omnisKeywords from '../assets/omnis-keywords.json';
import { fileLanguageMapping } from '../config/constants.js';

// register Omnis language (custom)
registerOmnisLanguage();

/**
 * Applies syntax highlighting to a line of code
 * @param {string} content - Content of the line
 * @param {string} fileExt - File extension (e.g., 'js', 'py', 'vue')
 * @param {string} filename - Full filename (optional, used for special files)
 * @returns {string} HTML with syntax highlighting
 */
export function highlightCode(content, fileExt, filename = '') {
    if (!content.trim()) {
        return escapeHtml(content);
    }

    let language = fileExt;

    if (!hljs.getLanguage(language)) {
        if (!fileLanguageMapping[filename]) {
            return escapeHtml(content);
        }

        language = fileLanguageMapping[filename];

        if (!hljs.getLanguage(language)) {
            return escapeHtml(content);
        }
    }

    try {
        const result = hljs.highlight(content, {
            language: language,
            ignoreIllegals: true
        });
        return result.value;
    } catch (e) {
        return escapeHtml(content);
    }
}

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Registers the Omnis Studio language definition with Highlight.js
 */
function registerOmnisLanguage() {
    if (typeof hljs === 'undefined' || hljs.getLanguage('omh')) {
        return;
    }

    hljs.registerLanguage('omh', function(hljs) {
        const sortByLength = (a, b) => b.length - a.length;
        
        const allKeywords = omnisKeywords.keywords_control.concat(omnisKeywords.commands).sort(sortByLength);
        const multiWordKeywords = allKeywords.filter(k => k.includes(' '));
        const singleWordKeywords = allKeywords.filter(k => !k.includes(' '));

        return {
            name: 'Omnis Studio',
            case_insensitive: false,
            keywords: {
                keyword: singleWordKeywords,
                type: omnisKeywords.types,
                literal: omnisKeywords.constants,
                built_in: omnisKeywords.properties.concat(omnisKeywords.functions)
            },
            contains: [
                {
                    className: 'keyword',
                    begin: new RegExp('\\b(' + multiWordKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b'),
                    relevance: 10
                },
                { className: 'comment', begin: '^\\s*[#;]', end: '$', relevance: 5 },
                { className: 'comment', begin: '##', end: '$', relevance: 5 },
                {
                    begin: '\\bSta:\\s*', end: '$', subLanguage: 'sql',
                    contains: [{ className: 'variable', begin: '@?\\[[^\\]]+\\]' }]
                },
                { begin: '\\bText:\\s*', end: '$', className: 'string', relevance: 10 },
                hljs.QUOTE_STRING_MODE,
                { className: 'constant', begin: '\\b#[A-Z][a-zA-Z0-9_]*\\b', relevance: 10 },
                { className: 'number', begin: '\\b0x[0-9a-fA-F]+\\b' },
                { className: 'number', begin: '\\b\\d+(\\.\\d+)?\\b' },
                { className: 'variable', begin: '\\$[a-zA-Z_][a-zA-Z0-9_]*' },
                { className: 'operator', begin: '(&|\\||\\+|-|\\*|/|=|<>|<=|>=|<|>)' }
            ]
        };
    });
}
