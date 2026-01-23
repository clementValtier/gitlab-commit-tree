/**
 * GitLab Commit Tree Syntax Highlighting Module
 * @fileoverview Functions for syntax highlighting code with Highlight.js
 * @module commit-tree-highlight
 */

/**
 * Applies syntax highlighting to a line of code
 * @param {string} content - Content of the line
 * @param {string} fileExt - File extension (e.g., 'js', 'py', 'vue')
 * @returns {string} HTML with syntax highlighting
 */
export function highlightCode(content, fileExt) {
    if (!hljs || !fileExt || !content.trim() || !hljs.getLanguage(fileExt)) {
        return escapeHtml(content);
    }
    
    try {
        const result = hljs.highlight(content, { 
            language: fileExt,
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