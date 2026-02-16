import { processFilesFromApiResponse, buildFileTree } from '../src/api/transformer.js';

describe('processFilesFromApiResponse', () => {
    test('should return empty array for null input', () => {
        expect(processFilesFromApiResponse(null)).toEqual([]);
    });

    test('should process commit diff data correctly', () => {
        const diffData = [
            {
                new_path: 'src/app.js',
                old_path: 'src/app.js',
                new_file: false,
                deleted_file: false,
                renamed_file: false,
                diff: `@@ -1,1 +1,2 @@
+added line
 line`
            },
            {
                new_path: 'new-file.txt',
                old_path: 'new-file.txt',
                new_file: true,
                deleted_file: false,
                renamed_file: false,
                diff: `@@ -0,0 +1,1 @@
+content`
            }
        ];

        const result = processFilesFromApiResponse(diffData, false);

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
            path: 'src/app.js',
            status: 'modified',
            has_diff_content: true
        });
        expect(result[1]).toMatchObject({
            path: 'new-file.txt',
            status: 'added',
            has_diff_content: true
        });
    });

    test('should process compare diff data correctly', () => {
        const diffData = {
            diffs: [
                {
                    new_path: 'compare.js',
                    old_path: 'compare.js',
                    new_file: false,
                    deleted_file: false,
                    renamed_file: false,
                    diff: 'diff'
                }
            ]
        };

        const result = processFilesFromApiResponse(diffData, true);

        expect(result).toHaveLength(1);
        expect(result[0].path).toBe('compare.js');
    });
});

describe('buildFileTree', () => {
    test('should build a nested tree structure', () => {
        const files = [
            { path: 'src/app.js', status: 'modified', diff_content: '+line', has_diff_content: true },
            { path: 'src/utils/math.js', status: 'added', diff_content: '+line', has_diff_content: true },
            { path: 'README.md', status: 'modified', diff_content: '+line', has_diff_content: true }
        ];

        const tree = buildFileTree(files);

        expect(tree.type).toBe('folder');
        expect(tree.children['README.md'].type).toBe('file');
        expect(tree.children['src'].type).toBe('folder');
        expect(tree.children['src'].children['app.js'].type).toBe('file');
        expect(tree.children['src'].children['utils'].children['math.js'].type).toBe('file');
    });

    test('should collapse single child folders', () => {
        const files = [
            { path: 'a/b/c/file.txt', status: 'added', diff_content: '+line', has_diff_content: true }
        ];

        const tree = buildFileTree(files);

        // a/b/c should be collapsed into one node if b and c are single children
        expect(tree.children['a/b/c']).toBeDefined();
        expect(tree.children['a/b/c'].children['file.txt']).toBeDefined();
    });
});
