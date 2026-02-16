/**
 * Helper Utilities
 * @fileoverview Generic helper functions
 */

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Parses file statistics from diff content
 * @param {string} diffContent - The diff content string
 * @returns {{additions: number, deletions: number}} Line statistics
 */
export function parseFileStats(diffContent) {
    if (!diffContent) {
        return { additions: 0, deletions: 0 };
    }

    const lines = diffContent.split('\n');
    let additions = 0;
    let deletions = 0;

    lines.forEach(line => {
        if (line.startsWith('+') && !line.startsWith('+++')) {
            additions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
            deletions++;
        }
    });

    return { additions, deletions };
}
