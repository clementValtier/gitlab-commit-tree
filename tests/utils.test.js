import { parseFileStats } from '../src/utils/helpers.js';

describe('parseFileStats', () => {
    test('should return 0 for empty diff', () => {
        const stats = parseFileStats('');
        expect(stats).toEqual({ additions: 0, deletions: 0 });
    });

    test('should count additions and deletions correctly', () => {
        const diff = `--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,4 @@
 line 1
-line 2
+line 2 updated
+line 3 new
 line 4`;
        const stats = parseFileStats(diff);
        expect(stats).toEqual({ additions: 2, deletions: 1 });
    });

    test('should ignore headers', () => {
        const diff = `--- a/file.txt
+++ b/file.txt`;
        const stats = parseFileStats(diff);
        expect(stats).toEqual({ additions: 0, deletions: 0 });
    });
});
