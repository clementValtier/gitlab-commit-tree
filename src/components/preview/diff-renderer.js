/**
 * Diff Renderer Component
 * @fileoverview Logic for rendering unified diffs with syntax highlighting
 */

import * as Diff from 'diff';
import { icons, cssClasses } from '../../config/constants.js';
import { createElement } from '../../utils/dom.js';
import { highlightCode } from '../../core/highlight.js';

/**
 * Toggles the diff view for a file
 * @param {HTMLElement} item - Tree item element
 * @param {Object} fileNode - File node data
 */
export function toggleDiffView(item, fileNode) {
    let diffContainer = item.nextElementSibling;

    if (diffContainer && diffContainer.classList.contains(cssClasses.diffContainer)) {
        diffContainer.style.display = diffContainer.style.display === 'none' ? 'block' : 'none';
        return;
    }

    diffContainer = createElement('div', { className: cssClasses.diffContainer });
    renderDiff(diffContainer, fileNode.diff_content, fileNode.path);
    item.parentNode.insertBefore(diffContainer, item.nextSibling);
}

/**
 * Renders diff content into a container with table structure
 * @param {HTMLElement} container - Container element
 * @param {string} diffContent - The diff content string
 * @param {string} filePath - File path for syntax highlighting logic
 */
export function renderDiff(container, diffContent, filePath) {
    if (!diffContent) {
        container.innerHTML = '<div class="ct-diff-empty"><span class="ct-diff-empty-text">Aucune différence disponible</span></div>';
        return;
    }

    const filename = filePath.split('/').pop() || '';
    const fileExt = filename.split('.').pop()?.toLowerCase() || '';
    const lines = diffContent.split('\n');
    const table = createElement('div', { className: 'ct-diff-table' });

    let oldLineNum = 0;
    let newLineNum = 0;
    let sectionCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('@@')) {
            const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
            if (match) {
                oldLineNum = parseInt(match[1], 10);
                newLineNum = parseInt(match[2], 10);
            }

            sectionCount++;
            if (sectionCount > 1) {
                const separatorRow = createElement('div', { className: 'ct-diff-separator' });
                const separatorCell1 = createElement('span', { className: 'ct-diff-separator-cell' }, '•••');
                const separatorCell2 = createElement('span', { className: 'ct-diff-separator-spacer' });
                const separatorCell3 = createElement('span', { className: 'ct-diff-separator-content' });
                separatorRow.appendChild(separatorCell1);
                separatorRow.appendChild(separatorCell2);
                separatorRow.appendChild(separatorCell3);
                table.appendChild(separatorRow);
            }
            continue;
        }

        if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('\\')) {
            continue;
        }

        if (line.startsWith('-')) {
            let removed = [];
            let j = i;
            while (j < lines.length && lines[j].startsWith('-') && !lines[j].startsWith('---')) {
                removed.push(lines[j]);
                j++;
            }

            let added = [];
            while (j < lines.length && lines[j].startsWith('+') && !lines[j].startsWith('+++')) {
                added.push(lines[j]);
                j++;
            }

            if (removed.length > 0 && removed.length === added.length) {
                for (let k = 0; k < removed.length; k++) {
                    const oldText = removed[k].substring(1);
                    const changes = Diff.diffWords(oldText, added[k].substring(1));
                    renderModifiedLine(table, 'removed', oldLineNum++, '', changes, true, fileExt, filename);
                }
                for (let k = 0; k < added.length; k++) {
                    const newText = added[k].substring(1);
                    const changes = Diff.diffWords(removed[k].substring(1), newText);
                    renderModifiedLine(table, 'added', '', newLineNum++, changes, false, fileExt, filename);
                }

                i = j - 1;
                continue;
            }
        }

        renderNormalLine(table, line, oldLineNum, newLineNum, fileExt, filename);

        if (line.startsWith('+')) {
            newLineNum++;
        } else if (line.startsWith('-')) {
            oldLineNum++;
        } else if (line.startsWith(' ')) {
            oldLineNum++;
            newLineNum++;
        }
    }

    container.appendChild(table);
}

/**
 * Helper to render modified lines with word highlighting
 */
function renderModifiedLine(table, type, oldNum, newNum, changes, isRemoved, fileExt, filename) {
    const lineRow = createElement('div', { className: `ct-diff-line ct-diff-line-${type}` });
    const oldNumCell = createElement('span', { className: 'ct-line-num ct-line-num-old' }, oldNum.toString());
    const newNumCell = createElement('span', { className: 'ct-line-num ct-line-num-new' }, newNum.toString());
    const contentCell = createElement('span', { className: 'ct-line-content' });

    changes.forEach(part => {
        if (isRemoved && part.removed) {
            const span = document.createElement('span');
            span.className = 'ct-word-removed';
            span.textContent = part.value;
            contentCell.appendChild(span);
        } else if (!isRemoved && part.added) {
            const span = document.createElement('span');
            span.className = 'ct-word-added';
            span.textContent = part.value;
            contentCell.appendChild(span);
        } else if (!part.added && !part.removed) {
            const span = createElement('span');
            span.innerHTML = highlightCode(part.value, fileExt, filename);
            contentCell.appendChild(span);
        }
    });

    lineRow.appendChild(oldNumCell);
    lineRow.appendChild(newNumCell);
    lineRow.appendChild(contentCell);
    table.appendChild(lineRow);
}

/**
 * Helper for normal lines
 */
function renderNormalLine(table, line, oldLineNum, newLineNum, fileExt, filename) {
    let lineType = 'context';
    let oldNum = '';
    let newNum = '';
    let lineContent = line;

    if (line.startsWith('+')) {
        lineType = 'added';
        newNum = newLineNum;
        lineContent = line.substring(1);
    } else if (line.startsWith('-')) {
        lineType = 'removed';
        oldNum = oldLineNum;
        lineContent = line.substring(1);
    } else if (line.startsWith(' ')) {
        lineType = 'context';
        oldNum = oldLineNum;
        newNum = newLineNum;
        lineContent = line.substring(1);
    } else {
        return;
    }

    const lineRow = createElement('div', { className: `ct-diff-line ct-diff-line-${lineType}` });
    const oldNumCell = createElement('span', { className: 'ct-line-num ct-line-num-old' }, oldNum.toString());
    const newNumCell = createElement('span', { className: 'ct-line-num ct-line-num-new' }, newNum.toString());
    const contentCell = createElement('span', { className: 'ct-line-content' });

    if (lineContent === '') {
        contentCell.innerHTML = ' ';
    } else {
        contentCell.innerHTML = highlightCode(lineContent, fileExt, filename);
    }

    lineRow.appendChild(oldNumCell);
    lineRow.appendChild(newNumCell);
    lineRow.appendChild(contentCell);
    table.appendChild(lineRow);
}

/**
 * Extracts diff content from GitLab's HTML response
 * @param {string} html - HTML string from GitLab's diff_for_path endpoint
 * @returns {string} Extracted diff content in unified diff format
 */
export function extractDiffFromGitLabHTML(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const lineHolders = doc.querySelectorAll('.line_holder');
    
    const sections = [];
    let currentSection = null;
    let prevOldNum = null;
    let prevNewNum = null;
    
    lineHolders.forEach((lineHolder) => {
        const contentCell = lineHolder.querySelector('.line_content');
        if (!contentCell) return;
        
        let text = contentCell.textContent || '';
        text = text.replace(/\n/g, '');
        
        if (text.startsWith('\\ No newline at end of file') || text.startsWith('@@')) return;
        
        const getLineNum = (selector) => {
            const num = lineHolder.querySelector(selector)?.getAttribute('data-linenumber');
            if (!num || num.trim() === '') return null;
            const parsed = parseInt(num, 10);
            return isNaN(parsed) ? null : parsed;
        };
        
        const oldNum = getLineNum('.old_line');
        const newNum = getLineNum('.new_line');
        const type = lineHolder.classList.contains('old') ? 'removed' 
                   : lineHolder.classList.contains('new') ? 'added' 
                   : 'context';
        
        const hasJump = (prevOldNum !== null && oldNum !== null && oldNum > prevOldNum + 1) ||
                       (prevNewNum !== null && newNum !== null && newNum > prevNewNum + 1);
        
        if (hasJump || !currentSection) {
            if (currentSection) sections.push(currentSection);
            currentSection = {
                oldStart: oldNum || 1,
                newStart: newNum || 1,
                oldCount: 0,
                newCount: 0,
                lines: []
            };
        }
        
        const prefix = type === 'removed' ? '-' : type === 'added' ? '+' : ' ';
        currentSection.lines.push(prefix + text);
        
        if (type === 'removed') currentSection.oldCount++;
        else if (type === 'added') currentSection.newCount++;
        else { currentSection.oldCount++; currentSection.newCount++; }
        
        prevOldNum = oldNum;
        prevNewNum = newNum;
    });
    
    if (currentSection) sections.push(currentSection);
    if (sections.length === 0) return '';
    
    return sections.map(s => 
        `@@ -${s.oldStart},${s.oldCount} +${s.newStart},${s.newCount} @@\n${s.lines.join('\n')}`
    ).join('\n');
}
