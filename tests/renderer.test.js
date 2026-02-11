import {
    createTreeContainer,
    renderTree,
    expandAllFolders,
    collapseAllFolders,
    setupSearch,
    setupPreviewSearch,
    renderDiff,
    createLoadingIndicator,
    createErrorMessage
} from '../src/commit-tree-renderer.js';

if (typeof CSS === 'undefined') {
    global.CSS = {
        highlights: new Map()
    };
}

if (typeof Highlight === 'undefined') {
    global.Highlight = class {
        constructor() {
            this.ranges = [];
        }
        add(range) {
            this.ranges.push(range);
        }
        clear() {
            this.ranges = [];
        }
    };
}

if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = function() {};
}

if (!document.elementFromPoint) {
    document.elementFromPoint = function(x, y) {
        return document.body;
    };
}

describe('createTreeContainer', () => {
    test('should create container with all required elements', () => {
        const result = createTreeContainer('Test Title', 10);

        expect(result.container).toBeDefined();
        expect(result.toolbar).toBeDefined();
        expect(result.searchInput).toBeDefined();
        expect(result.treeView).toBeDefined();
        expect(result.previewPanel).toBeDefined();
        expect(result.expandAllBtn).toBeDefined();
        expect(result.collapseAllBtn).toBeDefined();
        expect(result.viewDiffBtn).toBeDefined();
        expect(result.viewFullBtn).toBeDefined();
    });

    test('should set correct title and file count', () => {
        const result = createTreeContainer('My Commit', 42);
        const header = result.container.querySelector('.ct-header');

        expect(header.textContent).toContain('My Commit');
        expect(header.textContent).toContain('42');
    });

    test('should initialize preview panel with placeholder', () => {
        const result = createTreeContainer('Test', 5);
        const placeholder = result.previewPanel.querySelector('.ct-preview-placeholder');

        expect(placeholder).toBeDefined();
        expect(placeholder.textContent).toContain('Sélectionnez un fichier');
    });

    test('should set preview panel view mode to diff by default', () => {
        const result = createTreeContainer('Test', 1);

        expect(result.previewPanel._viewMode).toBe('diff');
    });
});

describe('renderTree', () => {
    let container;
    let fileTree;

    beforeEach(() => {
        container = document.createElement('div');
        fileTree = {
            type: 'folder',
            name: 'root',
            children: {
                'src': {
                    type: 'folder',
                    name: 'src',
                    path: 'src',
                    children: {
                        'app.js': {
                            type: 'file',
                            name: 'app.js',
                            path: 'src/app.js',
                            status: 'modified',
                            stats: { additions: 5, deletions: 2 }
                        }
                    }
                },
                'README.md': {
                    type: 'file',
                    name: 'README.md',
                    path: 'README.md',
                    status: 'added',
                    stats: { additions: 10, deletions: 0 }
                }
            }
        };
    });

    test('should render folders before files', () => {
        renderTree(container, fileTree);

        const items = container.querySelectorAll('.ct-tree-item');
        expect(items[0].classList.contains('ct-folder')).toBe(true);
        expect(items[1].classList.contains('ct-file')).toBe(true);
    });

    test('should render file with correct stats', () => {
        renderTree(container, fileTree);

        const readmeItem = Array.from(container.querySelectorAll('.ct-tree-item'))
            .find(item => item.textContent.includes('README.md'));

        const stats = readmeItem.querySelector('.ct-tree-item-stats');
        expect(stats.textContent).toContain('+10');
    });

    test('should filter files based on search query', () => {
        renderTree(container, fileTree, 0, 'README');

        const items = container.querySelectorAll('.ct-tree-item');
        expect(items.length).toBe(1);
        expect(items[0].textContent).toContain('README.md');
    });

    test('should expand folders when filter is active', () => {
        renderTree(container, fileTree, 0, 'app.js');

        const srcFolder = Array.from(container.querySelectorAll('.ct-tree-item'))
            .find(item => item.textContent.includes('src'));

        expect(srcFolder.classList.contains('ct-expanded')).toBe(true);
    });

    test('should render status badges', () => {
        renderTree(container, fileTree);

        const addedFile = Array.from(container.querySelectorAll('.ct-tree-item'))
            .find(item => item.textContent.includes('README.md'));

        const badge = addedFile.querySelector('.ct-status-badge-added');
        expect(badge).toBeDefined();
        expect(badge.textContent).toBe('A');
    });
});

describe('expandAllFolders and collapseAllFolders', () => {
    let container;
    let treeView;

    beforeEach(() => {
        const result = createTreeContainer('Test', 1);
        container = result.container;
        treeView = result.treeView;

        const fileTree = {
            type: 'folder',
            name: 'root',
            children: {
                'folder1': {
                    type: 'folder',
                    name: 'folder1',
                    path: 'folder1',
                    children: {
                        'subfolder': {
                            type: 'folder',
                            name: 'subfolder',
                            path: 'folder1/subfolder',
                            children: {
                                'file.txt': {
                                    type: 'file',
                                    name: 'file.txt',
                                    path: 'folder1/subfolder/file.txt',
                                    status: 'added'
                                }
                            }
                        }
                    }
                }
            }
        };

        renderTree(treeView, fileTree);
    });

    test('expandAllFolders should expand all collapsed folders', () => {
        collapseAllFolders(treeView);

        const collapsedBefore = treeView.querySelectorAll('.ct-folder:not(.ct-expanded)');
        expect(collapsedBefore.length).toBeGreaterThan(0);

        expandAllFolders(treeView);

        const collapsedAfter = treeView.querySelectorAll('.ct-folder:not(.ct-expanded)');
        expect(collapsedAfter.length).toBe(0);
    });

    test('collapseAllFolders should collapse all expanded folders', () => {
        expandAllFolders(treeView);

        const expandedBefore = treeView.querySelectorAll('.ct-folder.ct-expanded');
        expect(expandedBefore.length).toBeGreaterThan(0);

        collapseAllFolders(treeView);

        const expandedAfter = treeView.querySelectorAll('.ct-folder.ct-expanded');
        expect(expandedAfter.length).toBe(0);
    });
});

describe('setupSearch', () => {
    test('should filter tree on input', (done) => {
        const result = createTreeContainer('Test', 1);
        const fileTree = {
            type: 'folder',
            name: 'root',
            children: {
                'test.js': {
                    type: 'file',
                    name: 'test.js',
                    path: 'test.js',
                    status: 'added'
                },
                'other.py': {
                    type: 'file',
                    name: 'other.py',
                    path: 'other.py',
                    status: 'modified'
                }
            }
        };

        renderTree(result.treeView, fileTree);
        setupSearch(result.searchInput, result.treeView, fileTree, null);

        result.searchInput.value = 'test';
        result.searchInput.dispatchEvent(new Event('input'));

        setTimeout(() => {
            const items = result.treeView.querySelectorAll('.ct-tree-item');
            expect(items.length).toBe(1);
            expect(items[0].textContent).toContain('test.js');
            done();
        }, 250);
    });

    test('should support glob patterns', (done) => {
        const result = createTreeContainer('Test', 1);
        const fileTree = {
            type: 'folder',
            name: 'root',
            children: {
                'app.js': { type: 'file', name: 'app.js', path: 'app.js', status: 'added' },
                'test.js': { type: 'file', name: 'test.js', path: 'test.js', status: 'added' },
                'style.css': { type: 'file', name: 'style.css', path: 'style.css', status: 'added' }
            }
        };

        renderTree(result.treeView, fileTree);
        setupSearch(result.searchInput, result.treeView, fileTree, null);

        result.searchInput.value = '*.js';
        result.searchInput.dispatchEvent(new Event('input'));

        setTimeout(() => {
            const items = result.treeView.querySelectorAll('.ct-tree-item');
            expect(items.length).toBe(2);
            done();
        }, 250);
    });
});

describe('renderDiff', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
    });

    test('should render empty message for null diff', () => {
        renderDiff(container, null, 'test.js');

        expect(container.textContent).toContain('Aucune différence disponible');
    });

    test('should render diff with line numbers', () => {
        const diff = `@@ -1,2 +1,3 @@
 context line
-removed line
+added line
+another added line`;

        renderDiff(container, diff, 'test.js');

        const lines = container.querySelectorAll('.ct-diff-line');
        expect(lines.length).toBeGreaterThan(0);

        const lineNums = container.querySelectorAll('.ct-line-num');
        expect(lineNums.length).toBeGreaterThan(0);
    });

    test('should style added lines correctly', () => {
        const diff = `@@ -1,1 +1,2 @@
 context
+added line`;

        renderDiff(container, diff, 'test.js');

        const addedLine = container.querySelector('.ct-diff-line-added');
        expect(addedLine).toBeDefined();
    });

    test('should style removed lines correctly', () => {
        const diff = `@@ -1,2 +1,1 @@
 context
-removed line`;

        renderDiff(container, diff, 'test.js');

        const removedLine = container.querySelector('.ct-diff-line-removed');
        expect(removedLine).toBeDefined();
    });

    test('should render separators between diff sections', () => {
        const diff = `@@ -1,1 +1,1 @@
+first section
@@ -10,1 +10,1 @@
+second section`;

        renderDiff(container, diff, 'test.js');

        const separators = container.querySelectorAll('.ct-diff-separator');
        expect(separators.length).toBe(1);
    });
});

describe('createLoadingIndicator', () => {
    test('should create loading element with message', () => {
        const loading = createLoadingIndicator('Loading test...');

        expect(loading.classList.contains('ct-loading')).toBe(true);
        expect(loading.textContent).toContain('Loading test...');
    });

    test('should use default message when none provided', () => {
        const loading = createLoadingIndicator();

        expect(loading.textContent).toContain('Chargement...');
    });

    test('should include spinner element', () => {
        const loading = createLoadingIndicator();

        expect(loading.innerHTML).toContain('ct-spinner');
    });
});

describe('createErrorMessage', () => {
    test('should create error element with message', () => {
        const error = createErrorMessage('Test error message');

        expect(error.classList.contains('ct-error')).toBe(true);
        expect(error.textContent).toBe('Test error message');
    });
});

describe('setupPreviewSearch', () => {
    let previewPanel;
    let container;

    beforeEach(() => {
        const result = createTreeContainer('Test', 1);
        container = result.container;
        previewPanel = result.previewPanel;
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (previewPanel._cleanupSearch) {
            previewPanel._cleanupSearch();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    test('should create search bar with all required elements', () => {
        setupPreviewSearch(previewPanel);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        expect(searchBar).toBeDefined();

        const searchInput = searchBar.querySelector('.ct-preview-search-input');
        expect(searchInput).toBeDefined();
        expect(searchInput.placeholder).toContain('Rechercher');

        const counter = searchBar.querySelector('.ct-preview-search-counter');
        expect(counter).toBeDefined();
        expect(counter.textContent).toBe('0/0');

        const btnPrev = searchBar.querySelector('.ct-preview-search-btn-prev');
        const btnNext = searchBar.querySelector('.ct-preview-search-btn-next');
        const btnClose = searchBar.querySelector('.ct-preview-search-btn-close');
        expect(btnPrev).toBeDefined();
        expect(btnNext).toBeDefined();
        expect(btnClose).toBeDefined();
    });

    test('should hide search bar by default', () => {
        setupPreviewSearch(previewPanel);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        expect(searchBar.style.display).toBe('none');
    });

    test('should not setup twice on same panel', () => {
        setupPreviewSearch(previewPanel);
        setupPreviewSearch(previewPanel);

        const searchBars = previewPanel.querySelectorAll('.ct-preview-search-bar');
        expect(searchBars.length).toBe(1);
    });

    test('should attach toggle and cleanup methods to panel', () => {
        setupPreviewSearch(previewPanel);

        expect(typeof previewPanel._toggleSearch).toBe('function');
        expect(typeof previewPanel._cleanupSearch).toBe('function');
    });

    test('should find matches in diff content', (done) => {
        setupPreviewSearch(previewPanel);

        const previewContent = document.createElement('div');
        previewContent.className = 'ct-preview-content';

        const diffLine1 = document.createElement('div');
        diffLine1.className = 'ct-diff-line';
        const content1 = document.createElement('div');
        content1.className = 'ct-line-content';
        content1.textContent = 'const test = 123;';
        diffLine1.appendChild(content1);

        const diffLine2 = document.createElement('div');
        diffLine2.className = 'ct-diff-line';
        const content2 = document.createElement('div');
        content2.className = 'ct-line-content';
        content2.textContent = 'function test() { }';
        diffLine2.appendChild(content2);

        previewContent.appendChild(diffLine1);
        previewContent.appendChild(diffLine2);
        previewPanel.appendChild(previewContent);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        searchBar.style.display = 'block';

        const searchInput = searchBar.querySelector('.ct-preview-search-input');
        const counter = searchBar.querySelector('.ct-preview-search-counter');

        searchInput.value = 'test';
        searchInput.dispatchEvent(new Event('input'));

        setTimeout(() => {
            expect(counter.textContent).toBe('1/2');
            done();
        }, 150);
    });

    test('should navigate to next match', (done) => {
        setupPreviewSearch(previewPanel);

        const previewContent = document.createElement('div');
        previewContent.className = 'ct-preview-content';

        const diffLine1 = document.createElement('div');
        diffLine1.className = 'ct-diff-line';
        const content1 = document.createElement('div');
        content1.className = 'ct-line-content';
        content1.textContent = 'first match';
        diffLine1.appendChild(content1);

        const diffLine2 = document.createElement('div');
        diffLine2.className = 'ct-diff-line';
        const content2 = document.createElement('div');
        content2.className = 'ct-line-content';
        content2.textContent = 'second match';
        diffLine2.appendChild(content2);

        previewContent.appendChild(diffLine1);
        previewContent.appendChild(diffLine2);
        previewPanel.appendChild(previewContent);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        const searchInput = searchBar.querySelector('.ct-preview-search-input');
        const counter = searchBar.querySelector('.ct-preview-search-counter');
        const btnNext = searchBar.querySelector('.ct-preview-search-btn-next');

        searchInput.value = 'match';
        searchInput.dispatchEvent(new Event('input'));

        setTimeout(() => {
            expect(counter.textContent).toBe('1/2');

            btnNext.click();

            setTimeout(() => {
                expect(counter.textContent).toBe('2/2');
                done();
            }, 50);
        }, 150);
    });

    test('should navigate to previous match', (done) => {
        setupPreviewSearch(previewPanel);

        const previewContent = document.createElement('div');
        previewContent.className = 'ct-preview-content';

        const diffLine1 = document.createElement('div');
        diffLine1.className = 'ct-diff-line';
        const content1 = document.createElement('div');
        content1.className = 'ct-line-content';
        content1.textContent = 'first item';
        diffLine1.appendChild(content1);

        const diffLine2 = document.createElement('div');
        diffLine2.className = 'ct-diff-line';
        const content2 = document.createElement('div');
        content2.className = 'ct-line-content';
        content2.textContent = 'third item';
        diffLine2.appendChild(content2);

        previewContent.appendChild(diffLine1);
        previewContent.appendChild(diffLine2);
        previewPanel.appendChild(previewContent);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        const searchInput = searchBar.querySelector('.ct-preview-search-input');
        const counter = searchBar.querySelector('.ct-preview-search-counter');
        const btnPrev = searchBar.querySelector('.ct-preview-search-btn-prev');

        searchInput.value = 'i';
        searchInput.dispatchEvent(new Event('input'));

        setTimeout(() => {
            expect(counter.textContent).toBe('1/4');

            btnPrev.click();

            setTimeout(() => {
                expect(counter.textContent).toBe('4/4');
                done();
            }, 50);
        }, 150);
    });

    test('should close search bar on close button click', () => {
        setupPreviewSearch(previewPanel);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        const btnClose = searchBar.querySelector('.ct-preview-search-btn-close');

        previewPanel._toggleSearch(true);
        expect(searchBar.style.display).toBe('block');

        btnClose.click();
        expect(searchBar.style.display).toBe('none');
    });

    test('should handle Enter key for next match', (done) => {
        setupPreviewSearch(previewPanel);

        const previewContent = document.createElement('div');
        previewContent.className = 'ct-preview-content';

        const diffLine1 = document.createElement('div');
        diffLine1.className = 'ct-diff-line';
        const content1 = document.createElement('div');
        content1.className = 'ct-line-content';
        content1.textContent = 'test test';
        diffLine1.appendChild(content1);

        previewContent.appendChild(diffLine1);
        previewPanel.appendChild(previewContent);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        const searchInput = searchBar.querySelector('.ct-preview-search-input');
        const counter = searchBar.querySelector('.ct-preview-search-counter');

        searchInput.value = 'test';
        searchInput.dispatchEvent(new Event('input'));

        setTimeout(() => {
            expect(counter.textContent).toBe('1/2');

            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            searchInput.dispatchEvent(enterEvent);

            setTimeout(() => {
                expect(counter.textContent).toBe('2/2');
                done();
            }, 50);
        }, 150);
    });

    test('should handle Shift+Enter key for previous match', (done) => {
        setupPreviewSearch(previewPanel);

        const previewContent = document.createElement('div');
        previewContent.className = 'ct-preview-content';

        const diffLine1 = document.createElement('div');
        diffLine1.className = 'ct-diff-line';
        const content1 = document.createElement('div');
        content1.className = 'ct-line-content';
        content1.textContent = 'test test';
        diffLine1.appendChild(content1);

        previewContent.appendChild(diffLine1);
        previewPanel.appendChild(previewContent);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        const searchInput = searchBar.querySelector('.ct-preview-search-input');
        const counter = searchBar.querySelector('.ct-preview-search-counter');

        searchInput.value = 'test';
        searchInput.dispatchEvent(new Event('input'));

        setTimeout(() => {
            expect(counter.textContent).toBe('1/2');

            const shiftEnterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                shiftKey: true,
                bubbles: true
            });
            searchInput.dispatchEvent(shiftEnterEvent);

            setTimeout(() => {
                expect(counter.textContent).toBe('2/2');
                done();
            }, 50);
        }, 150);
    });

    test('should escape regex special characters in search', (done) => {
        setupPreviewSearch(previewPanel);

        const previewContent = document.createElement('div');
        previewContent.className = 'ct-preview-content';

        const diffLine1 = document.createElement('div');
        diffLine1.className = 'ct-diff-line';
        const content1 = document.createElement('div');
        content1.className = 'ct-line-content';
        content1.textContent = 'test.js (file)';
        diffLine1.appendChild(content1);

        previewContent.appendChild(diffLine1);
        previewPanel.appendChild(previewContent);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        const searchInput = searchBar.querySelector('.ct-preview-search-input');
        const counter = searchBar.querySelector('.ct-preview-search-counter');

        searchInput.value = '(file)';
        searchInput.dispatchEvent(new Event('input'));

        setTimeout(() => {
            expect(counter.textContent).toBe('1/1');
            done();
        }, 150);
    });

    test('should show 0/0 when no matches found', (done) => {
        setupPreviewSearch(previewPanel);

        const previewContent = document.createElement('div');
        previewContent.className = 'ct-preview-content';

        const diffLine1 = document.createElement('div');
        diffLine1.className = 'ct-diff-line';
        const content1 = document.createElement('div');
        content1.className = 'ct-line-content';
        content1.textContent = 'no matches here';
        diffLine1.appendChild(content1);

        previewContent.appendChild(diffLine1);
        previewPanel.appendChild(previewContent);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        const searchInput = searchBar.querySelector('.ct-preview-search-input');
        const counter = searchBar.querySelector('.ct-preview-search-counter');

        searchInput.value = 'xyz123';
        searchInput.dispatchEvent(new Event('input'));

        setTimeout(() => {
            expect(counter.textContent).toBe('0/0');
            done();
        }, 150);
    });

    test('should clear search when input is empty', (done) => {
        setupPreviewSearch(previewPanel);

        const previewContent = document.createElement('div');
        previewContent.className = 'ct-preview-content';

        const diffLine1 = document.createElement('div');
        diffLine1.className = 'ct-diff-line';
        const content1 = document.createElement('div');
        content1.className = 'ct-line-content';
        content1.textContent = 'test content';
        diffLine1.appendChild(content1);

        previewContent.appendChild(diffLine1);
        previewPanel.appendChild(previewContent);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        const searchInput = searchBar.querySelector('.ct-preview-search-input');
        const counter = searchBar.querySelector('.ct-preview-search-counter');

        searchInput.value = 'test';
        searchInput.dispatchEvent(new Event('input'));

        setTimeout(() => {
            expect(counter.textContent).toBe('1/1');

            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));

            setTimeout(() => {
                expect(counter.textContent).toBe('0/0');
                done();
            }, 150);
        }, 150);
    });

    test('should focus and select input when opening search bar', () => {
        setupPreviewSearch(previewPanel);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        const searchInput = searchBar.querySelector('.ct-preview-search-input');

        searchInput.value = 'previous search';

        previewPanel._toggleSearch(true);

        expect(document.activeElement).toBe(searchInput);
        expect(searchBar.style.display).toBe('block');
    });

    test('should clear input and counter when closing search bar', () => {
        setupPreviewSearch(previewPanel);

        const searchBar = previewPanel.querySelector('.ct-preview-search-bar');
        const searchInput = searchBar.querySelector('.ct-preview-search-input');
        const counter = searchBar.querySelector('.ct-preview-search-counter');

        searchInput.value = 'test';
        counter.textContent = '1/5';

        previewPanel._toggleSearch(true);
        previewPanel._toggleSearch(false);

        expect(searchInput.value).toBe('');
        expect(counter.textContent).toBe('0/0');
        expect(searchBar.style.display).toBe('none');
    });
});
