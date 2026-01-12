/**
 * GitLab Commit Tree Utilities Module
 * @fileoverview Utility functions for DOM manipulation, URL extraction, and helpers
 * @module commit-tree-utils
 */

/**
 * Determines the type of GitLab page currently being viewed
 * @returns {{isCommitPage: boolean, isComparePage: boolean, isBranchHistoryPage: boolean}} Page type flags
 */
export function getPageType() {
    const currentPath = window.location.pathname;
    return {
        isCommitPage: currentPath.includes('/commit/'),
        isComparePage: currentPath.includes('/compare/'),
        isBranchHistoryPage: currentPath.includes('/commits/') || currentPath.includes('/-/commits/')
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

    const pathMatch = window.location.pathname.match(/^((\/([^/]+))+?)\/-\/co/);
    if (pathMatch) {
        projectPath = pathMatch[1].substr(1);
    }

    if (isCommitPage) {
        const commitShaMatch = window.location.pathname.match(/\/commit\/([a-f0-9]+)/);
        commitSha = commitShaMatch ? commitShaMatch[1] : null;
    } else if (isComparePage) {
        const branchesMatch = window.location.pathname.match(/\/compare\/([^.]+)\.\.\.([^?]+)/);
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
 * Waits for an element to appear in the DOM
 * @param {string} selector - CSS selector to wait for
 * @param {number} [timeout=10000] - Maximum wait time in milliseconds
 * @returns {Promise<Element>} Promise resolving to the found element
 */
export function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const el = document.querySelector(selector);
            if (el) {
                obs.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

/**
 * Creates an HTML element with specified attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} [attributes={}] - Element attributes
 * @param {(string|Element|Element[])} [children] - Child elements or text content
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attributes = {}, children) {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else {
            element.setAttribute(key, value);
        }
    });

    if (children !== undefined) {
        if (typeof children === 'string') {
            element.innerHTML = children;
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (child) element.appendChild(child);
            });
        } else if (children instanceof Element) {
            element.appendChild(children);
        }
    }

    return element;
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

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Parses file statistics from diff content
 * @param {string} diffContent - The diff content string
 * @returns {{additions: number, deletions: number}} Line statistics
 */
export function parseFileStats(diffContent) {
    if (!diffContent) {
        return { additions: 0, deletions: 0 };
    }

    const lines = diffContent.split('\n');
    let additions = 0;
    let deletions = 0;

    lines.forEach(line => {
        if (line.startsWith('+') && !line.startsWith('+++')) {
            additions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
            deletions++;
        }
    });

    return { additions, deletions };
}
