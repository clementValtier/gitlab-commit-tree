/**
 * GitLab Commit Tree API Module
 * @fileoverview Functions for fetching data from GitLab's API
 * @module commit-tree-api
 */

import { pagination } from './commit-tree-config.js';

/**
 * Builds the API URL based on project information and page type
 * @param {Object} projectInfo - Project information object
 * @param {string} projectInfo.projectPath - The project path
 * @param {string|null} projectInfo.commitSha - Commit SHA for commit pages
 * @param {string|null} projectInfo.sourceBranch - Source branch for compare pages
 * @param {string|null} projectInfo.targetBranch - Target branch for compare pages
 * @param {boolean} projectInfo.isCommitPage - Whether it's a commit page
 * @param {boolean} projectInfo.isComparePage - Whether it's a compare page
 * @param {boolean} projectInfo.isBranchHistoryPage - Whether it's a branch history page
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [perPage=100] - Items per page
 * @param {string|null} [specificCommitSha=null] - Specific commit SHA override
 * @returns {string|null} The constructed API URL or null if invalid
 */
export function buildApiUrl(projectInfo, page = 1, perPage = pagination.perPage, specificCommitSha = null) {
    const gitlabBaseUrl = window.location.origin;
    const encodedProjectPath = encodeURIComponent(projectInfo.projectPath);

    if (projectInfo.isCommitPage) {
        return `${gitlabBaseUrl}/api/v4/projects/${encodedProjectPath}/repository/commits/${projectInfo.commitSha}/diff?page=${page}&per_page=${perPage}`;
    } else if (projectInfo.isComparePage) {
        const encodedFrom = encodeURIComponent(projectInfo.targetBranch);
        const encodedTo = encodeURIComponent(projectInfo.sourceBranch);
        return `${gitlabBaseUrl}/api/v4/projects/${encodedProjectPath}/repository/compare?from=${encodedFrom}&to=${encodedTo}&page=${page}&per_page=${perPage}`;
    } else if (projectInfo.isBranchHistoryPage && specificCommitSha) {
        return `${gitlabBaseUrl}/api/v4/projects/${encodedProjectPath}/repository/commits/${specificCommitSha}/diff?page=${page}&per_page=${perPage}`;
    }

    return null;
}

/**
 * Fetches a single page of data from the API
 * @param {string} apiUrl - The API URL to fetch
 * @returns {Promise<{data: Object|Array, nextPage: string|null}>} Promise with data and next page info
 * @throws {Error} When the API request fails
 */
export async function fetchSinglePage(apiUrl) {
    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`API error (${response.status}): ${response.statusText}`);
    }

    const nextPage = response.headers.get('X-Next-Page');
    const data = await response.json();

    return { data, nextPage };
}

/**
 * Fetches all files with automatic pagination
 * @param {Object} projectInfo - Project information object
 * @param {Function} [progressCallback] - Optional callback for progress updates
 * @param {string|null} [specificCommitSha=null] - Specific commit SHA override
 * @returns {Promise<Array>} Promise resolving to all fetched files
 * @throws {Error} When API requests fail
 */
export async function fetchAllFilesWithPagination(projectInfo, progressCallback, specificCommitSha = null) {
    let allFiles = [];
    let currentPageNum = 1;
    let hasMorePages = true;

    while (hasMorePages) {
        const apiUrl = buildApiUrl(projectInfo, currentPageNum, pagination.perPage, specificCommitSha);
        if (!apiUrl) {
            throw new Error("Unable to construct API URL.");
        }

        try {
            if (progressCallback) {
                progressCallback(`Loading page ${currentPageNum}...`);
            }

            const response = await fetchSinglePage(apiUrl);
            let currentFiles = [];
            const apiData = response.data;

            if ((projectInfo.isCommitPage || projectInfo.isBranchHistoryPage) && Array.isArray(apiData)) {
                currentFiles = apiData;
            } else if (projectInfo.isComparePage && apiData && Array.isArray(apiData.diffs)) {
                currentFiles = apiData.diffs;
            } else if (projectInfo.isComparePage && apiData && !apiData.diffs) {
                currentFiles = [];
            }

            if (currentFiles.length > 0) {
                allFiles = allFiles.concat(currentFiles);
            }

            const nextPageHeaderVal = response.nextPage;
            if (nextPageHeaderVal && nextPageHeaderVal !== "") {
                currentPageNum = parseInt(nextPageHeaderVal);
                hasMorePages = true;
            } else {
                hasMorePages = false;
            }

            if (currentFiles.length === 0 && nextPageHeaderVal && nextPageHeaderVal !== "") {
                hasMorePages = false;
            }

        } catch (error) {
            hasMorePages = false;
            throw error;
        }
    }

    return allFiles;
}

/**
 * Processes raw API response into structured file data
 * @param {Object|Array} diffData - Raw diff data from API
 * @param {boolean} [isComparePage=false] - Whether this is compare page data
 * @returns {Array<{
 *   path: string,
 *   old_path: string,
 *   diff_index: number,
 *   status: string,
 *   diff_content: string
 * }>} Processed file data array
 */
export function processFilesFromApiResponse(diffData, isComparePage = false) {
    const fileData = [];

    if (!diffData) {
        return fileData;
    }

    const diffsToProcess = isComparePage
        ? (Array.isArray(diffData) ? diffData : (diffData.diffs || []))
        : (Array.isArray(diffData) ? diffData : []);

    diffsToProcess.forEach((diff, index) => {
        if (diff.new_path || diff.old_path) {
            const status = diff.new_file
                ? 'added'
                : diff.deleted_file
                    ? 'deleted'
                    : diff.renamed_file
                        ? 'renamed'
                        : 'modified';

            fileData.push({
                path: diff.new_path || diff.old_path,
                old_path: diff.old_path,
                diff_index: index,
                status: status,
                diff_content: diff.diff
            });
        }
    });

    return fileData;
}

/**
 * Builds a tree structure from a flat list of files
 * @param {Array<{
 *   path: string,
 *   old_path: string,
 *   diff_index: number,
 *   status: string,
 *   diff_content: string
 * }>} files - Array of file objects
 * @returns {Object} Tree structure with nested folders and files
 */
export function buildFileTree(files) {
    const root = {
        name: '/',
        type: 'folder',
        children: {},
        status: null,
        stats: { additions: 0, deletions: 0 }
    };

    files.forEach(file => {
        const parts = file.path.split('/');
        let currentNode = root;

        parts.forEach((part, i) => {
            const isFile = i === parts.length - 1;

            if (isFile) {
                const stats = parseFileStatsFromDiff(file.diff_content);
                currentNode.children[part] = {
                    name: part,
                    type: 'file',
                    path: file.path,
                    old_path: file.old_path,
                    diff_index: file.diff_index,
                    status: file.status,
                    diff_content: file.diff_content,
                    stats: stats
                };

                propagateStats(root, file.path, stats);
            } else {
                if (!currentNode.children[part]) {
                    currentNode.children[part] = {
                        name: part,
                        type: 'folder',
                        children: {},
                        status: null,
                        stats: { additions: 0, deletions: 0 }
                    };
                }

                if (file.status && (!currentNode.children[part].status || file.status === 'modified')) {
                    currentNode.children[part].status = file.status;
                }

                currentNode = currentNode.children[part];
            }
        });
    });

    collapseSingleChildFolders(root);

    return root;
}

/**
 * Recursively collapses folders that have only one child folder
 * @param {Object} node - Tree node to process
 */
function collapseSingleChildFolders(node) {
    if (node.type !== 'folder' || !node.children) {
        return;
    }

    const childKeys = Object.keys(node.children);

    for (const key of childKeys) {
        const child = node.children[key];
        
        if (child.type === 'folder') {
            collapseSingleChildFolders(child);

            const grandchildKeys = Object.keys(child.children);
            
            if (grandchildKeys.length === 1) {
                const grandchildKey = grandchildKeys[0];
                const grandchild = child.children[grandchildKey];
                
                if (grandchild.type === 'folder') {
                    const newName = `${child.name}/${grandchild.name}`;
                    
                    grandchild.name = newName;
                    
                    delete node.children[key];
                    node.children[newName] = grandchild;
                    
                    collapseSingleChildFolders(node);
                    return;
                }
            }
        }
    }
}

/**
 * Fetches the full content of a file from the GitLab API
 * @param {Object} projectInfo - Project information object
 * @param {string} filePath - Path of the file to fetch
 * @param {string} ref - Git reference (commit SHA or branch name)
 * @returns {Promise<{content: string, encoding: string, size: number, file_name: string}>}
 * @throws {Error} When the API request fails
 */
export async function fetchFileContent(projectInfo, filePath, ref) {
    const gitlabBaseUrl = window.location.origin;
    const encodedProjectPath = encodeURIComponent(projectInfo.projectPath);
    const encodedFilePath = encodeURIComponent(filePath);
    const apiUrl = `${gitlabBaseUrl}/api/v4/projects/${encodedProjectPath}/repository/files/${encodedFilePath}?ref=${encodeURIComponent(ref)}`;

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('File not found or deleted');
        } else if (response.status === 413) {
            throw new Error('File too large');
        }
        throw new Error(`API error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    
    let decodedContent = data.content;
    if (data.encoding === 'base64') {
        const blob = await fetch(`data:application/octet-stream;base64,${data.content}`).then(r => r.blob());
        decodedContent = await blob.text();
    }

    return {
        content: decodedContent,
        encoding: data.encoding,
        size: data.size,
        file_name: data.file_name
    };
}

/**
 * Parses addition/deletion statistics from diff content
 * @param {string} diffContent - The diff content string
 * @returns {{additions: number, deletions: number}} Line statistics
 */
function parseFileStatsFromDiff(diffContent) {
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

/**
 * Propagates file statistics up the tree hierarchy
 * @param {Object} root - Root node of the tree
 * @param {string} filePath - Path of the file
 * @param {{additions: number, deletions: number}} stats - Statistics to propagate
 */
function propagateStats(root, filePath, stats) {
    const parts = filePath.split('/');
    let currentNode = root;

    currentNode.stats.additions += stats.additions;
    currentNode.stats.deletions += stats.deletions;

    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (currentNode.children[part]) {
            currentNode = currentNode.children[part];
            currentNode.stats.additions += stats.additions;
            currentNode.stats.deletions += stats.deletions;
        }
    }
}