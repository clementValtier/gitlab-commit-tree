/**
 * Data Transformer Module
 * @fileoverview Functions for processing raw API responses and building tree structures
 */

/**
 * Processes raw API response into structured file data
 * @param {Object|Array} diffData - Raw diff data from API
 * @param {boolean} [isComparePage=false] - Whether this is compare page data
 * @param {string|null} [ref=null] - Git reference for this data
 * @returns {Array<{
 *   path: string,
 *   old_path: string,
 *   diff_index: number,
 *   status: string,
 *   diff_content: string,
 *   has_diff_content: boolean,
 *   ref: string|null
 * }>} Processed file data array
 */
export function processFilesFromApiResponse(diffData, isComparePage = false, ref = null) {
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

            const hasDiff = Boolean(diff.diff && diff.diff.trim());

            fileData.push({
                path: diff.new_path || diff.old_path,
                old_path: diff.old_path,
                diff_index: index,
                status: status,
                diff_content: diff.diff,
                has_diff_content: hasDiff,
                ref: ref
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
 *   diff_content: string,
 *   has_diff_content: boolean,
 *   ref: string|null
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
                    has_diff_content: file.has_diff_content,
                    stats: stats,
                    ref: file.ref
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
