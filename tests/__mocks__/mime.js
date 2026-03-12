/**
 * Mock for the 'mime' package (ESM-only — not handled by Babel in Jest)
 */
const mimeTypes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    pdf: 'application/pdf',
    js: 'text/javascript',
    css: 'text/css',
    html: 'text/html',
    txt: 'text/plain',
    json: 'application/json',
    zip: 'application/zip',
    gz: 'application/gzip',
};

const mime = {
    getType: (ext) => mimeTypes[ext?.toLowerCase()] ?? null,
};

export default mime;
