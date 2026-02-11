/**
 * GitLab Commit Tree View
 * @fileoverview Main entry point - Displays file tree for commits, comparisons, and branch history
 * @module commit-tree
 */

import * as config from './commit-tree-config.js';
import * as utils from './commit-tree-utils.js';
import * as api from './commit-tree-api.js';
import * as renderer from './commit-tree-renderer.js';
import './commit-tree.css';

(function() {
    'use strict';

    /**
     * Initializes the tree view for a commit page or compare page
     * @returns {Promise<void>}
     */
    async function initCommitOrComparePage() {
        const projectInfo = utils.extractProjectAndCommitInfo();

        if (!projectInfo.projectPath ||
            (!projectInfo.commitSha && (!projectInfo.sourceBranch || !projectInfo.targetBranch))) {
            return;
        }

        renderer.setProjectContext(projectInfo, projectInfo.commitSha);

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
        const wrapper = utils.createElement('div', { className: 'ct-wrapper' });

        const loadButton = utils.createElement('button', {
            className: `${config.cssClasses.button} ct-load-btn`
        }, `${config.icons.tree} <span>Charger l'arborescence</span>`);

        wrapper.appendChild(loadButton);
        targetInsertionPoint.parentNode.insertBefore(wrapper, targetInsertionPoint);

        loadButton.onclick = async () => {
            loadButton.disabled = true;
            loadButton.innerHTML = `${config.icons.tree} <span>Chargement...</span>`;

            const loading = renderer.createLoadingIndicator('Chargement des fichiers via l\'API GitLab');
            wrapper.appendChild(loading);

            try {
                const diffData = await api.fetchAllFilesWithPagination(
                    projectInfo,
                    (msg) => { loading.innerHTML = `${msg} <span class="ct-spinner"></span>`; }
                );

                const fileData = api.processFilesFromApiResponse(
                    diffData, 
                    projectInfo.isComparePage, 
                    projectInfo.commitSha || projectInfo.sourceBranch
                );
                loading.remove();

                if (fileData.length === 0) {
                    const error = renderer.createErrorMessage(
                        `Aucun fichier trouvé pour ${projectInfo.isCommitPage ? 'ce commit' : 'cette comparaison'}.`
                    );
                    wrapper.appendChild(error);
                    loadButton.innerHTML = `${config.icons.tree} <span>Réessayer</span>`;
                    loadButton.disabled = false;
                    return;
                }

                loadButton.remove();

                const fileTree = api.buildFileTree(fileData);
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
                } = renderer.createTreeContainer(`Vue en arborescence (${pageTypeTitle})`, fileData.length);

                wrapper.appendChild(container);
                renderer.renderTree(treeView, fileTree, 0, '', null, previewPanel);
                renderer.setupSearch(searchInput, treeView, fileTree, null, previewPanel);
                renderer.setupViewModeToggle(viewDiffBtn, viewFullBtn, previewPanel);
                renderer.setupFullscreen(container, fullscreenBtn);

                expandAllBtn.onclick = () => renderer.expandAllFolders(treeView);
                collapseAllBtn.onclick = () => renderer.collapseAllFolders(treeView);

            } catch (error) {
                loading.remove();
                const errorEl = renderer.createErrorMessage(`Erreur lors de l'accès à l'API GitLab: ${error.message}`);
                wrapper.appendChild(errorEl);
                loadButton.innerHTML = `${config.icons.tree} <span>Réessayer</span>`;
                loadButton.disabled = false;
            }
        };
    }

    /**
     * Initializes tree buttons for branch history page
     * @returns {Promise<void>}
     */
    async function initBranchHistory() {
        const projectInfo = utils.extractProjectAndCommitInfo();
        if (!projectInfo.projectPath) {
            return;
        }

        const processCommits = () => {
            const commitElements = utils.findCommitElements();
            commitElements.forEach(commitElement => {
                const commitSha = utils.extractCommitShaFromElement(commitElement);
                if (commitSha && !commitElement.querySelector(`.${config.cssClasses.commitTreeButton}`)) {
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
        let actionsContainer = commitElement.querySelector('.commit-sha-group.btn-group');

        if (!actionsContainer) {
            actionsContainer = utils.createElement('div', { className: 'commit-sha-group btn-group' });
            commitElement.appendChild(actionsContainer);
        }

        const nextSibling = commitElement.nextElementSibling;
        if (nextSibling && nextSibling.classList.contains(config.cssClasses.commitTreeContainer)) {
            return;
        }

        const treeButton = utils.createElement('button', {
            className: `${config.cssClasses.commitTreeButton} gl-button btn btn-icon btn-md btn-default has-tooltip`,
            title: 'Fichiers modifiés',
            'aria-label': 'Fichiers modifiés',
            dataset: { commitSha }
        }, config.icons.tree);

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
        if (existingContainer && existingContainer.classList.contains(config.cssClasses.commitTreeContainer)) {
            const isHidden = existingContainer.style.display === 'none';
            existingContainer.style.display = isHidden ? 'block' : 'none';
            buttonElement.innerHTML = isHidden ? config.icons.close : config.icons.tree;
            return;
        }

        renderer.setProjectContext(projectInfo, commitSha);

        const treeContainer = utils.createElement('div', { className: config.cssClasses.commitTreeContainer });

        const loading = renderer.createLoadingIndicator('Chargement des fichiers');
        treeContainer.appendChild(loading);

        commitElement.parentNode.insertBefore(treeContainer, commitElement.nextSibling);
        buttonElement.innerHTML = config.icons.close;

        try {
            const diffData = await api.fetchAllFilesWithPagination(projectInfo, null, commitSha);
            const fileData = api.processFilesFromApiResponse(diffData, false, commitSha);

            loading.remove();

            if (fileData.length === 0) {
                const error = renderer.createErrorMessage('Aucun fichier trouvé pour ce commit.');
                treeContainer.appendChild(error);
                return;
            }

            const fileTree = api.buildFileTree(fileData);
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
            } = renderer.createTreeContainer(`Commit ${commitSha.substring(0, 8)}`, fileData.length);

            treeContainer.appendChild(container);
            renderer.renderTree(treeView, fileTree, 0, '', commitSha, previewPanel);
            renderer.setupSearch(searchInput, treeView, fileTree, commitSha, previewPanel);
            renderer.setupViewModeToggle(viewDiffBtn, viewFullBtn, previewPanel);
            renderer.setupFullscreen(container, fullscreenBtn);

            expandAllBtn.onclick = () => renderer.expandAllFolders(treeView);
            collapseAllBtn.onclick = () => renderer.collapseAllFolders(treeView);

        } catch (error) {
            loading.remove();
            const errorEl = renderer.createErrorMessage(`Erreur lors du chargement: ${error.message}`);
            treeContainer.appendChild(errorEl);
        }
    }

    /**
     * Main initialization function
     * @returns {Promise<void>}
     */
    async function init() {
        const { isCommitPage, isComparePage, isBranchHistoryPage } = utils.getPageType();

        if (!isCommitPage && !isComparePage && !isBranchHistoryPage) {
            return;
        }

        try {
            if (isBranchHistoryPage) {
                await utils.waitForElement('.commit, .commit-row, li[data-testid], .flex-list li, .content-list li');
                await initBranchHistory();
            } else {
                await utils.waitForElement('.commit, .diff-table, .diff-file, .file-holder, .diffs-container, .diff-stats');
                await initCommitOrComparePage();
            }
        } catch (error) {
            console.error('[Commit Tree]', error);
        }
    }

    window.addEventListener('load', init);

})();