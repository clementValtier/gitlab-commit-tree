import { createElement, safeSetHTML, waitForElement } from '../src/utils/dom.js';

// ─── safeSetHTML ──────────────────────────────────────────────────────────────

describe('safeSetHTML', () => {
    test('sets HTML content of an element', () => {
        const div = document.createElement('div');
        safeSetHTML(div, '<span class="foo">hello</span>');

        const span = div.querySelector('.foo');
        expect(span).not.toBeNull();
        expect(span.textContent).toBe('hello');
    });

    test('replaces all previous children', () => {
        const div = document.createElement('div');
        div.innerHTML = '<p>old</p><p>also old</p>';

        safeSetHTML(div, '<span>new</span>');

        expect(div.querySelectorAll('p').length).toBe(0);
        expect(div.querySelectorAll('span').length).toBe(1);
        expect(div.textContent).toBe('new');
    });

    test('handles plain text (no tags)', () => {
        const div = document.createElement('div');
        safeSetHTML(div, 'just some text');

        expect(div.textContent).toBe('just some text');
        expect(div.children.length).toBe(0);
    });

    test('handles empty string — clears all children', () => {
        const div = document.createElement('div');
        div.innerHTML = '<span>old</span>';

        safeSetHTML(div, '');
        expect(div.childNodes.length).toBe(0);
    });

    test('handles multiple sibling elements', () => {
        const div = document.createElement('div');
        safeSetHTML(div, '<em>a</em><strong>b</strong>');

        expect(div.children.length).toBe(2);
        expect(div.children[0].tagName.toLowerCase()).toBe('em');
        expect(div.children[1].tagName.toLowerCase()).toBe('strong');
    });

    test('preserves SVG elements', () => {
        const div = document.createElement('div');
        safeSetHTML(div, '<svg viewBox="0 0 16 16"><path d="M0 0"/></svg>');

        const svg = div.querySelector('svg');
        expect(svg).not.toBeNull();
        expect(svg.querySelector('path')).not.toBeNull();
    });
});

// ─── createElement ────────────────────────────────────────────────────────────

describe('createElement', () => {
    test('creates element with the specified tag', () => {
        const el = createElement('section');
        expect(el.tagName.toLowerCase()).toBe('section');
    });

    test('sets className', () => {
        const el = createElement('div', { className: 'foo bar' });
        expect(el.className).toBe('foo bar');
    });

    test('sets dataset attributes', () => {
        const el = createElement('div', { dataset: { path: 'src/app.js', index: '3' } });
        expect(el.dataset.path).toBe('src/app.js');
        expect(el.dataset.index).toBe('3');
    });

    test('sets style from an object', () => {
        const el = createElement('div', { style: { display: 'none', color: 'red' } });
        expect(el.style.display).toBe('none');
        expect(el.style.color).toBe('red');
    });

    test('sets arbitrary HTML attributes', () => {
        const el = createElement('a', { href: 'https://example.com', target: '_blank' });
        expect(el.getAttribute('href')).toBe('https://example.com');
        expect(el.getAttribute('target')).toBe('_blank');
    });

    test('attaches event listeners via on* attributes', () => {
        const fn = jest.fn();
        const el = createElement('button', { onclick: fn });
        el.click();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('sets text content as child string', () => {
        const el = createElement('span', {}, 'hello world');
        expect(el.textContent).toBe('hello world');
    });

    test('renders HTML in child string via safeSetHTML', () => {
        const el = createElement('div', {}, '<em>italic</em>');
        expect(el.querySelector('em')).not.toBeNull();
    });

    test('appends a single child element', () => {
        const child = document.createElement('em');
        const el = createElement('div', {}, child);
        expect(el.firstChild).toBe(child);
    });

    test('appends an array of child elements', () => {
        const c1 = document.createElement('span');
        const c2 = document.createElement('em');
        const el = createElement('div', {}, [c1, c2]);
        expect(el.children.length).toBe(2);
        expect(el.children[0]).toBe(c1);
        expect(el.children[1]).toBe(c2);
    });

    test('ignores falsy values in children array', () => {
        const c1 = document.createElement('span');
        const el = createElement('div', {}, [c1, null, undefined, false]);
        expect(el.children.length).toBe(1);
    });

    test('works without attributes or children', () => {
        const el = createElement('div');
        expect(el.tagName.toLowerCase()).toBe('div');
        expect(el.childNodes.length).toBe(0);
    });
});

// ─── waitForElement ───────────────────────────────────────────────────────────

describe('waitForElement', () => {
    afterEach(() => {
        // Clean up any elements added during tests
        document.querySelectorAll('.wfe-test').forEach(el => el.remove());
    });

    test('resolves immediately when element already exists', async () => {
        const div = document.createElement('div');
        div.className = 'wfe-test wfe-already-there';
        document.body.appendChild(div);

        await expect(waitForElement('.wfe-already-there')).resolves.toBe(div);
    });

    test('resolves when element is added to the DOM after the call', async () => {
        const promise = waitForElement('.wfe-test.wfe-added-later');

        // Add the element asynchronously
        setTimeout(() => {
            const div = document.createElement('div');
            div.className = 'wfe-test wfe-added-later';
            document.body.appendChild(div);
        }, 20);

        const el = await promise;
        expect(el).not.toBeNull();
        expect(el.classList.contains('wfe-added-later')).toBe(true);
    });

    test('rejects with a descriptive error when element never appears', async () => {
        await expect(
            waitForElement('.wfe-never-appears', 50)
        ).rejects.toThrow('.wfe-never-appears');
    });
});
