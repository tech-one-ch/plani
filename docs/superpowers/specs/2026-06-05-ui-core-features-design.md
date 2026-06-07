# Plani — UI & Core Features Design

**Date:** 2026-06-05
**Scope:** UI complète + 4 premières grandes fonctionnalités
**Approche:** Tranches verticales (DB → API → UI par feature)

---

## Contexte

Plani est actuellement un scaffold fonctionnel : auth, admin, organisations et workspaces (schéma DB) sont en place. Aucune fonctionnalité métier ni UI applicative n'existe encore. Ce document spécifie le design pour le premier cycle de développement produit.

---

## Décisions visuelles

| Élément           | Choix                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| Thème             | Full dark par défaut (`#0a0a0a` fond, `#0f0f0f` sidebar)                     |
| Toggle light      | Prévu mais non implémenté en v1                                              |
| Navigation        | Sidebar gauche large (220px), collapsible en mode icônes (48px)              |
| Accent principal  | Bleu (`#3b82f6`)                                                             |
| Accent secondaire | Blanc / gris clair pour highlights et textes importants                      |
| Navigation projet | Onglets horizontaux en haut du contenu (Board / Tâches / Notes / Calendrier) |
| Design            | Flat, minimaliste, sobre — pas d'ombres portées, peu de couleurs             |

---

## Architecture générale

### Ce qui existe (ne pas toucher)

- `user`, `session`, `account` — better-auth
- `organization`, `member`, `invitation` — better-auth org plugin
- `workspace`, `workspace_member` — schéma Plani existant

### Nouvelles tables DB

```sql
-- Projet appartenant à un workspace
project
  id          text PK (uuid v7)
  workspace_id text FK → workspace (cascade delete)
  name        text NOT NULL
  slug        text NOT NULL
  color       text NOT NULL DEFAULT '#3b82f6'
  created_at  timestamptz NOT NULL DEFAULT now()
  updated_at  timestamptz NOT NULL DEFAULT now()
  UNIQUE (workspace_id, slug)

-- Tâche appartenant à un projet
task
  id          text PK (uuid v7)
  project_id  text FK → project (cascade delete)
  title       text NOT NULL
  description text
  status      text NOT NULL DEFAULT 'backlog'
              -- enum: backlog | todo | in_progress | done
  priority    text NOT NULL DEFAULT 'medium'
              -- enum: low | medium | high
  due_date    date
  assignee_id text FK → user (set null on delete)
  position    real NOT NULL DEFAULT 0  -- ordre dans la colonne kanban
  created_at  timestamptz NOT NULL DEFAULT now()
  updated_at  timestamptz NOT NULL DEFAULT now()

-- Note appartenant à un projet
note
  id          text PK (uuid v7)
  project_id  text FK → project (cascade delete)
  title       text NOT NULL DEFAULT 'Sans titre'
  content     text NOT NULL DEFAULT ''  -- HTML sérialisé par TipTap
  created_by  text FK → user (set null on delete)
  created_at  timestamptz NOT NULL DEFAULT now()
  updated_at  timestamptz NOT NULL DEFAULT now()
```

### API REST

Routes sous `/api/v1/` (Next.js route handlers). Validation Zod sur tous les inputs. Auth vérifiée sur chaque route (session + appartenance workspace).

```
GET    /api/v1/workspaces                      liste workspaces de l'utilisateur
POST   /api/v1/workspaces                      créer un workspace
GET    /api/v1/workspaces/:id                  détail workspace
PATCH  /api/v1/workspaces/:id                  modifier nom/slug

GET    /api/v1/workspaces/:id/projects         liste projets
POST   /api/v1/workspaces/:id/projects         créer projet
GET    /api/v1/projects/:id                    détail projet
PATCH  /api/v1/projects/:id                    modifier projet
DELETE /api/v1/projects/:id                    supprimer projet

GET    /api/v1/projects/:id/tasks              liste tâches (avec filtres: status, assignee)
POST   /api/v1/projects/:id/tasks              créer tâche
GET    /api/v1/tasks/:id                       détail tâche
PATCH  /api/v1/tasks/:id                       modifier tâche (inclut changement statut/position)
DELETE /api/v1/tasks/:id                       supprimer tâche
GET    /api/v1/projects/:id/notes              liste notes
POST   /api/v1/projects/:id/notes              créer note
GET    /api/v1/notes/:id                       détail note
PATCH  /api/v1/notes/:id                       modifier note (titre + contenu)
DELETE /api/v1/notes/:id                       supprimer note

GET    /api/v1/workspaces/:id/members          liste membres
POST   /api/v1/workspaces/:id/members/invite   inviter par email
DELETE /api/v1/workspaces/:id/members/:userId  retirer un membre
```

---

## Tranche 1 — App shell + Workspace/Projets

### Objectif

Mettre en place la navigation complète et la gestion de workspace/projets. À la fin de cette tranche, un utilisateur peut se connecter, créer un workspace, créer des projets et naviguer entre eux.

### Layout principal `(app)/layout.tsx`

Remplace le layout actuel par la structure dark complète :

```
┌─────────────────────────────────────────────────────┐
│ topbar (40px) — logo | workspace switcher | avatar  │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│   sidebar    │        main content                  │
│   (220px)    │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

**Topbar :** logo "plani", workspace switcher (pill cliquable → dropdown liste des workspaces + créer), avatar utilisateur (dropdown → profil, déconnexion).

> **Workspace = Organisation better-auth.** En v1, chaque organisation a exactement un workspace (créé automatiquement à la création de l'org). Le switcher change d'organisation active (`activeOrganizationId` sur la session). Le workspace est résolu depuis l'organisation active.

**Sidebar :**

- Section navigation : Dashboard, Mes tâches
- Séparateur
- Section projets : liste des projets du workspace actif (dot couleur + nom), bouton "+ Nouveau projet"
- Séparateur
- Section workspace : Membres, Paramètres
- Bouton collapse en bas (persisté en localStorage)

**Mode collapsed (48px) :** icônes uniquement avec tooltips au survol.

### Pages

**`/dashboard`** — Grille de cartes de projets (nom, couleur, compteur de tâches ouvertes). Bouton "Créer un projet" si vide.

**`/projects/[projectId]`** — Redirige vers `/projects/[projectId]/board` par défaut. Shell avec onglets Board / Tâches / Notes / Calendrier (Calendrier désactivé/grisé en v1).

> **Convention :** toutes les routes projet utilisent `[projectId]` (l'id uuid v7), pas le slug — le slug est affiché mais l'id est utilisé en interne pour éviter les conflits lors d'un renommage.

**`/settings`** — Paramètres du workspace (nom, slug).

### Modals

**Créer un projet :** champ nom (requis), sélecteur de couleur (6 couleurs prédéfinies), bouton créer. Le slug est dérivé automatiquement du nom.

**Créer un workspace :** champ nom uniquement. Créé via better-auth org plugin.

### Comportement post-login

Si l'utilisateur a un workspace → redirect `/dashboard`. Sinon → flow création workspace.

---

## Tranche 2 — Tâches + Kanban

### Board (`/projects/[projectId]/board`)

4 colonnes fixes dans l'ordre :

| Colonne  | Statut DB     |
| -------- | ------------- |
| Backlog  | `backlog`     |
| À faire  | `todo`        |
| En cours | `in_progress` |
| Terminé  | `done`        |

**Carte tâche :**

- Titre (tronqué à 2 lignes)
- Badge priorité (rouge/orange/vert selon low/medium/high)
- Date d'échéance (rouge si dépassée)
- Avatar assignee (si assigné)

**Drag & drop :** `@dnd-kit/core` + `@dnd-kit/sortable`. Sur drop : PATCH `/api/v1/tasks/:id` avec nouveau `status` + `position` calculée (moyenne des positions voisines — algorithme LexoRank simplifié avec float).

**Création rapide :** champ texte en bas de chaque colonne. Entrée → crée la tâche dans la colonne correspondante, focus reste sur le champ.

**Clic sur carte → panneau détail** (slide depuis la droite, 380px, overlay semi-transparent).

### Vue Tâches (`/projects/[projectId]/tasks`)

Table/liste avec colonnes : titre, statut (badge), priorité (badge), date, assignee. Tri par colonne. Même panneau détail au clic.

### Panneau détail tâche

- Titre éditable inline (blur → save)
- Description (textarea, sauvegarde à blur)
- Sélecteur statut (dropdown)
- Sélecteur priorité (dropdown)
- Date d'échéance (date picker natif)
- Assignee (dropdown membres du workspace)
- Bouton supprimer (avec confirmation)
- Fermeture via Escape ou clic hors panneau

---

## Tranche 3 — Notes

### Vue Notes (`/projects/[projectId]/notes`)

Split view 2 colonnes :

```
┌────────────────┬──────────────────────────────────┐
│  liste notes   │       éditeur TipTap              │
│  (240px)       │                                  │
│                │  Titre (h1 éditable)              │
│  + Nouvelle    │                                  │
│  note          │  Contenu...                      │
│                │                                  │
└────────────────┴──────────────────────────────────┘
```

**Liste :** titre, extrait du contenu (30 chars), date de modification. Sélection met à jour l'éditeur.

**Création :** bouton "+ Nouvelle note" → crée en DB avec titre "Sans titre", sélectionne immédiatement dans l'éditeur, focus sur le titre.

**Éditeur TipTap — extensions :**

- `StarterKit` (paragraphe, titres h1-h3, gras, italique, listes, blockquote, code inline, codeblock, hr)
- `Placeholder` — texte fantôme "Commencer à écrire..."
- Pas d'image en v1

**Sauvegarde :** debounce 1000ms sur `onUpdate` → PATCH `/api/v1/notes/:id`. Indicateur "Enregistrement..." / "Enregistré" discret dans l'en-tête.

---

## Tranche 4 — Membres

### Page Membres (`/settings/members`)

**Liste :** tableau avec colonnes : avatar + nom, email, rôle (badge admin/member), date d'ajout, actions (retirer).

**Inviter :** bouton "Inviter un membre" → modal avec :

- Champ email
- Sélecteur rôle : Member (défaut) / Admin
- Bouton envoyer → utilise le client better-auth (`authClient.organization.inviteMember`) — pas de route custom, mieux-auth gère l'envoi d'email et la gestion de l'invitation.

**Invitations en attente :** section séparée sous la liste des membres actifs, avec email + date d'envoi + bouton annuler.

**Retirer un membre :** bouton "Retirer" → confirmation → DELETE. Impossible de retirer le dernier admin.

**Permissions v1 :** accès workspace = accès à tous les projets. Pas de gestion fine par projet.

---

## Ce qui n'est PAS dans ce scope

- Calendrier (vue désactivée, à activer en v2)
- Canvas (tldraw)
- Commentaires sur les tâches
- Checklist / pièces jointes dans les tâches
- Dépendances entre tâches
- Notifications temps réel (Yjs/Hocuspocus)
- Toggle dark/light (dark par défaut, toggle à ajouter en v2)
- App mobile

---

## Stack & librairies ajoutées

| Librairie                               | Usage                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `@dnd-kit/core` + `@dnd-kit/sortable`   | Drag & drop kanban                                                               |
| `@tiptap/react` + `@tiptap/starter-kit` | Éditeur de notes                                                                 |
| `zod`                                   | Validation API (déjà disponible via better-auth)                                 |
| `lucide-react`                          | Icônes (déjà dans `@plani/ui` — utiliser via ce package ou ajouter à `apps/web`) |

---

## Conventions à respecter

- Toutes les nouvelles tables : `id` uuid v7, `created_at`/`updated_at` timestamptz
- Multi-tenancy par `workspace_id` sur chaque table métier
- Server Components par défaut, `"use client"` uniquement pour interactivité (DnD, éditeur, modals)
- Migrations Drizzle committées dans `packages/db/src/migrations/`
- Routes API sous `apps/web/src/app/api/v1/`
- Validation Zod sur tous les inputs API
