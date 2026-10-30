# CoursLive – Plateforme de cours en ligne

Mini-projet Full-Stack : un professeur gère des cours, des leçons vidéo et des sessions Live ;
un étudiant consulte les cours, regarde les vidéos et rejoint les Lives.

- **Application en ligne** : [URL à renseigner après déploiement]
- **Code source** : https://github.com/medmoutahir2/Platforme_cours

## Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| Professeur | prof.demo@example.com | [communiqué avec le rendu] |
| Étudiant | etudiant.demo@example.com | [communiqué avec le rendu] |

## Stack technique

| Couche | Technologie | Pourquoi |
|---|---|---|
| Backend | Python, Django, Django REST Framework | Auth, ORM, validations et permissions intégrés ; livraison rapide |
| Base de données | PostgreSQL | Fiable, standard, bien supporté par Django |
| Authentification | Sessions Django (cookie HttpOnly) + protection CSRF | Plus simple et plus sûr que stocker un JWT dans le navigateur |
| Frontend (pages publiques) | HTML / CSS / JS + Bootstrap, servi par Django | Page d'accueil légère et rapide |
| Frontend (espaces privés) | React (Vite), React Router, Axios | Interfaces interactives (dashboards) |
| Fichiers statiques | WhiteNoise | Django sert aussi le build React : une seule URL |
| Déploiement | Docker (build React + Django) | [à compléter selon l'hébergeur] |

## Architecture

```
Navigateur
   │
   ├── /            → page d'accueil (template Django, HTML/CSS/JS)
   ├── /app/...     → application React (build servi par Django)
   └── /api/...     → API JSON (Django REST Framework)
                          │
                          ▼
                     PostgreSQL (users, courses, lessons, live_sessions)
```

- Le frontend React appelle l'API avec Axios ; la session est portée par un cookie.
- Chaque endpoint vérifie le **rôle** (`IsProfessor`) et la **propriété** (`IsCourseOwner`) côté backend.
- Les vidéos sont des URL (YouTube, Vimeo, fichier public) ; les Lives sont des liens externes.

Organisation du dépôt :

```
backend/    Django (config, accounts, courses, templates, static)
frontend/   React + Vite (src/pages, src/components, src/context)
Dockerfile  build du frontend puis image Django
```

## Règle de visibilité des cours

Tout étudiant connecté voit tous les cours. Il n'y a pas d'inscription par cours
(simplification volontaire). Un professeur ne peut modifier que ses propres cours,
leçons et sessions Live.

## Prérequis

- Python 3.12+
- Node.js 20+ (LTS)
- PostgreSQL 14+

## Lancer le projet en local

### 1. Base de données

```sql
CREATE DATABASE plateforme_cours;
CREATE USER cours_user WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE plateforme_cours TO cours_user;
ALTER USER cours_user CREATEDB;  -- nécessaire pour lancer les tests
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Linux/Mac : source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env           # Linux/Mac : cp .env.example .env (puis renseigner les valeurs)
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3. Frontend (développement)

```bash
cd frontend
npm install
npm run dev
```

Ouvrir http://localhost:5173/app/ (le proxy Vite redirige `/api` vers Django).

### 4. Build complet (comme en production)

```bash
cd frontend
npm run build
cd ../backend
python manage.py runserver
```

Ouvrir http://127.0.0.1:8000/

## Vérifications reproductibles

1. **Autorisations** :
   `python manage.py test courses.tests.AccessControlTests`
   (un étudiant ou un autre professeur ne peut ni créer, ni modifier, ni supprimer ; accès anonyme refusé).
2. **Persistance** :
   `python manage.py test courses.tests.PersistenceTests`
   (les données sont retrouvées après une nouvelle connexion ; suppression en cascade).
3. **Accès direct à l'API** : connecté en étudiant, dans la console du navigateur :

```js
fetch("/api/courses/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1]
  },
  body: JSON.stringify({ title: "x", description: "y" })
}).then(r => r.status)
```

Résultat attendu : `403`.

Suite complète : `python manage.py test` (12 tests).

## Fonctionnalités

**Terminées**
- Page d'accueil publique responsive, inscription / connexion / déconnexion avec rôles
- Espace professeur : CRUD des cours, leçons (URL vidéo), sessions Live
- Espace étudiant : liste des cours, lecteur vidéo (YouTube, Vimeo, fichier direct), Lives et bouton « Rejoindre le Live »
- Contrôle d'accès côté backend, validations, messages d'erreur lisibles, états de chargement et vides
- Données en PostgreSQL ; 12 tests automatisés

**Simulées / simplifiées**
- Vidéos : URL externes (pas d'upload ni de stockage propre)
- Live : lien externe (Meet, Zoom, Jitsi), pas de Live intégré
- Image de couverture : URL (pas d'upload)

**Non réalisées (limites connues)**
- Inscription des étudiants à un cours (enrollment) et multi-établissements
- Choix du rôle libre à l'inscription (en production : invitation ou validation par un administrateur)
- Pas de réinitialisation de mot de passe, pas de vérification d'email, pas de limitation des tentatives de connexion
- Pas de monitoring ni de sauvegardes automatisées

## Usage de l'IA

Un assistant IA (Claude) a été utilisé pour l'aide à la conception, la génération de code et le débogage.
Le code a été relu, testé et adapté ; je suis en mesure de l'expliquer et de le modifier.

## Étude technico-économique et propositions

Voir la note de décision (vidéos enregistrées, Live intégré, coûts, évolution).
