import { setProjectContext, getProjectInfo, getCommitSha } from '../src/core/context.js';

afterEach(() => {
    // Reset module state between tests
    setProjectContext(null, null);
});

describe('getProjectInfo / getCommitSha — initial state', () => {
    test('getProjectInfo returns null before any call', () => {
        expect(getProjectInfo()).toBeNull();
    });

    test('getCommitSha returns null before any call', () => {
        expect(getCommitSha()).toBeNull();
    });
});

describe('setProjectContext', () => {
    test('stores projectInfo and makes it accessible via getProjectInfo', () => {
        const info = { projectPath: 'group/project', isComparePage: false };
        setProjectContext(info);
        expect(getProjectInfo()).toBe(info);
    });

    test('stores commitSha and makes it accessible via getCommitSha', () => {
        setProjectContext({ projectPath: 'group/project' }, 'abc123def456');
        expect(getCommitSha()).toBe('abc123def456');
    });

    test('commitSha defaults to null when not provided', () => {
        setProjectContext({ projectPath: 'group/project' });
        expect(getCommitSha()).toBeNull();
    });

    test('overwrites previously stored values', () => {
        setProjectContext({ projectPath: 'old' }, 'old-sha');
        setProjectContext({ projectPath: 'new' }, 'new-sha');

        expect(getProjectInfo().projectPath).toBe('new');
        expect(getCommitSha()).toBe('new-sha');
    });

    test('setProjectContext(null, null) resets both values', () => {
        setProjectContext({ projectPath: 'group/project' }, 'abc123');
        setProjectContext(null, null);

        expect(getProjectInfo()).toBeNull();
        expect(getCommitSha()).toBeNull();
    });

    test('stores any object shape without coercion', () => {
        const info = {
            projectPath: 'ns/repo',
            sourceBranch: 'feature',
            targetBranch: 'main',
            commitSha: 'deadbeef',
            isComparePage: true,
        };
        setProjectContext(info, 'deadbeef');

        expect(getProjectInfo()).toStrictEqual(info);
        expect(getCommitSha()).toBe('deadbeef');
    });

    test('getProjectInfo returns the same object reference (no copy)', () => {
        const info = { projectPath: 'ns/repo' };
        setProjectContext(info);
        expect(getProjectInfo()).toBe(info); // strict reference equality
    });
});
