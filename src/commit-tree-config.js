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
    chevronUp: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.78 10.28a.75.75 0 0 1-1.06 0L8 6.56l-3.72 3.72a.75.75 0 1 1-1.06-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06Z"/></svg>`,
    expandAll: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.75a.75.75 0 0 1 .75.75v4.69l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 1.06-1.06l1.72 1.72V2.5A.75.75 0 0 1 8 1.75Zm-5.25 9.5a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Z"/></svg>`,
    collapseAll: `<svg class="gl-icon gl-fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 9.25a.75.75 0 0 1-.75-.75V3.81L5.53 5.53a.75.75 0 0 1-1.06-1.06l3-3a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1-1.06 1.06L8.75 3.81V8.5a.75.75 0 0 1-.75.75Zm-5.25 2a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Z"/></svg>`,
    maximize: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M264 96L120 96C106.7 96 96 106.7 96 120L96 264C96 273.7 101.8 282.5 110.8 286.2C119.8 289.9 130.1 287.8 137 281L177 241L256 320L177 399L137 359C130.1 352.1 119.8 350.1 110.8 353.8C101.8 357.5 96 366.3 96 376L96 520C96 533.3 106.7 544 120 544L264 544C273.7 544 282.5 538.2 286.2 529.2C289.9 520.2 287.9 509.9 281 503L241 463L320 384L399 463L359 503C352.1 509.9 350.1 520.2 353.8 529.2C357.5 538.2 366.3 544 376 544L520 544C533.3 544 544 533.3 544 520L544 376C544 366.3 538.2 357.5 529.2 353.8C520.2 350.1 509.9 352.1 503 359L463 399L384 320L463 241L503 281C509.9 287.9 520.2 289.9 529.2 286.2C538.2 282.5 544 273.7 544 264L544 120C544 106.7 533.3 96 520 96L376 96C366.3 96 357.5 101.8 353.8 110.8C350.1 119.8 352.2 130.1 359 137L399 177L320 256L241 177L281 137C287.9 130.1 289.9 119.8 286.2 110.8C282.5 101.8 273.7 96 264 96z"/></svg>`,
    minimize: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M520 288L376 288C362.7 288 352 277.3 352 264L352 120C352 110.3 357.8 101.5 366.8 97.8C375.8 94.1 386.1 96.2 393 103L433 143L506.4 69.6C510 66 514.9 64 520 64C525.1 64 530 66 533.7 69.7L570.4 106.4C574 110 576 114.9 576 120C576 125.1 574 130 570.3 133.7L497 207L537 247C543.9 253.9 545.9 264.2 542.2 273.2C538.5 282.2 529.7 288 520 288zM520 352C529.7 352 538.5 357.8 542.2 366.8C545.9 375.8 543.9 386.1 537 393L497 433L570.4 506.4C574 510 576.1 514.9 576.1 520.1C576.1 525.3 574.1 530.1 570.4 533.8L533.7 570.5C530 574 525.1 576 520 576C514.9 576 510 574 506.3 570.3L433 497L393 537C386.1 543.9 375.8 545.9 366.8 542.2C357.8 538.5 352 529.7 352 520L352 376C352 362.7 362.7 352 376 352L520 352zM264 352C277.3 352 288 362.7 288 376L288 520C288 529.7 282.2 538.5 273.2 542.2C264.2 545.9 253.9 543.9 247 537L207 497L133.6 570.4C130 574 125.1 576 120 576C114.9 576 110 574 106.3 570.3L69.7 533.7C66 530 64 525.1 64 520C64 514.9 66 510 69.7 506.3L143 433L103 393C96.1 386.1 94.1 375.8 97.8 366.8C101.5 357.8 110.3 352 120 352L264 352zM120 288C110.3 288 101.5 282.2 97.8 273.2C94.1 264.2 96.2 253.9 103 247L143 207L69.7 133.7C66 130 64 125.1 64 120C64 114.9 66 110 69.7 106.3L106.3 69.7C110 66 114.9 64 120 64C125.1 64 130 66 133.7 69.7L207 143L247 103C253.9 96.1 264.2 94.1 273.2 97.8C282.2 101.5 288 110.3 288 120L288 264C288 277.3 277.3 288 264 288L120 288z"/></svg>`,
    viewDiff: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><rect width="14" height="14" x="1" y="1" stroke="#333" rx="1.5" fill="white"/><path stroke="#4ADE80" stroke-linecap="round" stroke-width="1.7" d="M4.5 5.5H8"/><path stroke="#999" stroke-linecap="round" stroke-width="1.7" d="M4.5 8h7"/><path stroke="#F87171" stroke-linecap="round" stroke-width="1.7" d="M4.5 10.5h5"/></svg>`,
    viewFile: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.75 1A1.75 1.75 0 0 0 1 2.75v10.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 15 13.25V5L11 1H2.75Zm-.25 1.75a.25.25 0 0 1 .25-.25h7.25v3.5c0 .414.336.75.75.75h2.75v6.25a.25.25 0 0 1-.25.25H2.75a.25.25 0 0 1-.25-.25V2.75Z"/></svg>`
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
    'tsconfig.json': 'json',
    'jsconfig.json': 'json',
    '.mailmap': 'ini',
    '.git-blame-ignore-revs': 'plaintext',
    'Makefile': 'makefile',
    'Dockerfile': 'dockerfile',
    'docker-compose.yml': 'yaml',
    'docker-compose.yaml': 'yaml',
    'phpstan.dist.neon': 'yaml'
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