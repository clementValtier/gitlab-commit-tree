/**
 * Main Container Component
 * @fileoverview Functions for creating the main UI structure and layout
 */

import { icons } from '../../assets/icons.js';
import { cssClasses } from '../../config/constants.js';
import { createElement } from '../../utils/dom.js';
import { setupPreviewSearch } from '../preview/search.js';

/**
 * Creates the main tree view container with toolbar and preview panel
 * @param {string} title - Title for the tree view
 * @param {number} fileCount - Number of files
 * @returns {Object} Created elements
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

    const fullscreenBtn = createElement('button', {
        className: `${cssClasses.button} ct-btn-icon ct-fullscreen-btn`,
        title: 'Plein écran'
    }, icons.maximize);

    viewModeGroup.appendChild(viewDiffBtn);
    viewModeGroup.appendChild(viewFullBtn);
    viewModeGroup.appendChild(fullscreenBtn);

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
        viewFullBtn,
        fullscreenBtn
    };
}

/**
 * Sets up fullscreen mode toggle
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement} fullscreenBtn - Fullscreen button element
 */
export function setupFullscreen(container, fullscreenBtn) {
    if (!container || !fullscreenBtn) return;

    const toggleFullscreen = () => {
        const isFullscreen = container.classList.toggle(cssClasses.containerFullscreen);
        fullscreenBtn.innerHTML = isFullscreen ? icons.minimize : icons.maximize;
        fullscreenBtn.title = isFullscreen ? 'Quitter le plein écran' : 'Plein écran';
        document.body.style.overflow = isFullscreen ? 'hidden' : '';
    };

    fullscreenBtn.onclick = toggleFullscreen;

    const handleKeydown = (e) => {
        if (e.key === 'Escape' && container.classList.contains(cssClasses.containerFullscreen)) {
            e.preventDefault();
            container.classList.remove(cssClasses.containerFullscreen);
            fullscreenBtn.innerHTML = icons.maximize;
            fullscreenBtn.title = 'Plein écran';
            document.body.style.overflow = '';
        }
    };

    document.addEventListener('keydown', handleKeydown);
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
