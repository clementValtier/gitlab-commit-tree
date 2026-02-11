# GitLab Commit Tree

Extension Firefox qui affiche une arborescence interactive des fichiers modifiés dans les commits, comparaisons et historiques de branches GitLab.

## Fonctionnalités

### Navigation et visualisation

- **Vue en arborescence** : Visualisation hiérarchique des fichiers modifiés avec dossiers repliables
- **Modes de visualisation** : Basculement entre vue diff et fichier complet
- **Prévisualisation des diffs** : Panneau latéral avec coloration syntaxique et surlignage des modifications
- **Statistiques** : Nombre de lignes ajoutées/supprimées par fichier et par dossier
- **Expand/Collapse all** : Déplier ou replier tous les dossiers d'un clic

### Recherche et filtrage

- **Recherche de fichiers** : Filtrage par nom ou pattern glob (ex: `*.vue`)
- **Recherche dans le contenu** : Cmd+F / Ctrl+F pour chercher dans les diffs et fichiers
  - Navigation entre résultats (Enter / Shift+Enter)
  - Compteur de résultats
  - Surlignage des correspondances

### Coloration syntaxique

- **Support de 180+ langages** : JavaScript, Python, PHP, Ruby, Go, Rust, etc.
- **Fichiers spéciaux** : Coloration pour `.gitignore`, `package-lock.json`, `Dockerfile`, `Makefile`, `.env`, etc.
- **Langage custom Omnis** : Support natif pour Omnis Studio (.omh)

### Interface et raccourcis

- **Statuts visuels** : Badges colorés (ajouté, modifié, supprimé, renommé)
- **Sélection intelligente** : Cmd+A / Ctrl+A limité au bloc de diff en cours
- **Support du dark mode** : S'adapte automatiquement au thème GitLab
- **Raccourcis clavier** :
  - `Cmd+F` / `Ctrl+F` : Recherche dans le fichier
  - `Enter` : Résultat suivant
  - `Shift+Enter` : Résultat précédent
  - `Escape` : Fermer la recherche
  - `Cmd+A` / `Ctrl+A` : Sélectionner le bloc de diff en cours

## Pages supportées

L'extension fonctionne sur trois types de pages GitLab :

| Page | URL | Description |
|------|-----|-------------|
| Commit | `/project/-/commit/sha` | Fichiers modifiés dans un commit |
| Comparaison | `/project/-/compare/branch1...branch2` | Différences entre deux branches |
| Historique | `/project/-/commits/branch` | Liste des commits avec bouton d'accès rapide |

## Installation

### Depuis le package pré-buildé

1. Télécharger le fichier `.zip` depuis les releases
2. Aller à `about:addons` dans Firefox
3. Cliquer sur l'icône engrenage > "Installer un module depuis un fichier"
4. Sélectionner le fichier `.zip`

### Installation en développement

1. Cloner le repository
2. Installer les dépendances : `npm install`
3. Builder l'extension : `npm run build`
4. Dans Firefox, aller à `about:debugging`
5. Cliquer sur "Ce Firefox"
6. Cliquer sur "Charger un module complémentaire temporaire"
7. Sélectionner le fichier `manifest.json` dans le dossier `dist/`

Pour le développement avec hot-reload :
```bash
npm run dev
```
Puis recharger l'extension dans `about:debugging` après chaque modification.

## Développement

### Prérequis

```bash
npm install
```

### Scripts disponibles

```bash
npm run dev      # Mode développement avec watch
npm run build    # Build de production
npm test         # Lancer les tests unitaires
npm run package  # Créer le package .zip pour distribution
```

### Structure du projet

```
├── src/
│   ├── commit-tree.js           # Point d'entrée principal
│   ├── commit-tree-*.js         # Modules de l'extension
│   ├── commit-tree.css          # Styles
│   ├── omnis-keywords.json      # Définition langage Omnis
│   ├── manifest.json            # Manifest de l'extension
│   └── public/                  # Assets statiques
├── tests/
│   ├── api.test.js              # Tests API
│   ├── utils.test.js            # Tests utilitaires
│   ├── highlight.test.js        # Tests coloration syntaxique
│   └── renderer.test.js         # Tests rendu
├── dist/                        # Fichiers build
└── vite.config.js               # Configuration Vite
```

### Tests

Suite de tests complète avec Jest et JSDOM :

```bash
npm test
```

## Utilisation

### Sur une page de commit ou comparaison

1. Un bouton "Charger l'arborescence" apparaît en haut de la page
2. Cliquer pour charger les fichiers via l'API GitLab
3. Naviguer dans l'arborescence et cliquer sur un fichier pour voir le diff

### Sur une page d'historique de branche

1. Un bouton arborescence apparaît à côté de chaque commit
2. Cliquer pour afficher/masquer l'arborescence du commit

## Technologies utilisées

- **Vite** : Build et bundling
- **Highlight.js** : Coloration syntaxique
- **diff.js** : Analyse et comparaison de fichiers
- **Jest + JSDOM** : Tests unitaires
- **CSS Custom Highlight API** : Surlignage de recherche performant

## Instances GitLab supportées

Par défaut, l'extension est configurée pour :

- `gitlab.equation.fr`
- `gitlab.com`

Pour ajouter d'autres instances, modifier la section `matches` dans `src/manifest.json`.

## Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalité`)
3. Commiter vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Pousser vers la branche (`git push origin feature/ma-fonctionnalité`)
5. Ouvrir une Pull Request

Assurez-vous que les tests passent avant de soumettre :
```bash
npm test
```
