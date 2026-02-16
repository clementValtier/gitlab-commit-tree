/**
 * GitLab API Client Module
 * @fileoverview Functions for fetching data from GitLab's API
 */

import { pagination } from '../config/constants.js';

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
 * Fetches diff content for a specific file in compare view using diff_for_path endpoint
 * @param {Object} projectInfo - Project information object
 * @param {string} filePath - Path of the file
 * @param {string} oldPath - Old path of the file (for renamed files)
 * @param {string} [fileStatus='modified'] - Status of the file
 * @returns {Promise<{html: string}>} HTML diff content
 * @throws {Error} When the API request fails or endpoint doesn't exist
 */
export async function fetchDiffForPath(projectInfo, filePath, oldPath, fileStatus = 'modified') {
    if (!projectInfo.isComparePage) {
        throw new Error('diff_for_path is only available on compare pages');
    }

    const gitlabBaseUrl = window.location.origin;
    
    const isNewFile = fileStatus === 'added';
    const fileIdentifier = `${filePath}-${isNewFile ? 'true' : 'false'}-false-false`;
    
    const urlParams = new URLSearchParams(window.location.search);
    const fromProjectId = urlParams.get('from_project_id') || projectInfo.projectId || '';
    
    const params = new URLSearchParams({
        file_identifier: fileIdentifier,
        from: projectInfo.targetBranch,
        from_project_id: fromProjectId,
        new_path: filePath,
        old_path: oldPath,
        straight: 'false',
        to: projectInfo.sourceBranch
    });

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    
    const apiUrl = `${gitlabBaseUrl}/${projectInfo.projectPath}/-/compare/diff_for_path?${params.toString()}`;

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Diff endpoint not available for this file');
        }
        throw new Error(`API error (${response.status}): ${response.statusText}`);
    }

    return await response.json();
}
