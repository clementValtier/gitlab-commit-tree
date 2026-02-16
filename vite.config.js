import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { terser } from 'rollup-plugin-terser';

// Plugin pour injecter les données du package.json dans le manifest.json
function manifestPlugin() {
  return {
    name: 'manifest-plugin',
    writeBundle() {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const manifest = JSON.parse(fs.readFileSync('src/manifest.json', 'utf-8'));
      
      manifest.name = pkg.displayName || pkg.name;
      manifest.version = pkg.version;
      manifest.description = pkg.description;
      
      fs.writeFileSync(
        path.resolve(__dirname, 'dist/manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
    }
  };
}

export default defineConfig(({ mode }) => ({
  root: 'src',
  publicDir: path.resolve(__dirname, 'src/public'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        'commit-tree': path.resolve(__dirname, 'src/index.js')
      },
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`
      },
      plugins: mode === 'production' ? [
        terser({
          compress: {
            drop_console: true,
          }
        })
      ] : []
    }
  },
  plugins: [
    manifestPlugin()
  ],
}));
