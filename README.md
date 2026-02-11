# GitLab Commit Tree

Extension Firefox qui affiche une arborescence interactive des fichiers modifiés dans les commits, comparaisons et historiques de branches GitLab.

## Fonctionnalités

- **Vue en arborescence** : Visualisation hiérarchique des fichiers modifiés avec dossiers repliables
- **Prévisualisation des diffs** : Panneau latéral affichant les différences pour chaque fichier
- **Statistiques** : Nombre de lignes ajoutées/supprimées par fichier et par dossier
- **Recherche** : Filtrage des fichiers par nom ou pattern glob (ex: `*.vue`)
- **Statuts visuels** : Badges colorés indiquant les fichiers ajoutés, modifiés, supprimés ou renommés
- **Support du dark mode** : S'adapte automatiquement au thème GitLab

## Pages supportées

L'extension fonctionne sur trois types de pages GitLab :

| Page | URL | Description |
|------|-----|-------------|
| Commit | `/project/-/commit/sha` | Fichiers modifiés dans un commit |
| Comparaison | `/project/-/compare/branch1...branch2` | Différences entre deux branches |
| Historique | `/project/-/commits/branch` | Liste des commits avec bouton d'accès rapide |

## Installation

### Installation temporaire (développement)

1. Ouvrir Firefox et aller à `about:debugging`
2. Cliquer sur "Ce Firefox"
3. Cliquer sur "Charger un module complémentaire temporaire"
4. Sélectionner le fichier `manifest.json` situé dans le dossier `src/`

### Installation permanente

1. Compresser le contenu du dossier `src/` en fichier `.zip`
2. Renommer en `.xpi`
3. Installer via `about:addons`

## Développement

### Structure du projet

- `src/` : Fichiers source de l'extension
- `tests/` : Tests unitaires
- `vendor/` : Bibliothèques tierces (diff, highlight.js)

### Tests

Pour lancer les tests unitaires :

```bash
npm install
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

## Instances GitLab supportées

Par défaut, l'extension est configurée pour :

- `gitlab.equation.fr`
- `gitlab.com`

Pour ajouter d'autres instances, modifier la section `matches` dans `manifest.json`.
