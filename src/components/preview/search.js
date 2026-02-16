/**
 * Preview Search Component
 * @fileoverview Logic for searching within the preview panel using Highlight API
 */

import { icons, cssClasses } from '../../config/constants.js';
import { createElement } from '../../utils/dom.js';
import { debounce } from '../../utils/helpers.js';

/**
 * Sets up preview panel search functionality with CSS Custom Highlight API
 * @param {HTMLElement} previewPanel - Preview panel element
 */
export function setupPreviewSearch(previewPanel) {
    if (!previewPanel || previewPanel._searchSetup) return;
    previewPanel._searchSetup = true;

    const supportsHighlight = 'highlights' in CSS;

    const searchBar = createElement('div', { className: cssClasses.previewSearchBar });
    searchBar.style.display = 'none';

    const searchContainer = createElement('div', { className: cssClasses.previewSearch });

    const searchInputWrapper = createElement('div', { className: 'ct-preview-search-input-wrapper' });
    const searchInput = createElement('input', {
        className: cssClasses.previewSearchInput,
        type: 'text',
        placeholder: 'Rechercher dans le fichier...'
    });
    searchInputWrapper.appendChild(searchInput);

    const counter = createElement('span', { className: cssClasses.previewSearchCounter }, '0/0');

    const btnPrev = createElement('button', {
        className: `${cssClasses.button} ${cssClasses.previewSearchBtnPrev}`,
        title: 'Précédent (Shift+Enter)',
        'aria-label': 'Précédent'
    }, icons.chevronUp);

    const btnNext = createElement('button', {
        className: `${cssClasses.button} ${cssClasses.previewSearchBtnNext}`,
        title: 'Suivant (Enter)',
        'aria-label': 'Suivant'
    }, icons.chevronDown);

    const btnClose = createElement('button', {
        className: `${cssClasses.button} ${cssClasses.previewSearchBtnClose}`,
        title: 'Fermer (Esc)',
        'aria-label': 'Fermer'
    }, icons.close);

    searchContainer.appendChild(searchInputWrapper);
    searchContainer.appendChild(counter);
    searchContainer.appendChild(btnPrev);
    searchContainer.appendChild(btnNext);
    searchContainer.appendChild(btnClose);
    searchBar.appendChild(searchContainer);

    previewPanel.insertBefore(searchBar, previewPanel.firstChild);

    let currentMatches = [];
    let currentIndex = -1;
    let highlightAll = null;
    let highlightActive = null;

    if (supportsHighlight) {
        highlightAll = new Highlight();
        highlightActive = new Highlight();
        CSS.highlights.set('preview-search-all', highlightAll);
        CSS.highlights.set('preview-search-active', highlightActive);
    }

    const performSearch = () => {
        const query = searchInput.value.trim();
        currentMatches = [];
        currentIndex = -1;

        if (supportsHighlight) {
            highlightAll.clear();
            highlightActive.clear();
        }

        if (!query) {
            counter.textContent = '0/0';
            return;
        }

        const contentCells = previewPanel.querySelectorAll('.ct-line-content');
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

        for (const cell of contentCells) {
            const textContent = cell.textContent;
            if (!textContent) continue;

            regex.lastIndex = 0;
            let match;

            while ((match = regex.exec(textContent)) !== null) {
                const range = new Range();
                const textNode = findTextNode(cell, match.index);

                if (textNode) {
                    range.setStart(textNode.node, textNode.offset);
                    range.setEnd(textNode.node, textNode.offset + match[0].length);
                    currentMatches.push({ range, element: cell });

                    if (supportsHighlight) {
                        highlightAll.add(range);
                    }
                }
            }
        }

        counter.textContent = currentMatches.length > 0
            ? `1/${currentMatches.length}`
            : '0/0';

        if (currentMatches.length > 0) {
            currentIndex = 0;
            scrollToMatch(0);
        }
    };

    const findTextNode = (element, targetIndex) => {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let currentIndex = 0;
        let node;

        while ((node = walker.nextNode())) {
            const text = node.textContent;
            if (currentIndex + text.length > targetIndex) {
                return { node, offset: targetIndex - currentIndex };
            }
            currentIndex += text.length;
        }

        return null;
    };

    const scrollToMatch = (index) => {
        if (index < 0 || index >= currentMatches.length) return;

        currentIndex = index;
        counter.textContent = `${index + 1}/${currentMatches.length}`;

        const match = currentMatches[index];

        if (supportsHighlight) {
            highlightActive.clear();
            highlightActive.add(match.range);
        }

        const previewContent = previewPanel.querySelector('.ct-preview-content');
        if (match.element && previewContent) {
            const elementRect = match.element.getBoundingClientRect();
            const containerRect = previewContent.getBoundingClientRect();
            const relativeTop = elementRect.top - containerRect.top + previewContent.scrollTop;
            const centerPosition = relativeTop - (previewContent.clientHeight / 2);

            previewContent.scrollTo({
                top: Math.max(0, centerPosition),
                behavior: 'smooth'
            });
        }
    };

    const nextMatch = () => {
        if (currentMatches.length === 0) return;
        const nextIndex = (currentIndex + 1) % currentMatches.length;
        scrollToMatch(nextIndex);
    };

    const prevMatch = () => {
        if (currentMatches.length === 0) return;
        const prevIndex = currentIndex - 1 < 0 ? currentMatches.length - 1 : currentIndex - 1;
        scrollToMatch(prevIndex);
    };

    const toggleSearchBar = (show) => {
        searchBar.style.display = show ? 'block' : 'none';
        if (show) {
            searchInput.focus();
            searchInput.select();
            if (searchInput.value.trim()) {
                performSearch();
            }
        } else {
            if (supportsHighlight) {
                highlightAll.clear();
                highlightActive.clear();
            }
            currentMatches = [];
            currentIndex = -1;
            counter.textContent = '0/0';
            searchInput.value = '';
        }
    };

    searchInput.addEventListener('input', debounce(performSearch, 100));

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                prevMatch();
            } else {
                nextMatch();
            }
        }
    });

    btnNext.onclick = nextMatch;
    btnPrev.onclick = prevMatch;
    btnClose.onclick = () => toggleSearchBar(false);

    const abortController = new AbortController();
    const container = previewPanel.closest('.ct-container');

    const handleKeydown = (e) => {
        const activeContainer = getActiveContainer(container);
        const hasContent = previewPanel.querySelector('.ct-preview-header');

        if (activeContainer === container) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'f' && hasContent) {
                e.preventDefault();
                e.stopPropagation();
                toggleSearchBar(true);
            }

            if (e.key === 'Escape' && searchBar.style.display === 'block') {
                e.preventDefault();
                toggleSearchBar(false);
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'a' && hasContent) {
                if (selectCurrentDiffBlock()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }
    };

    document.addEventListener('keydown', handleKeydown, { signal: abortController.signal });

    previewPanel._toggleSearch = toggleSearchBar;
    previewPanel._cleanupSearch = () => abortController.abort();
}

/**
 * Récupère le container GitLab Commit Tree actif basé sur la sélection ou la position
 * @param {HTMLElement} fallbackContainer - Container de secours
 * @returns {HTMLElement|null} Le container actif ou null
 */
function getActiveContainer(fallbackContainer) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const selectedNode = selection.getRangeAt(0).startContainer;
        const element = selectedNode.nodeType === Node.ELEMENT_NODE ? selectedNode : selectedNode.parentElement;
        const container = element?.closest(`.${cssClasses.container}`);
        if (container) return container;
    }
    
    const elementAtCenter = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    const centerContainer = elementAtCenter?.closest(`.${cssClasses.container}`);
    return centerContainer || fallbackContainer;
}

/**
 * Sélectionne le bloc de diff contenant le curseur ou tout le fichier lors d'un Cmd+A / Ctrl+A
 * @returns {boolean} True si une sélection a été effectuée
 */
function selectCurrentDiffBlock() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;
    
    const currentElement = selection.getRangeAt(0).startContainer;
    const element = currentElement.nodeType === Node.ELEMENT_NODE ? currentElement : currentElement.parentElement;
    
    const diffLine = element.closest('.ct-diff-line');
    if (diffLine) {
        let start = diffLine;
        while (start.previousElementSibling && 
               !start.previousElementSibling.classList.contains('ct-diff-separator')) {
            start = start.previousElementSibling;
        }
        
        let end = diffLine;
        while (end.nextElementSibling && 
               !end.nextElementSibling.classList.contains('ct-diff-separator')) {
            end = end.nextElementSibling;
        }
        
        const range = document.createRange();
        range.setStartBefore(start);
        range.setEndAfter(end);
        
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
    }

    const fullFileContainer = element.closest(`.${cssClasses.fullFileContainer}`);
    if (fullFileContainer) {
        const range = document.createRange();
        range.selectNodeContents(fullFileContainer);
        
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
    }

    return false;
}
