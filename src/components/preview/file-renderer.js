/**
 * File Content Renderer
 * @fileoverview Renders the full content of a file in the preview panel:
 * text (with syntax highlighting), images, PDFs, and binary placeholders.
 * Extracted from tree/renderer.js for separation of concerns, consistent
 * with the existing diff-renderer.js.
 */

import { cssClasses, getFileIcon } from '../../config/constants.js';
import { createElement, safeSetHTML } from '../../utils/dom.js';
import { isImageFile, isPdfFile, isBinaryFile, getMimeType } from '../../utils/helpers.js';
import { highlightCode } from '../../core/highlight.js';
import { fetchFileContent } from '../../api/client.js';
import { getProjectInfo, getCommitSha } from '../../core/context.js';
import { createLoadingIndicator } from '../common/container.js';

/** @type {Map<string, string>} Cache for full file contents (text and base64) */
export const fullFileCache = new Map();

/** @type {string|null} Active PDF blob URL to revoke on next preview change */
let currentPdfBlobUrl = null;

/**
 * Revokes the current PDF blob URL if any, to free memory.
 */
export function revokePdfBlobUrl() {
    if (currentPdfBlobUrl) {
        URL.revokeObjectURL(currentPdfBlobUrl);
        currentPdfBlobUrl = null;
    }
}

/**
 * Converts a base64 string to a Blob object URL.
 * More reliable than data URIs in browser extensions (especially Firefox).
 * @param {string} base64 - Base64-encoded content
 * @param {string} mimeType - MIME type of the content
 * @returns {string} Object URL — must be revoked when no longer needed
 */
function base64ToBlobUrl(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
}

/**
 * Renders the full file content (without diff) into a container.
 * Dispatches to the appropriate renderer based on file type.
 * @param {HTMLElement} container - Target container element
 * @param {Object} fileNode - File node from the tree
 * @param {string|null} [refOverride=null] - Git ref to use (overrides fileNode.ref)
 */
export async function renderFullFileContent(container, fileNode, refOverride = null) {
    const currentProjectInfo = getProjectInfo();
    const currentCommitSha = getCommitSha();

    if (!currentProjectInfo) {
        container.appendChild(createElement('div', { className: 'ct-diff-empty' }, 'Contexte du projet non disponible.'));
        return;
    }

    const ref = refOverride || fileNode.ref || currentCommitSha || currentProjectInfo.commitSha || currentProjectInfo.sourceBranch || currentProjectInfo.branchName || 'main';
    const filename = fileNode.name;
    const fileExt = filename.split('.').pop()?.toLowerCase() || '';

    if (isImageFile(fileExt)) {
        await renderImageContent(container, fileNode, ref, fileExt);
        return;
    }

    if (isPdfFile(fileExt)) {
        await renderPdfContent(container, fileNode, ref);
        return;
    }

    if (isBinaryFile(fileExt)) {
        renderBinaryContent(container, fileNode);
        return;
    }

    const cacheKey = `${currentProjectInfo.projectPath}:${fileNode.path}@${ref}`;
    let fileContent = fullFileCache.get(cacheKey);

    if (!fileContent) {
        const loading = createLoadingIndicator('Chargement du fichier...');
        container.appendChild(loading);

        try {
            const fileData = await fetchFileContent(currentProjectInfo, fileNode.path, ref);
            fileContent = fileData.content;
            fullFileCache.set(cacheKey, fileContent);
            loading.remove();
        } catch (error) {
            loading.remove();
            const errorDiv = createElement('div', { className: 'ct-diff-empty ct-diff-error' });
            errorDiv.textContent = `Erreur lors du chargement du fichier: ${error.message}`;
            container.appendChild(errorDiv);
            return;
        }
    }

    const lines = fileContent.split('\n');
    const table = createElement('div', { className: cssClasses.fullFileContainer });

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const lineRow = createElement('div', { className: cssClasses.fullFileLine });
        const lineNumCell = createElement('span', { className: cssClasses.fullFileLineNum }, lineNum.toString());
        const contentCell = createElement('span', { className: 'ct-line-content' });

        if (line === '') {
            contentCell.textContent = '\u00A0';
        } else {
            safeSetHTML(contentCell, highlightCode(line, fileExt, filename));
        }

        lineRow.appendChild(lineNumCell);
        lineRow.appendChild(contentCell);
        table.appendChild(lineRow);
    });

    container.appendChild(table);
}

/**
 * Renders an image file in the preview panel.
 * @param {HTMLElement} container
 * @param {Object} fileNode
 * @param {string} ref
 * @param {string} fileExt
 */
async function renderImageContent(container, fileNode, ref, fileExt) {
    const currentProjectInfo = getProjectInfo();
    const cacheKey = `img:${currentProjectInfo.projectPath}:${fileNode.path}@${ref}`;
    let base64 = fullFileCache.get(cacheKey);

    if (!base64) {
        const loading = createLoadingIndicator('Chargement de l\'image...');
        container.appendChild(loading);

        try {
            const fileData = await fetchFileContent(currentProjectInfo, fileNode.path, ref, true);
            base64 = fileData.content;
            fullFileCache.set(cacheKey, base64);
            loading.remove();
        } catch (error) {
            loading.remove();
            const errorDiv = createElement('div', { className: 'ct-diff-empty ct-diff-error' });
            errorDiv.textContent = `Erreur lors du chargement de l'image: ${error.message}`;
            container.appendChild(errorDiv);
            return;
        }
    }

    const mimeType = getMimeType(fileExt);
    const wrapper = createElement('div', { className: 'ct-preview-image-wrapper' });
    const img = createElement('img', {
        className: 'ct-preview-image',
        src: `data:${mimeType};base64,${base64}`,
        alt: fileNode.name
    });
    wrapper.appendChild(img);
    container.appendChild(wrapper);
}

/**
 * Renders a PDF file in the preview panel.
 * @param {HTMLElement} container
 * @param {Object} fileNode
 * @param {string} ref
 */
async function renderPdfContent(container, fileNode, ref) {
    const currentProjectInfo = getProjectInfo();
    const cacheKey = `pdf:${currentProjectInfo.projectPath}:${fileNode.path}@${ref}`;
    let base64 = fullFileCache.get(cacheKey);

    if (!base64) {
        const loading = createLoadingIndicator('Chargement du PDF...');
        container.appendChild(loading);

        try {
            const fileData = await fetchFileContent(currentProjectInfo, fileNode.path, ref, true);
            base64 = fileData.content;
            fullFileCache.set(cacheKey, base64);
            loading.remove();
        } catch (error) {
            loading.remove();
            const errorDiv = createElement('div', { className: 'ct-diff-empty ct-diff-error' });
            errorDiv.textContent = `Erreur lors du chargement du PDF: ${error.message}`;
            container.appendChild(errorDiv);
            return;
        }
    }

    const blobUrl = base64ToBlobUrl(base64, 'application/pdf');
    currentPdfBlobUrl = blobUrl;

    const wrapper = createElement('div', { className: 'ct-preview-pdf-wrapper' });
    const embed = createElement('embed', {
        className: 'ct-preview-pdf',
        src: blobUrl,
        type: 'application/pdf'
    });
    wrapper.appendChild(embed);
    container.appendChild(wrapper);
}

/**
 * Renders a placeholder for non-previewable binary files.
 * @param {HTMLElement} container
 * @param {Object} fileNode
 */
function renderBinaryContent(container, fileNode) {
    const div = createElement('div', { className: 'ct-diff-empty' });

    const iconData = getFileIcon(fileNode.name);
    const icon = createElement('span', { className: 'ct-preview-icon' });
    if (iconData.type === 'svg') {
        safeSetHTML(icon, iconData.value);
    } else {
        icon.className += ' ' + iconData.value;
    }

    const text = createElement('span', { className: 'ct-preview-text' }, 'Fichier binaire — prévisualisation non disponible');
    const size = fileNode.size
        ? createElement('span', { className: 'ct-preview-text' }, `${(fileNode.size / 1024).toFixed(1)} Ko`)
        : null;
    div.appendChild(icon);
    div.appendChild(text);
    if (size) div.appendChild(size);
    container.appendChild(div);
}
