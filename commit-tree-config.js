/**
 * GitLab Commit Tree Configuration Module
 * @fileoverview Configuration constants, icons, and selectors for the commit tree view
 * @module commit-tree-config
 */

/**
 * SVG Icons matching GitLab's native design system
 * @type {Object<string, string>}
 */
export const icons = {
    folderClosed: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.75 2A1.75 1.75 0 0 0 0 3.75v8.5C0 13.216.784 14 1.75 14h12.5A1.75 1.75 0 0 0 16 12.25V5.56a1.75 1.75 0 0 0-1.75-1.75H8.643a.25.25 0 0 1-.177-.073L6.879 2.15A1.75 1.75 0 0 0 5.643 1.5H1.75Z"/></svg>`,
    folderOpen: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.75 2A1.75 1.75 0 0 0 0 3.75v8.5C0 13.216.784 14 1.75 14h12.5A1.75 1.75 0 0 0 16 12.25v-6.5A1.75 1.75 0 0 0 14.25 4H8.643a.25.25 0 0 1-.177-.073L6.879 2.34A1.75 1.75 0 0 0 5.643 1.5H1.75ZM1.5 3.75a.25.25 0 0 1 .25-.25h3.893c.066 0 .13.026.177.073l1.587 1.587A1.75 1.75 0 0 0 8.643 5.5h5.607a.25.25 0 0 1 .25.25v6.5a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25v-8.5Z"/></svg>`,
    file: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.75 1A1.75 1.75 0 0 0 1 2.75v10.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 15 13.25V5L11 1H2.75Zm-.25 1.75a.25.25 0 0 1 .25-.25h7.25v3.5c0 .414.336.75.75.75h2.75v6.25a.25.25 0 0 1-.25.25H2.75a.25.25 0 0 1-.25-.25V2.75Z"/></svg>`,
    fileCode: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.78 5.72a.75.75 0 0 1 0 1.06L3.06 8.5l1.72 1.72a.75.75 0 1 1-1.06 1.06l-2.25-2.25a.75.75 0 0 1 0-1.06l2.25-2.25a.75.75 0 0 1 1.06 0zm6.44 0a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06zm-3.44-.46a.75.75 0 0 1 .46.96l-2 5.5a.75.75 0 1 1-1.41-.52l2-5.5a.75.75 0 0 1 .95-.44z"/></svg>`,
    fileImage: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.75 2A1.75 1.75 0 0 0 0 3.75v8.5C0 13.216.784 14 1.75 14h12.5A1.75 1.75 0 0 0 16 12.25v-8.5A1.75 1.75 0 0 0 14.25 2H1.75ZM1.5 3.75a.25.25 0 0 1 .25-.25h12.5a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25v-8.5Zm4.5 2a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm.97 2.97L5.72 10.03a.75.75 0 0 0 1.06 1.06l2.25-2.25a.75.75 0 0 0 0-1.06L7.78 6.53a.75.75 0 0 0-1.06 0l-.75.72Z"/></svg>`,
    fileText: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.75 1A1.75 1.75 0 0 0 1 2.75v10.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 15 13.25v-7.5a.75.75 0 0 0-.22-.53l-4-4A.75.75 0 0 0 10.25 1h-7.5Zm-.25 1.75a.25.25 0 0 1 .25-.25h6.5v3.5c0 .414.336.75.75.75h3.5v6.5a.25.25 0 0 1-.25.25H2.75a.25.25 0 0 1-.25-.25V2.75ZM4 8.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 4 8.25Zm.75 2.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z"/></svg>`,
    fileConfig: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.457 1.047a.75.75 0 0 1 .543.714v.36c0 .067.054.122.12.122h1.76c.066 0 .12-.055.12-.122v-.36a.75.75 0 0 1 1.293-.513l1.5 1.5A.75.75 0 0 1 12 3.25v1.5a.75.75 0 0 1-.75.75h-6.5a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 .207-.513l1.5-1.5a.75.75 0 0 1 .75-.19ZM8 6.25a.75.75 0 0 1 .75.75v6.25a.75.75 0 0 1-1.5 0V7a.75.75 0 0 1 .75-.75ZM5 9a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 5 9Zm6.75.75a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5Z"/></svg>`,
    chevronRight: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.72 3.97a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 1 1-1.06-1.06L8.94 8 5.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>`,
    chevronDown: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.22 5.72a.75.75 0 0 1 1.06 0L8 9.44l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 6.78a.75.75 0 0 1 0-1.06Z"/></svg>`,
    tree: `<svg style="width: 16px; height: 16px; fill: #737278;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104.12 122.88"><path d="M8,0V33.06H36.47v8H8v63.61H36v8H0V0ZM45.31,92.07l3.83,28.87a2,2,0,0,0,1.8,1.94H97.37c1.07,0,1.67-1,1.8-2l5-28.81Zm2.37-8.24-2.13,4.73h58.39l-2.15-4.74h-26a1.55,1.55,0,0,1-1.56-1.56V78.55H52v3.73a1.54,1.54,0,0,1-1.55,1.55ZM45.31,28.4l3.83,28.86a2,2,0,0,0,1.8,1.94H97.37c1.07,0,1.67-1,1.8-2l5-28.82Zm2.37-8.24-2.13,4.72h58.39l-2.15-4.73h-26a1.56,1.56,0,0,1-1.56-1.56V14.88H52V18.6a1.55,1.55,0,0,1-1.55,1.56Z"/></svg>`,
    search: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.393 4.168a5 5 0 1 1 1.06-1.06l2.613 2.612a.75.75 0 1 1-1.06 1.06l-2.613-2.612Z"/></svg>`,
    close: `<svg style="width: 16px;height: 16px;" class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>`,
    expandAll: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.75a.75.75 0 0 1 .75.75v4.69l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 1.06-1.06l1.72 1.72V2.5A.75.75 0 0 1 8 1.75Zm-5.25 9.5a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Z"/></svg>`,
    collapseAll: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 9.25a.75.75 0 0 1-.75-.75V3.81L5.53 5.53a.75.75 0 0 1-1.06-1.06l3-3a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1-1.06 1.06L8.75 3.81V8.5a.75.75 0 0 1-.75.75Zm-5.25 2a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Z"/></svg>`,
    viewDiff: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" style="height:16px;width:16px" viewBox="0 0 16 16"><rect width="12" height="12" x="2" y="2" stroke="#333" rx="1.5" fill="white"/><path stroke="#4ADE80" stroke-linecap="round" stroke-width="1.7" d="M4.5 5.5H8"/><path stroke="#999" stroke-linecap="round" stroke-width="1.7" d="M4.5 8h7"/><path stroke="#F87171" stroke-linecap="round" stroke-width="1.7" d="M4.5 10.5h5"/></svg>`,
    viewFile: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.75 1A1.75 1.75 0 0 0 1 2.75v10.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 15 13.25V5L11 1H2.75Zm-.25 1.75a.25.25 0 0 1 .25-.25h7.25v3.5c0 .414.336.75.75.75h2.75v6.25a.25.25 0 0 1-.25.25H2.75a.25.25 0 0 1-.25-.25V2.75Z"/></svg>`
};

/**
 * File extension to icon mapping
 * @type {Object<string, string>}
 */
export const fileTypeIcons = {
    code: ['js', 'ts', 'jsx', 'tsx', 'vue', 'py', 'rb', 'php', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'swift', 'kt', 'scala', 'sh', 'bash', 'zsh', 'ps1', 'pl', 'r', 'lua', 'ex', 'exs', 'clj', 'hs', 'elm', 'erl'],
    config: ['json', 'yaml', 'yml', 'toml', 'xml', 'ini', 'cfg', 'conf', 'env', 'properties', 'gradle', 'pom', 'lock', 'gitignore', 'dockerignore', 'editorconfig', 'eslintrc', 'prettierrc', 'babelrc'],
    text: ['md', 'txt', 'rst', 'doc', 'docx', 'pdf', 'rtf', 'tex', 'csv', 'log'],
    image: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'tiff'],
    style: ['css', 'scss', 'sass', 'less', 'styl'],
    html: ['html', 'htm', 'xhtml', 'ejs', 'hbs', 'pug', 'jade']
};

/**
 * Gets the appropriate icon for a file based on its extension
 * @param {string} filename - The filename
 * @returns {string} The SVG icon string
 */
export function getFileIcon(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    if (fileTypeIcons.code.includes(ext) || fileTypeIcons.style.includes(ext) || fileTypeIcons.html.includes(ext)) {
        return icons.fileCode;
    }
    if (fileTypeIcons.config.includes(ext)) {
        return icons.fileConfig;
    }
    if (fileTypeIcons.image.includes(ext)) {
        return icons.fileImage;
    }
    if (fileTypeIcons.text.includes(ext)) {
        return icons.fileText;
    }
    return icons.file;
}

/**
 * File status indicators
 * @type {Object<string, {label: string, shortLabel: string}>}
 */
export const fileStatus = {
    added: { label: 'Added', shortLabel: 'A' },
    modified: { label: 'Modified', shortLabel: 'M' },
    deleted: { label: 'Deleted', shortLabel: 'D' },
    renamed: { label: 'Renamed', shortLabel: 'R' }
};

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
        commitActions: '.commit-sha-group.btn-group'
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
    fullFileLineNum: 'ct-full-file-line-num'
};

/**
 * Default configuration object
 * @type {Object}
 */
const config = {
    icons,
    fileStatus,
    pagination,
    gitlabSelectors,
    cssClasses
};

export default config;