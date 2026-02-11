/**
 * GitLab Commit Tree Renderer Module
 * @fileoverview Functions for rendering the file tree and diff views
 * @module commit-tree-renderer
 */

import * as Diff from 'diff';
import { icons, cssClasses, getFileIcon } from './commit-tree-config.js';
import { createElement, scrollToFileInCurrentPage, navigateToFile, debounce } from './commit-tree-utils.js';
import { highlightCode } from './commit-tree-highlight.js';
import { fetchFileContent, fetchDiffForPath } from './commit-tree-api.js';

/** @type {boolean} Flag to prevent cascade opening during programmatic operations */
let isProgrammaticToggle = false;

/** @type {Object|null} Current project info for API calls */
let currentProjectInfo = null;

/** @type {string|null} Current specific commit SHA */
let currentCommitSha = null;

/** @type {Map<string, string>} Cache for full file contents */
const fullFileCache = new Map();

/** @type {Map<string, string>} Cache for fetched diff contents */
const diffContentCache = new Map();

/**
 * Sets the project context for API calls
 * @param {Object} projectInfo - Project information
 * @param {string|null} commitSha - Specific commit SHA
 */
export function setProjectContext(projectInfo, commitSha = null) {
    currentProjectInfo = projectInfo;
    currentCommitSha = commitSha;
}

/**
 * Creates the main tree view container with toolbar and preview panel
 * @param {string} title - Title for the tree view
 * @param {number} fileCount - Number of files
 * @returns {{
 *   container: HTMLElement,
 *   toolbar: HTMLElement,
 *   searchInput: HTMLInputElement,
 *   treeView: HTMLElement,
 *   previewPanel: HTMLElement,
 *   expandAllBtn: HTMLElement,
 *   collapseAllBtn: HTMLElement,
 *   viewDiffBtn: HTMLElement,
 *   viewFullBtn: HTMLElement
 * }} Created elements
 */
export function createTreeContainer(title, fileCount) {
    const container = createElement('div', { className: cssClasses.container });

    const header = createElement('div', { className: cssClasses.header }, `
        <span class="ct-header-title">${title}</span>
        <span class="ct-header-count">${fileCount} fichier(s)</span>
    `);

    const toolbar = createElement('div', { className: cssClasses.toolbar });

    const searchBox = createElement('div', { className: cssClasses.searchBox });
    const searchIcon = createElement('span', { className: 'ct-search-icon' }, icons.search);
    const searchInput = createElement('input', {
        className: cssClasses.searchInput,
        type: 'text',
        placeholder: 'Rechercher (par ex. *.vue) (%P)'
    });
    searchBox.appendChild(searchIcon);
    searchBox.appendChild(searchInput);

    const buttonGroup = createElement('div', { className: 'ct-button-group' });

    const expandAllBtn = createElement('button', {
        className: `${cssClasses.button} ct-btn-icon`,
        title: 'Tout déplier'
    }, icons.expandAll);

    const collapseAllBtn = createElement('button', {
        className: `${cssClasses.button} ct-btn-icon`,
        title: 'Tout replier'
    }, icons.collapseAll);

    buttonGroup.appendChild(expandAllBtn);
    buttonGroup.appendChild(collapseAllBtn);

    const viewModeGroup = createElement('div', { className: 'ct-button-group ct-view-mode-group' });

    const viewDiffBtn = createElement('button', {
        className: `${cssClasses.button} ct-btn-icon ${cssClasses.viewModeActive}`,
        title: 'Mode différences'
    }, icons.viewDiff);

    const viewFullBtn = createElement('button', {
        className: `${cssClasses.button} ct-btn-icon`,
        title: 'Mode fichier complet'
    }, icons.viewFile);

    viewModeGroup.appendChild(viewDiffBtn);
    viewModeGroup.appendChild(viewFullBtn);

    toolbar.appendChild(searchBox);
    toolbar.appendChild(buttonGroup);
    toolbar.appendChild(viewModeGroup);

    const splitView = createElement('div', { className: 'ct-split-view' });

    const treeView = createElement('div', { className: cssClasses.tree });

    const previewPanel = createElement('div', { className: 'ct-preview-panel' });
    previewPanel._viewMode = 'diff';
    const previewPlaceholder = createElement('div', { className: 'ct-preview-placeholder' }, `
        <span class="ct-preview-icon">${icons.file}</span>
        <span class="ct-preview-text">Sélectionnez un fichier pour voir les modifications</span>
    `);
    previewPanel.appendChild(previewPlaceholder);

    splitView.appendChild(treeView);
    splitView.appendChild(previewPanel);

    container.appendChild(header);
    container.appendChild(toolbar);
    container.appendChild(splitView);

    setupPreviewSearch(previewPanel);

    return {
        container,
        toolbar,
        searchInput,
        treeView,
        previewPanel,
        expandAllBtn,
        collapseAllBtn,
        viewDiffBtn,
        viewFullBtn
    };
}

/**
 * Renders the file tree into a container
 * @param {HTMLElement} container - Container element
 * @param {Object} node - Tree node to render
 * @param {number} [level=0] - Current depth level
 * @param {string} [filter=''] - Filter string for searching
 * @param {string|null} [specificCommitSha=null] - Specific commit SHA
 * @param {HTMLElement|null} [previewPanel=null] - Preview panel element
 */
export function renderTree(container, node, level = 0, filter = '', specificCommitSha = null, previewPanel = null) {
    const nodeArray = Object.values(node.children).sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    if (level === 0 && !container._delegationSetup) {
        setupTreeEventDelegation(container, specificCommitSha, previewPanel);
    }

    nodeArray.forEach(child => {
        const isCollapsible = child.type === 'folder' && Object.keys(child.children).length > 0;
        const fullPath = child.path || child.name;

        const matchesFilter = filter === '' ||
            fullPath.toLowerCase().includes(filter.toLowerCase()) ||
            child.name.toLowerCase().includes(filter.toLowerCase()) ||
            matchesGlobPattern(child.name, filter);

        const hasMatchingDescendants = child.type === 'folder' && hasMatchingChildren(child, filter);
        const displayItem = child.type === 'folder' ? hasMatchingDescendants : matchesFilter;

        if (!displayItem && filter !== '') {
            return;
        }

        const item = createTreeItem(child, level, isCollapsible);
        container.appendChild(item.element);

        if (child.type === 'folder' && isCollapsible) {
            const shouldExpand = filter !== '' || level === 0;
            
            const childContainer = createElement('div', {
                className: cssClasses.treeChildren,
                style: { display: shouldExpand ? 'block' : 'none' }
            });
            container.appendChild(childContainer);

            renderTree(childContainer, child, level + 1, filter, specificCommitSha, previewPanel);

            item.element._childData = child;

            if (shouldExpand) {
                item.element.classList.add(cssClasses.expanded);
                item.chevron.innerHTML = icons.chevronDown;
                item.icon.innerHTML = icons.folderOpen;
            }
        }
    });
}

/**
 * Sets up event delegation for the entire tree
 * @param {HTMLElement} treeContainer - Tree container element
 * @param {string|null} specificCommitSha - Specific commit SHA
 * @param {HTMLElement|null} previewPanel - Preview panel element
 */
function setupTreeEventDelegation(treeContainer, specificCommitSha, previewPanel) {
    treeContainer._delegationSetup = true;

    treeContainer.onclick = (e) => {
        const treeItem = e.target.closest(`.${cssClasses.treeItem}`);
        if (!treeItem) return;

        const chevron = e.target.closest(`.${cssClasses.treeItemChevron}`);
        const content = e.target.closest(`.${cssClasses.treeItemContent}`);
        if (!content) return;

        if (treeItem.classList.contains(cssClasses.folder)) {
            if (chevron) {
                e.stopPropagation();
            }
            
            const childContainer = treeItem.nextElementSibling;
            if (!childContainer || !childContainer.classList.contains(cssClasses.treeChildren)) return;

            const itemChevron = treeItem.querySelector(`.${cssClasses.treeItemChevron}`);
            const itemIcon = treeItem.querySelector(`.${cssClasses.treeItemIcon}`);
            const isExpanded = treeItem.classList.contains(cssClasses.expanded);

            if (isExpanded) {
                treeItem.classList.remove(cssClasses.expanded);
                itemChevron.innerHTML = icons.chevronRight;
                itemIcon.innerHTML = icons.folderClosed;
                childContainer.style.display = 'none';
            } else {
                treeItem.classList.add(cssClasses.expanded);
                itemChevron.innerHTML = icons.chevronDown;
                itemIcon.innerHTML = icons.folderOpen;
                childContainer.style.display = 'block';

                if (!isProgrammaticToggle) {
                    const childData = treeItem._childData;
                    if (childData) {
                        autoExpandSingleChild(childContainer, childData);
                    }
                }
            }
        } else if (treeItem.classList.contains(cssClasses.file)) {
            const child = treeItem._fileNode;
            if (!child) return;

            if (previewPanel) {
                showFileInPreview(previewPanel, child, previewPanel._viewMode || 'diff');
                
                treeContainer.querySelectorAll(`.${cssClasses.treeItem}`).forEach(el => {
                    el.classList.remove('ct-selected');
                });
                treeItem.classList.add('ct-selected');
            } else if (!scrollToFileInCurrentPage(child.path)) {
                navigateToFile(child.path, null, child.ref || specificCommitSha);
            }
        }
    };

    treeContainer.oncontextmenu = (e) => {
        const treeItem = e.target.closest(`.${cssClasses.treeItem}`);
        if (!treeItem || !treeItem.classList.contains(cssClasses.file)) return;

        const content = e.target.closest(`.${cssClasses.treeItemContent}`);
        if (!content) return;

        e.preventDefault();
        
        const child = treeItem._fileNode;
        if (!child) return;

        showContextMenu(e, child, treeItem, child.ref || specificCommitSha, previewPanel);
    };
}

/**
 * Creates a tree item element
 * @param {Object} child - Tree node data
 * @param {number} level - Indentation level
 * @param {boolean} isCollapsible - Whether the item can be expanded/collapsed
 * @returns {{element: HTMLElement, chevron: HTMLElement, icon: HTMLElement, name: HTMLElement}} Created elements
 */
function createTreeItem(child, level, isCollapsible) {
    const item = createElement('div', {
        className: `${cssClasses.treeItem} ${child.type === 'folder' ? cssClasses.folder : cssClasses.file}`,
        dataset: { path: child.path || child.name }
    });

    item.style.paddingLeft = `${level * 16 + 8}px`;

    const content = createElement('div', { className: cssClasses.treeItemContent });

    const chevron = createElement('span', {
        className: cssClasses.treeItemChevron,
        style: { visibility: isCollapsible ? 'visible' : 'hidden' }
    }, icons.chevronRight);

    const icon = createElement('span', {
        className: cssClasses.treeItemIcon
    }, child.type === 'folder' ? icons.folderClosed : getFileIcon(child.name));

    const name = createElement('span', {
        className: cssClasses.treeItemName
    }, child.name);

    content.appendChild(chevron);
    content.appendChild(icon);
    content.appendChild(name);

    const rightSection = createElement('span', { className: 'ct-tree-item-right' });

    if (child.type === 'file' && child.stats && (child.stats.additions > 0 || child.stats.deletions > 0)) {
        const stats = createElement('span', { className: cssClasses.treeItemStats });
        if (child.stats.additions > 0) {
            const addSpan = createElement('span', { className: 'ct-stats-add' }, `+${child.stats.additions}`);
            stats.appendChild(addSpan);
        }
        if (child.stats.deletions > 0) {
            const delSpan = createElement('span', { className: 'ct-stats-del' }, `-${child.stats.deletions}`);
            stats.appendChild(delSpan);
        }
        rightSection.appendChild(stats);
    }

    if (child.status && child.type === 'file') {
        const statusBadge = createElement('span', {
            className: `ct-status-badge ct-status-badge-${child.status}`,
            title: getStatusLabel(child.status)
        }, getStatusShortLabel(child.status));
        rightSection.appendChild(statusBadge);
    }

    content.appendChild(rightSection);
    item.appendChild(content);

    if (child.type === 'file') {
        item._fileNode = child;
    }

    return { element: item, chevron, icon, name };
}

/**
 * Gets the full label for a file status
 * @param {string} status - File status
 * @returns {string} Full status label
 */
function getStatusLabel(status) {
    const labels = {
        added: 'Ajouté',
        modified: 'Modifié',
        deleted: 'Supprimé',
        renamed: 'Renommé'
    };
    return labels[status] || status;
}

/**
 * Gets the short label for a file status
 * @param {string} status - File status
 * @returns {string} Short status label
 */
function getStatusShortLabel(status) {
    const labels = {
        added: 'A',
        modified: 'M',
        deleted: 'D',
        renamed: 'R'
    };
    return labels[status] || '?';
}

/**
 * Auto-expands single child folders
 * @param {HTMLElement} childContainer - Container for children
 * @param {Object} child - Tree node data
 */
function autoExpandSingleChild(childContainer, child) {
    const childFolders = Object.values(child.children).filter(c => c.type === 'folder');
    if (childFolders.length === 1 && Object.values(child.children).length === 1) {
        const subFolderItem = childContainer.querySelector(`.${cssClasses.treeItem}.${cssClasses.folder}`);
        if (subFolderItem && !subFolderItem.classList.contains(cssClasses.expanded)) {
            setTimeout(() => {
                const chevron = subFolderItem.querySelector(`.${cssClasses.treeItemChevron}`);
                if (chevron) chevron.click();
            }, 10);
        }
    }
}

/**
 * Shows file diff in the preview panel
 * @param {HTMLElement} previewPanel - Preview panel element
 * @param {Object} fileNode - File node data
 * @param {string} mode - Display mode ('diff' or 'full')
 */
function showFileInPreview(previewPanel, fileNode, mode = 'diff') {
    const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
    previewPanel.innerHTML = '';
    if (searchBar) {
        previewPanel.appendChild(searchBar);
        searchBar.style.display = 'none';
        const searchInput = searchBar.querySelector('.ct-preview-search-input');
        if (searchInput) searchInput.value = '';
    }
    previewPanel._currentFileNode = fileNode;
    const ref = fileNode.ref || currentCommitSha;

    const previewHeader = createElement('div', { className: 'ct-preview-header' });
    const fileInfo = createElement('div', { className: 'ct-preview-file-info' });
    const fileName = createElement('span', { className: 'ct-preview-filename' }, fileNode.name);
    const filePath = createElement('span', { className: 'ct-preview-filepath' }, fileNode.path);
    fileInfo.appendChild(fileName);
    fileInfo.appendChild(filePath);

    if (fileNode.status === 'renamed' && fileNode.old_path && fileNode.old_path !== fileNode.path) {
        const oldPath = createElement('span', { className: 'ct-preview-old-path' }, fileNode.old_path);
        fileInfo.appendChild(oldPath);
    }

    const fileStats = createElement('div', { className: 'ct-preview-stats' });
    if (fileNode.stats && (fileNode.stats.additions > 0 || fileNode.stats.deletions > 0)) {
        if (fileNode.stats.additions > 0) {
            const addSpan = createElement('span', { className: 'ct-stats-add' }, `+${fileNode.stats.additions}`);
            fileStats.appendChild(addSpan);
        }
        if (fileNode.stats.deletions > 0) {
            const delSpan = createElement('span', { className: 'ct-stats-del' }, `-${fileNode.stats.deletions}`);
            fileStats.appendChild(delSpan);
        }
    }
    if (fileNode.status) {
        const statusBadge = createElement('span', {
            className: `ct-status-badge ct-status-badge-${fileNode.status}`
        }, getStatusShortLabel(fileNode.status));
        fileStats.appendChild(statusBadge);
    }

    previewHeader.appendChild(fileInfo);
    previewHeader.appendChild(fileStats);

    const previewContent = createElement('div', { className: 'ct-preview-content' });

    if (mode === 'full') {
        renderFullFileContent(previewContent, fileNode, ref);
    } else {
        if (fileNode.has_diff_content && fileNode.diff_content) {
            renderDiff(previewContent, fileNode.diff_content, fileNode.path);
        } else if (currentProjectInfo && currentProjectInfo.isComparePage) {
            const cacheKey = `${currentProjectInfo.projectPath}:${fileNode.path}:${currentProjectInfo.targetBranch}...${currentProjectInfo.sourceBranch}`;
            let cachedDiff = diffContentCache.get(cacheKey);
            
            if (cachedDiff) {
                renderDiff(previewContent, cachedDiff, fileNode.path);
            } else {
                const loading = createElement('div', { className: cssClasses.loading }, 'Récupération des différences...');
                previewContent.appendChild(loading);

                (async () => {
                    try {
                        const diffData = await fetchDiffForPath(
                            currentProjectInfo, 
                            fileNode.path, 
                            fileNode.old_path || fileNode.path,
                            fileNode.status
                        );
                        
                        loading.remove();
                        
                        if (diffData && diffData.html) {
                            const extractedDiff = extractDiffFromGitLabHTML(diffData.html);
                            diffContentCache.set(cacheKey, extractedDiff);
                            renderDiff(previewContent, extractedDiff, fileNode.path);
                        } else {
                            throw new Error('No diff data received');
                        }
                    } catch (error) {
                        loading.remove();
                        renderEmptyDiffWithLoadButton(previewContent, fileNode, previewPanel);
                    }
                })();
            }
        } else {
            renderEmptyDiffWithLoadButton(previewContent, fileNode, previewPanel);
        }
    }

    previewPanel.appendChild(previewHeader);
    previewPanel.appendChild(previewContent);
}

/**
 * Renders empty diff state with a link to view the file
 * @param {HTMLElement} container - Container element
 * @param {Object} fileNode - File node data
 * @param {HTMLElement} previewPanel - Preview panel for context
 */
function renderEmptyDiffWithLoadButton(container, fileNode, previewPanel) {
    const emptyDiv = createElement('div', { className: 'ct-diff-empty' });
    
    const emptyText = createElement('span', { className: 'ct-diff-empty-text' }, 
        'Les différences ne sont pas accessibles pour ce fichier.');
    emptyDiv.appendChild(emptyText);

    if (currentProjectInfo) {
        const viewFileBtn = createElement('button', {
            className: `${cssClasses.button} ct-diff-load-btn`
        }, `${icons.file} <span>Ouvrir le fichier</span>`);
        viewFileBtn.onclick = () => navigateToFile(fileNode.path, currentProjectInfo, fileNode.ref || currentCommitSha);
        emptyDiv.appendChild(viewFileBtn);
    }
    container.appendChild(emptyDiv);
}

/**
 * Extracts diff content from GitLab's HTML response
 * @param {string} html - HTML string from GitLab's diff_for_path endpoint
 * @returns {string} Extracted diff content in unified diff format
 */
function extractDiffFromGitLabHTML(html) {
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

/**
 * Shows a context menu for a file
 * @param {MouseEvent} event - The context menu event
 * @param {Object} child - Tree node data
 * @param {HTMLElement} item - Tree item element
 * @param {string|null} specificCommitSha - Specific commit SHA
 * @param {HTMLElement|null} previewPanel - Preview panel element
 */
function showContextMenu(event, child, item, specificCommitSha, previewPanel) {
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

    if (child.diff_content) {
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
 * Renders diff content into a container with table structure for proper backgrounds
 * @param {HTMLElement} container - Container element
 * @param {string} diffContent - The diff content string
 * @param {string} filePath - File path for syntax highlighting logic
 */
export function renderDiff(container, diffContent, filePath) {
    if (!diffContent) {
        container.innerHTML = '<div class="ct-diff-empty"><span class="ct-diff-empty-text">Aucune différence disponible</span></div>';
        return;
    }

    const fileExt = filePath.split('.').pop()?.toLowerCase() || '';
    const lines = diffContent.split('\n');
    const table = createElement('div', { className: 'ct-diff-table' });

    let oldLineNum = 0;
    let newLineNum = 0;
    let sectionCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Gestion des séparateurs @@
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
                // On rend d'abord les lignes removed
                for (let k = 0; k < removed.length; k++) {
                    const oldText = removed[k].substring(1);
                    const changes = Diff.diffWords(oldText, added[k].substring(1));
                    renderModifiedLine(table, 'removed', oldLineNum++, '', changes, true, fileExt);
                }
                // Puis les lignes added
                for (let k = 0; k < added.length; k++) {
                    const newText = added[k].substring(1);
                    const changes = Diff.diffWords(removed[k].substring(1), newText);
                    renderModifiedLine(table, 'added', '', newLineNum++, changes, false, fileExt);
                }

                i = j - 1;           // saute tout le bloc
                continue;
            }
        }

        // Lignes normales (context, added, removed seuls)
        renderNormalLine(table, line, oldLineNum, newLineNum, fileExt);

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

// Fonction helper pour les lignes modifiées avec surlignage
function renderModifiedLine(table, type, oldNum, newNum, changes, isRemoved, fileExt) {
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
            span.innerHTML = highlightCode(part.value, fileExt);
            contentCell.appendChild(span);
        }
    });

    lineRow.appendChild(oldNumCell);
    lineRow.appendChild(newNumCell);
    lineRow.appendChild(contentCell);
    table.appendChild(lineRow);
}

// Fonction helper pour les lignes normales
function renderNormalLine(table, line, oldLineNum, newLineNum, fileExt) {
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
        contentCell.innerHTML = highlightCode(lineContent, fileExt);
    }

    lineRow.appendChild(oldNumCell);
    lineRow.appendChild(newNumCell);
    lineRow.appendChild(contentCell);
    table.appendChild(lineRow);
}

/**
 * Expands all folders in the tree
 * @param {HTMLElement} treeViewElement - Tree view container
 */
export function expandAllFolders(treeViewElement) {
    isProgrammaticToggle = true;
    const collapsedItems = treeViewElement.querySelectorAll(
        `.${cssClasses.treeItem}.${cssClasses.folder}:not(.${cssClasses.expanded})`
    );
    collapsedItems.forEach(item => {
        const chevron = item.querySelector(`.${cssClasses.treeItemChevron}`);
        if (chevron) {
            chevron.click();
        }
    });
    isProgrammaticToggle = false;
}

/**
 * Collapses all folders in the tree
 * @param {HTMLElement} treeViewElement - Tree view container
 */
export function collapseAllFolders(treeViewElement) {
    isProgrammaticToggle = true;
    const expandedItems = treeViewElement.querySelectorAll(
        `.${cssClasses.treeItem}.${cssClasses.folder}.${cssClasses.expanded}`
    );
    Array.from(expandedItems).reverse().forEach(item => {
        const chevron = item.querySelector(`.${cssClasses.treeItemChevron}`);
        if (chevron) {
            chevron.click();
        }
    });
    isProgrammaticToggle = false;
}

/**
 * Sets up the search filter functionality
 * @param {HTMLInputElement} searchInput - Search input element
 * @param {HTMLElement} treeView - Tree view container
 * @param {Object} fileTree - The file tree data
 * @param {string|null} specificCommitSha - Specific commit SHA
 * @param {HTMLElement|null} previewPanel - Preview panel element
 */
export function setupSearch(searchInput, treeView, fileTree, specificCommitSha, previewPanel = null) {
    const filterTree = debounce((filter) => {
        treeView.innerHTML = '';
        treeView._delegationSetup = false;
        renderTree(treeView, fileTree, 0, filter, specificCommitSha, previewPanel);
    }, 200);

    searchInput.oninput = (e) => {
        filterTree(e.target.value);
    };
}

/**
 * Sets up the view mode toggle buttons
 * @param {HTMLElement} viewDiffBtn - Diff mode button
 * @param {HTMLElement} viewFullBtn - Full file mode button
 * @param {HTMLElement} previewPanel - Preview panel element
 */
export function setupViewModeToggle(viewDiffBtn, viewFullBtn, previewPanel) {
    viewDiffBtn.onclick = () => {
        previewPanel._viewMode = 'diff';
        viewDiffBtn.classList.add(cssClasses.viewModeActive);
        viewFullBtn.classList.remove(cssClasses.viewModeActive);
        
        const selectedFile = previewPanel.querySelector('.ct-preview-header');
        if (selectedFile) {
            const fileNode = previewPanel._currentFileNode;
            if (fileNode) {
                showFileInPreview(previewPanel, fileNode, 'diff');
            }
        }
    };
    
    viewFullBtn.onclick = () => {
        previewPanel._viewMode = 'full';
        viewFullBtn.classList.add(cssClasses.viewModeActive);
        viewDiffBtn.classList.remove(cssClasses.viewModeActive);
        
        const selectedFile = previewPanel.querySelector('.ct-preview-header');
        if (selectedFile) {
            const fileNode = previewPanel._currentFileNode;
            if (fileNode) {
                showFileInPreview(previewPanel, fileNode, 'full');
            }
        }
    };
}

/**
 * Checks if a filename matches a glob pattern
 * @param {string} filename - Filename to check
 * @param {string} pattern - Glob pattern (e.g., "*.vue")
 * @returns {boolean} True if matches
 */
function matchesGlobPattern(filename, pattern) {
    if (!pattern.includes('*')) {
        return false;
    }

    const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');

    try {
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(filename);
    } catch {
        return false;
    }
}

/**
 * Checks if a folder has any children matching the filter
 * @param {Object} node - Tree node
 * @param {string} filter - Filter string
 * @returns {boolean} True if has matching children
 */
function hasMatchingChildren(node, filter) {
    if (!node.children) {
        return false;
    }

    return Object.values(node.children).some(child => {
        if (child.type === 'file') {
            const fullPath = child.path || child.name;
            return fullPath.toLowerCase().includes(filter.toLowerCase()) ||
                   child.name.toLowerCase().includes(filter.toLowerCase()) ||
                   matchesGlobPattern(child.name, filter);
        }
        return hasMatchingChildren(child, filter);
    });
}

/**
 * Renders the full file content (without diff)
 * @param {HTMLElement} container - Container element
 * @param {Object} fileNode - File node data
 * @param {string|null} [refOverride=null] - Optional reference override
 */
async function renderFullFileContent(container, fileNode, refOverride = null) {
    if (!currentProjectInfo) {
        container.innerHTML = '<div class="ct-diff-empty">Contexte du projet non disponible.</div>';
        return;
    }

    const ref = refOverride || fileNode.ref || currentCommitSha || currentProjectInfo.commitSha || currentProjectInfo.sourceBranch || currentProjectInfo.branchName || 'main';
    const cacheKey = `${currentProjectInfo.projectPath}:${fileNode.path}@${ref}`;
    
    let fileContent = fullFileCache.get(cacheKey);
    
    if (!fileContent) {
        const loading = createElement('div', { className: cssClasses.loading }, 'Chargement du fichier...');
        container.appendChild(loading);

        try {
            const fileData = await fetchFileContent(currentProjectInfo, fileNode.path, ref);
            fileContent = fileData.content;
            fullFileCache.set(cacheKey, fileContent);
            loading.remove();
        } catch (error) {
            loading.remove();
            const errorDiv = createElement('div', { className: 'ct-diff-empty ct-diff-error' });
            errorDiv.textContent = `Erreur lors du chargement du fichier: ${error.message}`;
            container.appendChild(errorDiv);
            return;
        }
    }

    const fileExt = fileNode.name.split('.').pop()?.toLowerCase() || '';
    const lines = fileContent.split('\n');

    const table = createElement('div', { className: cssClasses.fullFileContainer });

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const lineRow = createElement('div', { className: cssClasses.fullFileLine });
        const lineNumCell = createElement('span', { className: cssClasses.fullFileLineNum }, lineNum.toString());
        const contentCell = createElement('span', { className: 'ct-line-content' });

        if (line === '') {
            contentCell.innerHTML = ' ';
        } else {
            contentCell.innerHTML = highlightCode(line, fileExt);
        }

        lineRow.appendChild(lineNumCell);
        lineRow.appendChild(contentCell);
        table.appendChild(lineRow);
    });

    container.appendChild(table);
}

/**
 * Creates a loading indicator
 * @param {string} [message='Chargement...'] - Loading message
 * @returns {HTMLElement} Loading element
 */
export function createLoadingIndicator(message = 'Chargement...') {
    return createElement('div', { className: cssClasses.loading }, `
        ${message}
        <span class="ct-spinner"></span>
    `);
}

/**
 * Creates an error message element
 * @param {string} message - Error message
 * @returns {HTMLElement} Error element
 */
export function createErrorMessage(message) {
    return createElement('div', { className: cssClasses.error }, message);
}

/**
 * Récupère le container GitLab Commit Tree actif basé sur la sélection ou la position
 * @returns {HTMLElement|null} Le container actif ou null
 */
function getActiveContainer() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const selectedNode = selection.getRangeAt(0).startContainer;
        const element = selectedNode.nodeType === Node.ELEMENT_NODE ? selectedNode : selectedNode.parentElement;
        const container = element?.closest(`.${cssClasses.container}`);
        if (container) return container;
    }
    
    const elementAtCenter = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    return elementAtCenter?.closest(`.${cssClasses.container}`);
}

/**
 * Sélectionne le bloc de diff contenant le curseur ou tout le fichier lors d'un Cmd+A / Ctrl+A
 * @returns {boolean} True si une sélection a été effectuée
 */
function selectCurrentDiffBlock() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;
    
    const currentElement = selection.getRangeAt(0).startContainer;
    const element = currentElement.nodeType === Node.ELEMENT_NODE ? currentElement : currentElement.parentElement;
    
    const diffLine = element.closest('.ct-diff-line');
    if (diffLine) {
        let start = diffLine;
        while (start.previousElementSibling && 
               !start.previousElementSibling.classList.contains('ct-diff-separator')) {
            start = start.previousElementSibling;
        }
        
        let end = diffLine;
        while (end.nextElementSibling && 
               !end.nextElementSibling.classList.contains('ct-diff-separator')) {
            end = end.nextElementSibling;
        }
        
        const range = document.createRange();
        range.setStartBefore(start);
        range.setEndAfter(end);
        
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
    }

    const fullFileContainer = element.closest(`.${cssClasses.fullFileContainer}`);
    if (fullFileContainer) {
        const range = document.createRange();
        range.selectNodeContents(fullFileContainer);
        
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
    }

    return false;
}

/**
 * Sets up preview panel search functionality with CSS Custom Highlight API
 * @param {HTMLElement} previewPanel - Preview panel element
 */
export function setupPreviewSearch(previewPanel) {
    if (!previewPanel || previewPanel._searchSetup) return;
    previewPanel._searchSetup = true;

    const supportsHighlight = 'highlights' in CSS;

    const searchBar = createElement('div', { className: cssClasses.previewSearchBar });
    searchBar.style.display = 'none';

    const searchContainer = createElement('div', { className: cssClasses.previewSearch });

    const searchInputWrapper = createElement('div', { className: 'ct-preview-search-input-wrapper' });
    const searchInput = createElement('input', {
        className: cssClasses.previewSearchInput,
        type: 'text',
        placeholder: 'Rechercher dans le fichier...'
    });
    searchInputWrapper.appendChild(searchInput);

    const counter = createElement('span', { className: cssClasses.previewSearchCounter }, '0/0');

    const btnPrev = createElement('button', {
        className: `${cssClasses.button} ${cssClasses.previewSearchBtnPrev}`,
        title: 'Précédent (Shift+Enter)',
        'aria-label': 'Précédent'
    }, icons.chevronUp);

    const btnNext = createElement('button', {
        className: `${cssClasses.button} ${cssClasses.previewSearchBtnNext}`,
        title: 'Suivant (Enter)',
        'aria-label': 'Suivant'
    }, icons.chevronDown);

    const btnClose = createElement('button', {
        className: `${cssClasses.button} ${cssClasses.previewSearchBtnClose}`,
        title: 'Fermer (Esc)',
        'aria-label': 'Fermer'
    }, icons.close);

    searchContainer.appendChild(searchInputWrapper);
    searchContainer.appendChild(counter);
    searchContainer.appendChild(btnPrev);
    searchContainer.appendChild(btnNext);
    searchContainer.appendChild(btnClose);
    searchBar.appendChild(searchContainer);

    previewPanel.insertBefore(searchBar, previewPanel.firstChild);

    let currentMatches = [];
    let currentIndex = -1;
    let highlightAll = null;
    let highlightActive = null;

    if (supportsHighlight) {
        highlightAll = new Highlight();
        highlightActive = new Highlight();
        CSS.highlights.set('preview-search-all', highlightAll);
        CSS.highlights.set('preview-search-active', highlightActive);
    }

    const performSearch = () => {
        const query = searchInput.value.trim();
        currentMatches = [];
        currentIndex = -1;

        if (supportsHighlight) {
            highlightAll.clear();
            highlightActive.clear();
        }

        if (!query) {
            counter.textContent = '0/0';
            return;
        }

        const contentCells = previewPanel.querySelectorAll('.ct-line-content');
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

        for (const cell of contentCells) {
            const textContent = cell.textContent;
            if (!textContent) continue;

            regex.lastIndex = 0;
            let match;

            while ((match = regex.exec(textContent)) !== null) {
                const range = new Range();
                const textNode = findTextNode(cell, match.index);

                if (textNode) {
                    range.setStart(textNode.node, textNode.offset);
                    range.setEnd(textNode.node, textNode.offset + match[0].length);
                    currentMatches.push({ range, element: cell });

                    if (supportsHighlight) {
                        highlightAll.add(range);
                    }
                }
            }
        }

        counter.textContent = currentMatches.length > 0
            ? `1/${currentMatches.length}`
            : '0/0';

        if (currentMatches.length > 0) {
            currentIndex = 0;
            scrollToMatch(0);
        }
    };

    const findTextNode = (element, targetIndex) => {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let currentIndex = 0;
        let node;

        while ((node = walker.nextNode())) {
            const text = node.textContent;
            if (currentIndex + text.length > targetIndex) {
                return { node, offset: targetIndex - currentIndex };
            }
            currentIndex += text.length;
        }

        return null;
    };

    const scrollToMatch = (index) => {
        if (index < 0 || index >= currentMatches.length) return;

        currentIndex = index;
        counter.textContent = `${index + 1}/${currentMatches.length}`;

        const match = currentMatches[index];

        if (supportsHighlight) {
            highlightActive.clear();
            highlightActive.add(match.range);
        }

        const previewContent = previewPanel.querySelector('.ct-preview-content');
        if (match.element && previewContent) {
            const elementRect = match.element.getBoundingClientRect();
            const containerRect = previewContent.getBoundingClientRect();
            const relativeTop = elementRect.top - containerRect.top + previewContent.scrollTop;
            const centerPosition = relativeTop - (previewContent.clientHeight / 2);

            previewContent.scrollTo({
                top: Math.max(0, centerPosition),
                behavior: 'smooth'
            });
        }
    };

    const nextMatch = () => {
        if (currentMatches.length === 0) return;
        const nextIndex = (currentIndex + 1) % currentMatches.length;
        scrollToMatch(nextIndex);
    };

    const prevMatch = () => {
        if (currentMatches.length === 0) return;
        const prevIndex = currentIndex - 1 < 0 ? currentMatches.length - 1 : currentIndex - 1;
        scrollToMatch(prevIndex);
    };

    const toggleSearchBar = (show) => {
        searchBar.style.display = show ? 'block' : 'none';
        if (show) {
            searchInput.focus();
            searchInput.select();
            if (searchInput.value.trim()) {
                performSearch();
            }
        } else {
            if (supportsHighlight) {
                highlightAll.clear();
                highlightActive.clear();
            }
            currentMatches = [];
            currentIndex = -1;
            counter.textContent = '0/0';
            searchInput.value = '';
        }
    };

    searchInput.addEventListener('input', debounce(performSearch, 100));

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                prevMatch();
            } else {
                nextMatch();
            }
        }
    });

    btnNext.onclick = nextMatch;
    btnPrev.onclick = prevMatch;
    btnClose.onclick = () => toggleSearchBar(false);

    const abortController = new AbortController();
    const container = previewPanel.closest('.ct-container');

    const handleKeydown = (e) => {
        const activeContainer = getActiveContainer();
        const hasContent = previewPanel.querySelector('.ct-preview-header');

        if (activeContainer === container) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'f' && hasContent) {
                e.preventDefault();
                e.stopPropagation();
                toggleSearchBar(true);
            }

            if (e.key === 'Escape' && searchBar.style.display === 'block') {
                e.preventDefault();
                toggleSearchBar(false);
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'a' && hasContent) {
                if (selectCurrentDiffBlock()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }
    };

    document.addEventListener('keydown', handleKeydown, { signal: abortController.signal });

    previewPanel._toggleSearch = toggleSearchBar;
    previewPanel._cleanupSearch = () => abortController.abort();
}