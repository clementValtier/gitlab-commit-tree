/**
 * GitLab Commit Tree View
 * @fileoverview Main entry point - Displays file tree for commits, comparisons, and branch history
 * @module commit-tree
 */

(function() {
    'use strict';
    
    let icons, cssClasses, getPageType, extractProjectAndCommitInfo, waitForElement, createElement, findCommitElements, extractCommitShaFromElement, fetchAllFilesWithPagination, processFilesFromApiResponse, buildFileTree, createTreeContainer, renderTree, expandAllFolders, collapseAllFolders, setupSearch, createLoadingIndicator, createErrorMessage, setProjectContext;

    /**
     * Charge les modules nécessaires
     */
    async function loadModules() {
        try {
            const [config, utils, api, renderer] = await Promise.all([
                import(browser.runtime.getURL('commit-tree-config.js')),
                import(browser.runtime.getURL('commit-tree-utils.js')),
                import(browser.runtime.getURL('commit-tree-api.js')),
                import(browser.runtime.getURL('commit-tree-renderer.js'))
            ]);

            ({ icons, cssClasses } = config);
            ({ getPageType, extractProjectAndCommitInfo, waitForElement, createElement, findCommitElements, extractCommitShaFromElement } = utils);
            ({ fetchAllFilesWithPagination, processFilesFromApiResponse, buildFileTree } = api);
            ({ createTreeContainer, renderTree, expandAllFolders, collapseAllFolders, setupSearch, createLoadingIndicator, createErrorMessage, setProjectContext } = renderer);
        } catch (error) {
            console.error('Erreur lors du chargement des modules:', error);
            throw error;
        }
    }

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

        loadButton.addEventListener('click', async () => {
            loadButton.disabled = true;
            loadButton.innerHTML = `${icons.tree} <span>Chargement...</span>`;

            const loading = createLoadingIndicator('Chargement des fichiers via l\'API GitLab');
            wrapper.appendChild(loading);

            try {
                const diffData = await fetchAllFilesWithPagination(
                    projectInfo,
                    (msg) => { loading.innerHTML = `${msg} <span class="ct-spinner"></span>`; }
                );

                const fileData = processFilesFromApiResponse(diffData, projectInfo.isComparePage);
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
                    collapseAllBtn
                } = createTreeContainer(`Vue en arborescence (${pageTypeTitle})`, fileData.length);

                wrapper.appendChild(container);
                renderTree(treeView, fileTree, 0, '', null, previewPanel);
                setupSearch(searchInput, treeView, fileTree, null, previewPanel);

                expandAllBtn.addEventListener('click', () => expandAllFolders(treeView));
                collapseAllBtn.addEventListener('click', () => collapseAllFolders(treeView));

            } catch (error) {
                loading.remove();
                const errorEl = createErrorMessage(`Erreur lors de l'accès à l'API GitLab: ${error.message}`);
                wrapper.appendChild(errorEl);
                loadButton.innerHTML = `${icons.tree} <span>Réessayer</span>`;
                loadButton.disabled = false;
            }
        });
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
        let actionsContainer = commitElement.querySelector('.commit-sha-group.btn-group');

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

        treeButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await createTreeForCommit(commitSha, commitElement, treeButton, projectInfo);
        });

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
            const fileData = processFilesFromApiResponse(diffData, false);

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
                collapseAllBtn
            } = createTreeContainer(`Commit ${commitSha.substring(0, 8)}`, fileData.length);

            treeContainer.appendChild(container);
            renderTree(treeView, fileTree, 0, '', commitSha, previewPanel);
            setupSearch(searchInput, treeView, fileTree, commitSha, previewPanel);

            expandAllBtn.addEventListener('click', () => expandAllFolders(treeView));
            collapseAllBtn.addEventListener('click', () => collapseAllFolders(treeView));

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
        await loadModules();

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