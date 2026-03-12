/**
 * Mock for virtual:material-icons (Vite virtual module — unavailable in Jest)
 */
export const fileExtensions = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'react',
    tsx: 'react_ts',
    py: 'python',
    css: 'css',
    scss: 'sass',
    html: 'html',
    json: 'json',
    md: 'markdown',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    java: 'java',
    rs: 'rust',
    vue: 'vue',
};

export const fileNames = {
    'package.json': 'npm',
    'tsconfig.json': 'tsconfig',
    'dockerfile': 'docker',
    '.gitignore': 'git',
    '.env': 'env',
};

export const defaultIcon = 'file';

export const svgs = {
    javascript: '<svg viewBox="0 0 16 16"><path fill="#f7df1e"/></svg>',
    typescript: '<svg viewBox="0 0 16 16"><path fill="#3178c6"/></svg>',
    python: '<svg viewBox="0 0 16 16"><path fill="#3572a5"/></svg>',
    file: '<svg viewBox="0 0 16 16"><path fill="#90a4ae"/></svg>',
};
