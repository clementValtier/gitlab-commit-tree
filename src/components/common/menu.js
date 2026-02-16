/**
 * Context Menu Component
 * @fileoverview Logic for the file context menu
 */

import { cssClasses } from '../../config/constants.js';
import { createElement } from '../../utils/dom.js';
import { navigateToFile } from '../../utils/gitlab.js';
import { toggleDiffView } from '../preview/diff-renderer.js';

/**
 * Shows a context menu for a file
 * @param {MouseEvent} event - The context menu event
 * @param {Object} child - Tree node data
 * @param {HTMLElement} item - Tree item element
 * @param {string|null} specificCommitSha - Specific commit SHA
 * @param {HTMLElement|null} previewPanel - Preview panel element
 * @param {Function} showFileInPreview - Callback to show file in preview
 */
export function showContextMenu(event, child, item, specificCommitSha, previewPanel, showFileInPreview) {
    document.querySelectorAll('.ct-context-menu').forEach(menu => menu.remove());

    const contextMenu = createElement('div', {
        className: 'ct-context-menu'
    });

    const viewItem = createElement('div', { className: 'ct-menu-item' }, 'Voir le fichier');
    viewItem.onclick = () => {
        navigateToFile(child.path, null, child.ref || specificCommitSha);
        contextMenu.remove();
    };
    contextMenu.appendChild(viewItem);

    if (child.diff_content || child.has_diff_content) {
        const diffItem = createElement('div', { className: 'ct-menu-item' }, 'Voir les différences');
        diffItem.onclick = () => {
            if (previewPanel) {
                showFileInPreview(previewPanel, child, previewPanel._viewMode || 'diff');
                const treeContainer = item.closest(`.${cssClasses.tree}`);
                if (treeContainer) {
                    treeContainer.querySelectorAll(`.${cssClasses.treeItem}`).forEach(el => {
                        el.classList.remove('ct-selected');
                    });
                }
                item.classList.add('ct-selected');
            } else {
                toggleDiffView(item, child);
            }
            contextMenu.remove();
        };
        contextMenu.appendChild(diffItem);
    }

    document.body.appendChild(contextMenu);

    const menuRect = contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = event.clientX;
    let top = event.clientY;

    if (left + menuRect.width > viewportWidth) {
        left = viewportWidth - menuRect.width - 5;
    }
    if (top + menuRect.height > viewportHeight) {
        top = viewportHeight - menuRect.height - 5;
    }

    contextMenu.style.left = `${left}px`;
    contextMenu.style.top = `${top}px`;

    document.addEventListener('click', () => contextMenu.remove(), { once: true });
}
