/**
 * Compare Selection Module
 * @fileoverview Lets the user pick a start/end commit on the branch history page
 * and renders their diff at the top of the page, reusing the compare-page pipeline.
 */

import { cssClasses, gitlabSelectors } from '../../config/constants.js';
import { createElement, safeSetHTML } from '../../utils/dom.js';
import { extractProjectAndCommitInfo, extractCommitShaFromElement } from '../../utils/gitlab.js';
import { fetchAllFilesWithPagination } from '../../api/client.js';
import { processFilesFromApiResponse, buildFileTree } from '../../api/transformer.js';
import {
    createTreeContainer,
    createLoadingIndicator,
    createErrorMessage,
    setupFullscreen,
    setupCollapse
} from '../common/container.js';
import {
    setProjectContext,
    renderTree,
    setupSearch,
    setupViewModeToggle,
    expandAllFolders,
    collapseAllFolders
} from '../tree/renderer.js';

let compareModeActive = false;
let compareSelectionStart = null;
let compareSelectionEnd = null;
let compareListenersAttached = false;

/**
 * Creates the small "Début"/"Fin" badge shown in a selected commit row
 * @param {string} label - Badge text
 * @param {string} modifierClass - Badge color modifier class
 * @returns {HTMLElement} Badge element
 */
function createCompareBadge(label, modifierClass) {
    return createElement('span', {
        className: `ct-compare-badge ${modifierClass}`
    }, label);
}

/**
 * Clears the current start/end compare selection, its badges and row highlights
 */
function clearCompareSelection() {
    compareSelectionStart = null;
    compareSelectionEnd = null;

    document.querySelectorAll(`.${cssClasses.compareSelectedStart}, .${cssClasses.compareSelectedEnd}`).forEach(el => {
        el.classList.remove(cssClasses.compareSelectedStart, cssClasses.compareSelectedEnd);
        el.querySelectorAll('.ct-compare-badge').forEach(badge => badge.remove());
    });
}

/**
 * Turns off compare mode and clears the current selection
 */
export function resetCompareSelection() {
    compareModeActive = false;
    clearCompareSelection();
    document.body.classList.remove(cssClasses.compareModeActive);

    const toggleBtn = document.querySelector(`.${cssClasses.compareToggleBtn}`);
    if (toggleBtn) {
        toggleBtn.classList.remove(cssClasses.viewModeActive);
    }
}

/**
 * Fetches and renders the diff between two selected commits at the top of the page
 * @param {string} startSha - SHA of the first selected commit
 * @param {string} endSha - SHA of the second selected commit
 */
async function buildCompareResult(startSha, endSha) {
    document.querySelectorAll(`.${cssClasses.compareTopWrapper}`).forEach(el => el.remove());

    const commitsList = document.querySelector(gitlabSelectors.current.commitsList);
    if (!commitsList) {
        return;
    }

    const compareProjectInfo = {
        ...extractProjectAndCommitInfo(),
        isCommitPage: false,
        isComparePage: true,
        isBranchHistoryPage: false,
        targetBranch: startSha,
        sourceBranch: endSha
    };

    setProjectContext(compareProjectInfo, null);

    const wrapper = createElement('div', { className: `ct-wrapper ${cssClasses.compareTopWrapper}` });
    const loading = createLoadingIndicator(`Chargement des fichiers via l'API GitLab`);
    wrapper.appendChild(loading);
    commitsList.parentNode.insertBefore(wrapper, commitsList);

    try {
        const diffData = await fetchAllFilesWithPagination(
            compareProjectInfo,
            (msg) => { safeSetHTML(loading, `${msg} <span class="ct-spinner"></span>`); }
        );

        const fileData = processFilesFromApiResponse(diffData, true, endSha);
        loading.remove();

        if (fileData.length === 0) {
            const error = createErrorMessage('Aucun fichier trouvé pour cette comparaison.');
            wrapper.appendChild(error);
            return;
        }

        const fileTree = buildFileTree(fileData);
        const {
            container,
            toolbar,
            splitView,
            searchInput,
            treeView,
            previewPanel,
            expandAllBtn,
            collapseAllBtn,
            viewDiffBtn,
            viewFullBtn,
            fullscreenBtn,
            collapseBtn
        } = createTreeContainer(`Comparaison ${startSha.substring(0, 8)} → ${endSha.substring(0, 8)}`, fileData.length);

        wrapper.appendChild(container);
        renderTree(treeView, fileTree, 0, '', null, previewPanel);
        setupSearch(searchInput, treeView, fileTree, null, previewPanel);
        setupViewModeToggle(viewDiffBtn, viewFullBtn, previewPanel);
        setupFullscreen(container, fullscreenBtn);
        setupCollapse(collapseBtn, toolbar, splitView);

        expandAllBtn.onclick = () => expandAllFolders(treeView);
        collapseAllBtn.onclick = () => collapseAllFolders(treeView);

    } catch (error) {
        loading.remove();
        const errorEl = createErrorMessage(`Erreur lors de l'accès à l'API GitLab: ${error.message}`);
        wrapper.appendChild(errorEl);
    }
}

/**
 * Handles a commit row click while compare mode is active
 * @param {HTMLElement} commitElement - The commit DOM element
 * @param {string} commitSha - The commit SHA
 */
function selectCommitForCompare(commitElement, commitSha) {
    if (commitElement.classList.contains(cssClasses.compareSelectedStart)) {
        commitElement.classList.remove(cssClasses.compareSelectedStart);
        commitElement.querySelectorAll('.ct-compare-badge').forEach(badge => badge.remove());
        compareSelectionStart = null;
        return;
    }

    if (commitElement.classList.contains(cssClasses.compareSelectedEnd)) {
        commitElement.classList.remove(cssClasses.compareSelectedEnd);
        commitElement.querySelectorAll('.ct-compare-badge').forEach(badge => badge.remove());
        compareSelectionEnd = null;
        return;
    }

    const actions = commitElement.querySelector('.commit-actions');

    if (!compareSelectionStart) {
        compareSelectionStart = commitSha;
        commitElement.classList.add(cssClasses.compareSelectedStart);
        if (actions) {
            actions.prepend(createCompareBadge('Début', 'ct-compare-badge-start'));
        }
        return;
    }

    if (!compareSelectionEnd) {
        compareSelectionEnd = commitSha;
        commitElement.classList.add(cssClasses.compareSelectedEnd);
        if (actions) {
            actions.prepend(createCompareBadge('Fin', 'ct-compare-badge-end'));
        }
        buildCompareResult(compareSelectionStart, compareSelectionEnd);
        clearCompareSelection();
        return;
    }

    clearCompareSelection();
    compareSelectionStart = commitSha;
    commitElement.classList.add(cssClasses.compareSelectedStart);
    if (actions) {
        actions.prepend(createCompareBadge('Début', 'ct-compare-badge-start'));
    }
}

/**
 * Adds the "Comparer entre deux commits" toggle to the commits toolbar
 * and wires up row selection for compare mode
 */
export function initCompareSelection() {
    resetCompareSelection();

    const toolbar = document.querySelector(gitlabSelectors.current.treeControls);
    if (toolbar && !toolbar.querySelector(`.${cssClasses.compareToggleBtn}`)) {
        const control = createElement('div', { className: 'control' });
        const toggleBtn = createElement('button', {
            className: `${cssClasses.compareToggleBtn} gl-button btn btn-md btn-default`
        }, `<span class="gl-button-text">Comparer entre deux commits</span>`);

        toggleBtn.onclick = () => {
            document.querySelectorAll(`.${cssClasses.compareTopWrapper}`).forEach(el => el.remove());

            compareModeActive = !compareModeActive;
            toggleBtn.classList.toggle(cssClasses.viewModeActive, compareModeActive);
            document.body.classList.toggle(cssClasses.compareModeActive, compareModeActive);
            if (!compareModeActive) {
                clearCompareSelection();
            }
        };

        control.appendChild(toggleBtn);
        toolbar.insertBefore(control, toolbar.firstChild);
    }

    if (!compareListenersAttached) {
        document.addEventListener('click', (e) => {
            if (!compareModeActive) {
                return;
            }

            const commitElement = e.target.closest('.commit');
            const commitSha = commitElement && extractCommitShaFromElement(commitElement);

            if (!commitSha) {
                return;
            }

            e.preventDefault();
            selectCommitForCompare(commitElement, commitSha);
        }, true);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && compareModeActive) {
                resetCompareSelection();
                if (document.activeElement && document.activeElement.blur) {
                    document.activeElement.blur();
                }
            }
        });

        compareListenersAttached = true;
    }
}
