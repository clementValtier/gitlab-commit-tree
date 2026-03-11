/**
 * GitLab Commit Tree Configuration Module
 * @fileoverview Configuration constants, icons, and selectors for the commit tree view
 */

import { icons as gitlabIcons } from '../assets/icons.js';
import { fileExtensions, fileNames, defaultIcon, svgs } from 'virtual:material-icons';

export { gitlabIcons as icons };


/**
 * Mapping de fichiers spécifiques vers les langages highlight.js
 * @type {Object<string, string>}
 */
export const fileLanguageMapping = {
    '.gitignore': 'ini',
    '.gitattributes': 'ini',
    '.gitmodules': 'ini',
    '.dockerignore': 'ini',
    '.editorconfig': 'ini',
    '.npmrc': 'ini',
    '.yarnrc': 'ini',
    '.env': 'ini',
    '.env.example': 'ini',
    '.env.local': 'ini',
    '.env.production': 'ini',
    '.env.development': 'ini',
    'package-lock.json': 'json',
    'composer.lock': 'json',
    'symfony.lock': 'json',
    'yarn.lock': 'yaml',
    'Gemfile.lock': 'properties',
    'pnpm-lock.yaml': 'yaml',
    'Pipfile.lock': 'json',
    'poetry.lock': 'toml',
    'Cargo.lock': 'toml',
    '.eslintrc': 'json',
    '.prettierrc': 'json',
    '.babelrc': 'json',
    '.stylelintrc': 'json',
    '.jshintrc': 'json',
    'tsconfig.json': 'json',
    'jsconfig.json': 'json',
    '.mailmap': 'ini',
    'Makefile': 'makefile',
    'Dockerfile': 'dockerfile',
    'docker-compose.yml': 'yaml',
    'docker-compose.yaml': 'yaml',
    'phpstan.dist.neon': 'yaml',
    'freetds.conf': 'ini',
    'nginx.conf': 'nginx',
    'supervisord.conf': 'ini'
};

/**
 * Gets the appropriate SVG icon for a file based on its name and extension.
 * Uses material-icon-theme associations (fileNames exact match, then fileExtensions).
 * @param {string} filename - The filename
 * @returns {{ type: 'svg', value: string }} SVG icon object
 */
export function getFileIcon(filename) {
    const lower = filename.toLowerCase();
    const ext = lower.includes('.') ? lower.split('.').pop() : '';

    const iconName = fileNames[lower] ?? fileExtensions[ext] ?? defaultIcon;
    const svg = svgs[iconName] ?? svgs[defaultIcon] ?? '';

    return { type: 'svg', value: svg };
}

/**
 * Pagination configuration
 * @type {Object}
 */
export const pagination = {
    perPage: 100
};

/**
 * GitLab DOM selectors for different interface versions
 * @type {Object}
 */
export const gitlabSelectors = {
    current: {
        files: '.files-wrapper, .diff-files-holder, .diffs-container',
        fileHeader: '.file-header, .file-title, .diff-file-header',
        container: '.content-wrapper, main, .container-fluid',
        commits: '.content-list.commit-list.flex-list',
        commitRow: '.commit-row, .commit-item, .commit-row-description',
        commitActions: '.commit-sha-group.btn-group',
        treeTableHolder: '#tree-holder .tree-content-holder .table-holder'
    },
    legacy: {
        files: '.file-holder, .tree-holder, .diff-files',
        fileHeader: '.file-header-content, .diff-header, .file-info',
        container: '.container-limited, .content',
        commits: '.commit-list, .commits',
        commitRow: '.commit, .commit-item',
        commitActions: '.commit-meta, .commit-info'
    }
};

/**
 * CSS class names used by the commit tree
 * @type {Object<string, string>}
 */
export const cssClasses = {
    container: 'ct-container',
    header: 'ct-header',
    toolbar: 'ct-toolbar',
    searchBox: 'ct-search-box',
    searchInput: 'ct-search-input',
    tree: 'ct-tree',
    treeItem: 'ct-tree-item',
    treeItemContent: 'ct-tree-item-content',
    treeItemIcon: 'ct-tree-item-icon',
    treeItemChevron: 'ct-tree-item-chevron',
    treeItemName: 'ct-tree-item-name',
    treeItemStats: 'ct-tree-item-stats',
    treeChildren: 'ct-tree-children',
    folder: 'ct-folder',
    file: 'ct-file',
    expanded: 'ct-expanded',
    hidden: 'ct-hidden',
    diffContainer: 'ct-diff-container',
    diffLine: 'ct-diff-line',
    diffLineAdded: 'ct-diff-line-added',
    diffLineRemoved: 'ct-diff-line-removed',
    diffLineContext: 'ct-diff-line-context',
    button: 'ct-button',
    loading: 'ct-loading',
    error: 'ct-error',
    commitTreeButton: 'ct-commit-btn',
    commitTreeContainer: 'ct-commit-container',
    viewModeToggle: 'ct-view-mode-toggle',
    viewModeButton: 'ct-view-mode-btn',
    viewModeActive: 'ct-view-mode-active',
    fullFileContainer: 'ct-full-file-container',
    fullFileLine: 'ct-full-file-line',
    fullFileLineNum: 'ct-full-file-line-num',
    containerFullscreen: 'ct-container-fullscreen',
    previewSearch: 'ct-preview-search',
    previewSearchBar: 'ct-preview-search-bar',
    previewSearchInput: 'ct-preview-search-input',
    previewSearchCounter: 'ct-preview-search-counter',
    previewSearchBtnPrev: 'ct-preview-search-btn-prev',
    previewSearchBtnNext: 'ct-preview-search-btn-next',
    previewSearchBtnClose: 'ct-preview-search-btn-close'
};
