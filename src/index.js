/**
 * GitLab Commit Tree View
 * @fileoverview Main entry point - Displays file tree for commits, comparisons, and branch history
 */

import { icons, cssClasses, gitlabSelectors } from './config/constants.js';
import { createElement, waitForElement } from './utils/dom.js';
import { 
    extractProjectAndCommitInfo, 
    getPageType, 
    findCommitElements, 
    extractCommitShaFromElement 
} from './utils/gitlab.js';
import { fetchAllFilesWithPagination } from './api/client.js';
import { processFilesFromApiResponse, buildFileTree } from './api/transformer.js';
import { 
    createTreeContainer, 
    createLoadingIndicator, 
    createErrorMessage, 
    setupFullscreen 
} from './components/common/container.js';
import { 
    setProjectContext, 
    renderTree, 
    setupSearch, 
    setupViewModeToggle, 
    expandAllFolders, 
    collapseAllFolders 
} from './components/tree/renderer.js';
import './styles/main.css';

(function() {
    'use strict';

    /**
     * Initializes the tree view for a commit page or compare page
     * @returns {Promise<void>}
     */
    async function initCommitOrComparePage() {
        const projectInfo = extractProjectAndCommitInfo();

        if (!projectInfo.projectPath ||
            (!projectInfo.commitSha && (!projectInfo.sourceBranch || !projectInfo.targetBranch))) {
            return;
        }

        setProjectContext(projectInfo, projectInfo.commitSha);

        let targetInsertionPoint;
        if (projectInfo.isCommitPage) {
            targetInsertionPoint = document.querySelector('.commit-ci-menu');
        } else if (projectInfo.isComparePage) {
            targetInsertionPoint = document.querySelector('.js-diff-files-changed');
        }

        if (!targetInsertionPoint) {
            targetInsertionPoint = document.querySelector('.commit-box, .diff-container, .content-wrapper');
        }

        if (!targetInsertionPoint) {
            return;
        }

        const pageTypeTitle = projectInfo.isCommitPage ? 'commit' : 'comparaison';
        const wrapper = createElement('div', { className: 'ct-wrapper' });

        const loadButton = createElement('button', {
            className: `${cssClasses.button} ct-load-btn`
        }, `${icons.tree} <span>Charger l'arborescence</span>`);

        wrapper.appendChild(loadButton);
        targetInsertionPoint.parentNode.insertBefore(wrapper, targetInsertionPoint);

        loadButton.onclick = async () => {
            loadButton.disabled = true;
            loadButton.innerHTML = `${icons.tree} <span>Chargement...</span>`;

            const loading = createLoadingIndicator(`Chargement des fichiers via l'API GitLab`);
            wrapper.appendChild(loading);

            try {
                const diffData = await fetchAllFilesWithPagination(
                    projectInfo,
                    (msg) => { loading.innerHTML = `${msg} <span class="ct-spinner"></span>`; }
                );

                const fileData = processFilesFromApiResponse(
                    diffData, 
                    projectInfo.isComparePage, 
                    projectInfo.commitSha || projectInfo.sourceBranch
                );
                loading.remove();

                if (fileData.length === 0) {
                    const error = createErrorMessage(
                        `Aucun fichier trouvé pour ${projectInfo.isCommitPage ? 'ce commit' : 'cette comparaison'}.`
                    );
                    wrapper.appendChild(error);
                    loadButton.innerHTML = `${icons.tree} <span>Réessayer</span>`;
                    loadButton.disabled = false;
                    return;
                }

                loadButton.remove();

                const fileTree = buildFileTree(fileData);
                const {
                    container,
                    searchInput,
                    treeView,
                    previewPanel,
                    expandAllBtn,
                    collapseAllBtn,
                    viewDiffBtn,
                    viewFullBtn,
                    fullscreenBtn
                } = createTreeContainer(`Vue en arborescence (${pageTypeTitle})`, fileData.length);

                wrapper.appendChild(container);
                renderTree(treeView, fileTree, 0, '', null, previewPanel);
                setupSearch(searchInput, treeView, fileTree, null, previewPanel);
                setupViewModeToggle(viewDiffBtn, viewFullBtn, previewPanel);
                setupFullscreen(container, fullscreenBtn);

                expandAllBtn.onclick = () => expandAllFolders(treeView);
                collapseAllBtn.onclick = () => collapseAllFolders(treeView);

            } catch (error) {
                loading.remove();
                const errorEl = createErrorMessage(`Erreur lors de l'accès à l'API GitLab: ${error.message}`);
                wrapper.appendChild(errorEl);
                loadButton.innerHTML = `${icons.tree} <span>Réessayer</span>`;
                loadButton.disabled = false;
            }
        };
    }

    /**
     * Initializes tree buttons for branch history page
     * @returns {Promise<void>}
     */
    async function initBranchHistory() {
        const projectInfo = extractProjectAndCommitInfo();
        if (!projectInfo.projectPath) {
            return;
        }

        const processCommits = () => {
            const commitElements = findCommitElements();
            commitElements.forEach(commitElement => {
                const commitSha = extractCommitShaFromElement(commitElement);
                if (commitSha && !commitElement.querySelector(`.${cssClasses.commitTreeButton}`)) {
                    attachTreeButtonToCommit(commitElement, commitSha, projectInfo);
                }
            });
        };

        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.querySelector && (
                                node.querySelector('[data-clipboard-text]') ||
                                node.querySelector('button[title*="SHA"]') ||
                                node.matches('li[data-testid]')
                            )) {
                                shouldProcess = true;
                                break;
                            }
                        }
                    }
                }
            });

            if (shouldProcess) {
                setTimeout(processCommits, 100);
            }
        });

        processCommits();

        const commitsContainer = document.querySelector('.content-list, .flex-list, ul, main') || document.body;
        observer.observe(commitsContainer, { childList: true, subtree: true });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Attaches a tree button to a commit element
     * @param {HTMLElement} commitElement - The commit DOM element
     * @param {string} commitSha - The commit SHA
     * @param {Object} projectInfo - Project information
     */
    function attachTreeButtonToCommit(commitElement, commitSha, projectInfo) {
        let actionsContainer = commitElement.querySelector(gitlabSelectors.current.commitActions);

        if (!actionsContainer) {
            actionsContainer = createElement('div', { className: 'commit-sha-group btn-group' });
            commitElement.appendChild(actionsContainer);
        }

        const nextSibling = commitElement.nextElementSibling;
        if (nextSibling && nextSibling.classList.contains(cssClasses.commitTreeContainer)) {
            return;
        }

        const treeButton = createElement('button', {
            className: `${cssClasses.commitTreeButton} gl-button btn btn-icon btn-md btn-default has-tooltip`,
            title: 'Fichiers modifiés',
            'aria-label': 'Fichiers modifiés',
            dataset: { commitSha }
        }, icons.tree);

        treeButton.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await createTreeForCommit(commitSha, commitElement, treeButton, projectInfo);
        };

        actionsContainer.appendChild(treeButton);
    }

    /**
     * Creates the tree view for a specific commit
     * @param {string} commitSha - The commit SHA
     * @param {HTMLElement} commitElement - The commit DOM element
     * @param {HTMLElement} buttonElement - The tree button element
     * @param {Object} projectInfo - Project information
     */
    async function createTreeForCommit(commitSha, commitElement, buttonElement, projectInfo) {
        let existingContainer = commitElement.nextElementSibling;
        if (existingContainer && existingContainer.classList.contains(cssClasses.commitTreeContainer)) {
            const isHidden = existingContainer.style.display === 'none';
            existingContainer.style.display = isHidden ? 'block' : 'none';
            buttonElement.innerHTML = isHidden ? icons.close : icons.tree;
            return;
        }

        setProjectContext(projectInfo, commitSha);

        const treeContainer = createElement('div', { className: cssClasses.commitTreeContainer });

        const loading = createLoadingIndicator('Chargement des fichiers');
        treeContainer.appendChild(loading);

        commitElement.parentNode.insertBefore(treeContainer, commitElement.nextSibling);
        buttonElement.innerHTML = icons.close;

        try {
            const diffData = await fetchAllFilesWithPagination(projectInfo, null, commitSha);
            const fileData = processFilesFromApiResponse(diffData, false, commitSha);

            loading.remove();

            if (fileData.length === 0) {
                const error = createErrorMessage('Aucun fichier trouvé pour ce commit.');
                treeContainer.appendChild(error);
                return;
            }

            const fileTree = buildFileTree(fileData);
            const {
                container,
                searchInput,
                treeView,
                previewPanel,
                expandAllBtn,
                collapseAllBtn,
                viewDiffBtn,
                viewFullBtn,
                fullscreenBtn
            } = createTreeContainer(`Commit ${commitSha.substring(0, 8)}`, fileData.length);

            treeContainer.appendChild(container);
            renderTree(treeView, fileTree, 0, '', commitSha, previewPanel);
            setupSearch(searchInput, treeView, fileTree, commitSha, previewPanel);
            setupViewModeToggle(viewDiffBtn, viewFullBtn, previewPanel);
            setupFullscreen(container, fullscreenBtn);

            expandAllBtn.onclick = () => expandAllFolders(treeView);
            collapseAllBtn.onclick = () => collapseAllFolders(treeView);

        } catch (error) {
            loading.remove();
            const errorEl = createErrorMessage(`Erreur lors du chargement: ${error.message}`);
            treeContainer.appendChild(errorEl);
        }
    }

    /**
     * Main initialization function
     * @returns {Promise<void>}
     */
    async function init() {
        const { isCommitPage, isComparePage, isBranchHistoryPage } = getPageType();

        if (!isCommitPage && !isComparePage && !isBranchHistoryPage) {
            return;
        }

        try {
            if (isBranchHistoryPage) {
                await waitForElement('.commit, .commit-row, li[data-testid], .flex-list li, .content-list li');
                await initBranchHistory();
            } else {
                await waitForElement('.commit, .diff-table, .diff-file, .file-holder, .diffs-container, .diff-stats');
                await initCommitOrComparePage();
            }
        } catch (error) {
            console.error('[Commit Tree]', error);
        }
    }

    window.addEventListener('load', init);

})();
