/**
 * GitLab Utilities
 * @fileoverview Utility functions for GitLab URL extraction and navigation
 */

/**
 * Determines the type of GitLab page currently being viewed
 * @returns {{isCommitPage: boolean, isComparePage: boolean, isBranchHistoryPage: boolean}} Page type flags
 */
export function getPageType() {
    const path = window.location.pathname;
    const isBranchHistoryPage = path.includes('/commits/');
    const isComparePage = path.includes('/compare/');
    const isCommitPage = !isBranchHistoryPage && path.includes('/commit/');

    return {
        isCommitPage,
        isComparePage,
        isBranchHistoryPage
    };
}

/**
 * Extracts project and commit information from the current URL
 * @returns {{
 *   projectPath: string,
 *   commitSha: string|null,
 *   sourceBranch: string|null,
 *   targetBranch: string|null,
 *   branchName: string|null,
 *   isCommitPage: boolean,
 *   isComparePage: boolean,
 *   isBranchHistoryPage: boolean
 * }} Extracted information
 */
export function extractProjectAndCommitInfo() {
    const { isCommitPage, isComparePage, isBranchHistoryPage } = getPageType();
    let projectPath = '';
    let commitSha = null;
    let sourceBranch = null;
    let targetBranch = null;
    let branchName = null;

    const pathMatch = window.location.pathname.match(/^(.*?)\/-\/(?:commit|commits|compare)/);
    if (pathMatch) {
        projectPath = pathMatch[1].substr(1);
    }

    if (isCommitPage) {
        const commitShaMatch = window.location.pathname.match(/\/commit\/([a-f0-9]+)/);
        commitSha = commitShaMatch ? commitShaMatch[1] : null;
    } else if (isComparePage) {
        const branchesMatch = window.location.pathname.match(/\/compare\/(.+?)(?:\.){2,3}(.+?)(?:\?|$)/);
        if (branchesMatch) {
            targetBranch = decodeURIComponent(branchesMatch[1]);
            sourceBranch = decodeURIComponent(branchesMatch[2]);
        }
    } else if (isBranchHistoryPage) {
        const branchMatch = window.location.pathname.match(/\/commits\/(.+?)(?:\?|$)/);
        branchName = branchMatch ? decodeURIComponent(branchMatch[1]) : 'main';
    }

    return {
        projectPath,
        commitSha,
        sourceBranch,
        targetBranch,
        branchName,
        isCommitPage,
        isComparePage,
        isBranchHistoryPage
    };
}

/**
 * Finds commit elements in the current page
 * @returns {HTMLElement[]} Array of commit elements
 */
export function findCommitElements() {
    const elements = document.querySelectorAll('.content-list li');

    if (elements.length > 0) {
        return Array.from(elements).filter(el => {
            const sha = extractCommitShaFromElement(el);
            return sha && sha.length >= 7;
        });
    }

    return [];
}

/**
 * Extracts the commit SHA from a commit element
 * @param {HTMLElement} commitElement - The commit DOM element
 * @returns {string|null} The commit SHA or null if not found
 */
export function extractCommitShaFromElement(commitElement) {
    const shaElement = commitElement.querySelector('button[data-clipboard-text]');
    if (shaElement) {
        const clipboardSha = shaElement.getAttribute('data-clipboard-text');
        if (clipboardSha && clipboardSha.match(/^[a-f0-9]{7,40}$/)) {
            return clipboardSha;
        }

        const href = shaElement.getAttribute('href');
        if (href) {
            const shaMatch = href.match(/\/commit\/([a-f0-9]+)/);
            if (shaMatch) {
                return shaMatch[1];
            }
        }

        const text = shaElement.textContent.trim();
        if (text.match(/^[a-f0-9]{7,40}$/)) {
            return text;
        }
    }

    return null;
}

/**
 * Scrolls to a file in the current page
 * @param {string} filePath - Path of the file to scroll to
 * @returns {boolean} True if the file was found and scrolled to
 */
export function scrollToFileInCurrentPage(filePath) {
    const idEncoded = filePath.replace(/[\/\.]/g, '_');
    const possibleIds = [
        `diff-content-${idEncoded}`,
        `file-path-${idEncoded}`,
        `diff_file_${idEncoded}`,
        `file_${idEncoded}`,
        idEncoded
    ];

    if (getPageType().isComparePage) {
        possibleIds.push(
            `compare-diff-${idEncoded}`,
            `compare-file-${idEncoded}`,
            `change-${idEncoded}`
        );
    }

    for (const id of possibleIds) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return true;
        }
    }

    const fileHeaders = document.querySelectorAll(
        '.file-header, .file-title, .diff-file-header, .file-header-content, .diff-header, .file-info'
    );

    for (const header of fileHeaders) {
        if (header.textContent.includes(filePath)) {
            header.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return true;
        }
    }

    return false;
}

/**
 * Navigates to a file's blob view
 * @param {string} filePath - Path of the file
 * @param {Object} [projectInfo=null] - Project information object
 * @param {string} [specificCommitSha=null] - Specific commit SHA
 */
export function navigateToFile(filePath, projectInfo = null, specificCommitSha = null) {
    if (!projectInfo) {
        projectInfo = extractProjectAndCommitInfo();
    }

    const gitlabBaseUrl = window.location.origin;
    let fileUrl;

    if (projectInfo.isCommitPage) {
        fileUrl = `${gitlabBaseUrl}/${projectInfo.projectPath}/-/blob/${projectInfo.commitSha}/${filePath}`;
    } else if (projectInfo.isComparePage) {
        const branch = projectInfo.sourceBranch || projectInfo.targetBranch;
        fileUrl = branch
            ? `${gitlabBaseUrl}/${projectInfo.projectPath}/-/blob/${encodeURIComponent(branch)}/${filePath}`
            : `${gitlabBaseUrl}/${projectInfo.projectPath}/-/blob/master/${filePath}`;
    } else if (projectInfo.isBranchHistoryPage) {
        const ref = specificCommitSha || projectInfo.branchName || 'main';
        fileUrl = `${gitlabBaseUrl}/${projectInfo.projectPath}/-/blob/${encodeURIComponent(ref)}/${filePath}`;
    } else {
        fileUrl = `${gitlabBaseUrl}/${projectInfo.projectPath}/-/blob/master/${filePath}`;
    }

    window.open(fileUrl, '_blank');
}
