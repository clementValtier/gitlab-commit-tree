import { initCompareSelection, resetCompareSelection } from '../src/components/history/compareSelection.js';
import { cssClasses } from '../src/config/constants.js';
import { getProjectInfo, setProjectContext } from '../src/core/context.js';

// Mock API client so tests don't make real network calls
jest.mock('../src/api/client.js', () => ({
    fetchAllFilesWithPagination: jest.fn()
}));

const { fetchAllFilesWithPagination } = require('../src/api/client.js');

// Same jsdom polyfills as renderer.test.js — createTreeContainer wires up
// setupPreviewSearch, which needs the CSS Custom Highlight API surface.
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

if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = function() {
        return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
    };
}

if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = function() {
        return [];
    };
}

if (!document.elementFromPoint) {
    document.elementFromPoint = function() {
        return document.body;
    };
}

const SHA_START = 'a1'.repeat(20);
const SHA_END = 'b2'.repeat(20);

/**
 * Builds a minimal commit row matching the real GitLab markup, close enough
 * for extractCommitShaFromElement / badge insertion to behave like on the real page.
 */
function buildCommitRow(sha, message) {
    const li = document.createElement('li');
    li.className = 'commit flex-row js-toggle-container';

    const detail = document.createElement('div');
    detail.className = 'commit-detail';

    const content = document.createElement('div');
    content.className = 'commit-content';
    content.innerHTML = `<a class="commit-row-message" href="/group/project/-/commit/${sha}">${message}</a>`;
    detail.appendChild(content);

    const actions = document.createElement('div');
    actions.className = 'commit-actions flex-row';

    const shaGroup = document.createElement('div');
    shaGroup.className = 'commit-sha-group btn-group';
    const copyBtn = document.createElement('button');
    copyBtn.setAttribute('data-clipboard-text', sha);
    shaGroup.appendChild(copyBtn);
    actions.appendChild(shaGroup);

    detail.appendChild(actions);
    li.appendChild(detail);

    return li;
}

/**
 * Rebuilds a page matching the branch history page: a native toolbar
 * (with one existing control) and the commits list.
 */
function buildPage() {
    document.body.innerHTML = '';

    const treeControls = document.createElement('div');
    treeControls.className = 'tree-controls';
    const existingControl = document.createElement('div');
    existingControl.className = 'control';
    existingControl.innerHTML = '<a class="gl-button btn btn-md btn-default">Afficher la requête de fusion ouverte</a>';
    treeControls.appendChild(existingControl);

    const commitsList = document.createElement('ol');
    commitsList.id = 'commits-list';

    document.body.appendChild(treeControls);
    document.body.appendChild(commitsList);

    return { treeControls, commitsList };
}

function click(el) {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event;
}

function flushAsync() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

afterEach(() => {
    resetCompareSelection();
    setProjectContext(null, null);
    fetchAllFilesWithPagination.mockReset();
});

// ─── Toggle button ────────────────────────────────────────────────────────────

describe('initCompareSelection — toggle button', () => {
    test('inserts the toggle button as the first control in .tree-controls', () => {
        const { treeControls } = buildPage();
        initCompareSelection();

        expect(treeControls.children.length).toBe(2);
        const firstControl = treeControls.firstElementChild;
        const toggleBtn = firstControl.querySelector(`.${cssClasses.compareToggleBtn}`);
        expect(toggleBtn).not.toBeNull();
        expect(toggleBtn.textContent.trim()).toBe('Comparer entre deux commits');
    });

    test('uses the native GitLab button classes so its height matches its siblings', () => {
        const { treeControls } = buildPage();
        initCompareSelection();

        const toggleBtn = treeControls.querySelector(`.${cssClasses.compareToggleBtn}`);
        expect(toggleBtn.classList.contains('gl-button')).toBe(true);
        expect(toggleBtn.classList.contains('btn')).toBe(true);
        expect(toggleBtn.classList.contains('btn-md')).toBe(true);
        expect(toggleBtn.classList.contains('btn-default')).toBe(true);
    });

    test('does not render an icon', () => {
        const { treeControls } = buildPage();
        initCompareSelection();

        const toggleBtn = treeControls.querySelector(`.${cssClasses.compareToggleBtn}`);
        expect(toggleBtn.querySelector('svg')).toBeNull();
    });

    test('does not insert a second button when called again', () => {
        const { treeControls } = buildPage();
        initCompareSelection();
        initCompareSelection();

        expect(treeControls.querySelectorAll(`.${cssClasses.compareToggleBtn}`).length).toBe(1);
    });

    test('activates compare mode on click', () => {
        const { treeControls } = buildPage();
        initCompareSelection();
        const toggleBtn = treeControls.querySelector(`.${cssClasses.compareToggleBtn}`);

        click(toggleBtn);

        expect(document.body.classList.contains(cssClasses.compareModeActive)).toBe(true);
        expect(toggleBtn.classList.contains(cssClasses.viewModeActive)).toBe(true);
    });

    test('deactivates compare mode and clears an in-progress selection on second click', () => {
        const { treeControls, commitsList } = buildPage();
        const row = buildCommitRow(SHA_START, 'commit one');
        commitsList.appendChild(row);

        initCompareSelection();
        const toggleBtn = treeControls.querySelector(`.${cssClasses.compareToggleBtn}`);
        click(toggleBtn);
        click(row.querySelector('.commit-content'));

        expect(row.classList.contains(cssClasses.compareSelectedStart)).toBe(true);

        click(toggleBtn);

        expect(document.body.classList.contains(cssClasses.compareModeActive)).toBe(false);
        expect(toggleBtn.classList.contains(cssClasses.viewModeActive)).toBe(false);
        expect(row.classList.contains(cssClasses.compareSelectedStart)).toBe(false);
        expect(row.querySelector('.ct-compare-badge')).toBeNull();
    });

    test('removes an existing comparison result when clicked', () => {
        const { treeControls, commitsList } = buildPage();
        const existingResult = document.createElement('div');
        existingResult.className = `ct-wrapper ${cssClasses.compareTopWrapper}`;
        commitsList.parentNode.insertBefore(existingResult, commitsList);

        initCompareSelection();
        const toggleBtn = treeControls.querySelector(`.${cssClasses.compareToggleBtn}`);
        click(toggleBtn);

        expect(document.querySelector(`.${cssClasses.compareTopWrapper}`)).toBeNull();
    });
});

// ─── Row selection ────────────────────────────────────────────────────────────

describe('row selection while compare mode is active', () => {
    let treeControls;
    let commitsList;
    let rowStart;
    let rowEnd;

    beforeEach(() => {
        ({ treeControls, commitsList } = buildPage());
        rowStart = buildCommitRow(SHA_START, 'first commit');
        rowEnd = buildCommitRow(SHA_END, 'second commit');
        commitsList.appendChild(rowStart);
        commitsList.appendChild(rowEnd);
        initCompareSelection();
    });

    function activateCompareMode() {
        click(treeControls.querySelector(`.${cssClasses.compareToggleBtn}`));
    }

    test('clicking a row does nothing when compare mode is inactive', () => {
        click(rowStart.querySelector('.commit-content'));

        expect(rowStart.classList.contains(cssClasses.compareSelectedStart)).toBe(false);
        expect(fetchAllFilesWithPagination).not.toHaveBeenCalled();
    });

    test('first click marks the row as the start selection with a "Début" badge', () => {
        activateCompareMode();
        click(rowStart.querySelector('.commit-content'));

        expect(rowStart.classList.contains(cssClasses.compareSelectedStart)).toBe(true);
        const badge = rowStart.querySelector('.ct-compare-badge-start');
        expect(badge).not.toBeNull();
        expect(badge.textContent).toBe('Début');
    });

    test('clicking the same row again clears the start selection', () => {
        activateCompareMode();
        click(rowStart.querySelector('.commit-content'));
        click(rowStart.querySelector('.commit-content'));

        expect(rowStart.classList.contains(cssClasses.compareSelectedStart)).toBe(false);
        expect(rowStart.querySelector('.ct-compare-badge')).toBeNull();
    });

    test('prevents default and selects when clicking directly on the commit message link', () => {
        activateCompareMode();
        const link = rowStart.querySelector('a.commit-row-message');

        const event = click(link);

        expect(event.defaultPrevented).toBe(true);
        expect(rowStart.classList.contains(cssClasses.compareSelectedStart)).toBe(true);
    });

    test('clicking anywhere in the row selects it, not just the message', () => {
        activateCompareMode();
        click(rowStart.querySelector('.commit-actions'));

        expect(rowStart.classList.contains(cssClasses.compareSelectedStart)).toBe(true);
    });

    describe('second selection', () => {
        beforeEach(() => {
            fetchAllFilesWithPagination.mockResolvedValue([
                {
                    new_path: 'src/app.js',
                    old_path: 'src/app.js',
                    new_file: false,
                    deleted_file: false,
                    renamed_file: false,
                    diff: '@@ -1,1 +1,2 @@\n+added line\n line'
                }
            ]);
        });

        test('marks the second row as "Fin" and fetches the diff between the two SHAs', async () => {
            activateCompareMode();
            click(rowStart.querySelector('.commit-content'));
            click(rowEnd.querySelector('.commit-content'));
            await flushAsync();

            expect(fetchAllFilesWithPagination).toHaveBeenCalledTimes(1);
            expect(fetchAllFilesWithPagination).toHaveBeenCalledWith(
                expect.objectContaining({
                    isComparePage: true,
                    isCommitPage: false,
                    isBranchHistoryPage: false,
                    targetBranch: SHA_START,
                    sourceBranch: SHA_END
                }),
                expect.any(Function)
            );
        });

        test('sets the compare project context before fetching', async () => {
            activateCompareMode();
            click(rowStart.querySelector('.commit-content'));
            click(rowEnd.querySelector('.commit-content'));
            await flushAsync();

            expect(getProjectInfo().isComparePage).toBe(true);
            expect(getProjectInfo().targetBranch).toBe(SHA_START);
            expect(getProjectInfo().sourceBranch).toBe(SHA_END);
        });

        test('inserts the result wrapper directly above the commits list', async () => {
            activateCompareMode();
            click(rowStart.querySelector('.commit-content'));
            click(rowEnd.querySelector('.commit-content'));
            await flushAsync();

            const wrapper = commitsList.previousElementSibling;
            expect(wrapper).not.toBeNull();
            expect(wrapper.classList.contains(cssClasses.compareTopWrapper)).toBe(true);
            expect(wrapper.textContent).toContain(SHA_START.substring(0, 8));
            expect(wrapper.textContent).toContain(SHA_END.substring(0, 8));
        });

        test('clears both row highlights and badges once the result is built', async () => {
            activateCompareMode();
            click(rowStart.querySelector('.commit-content'));
            click(rowEnd.querySelector('.commit-content'));
            await flushAsync();

            expect(rowStart.classList.contains(cssClasses.compareSelectedStart)).toBe(false);
            expect(rowEnd.classList.contains(cssClasses.compareSelectedEnd)).toBe(false);
            expect(document.querySelector('.ct-compare-badge')).toBeNull();
        });

        test('replaces a previous comparison result on a new pair', async () => {
            activateCompareMode();
            click(rowStart.querySelector('.commit-content'));
            click(rowEnd.querySelector('.commit-content'));
            await flushAsync();

            expect(document.querySelectorAll(`.${cssClasses.compareTopWrapper}`).length).toBe(1);

            click(rowStart.querySelector('.commit-content'));
            click(rowEnd.querySelector('.commit-content'));
            await flushAsync();

            expect(document.querySelectorAll(`.${cssClasses.compareTopWrapper}`).length).toBe(1);
        });
    });

    test('shows an error message when the API call fails', async () => {
        fetchAllFilesWithPagination.mockRejectedValue(new Error('Network error'));

        activateCompareMode();
        click(rowStart.querySelector('.commit-content'));
        click(rowEnd.querySelector('.commit-content'));
        await flushAsync();

        const wrapper = commitsList.previousElementSibling;
        expect(wrapper.textContent).toContain('Erreur');
        expect(wrapper.textContent).toContain('Network error');
    });

    test('shows a message when the diff has no files', async () => {
        fetchAllFilesWithPagination.mockResolvedValue([]);

        activateCompareMode();
        click(rowStart.querySelector('.commit-content'));
        click(rowEnd.querySelector('.commit-content'));
        await flushAsync();

        const wrapper = commitsList.previousElementSibling;
        expect(wrapper.textContent).toContain('Aucun fichier trouvé pour cette comparaison.');
    });

    test('Escape resets an in-progress selection', () => {
        activateCompareMode();
        click(rowStart.querySelector('.commit-content'));
        expect(rowStart.classList.contains(cssClasses.compareSelectedStart)).toBe(true);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(document.body.classList.contains(cssClasses.compareModeActive)).toBe(false);
        expect(rowStart.classList.contains(cssClasses.compareSelectedStart)).toBe(false);
        expect(rowStart.querySelector('.ct-compare-badge')).toBeNull();
    });

    test('Escape removes focus from the toggle button', () => {
        const toggleBtn = treeControls.querySelector(`.${cssClasses.compareToggleBtn}`);
        activateCompareMode();
        toggleBtn.focus();
        expect(document.activeElement).toBe(toggleBtn);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(document.activeElement).not.toBe(toggleBtn);
    });

    test('Escape does nothing when compare mode is already inactive', () => {
        expect(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        }).not.toThrow();
    });
});

// ─── resetCompareSelection (exported) ────────────────────────────────────────

describe('resetCompareSelection', () => {
    test('turns off compare mode, clears the toggle button state and row highlights', () => {
        const { treeControls, commitsList } = buildPage();
        const row = buildCommitRow(SHA_START, 'commit one');
        commitsList.appendChild(row);

        initCompareSelection();
        const toggleBtn = treeControls.querySelector(`.${cssClasses.compareToggleBtn}`);
        click(toggleBtn);
        click(row.querySelector('.commit-content'));

        resetCompareSelection();

        expect(document.body.classList.contains(cssClasses.compareModeActive)).toBe(false);
        expect(toggleBtn.classList.contains(cssClasses.viewModeActive)).toBe(false);
        expect(row.classList.contains(cssClasses.compareSelectedStart)).toBe(false);
        expect(row.querySelector('.ct-compare-badge')).toBeNull();
    });

    test('can be called safely before initCompareSelection has ever run', () => {
        document.body.innerHTML = '';
        expect(() => resetCompareSelection()).not.toThrow();
    });
});
