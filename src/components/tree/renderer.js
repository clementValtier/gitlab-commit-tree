/**
 * Tree Renderer Component
 * @fileoverview Functions for rendering the file tree and handling interactions
 */

import { icons, cssClasses, getFileIcon } from '../../config/constants.js';
import { createElement, safeSetHTML } from '../../utils/dom.js';
import { debounce, isImageFile, isPdfFile, isBinaryFile, getMimeType } from '../../utils/helpers.js';
import { scrollToFileInCurrentPage, navigateToFile } from '../../utils/gitlab.js';
import { highlightCode } from '../../core/highlight.js';
import { fetchFileContent, fetchDiffForPath } from '../../api/client.js';
import { showContextMenu } from '../common/menu.js';
import { renderDiff, extractDiffFromGitLabHTML, toggleDiffView } from '../preview/diff-renderer.js';
import { createLoadingIndicator } from '../common/container.js';

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

/** @type {string|null} Active PDF blob URL to revoke on next preview change */
let currentPdfBlobUrl = null;

function revokePdfBlobUrl() {
    if (currentPdfBlobUrl) {
        URL.revokeObjectURL(currentPdfBlobUrl);
        currentPdfBlobUrl = null;
    }
}

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
                safeSetHTML(item.chevron, icons.chevronDown);
                safeSetHTML(item.icon, icons.folderOpen);
            }
        }
    });
}

/**
 * Sets up event delegation for the entire tree
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
                safeSetHTML(itemChevron, icons.chevronRight);
                safeSetHTML(itemIcon, icons.folderClosed);
                childContainer.style.display = 'none';
            } else {
                treeItem.classList.add(cssClasses.expanded);
                safeSetHTML(itemChevron, icons.chevronDown);
                safeSetHTML(itemIcon, icons.folderOpen);
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

        showContextMenu(e, child, treeItem, child.ref || specificCommitSha, previewPanel, showFileInPreview);
    };
}

/**
 * Creates a tree item element
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

    const iconData = child.type === 'folder' ? { type: 'svg', value: icons.folderClosed } : getFileIcon(child.name);
    const icon = createElement('span', {
        className: cssClasses.treeItemIcon
    });
    
    if (iconData.type === 'svg') {
        safeSetHTML(icon, iconData.value);
    } else {
        icon.className += ' ' + iconData.value;
    }

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

function getStatusLabel(status) {
    const labels = {
        added: 'Ajouté',
        modified: 'Modifié',
        deleted: 'Supprimé',
        renamed: 'Renommé'
    };
    return labels[status] || status;
}

function getStatusShortLabel(status) {
    const labels = {
        added: 'A',
        modified: 'M',
        deleted: 'D',
        renamed: 'R'
    };
    return labels[status] || '?';
}

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
 * Shows file in the preview panel
 */
export function showFileInPreview(previewPanel, fileNode, mode = 'diff') {
    revokePdfBlobUrl();

    const searchBar = previewPanel.querySelector(`.${cssClasses.previewSearchBar}`);
    previewPanel.replaceChildren();
    if (searchBar) {
        previewPanel.appendChild(searchBar);
        searchBar.style.display = 'none';
        const searchInput = searchBar.querySelector(`.${cssClasses.previewSearchInput}`);
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
                const loading = createLoadingIndicator('Récupération des différences...');
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
 * Renders the full file content (without diff)
 */
async function renderFullFileContent(container, fileNode, refOverride = null) {
    if (!currentProjectInfo) {
        container.appendChild(createElement('div', { className: 'ct-diff-empty' }, 'Contexte du projet non disponible.'));
        return;
    }

    const ref = refOverride || fileNode.ref || currentCommitSha || currentProjectInfo.commitSha || currentProjectInfo.sourceBranch || currentProjectInfo.branchName || 'main';
    const filename = fileNode.name;
    const fileExt = filename.split('.').pop()?.toLowerCase() || '';

    if (isImageFile(fileExt)) {
        await renderImageContent(container, fileNode, ref, fileExt);
        return;
    }

    if (isPdfFile(fileExt)) {
        await renderPdfContent(container, fileNode, ref);
        return;
    }

    if (isBinaryFile(fileExt)) {
        renderBinaryContent(container, fileNode);
        return;
    }

    const cacheKey = `${currentProjectInfo.projectPath}:${fileNode.path}@${ref}`;
    let fileContent = fullFileCache.get(cacheKey);

    if (!fileContent) {
        const loading = createLoadingIndicator('Chargement du fichier...');
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

    const lines = fileContent.split('\n');
    const table = createElement('div', { className: cssClasses.fullFileContainer });

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const lineRow = createElement('div', { className: cssClasses.fullFileLine });
        const lineNumCell = createElement('span', { className: cssClasses.fullFileLineNum }, lineNum.toString());
        const contentCell = createElement('span', { className: 'ct-line-content' });

        if (line === '') {
            contentCell.textContent = '\u00A0';
        } else {
            safeSetHTML(contentCell, highlightCode(line, fileExt, filename));
        }

        lineRow.appendChild(lineNumCell);
        lineRow.appendChild(contentCell);
        table.appendChild(lineRow);
    });

    container.appendChild(table);
}

/**
 * Renders an image file in the preview panel
 */
async function renderImageContent(container, fileNode, ref, fileExt) {
    const cacheKey = `img:${currentProjectInfo.projectPath}:${fileNode.path}@${ref}`;
    let base64 = fullFileCache.get(cacheKey);

    if (!base64) {
        const loading = createLoadingIndicator('Chargement de l\'image...');
        container.appendChild(loading);

        try {
            const fileData = await fetchFileContent(currentProjectInfo, fileNode.path, ref, true);
            base64 = fileData.content;
            fullFileCache.set(cacheKey, base64);
            loading.remove();
        } catch (error) {
            loading.remove();
            const errorDiv = createElement('div', { className: 'ct-diff-empty ct-diff-error' });
            errorDiv.textContent = `Erreur lors du chargement de l'image: ${error.message}`;
            container.appendChild(errorDiv);
            return;
        }
    }

    const mimeType = getMimeType(fileExt);
    const wrapper = createElement('div', { className: 'ct-preview-image-wrapper' });
    const img = createElement('img', {
        className: 'ct-preview-image',
        src: `data:${mimeType};base64,${base64}`,
        alt: fileNode.name
    });
    wrapper.appendChild(img);
    container.appendChild(wrapper);
}

/**
 * Converts a base64 string to a Blob object URL.
 * More reliable than data URIs in browser extensions (especially Firefox).
 * @param {string} base64 - Base64-encoded content
 * @param {string} mimeType - MIME type of the content
 * @returns {string} Object URL — must be revoked when no longer needed
 */
function base64ToBlobUrl(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
}

/**
 * Renders a PDF file in the preview panel
 */
async function renderPdfContent(container, fileNode, ref) {
    const cacheKey = `pdf:${currentProjectInfo.projectPath}:${fileNode.path}@${ref}`;
    let base64 = fullFileCache.get(cacheKey);

    if (!base64) {
        const loading = createLoadingIndicator('Chargement du PDF...');
        container.appendChild(loading);

        try {
            const fileData = await fetchFileContent(currentProjectInfo, fileNode.path, ref, true);
            base64 = fileData.content;
            fullFileCache.set(cacheKey, base64);
            loading.remove();
        } catch (error) {
            loading.remove();
            const errorDiv = createElement('div', { className: 'ct-diff-empty ct-diff-error' });
            errorDiv.textContent = `Erreur lors du chargement du PDF: ${error.message}`;
            container.appendChild(errorDiv);
            return;
        }
    }

    const blobUrl = base64ToBlobUrl(base64, 'application/pdf');
    currentPdfBlobUrl = blobUrl;

    const wrapper = createElement('div', { className: 'ct-preview-pdf-wrapper' });
    const embed = createElement('embed', {
        className: 'ct-preview-pdf',
        src: blobUrl,
        type: 'application/pdf'
    });
    wrapper.appendChild(embed);
    container.appendChild(wrapper);
}

/**
 * Renders a placeholder for non-previewable binary files
 */
function renderBinaryContent(container, fileNode) {
    const div = createElement('div', { className: 'ct-diff-empty' });
    
    const iconData = getFileIcon(fileNode.name);
    const icon = createElement('span', { className: 'ct-preview-icon' });
    if (iconData.type === 'svg') {
        safeSetHTML(icon, iconData.value);
    } else {
        icon.className += ' ' + iconData.value;
    }

    const text = createElement('span', { className: 'ct-preview-text' }, 'Fichier binaire — prévisualisation non disponible');
    const size = fileNode.size
        ? createElement('span', { className: 'ct-preview-text' }, `${(fileNode.size / 1024).toFixed(1)} Ko`)
        : null;
    div.appendChild(icon);
    div.appendChild(text);
    if (size) div.appendChild(size);
    container.appendChild(div);
}

/**
 * Expands all folders in the tree
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
 */
export function setupSearch(searchInput, treeView, fileTree, specificCommitSha, previewPanel = null) {
    const filterTree = debounce((filter) => {
        treeView.replaceChildren();
        treeView._delegationSetup = false;
        renderTree(treeView, fileTree, 0, filter, specificCommitSha, previewPanel);
    }, 200);

    searchInput.oninput = (e) => {
        filterTree(e.target.value);
    };
}

/**
 * Sets up the view mode toggle buttons
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

function matchesGlobPattern(filename, pattern) {
    if (!pattern.includes('*')) {
        return false;
    }

    const regexPattern = pattern
        .replace(/\./g, '\.')
        .replace(/\*/g, '.*');

    try {
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(filename);
    } catch {
        return false;
    }
}

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
