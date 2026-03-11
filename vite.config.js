import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { terser } from 'rollup-plugin-terser';
import { generateManifest } from 'material-icon-theme';
import hljs from 'highlight.js';
import {
  icons as customIcons,
  fileExtensions as customFileExtensions,
  fileNames as customFileNames,
} from './src/config/icons-custom.js';

const VIRTUAL_MODULE_ID = 'virtual:material-icons';
const RESOLVED_ID = '\0' + VIRTUAL_MODULE_ID;

// Plugin virtual module : fournit les données d'icônes via un import ES.
function iconsPlugin() {
  let moduleSource = null;

  return {
    name: 'material-icons-plugin',

    buildStart() {
      const mitManifest = generateManifest();

      // -- Mapping principal depuis material-icon-theme --
      const fileExtensions = { ...mitManifest.fileExtensions };
      const fileNames = { ...mitManifest.fileNames };
      const defaultIcon = mitManifest.file || 'file';

      // -- Pont hljs : alias d'extension → languageId → icône --
      for (const lang of hljs.listLanguages()) {
        const iconName = mitManifest.languageIds[lang];
        if (!iconName) continue;
        const langObj = hljs.getLanguage(lang);
        const candidates = [lang, ...(langObj?.aliases ?? [])];
        for (const alias of candidates) {
          if (!fileExtensions[alias]) fileExtensions[alias] = iconName;
        }
      }

      // -- Icônes personnalisées (priorité sur material-icon-theme) --
      Object.assign(fileExtensions, customFileExtensions);
      Object.assign(fileNames, customFileNames);

      // -- Chargement des SVG depuis material-icon-theme --
      const usedIconNames = new Set([
        ...Object.values(fileExtensions),
        ...Object.values(fileNames),
        defaultIcon,
      ]);

      const iconsDir = path.resolve('node_modules/material-icon-theme/icons');
      const svgs = {};
      for (const iconName of usedIconNames) {
        const svgPath = path.join(iconsDir, `${iconName}.svg`);
        if (fs.existsSync(svgPath)) {
          svgs[iconName] = fs.readFileSync(svgPath, 'utf-8');
        }
      }

      // -- Fusion des SVG personnalisés --
      Object.assign(svgs, customIcons);

      moduleSource = [
        `export const fileExtensions = ${JSON.stringify(fileExtensions)};`,
        `export const fileNames = ${JSON.stringify(fileNames)};`,
        `export const defaultIcon = ${JSON.stringify(defaultIcon)};`,
        `export const svgs = ${JSON.stringify(svgs)};`,
      ].join('\n');
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id === RESOLVED_ID) return moduleSource;
    },
  };
}

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
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        'commit-tree': path.resolve(__dirname, 'src/index.js')
      },
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `assets/[name].[ext]`
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
    iconsPlugin(),
    manifestPlugin(),
  ],
}));
