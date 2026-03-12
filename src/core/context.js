/**
 * Shared Project Context
 * @fileoverview Centralise l'état du projet courant (projectInfo, commitSha)
 * accessible depuis tree/renderer.js et preview/file-renderer.js.
 */

/** @type {Object|null} */
let _currentProjectInfo = null;

/** @type {string|null} */
let _currentCommitSha = null;

/**
 * Returns the current project info.
 * @returns {Object|null}
 */
export function getProjectInfo() {
    return _currentProjectInfo;
}

/**
 * Returns the current commit SHA.
 * @returns {string|null}
 */
export function getCommitSha() {
    return _currentCommitSha;
}

/**
 * Sets the project context for API calls.
 * @param {Object} projectInfo - Project information
 * @param {string|null} commitSha - Specific commit SHA
 */
export function setProjectContext(projectInfo, commitSha = null) {
    _currentProjectInfo = projectInfo;
    _currentCommitSha = commitSha;
}
