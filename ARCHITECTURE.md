# Architecture – CoursLive

Les schémas sont écrits en Mermaid : GitHub les affiche directement dans ce fichier.

## 1. Architecture actuelle (prototype)

```mermaid
flowchart TD
    U["Navigateur (ordinateur ou mobile)"]

    subgraph Django["Serveur Django"]
        H["/ : page d'accueil (HTML, CSS, JS)"]
        R["/app : application React (build)"]
        A["/api : API REST (Django REST Framework)"]
        P["Permissions : rôle (IsProfessor) + propriété (IsCourseOwner)"]
    end

    DB[("PostgreSQL : users, courses, lessons, live_sessions")]
    Y["YouTube, Vimeo ou fichier .mp4 (vidéos par URL)"]
    L["Meet, Zoom ou Jitsi (Live par lien externe)"]

    U --> H
    U --> R
    R -->|"Axios + cookie de session + CSRF"| A
    A --> P
    P --> DB
    U -.->|"lecture de la vidéo"| Y
    U -.->|"Rejoindre le Live"| L
```

**Points clés**
- Une seule application Django sert la page d'accueil, le build React (`/app`) et l'API (`/api`) : une seule URL, pas de CORS.
- L'authentification repose sur une session (cookie HttpOnly) et un jeton CSRF.
- Chaque requête d'écriture passe par les permissions : le rôle puis la propriété du cours.
- Les vidéos et les Lives sont des liens externes : le serveur ne stocke et ne diffuse aucune vidéo.

## 2. Évolution envisagée (plusieurs établissements, plusieurs milliers d'utilisateurs)

```mermaid
flowchart TD
    W["Navigateur web ou mobile"]

    subgraph App["Application"]
        LB["Load balancer + CDN"]
        FE["Frontend React (fichiers statiques)"]
        API["API Django sans état (plusieurs instances)"]
        WK["Workers : encodage vidéo FFmpeg (file de tâches)"]
    end

    DB[("PostgreSQL géré : réplica + sauvegardes quotidiennes")]
    RD[("Redis : cache, sessions, file de tâches")]
    OBJ[("Stockage objet R2 ou S3 : originaux + HLS, un préfixe par établissement")]
    CDN["CDN vidéo : URL signées à durée limitée"]
    LIVE["Live : LiveKit (cloud, puis auto-hébergé), accès par jeton court"]
    MON["Monitoring : logs, métriques, alertes, suivi d'erreurs"]

    W --> LB
    LB --> FE
    LB --> API
    API --> DB
    API --> RD
    API -->|"URL pré-signée d'upload"| W
    W -->|"upload direct du fichier"| OBJ
    OBJ --> WK
    WK --> OBJ
    API -->|"jeton d'accès au Live"| W
    W -->|"WebRTC"| LIVE
    W -->|"lecture HLS"| CDN
    CDN --> OBJ
    API -.-> MON
    WK -.-> MON
```

**Ce qui change par rapport au prototype**

| Sujet | Prototype | Évolution |
|---|---|---|
| Vidéos | URL externes | Upload direct vers un stockage objet (le serveur principal ne voit pas les gros fichiers), encodage HLS par des workers, lecture via CDN et URL signées |
| Live | Lien externe | Salle intégrée (LiveKit) ; Django vérifie le droit d'accès puis délivre un jeton court |
| Établissements | Un seul espace | Colonne d'établissement sur chaque table, filtrage systématique dans l'API, préfixe de stockage par établissement |
| Montée en charge | Un serveur | API sans état derrière un load balancer, PostgreSQL géré avec réplica, Redis pour le cache et les tâches |
| Fiabilité | Aucune sauvegarde | Sauvegardes quotidiennes de la base, second exemplaire des originaux vidéo, reprise des tâches d'encodage en cas d'échec |
| Exploitation | Aucun suivi | Logs centralisés, métriques, alertes de coût et d'erreurs, déploiement avec retour rapide à la version précédente |
