/**
 * Helper Utilities
 * @fileoverview Generic helper functions
 */

import mime from 'mime';
import binaryExtensions from 'binary-extensions';

/**
 * Returns true if the file extension corresponds to an image
 * @param {string} ext - Lowercase file extension without dot
 * @returns {boolean}
 */
export function isImageFile(ext) {
    const type = mime.getType(ext);
    return type && type.startsWith('image/');
}

/**
 * Returns true if the file extension corresponds to a PDF
 * @param {string} ext - Lowercase file extension without dot
 * @returns {boolean}
 */
export function isPdfFile(ext) {
    const type = mime.getType(ext);
    return type === 'application/pdf';
}

/**
 * Returns true if the file extension corresponds to a non-text binary file
 * @param {string} ext - Lowercase file extension without dot
 * @returns {boolean}
 */
export function isBinaryFile(ext) {
    return binaryExtensions.includes(ext);
}

/**
 * Returns the MIME type for an extension
 * @param {string} ext - Lowercase file extension without dot
 * @returns {string}
 */
export function getMimeType(ext) {
    return mime.getType(ext) || 'application/octet-stream';
}

/**
 * Backwards compatibility for image MIME types
 * @deprecated Use getMimeType instead
 */
export function getImageMimeType(ext) {
    return getMimeType(ext);
}

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
