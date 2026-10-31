# Note de décision technique – CoursLive

*Étude technico-économique (cahier des charges §22) – tarifs consultés les 30 et 31/10/2026 – chiffres = estimations, hypothèses explicites.*

## 1. Résumé

Le prototype livré utilise des **URL vidéo** et des **liens Live externes**. Pour une vraie plateforme (10 établissements, 20 Lives simultanés), je recommande :

- **Live** : démarrer avec un **service externe** (LiveKit Cloud), puis passer à **LiveKit auto-hébergé** quand l'usage devient régulier (environ 50 sessions de 2 h par mois ou plus) et qu'une personne peut l'exploiter.
- **Vidéos enregistrées** : démarrer avec un **service vidéo géré** (Mux, Cloudflare Stream ou Bunny), puis construire un pipeline **stockage objet + CDN** (Cloudflare R2) quand la lecture dépasse environ 3 To par mois.

## 2. Choix du prototype

| Élément | Choix | Raison |
|---|---|---|
| Backend | Django + Django REST Framework | Authentification, permissions, ORM et validations intégrés ; livraison rapide |
| Base de données | PostgreSQL | Fiable, standard, adaptée à une montée en charge |
| Authentification | Sessions + CSRF | Cookie HttpOnly, plus sûr qu'un JWT stocké dans le navigateur |
| Frontend | HTML/CSS/JS (accueil) + React (espaces privés) | Accueil léger, interfaces interactives |
| Contrôle d'accès | Rôle + propriété côté backend, 12 tests | La sécurité ne dépend jamais de l'interface |

## 3. Hypothèses

**Live** : 10 établissements, 20 sessions simultanées, 1 professeur + 30 étudiants. Les étudiants reçoivent la vidéo du professeur, l'audio et le partage d'écran (**~2,5 Mbps par étudiant**, 100 % de participation = cas maximal). Activité : 20 Lives × 20 jours = **400 sessions/mois** (hypothèse haute). Durée : 2 h (120 min) ou 4 h. Enregistrement non inclus dans les coûts Live.

| Indicateur | 2 h | 4 h | ×10 (100 établissements, 2 h) |
|---|---|---|---|
| Personnes connectées au pic | 620 | 620 | 6 200 |
| Minutes-participants/mois | ~1,5 M | ~3 M | ~15 M |
| Données envoyées aux étudiants | ~27 To | ~54 To | ~270 To |
| Débit au pic | ~1,5 Gbps | ~1,5 Gbps | ~15 Gbps |

**Vidéos** : bibliothèque de 100 Go (≈ 8 900 min en 720p à ~1,5 Mbps) et 1 To de lecture par mois (≈ 89 000 min). Scénario ×10 : 1 To stocké, 10 To de lecture.

## 4. Live : trois approches

| Approche | Pourquoi | Avantages | Limites | Difficulté |
|---|---|---|---|---|
| **A. Service externe** (LiveKit Cloud) | Démarrage rapide, aucune infrastructure | Fiable, évolutif, SDK prêt | Coût proportionnel à l'usage ; dépendance au fournisseur | Faible |
| **B. Open source prêt à l'emploi** (BigBlueButton) | Conçu pour les classes (tableau blanc, enregistrement) | Gratuit, fonctions pédagogiques | ~200 utilisateurs/serveur ; administration et mises à jour à notre charge | Moyenne |
| **C. Auto-hébergé sur mesure** (LiveKit open source + notre interface React) | Live intégré à la plateforme, accès par jeton | Coût fixe faible, contrôle total | Développement et exploitation à notre charge | Élevée |

Intégration : Django vérifie le rôle et le cours, puis délivre un **jeton court** pour entrer dans la salle. LiveKit existe en version cloud et open source : passer de A à C consiste à changer l'URL et les clés, sans réécrire l'application.

### Coûts mensuels Live (fixe / variable)

| Approche | Fixe | Variable | Base (2 h) | 4 h | ×10 (2 h) |
|---|---|---|---|---|---|
| A. LiveKit Cloud (plan Scale) | 500 $ | données au-delà de 3 To (0,10 $/Go) et minutes au-delà de 1,5 M | **~2 900 $** | **~6 200 $** | **~32 600 $** |
| B. BigBlueButton | 4 serveurs, ~300–450 € + maintenance | ≈ 0 (trafic inclus, sous réserve de fair use) | **~300–450 €** | idem | **~2 200–3 400 €** |
| C. LiveKit auto-hébergé | 2–3 serveurs, ~150–330 € + développement et maintenance | ≈ 0 | **~150–330 €** | idem | **~1 000–2 000 €** |

Calcul A (base) : 500 $ + (27 To − 3 To) × 0,10 $/Go = ~2 900 $ ; les minutes (1,49 M) restent dans les 1,5 M incluses. Soit **~8 $ par session de 2 h**. Le point d'équilibre avec un coût fixe de ~400 €/mois est d'environ **50 sessions par mois**. Les coûts de maintenance humaine (monitoring, mises à jour) ne sont pas chiffrés dans B et C.

## 5. Vidéos enregistrées : approches

| Approche | Principe | Protection d'accès | Limites |
|---|---|---|---|
| **A. Stockage objet + CDN** (R2 ou S3) | Envoi direct du navigateur vers le stockage par **URL pré-signée** (le serveur principal ne voit pas le fichier) ; encodage HLS par un worker FFmpeg | URL signée à durée limitée, délivrée par Django après vérification des droits | Encodage, file d'attente et reprises à construire |
| **B. Service vidéo géré** (Mux, Cloudflare Stream, Bunny) | Upload direct, encodage et lecteur fournis | URL ou jeton signé | Coût proportionnel à l'usage ; dépendance |
| **C. Auto-hébergé** (MinIO/Nginx + FFmpeg) | Tout sur nos serveurs | Jeton vérifié par Nginx | Capacité, sauvegardes, disponibilité à notre charge |

### Coûts mensuels vidéos (fixe / variable)

| Option | Fixe | Variable | Base (100 Go, 1 To) | ×10 (1 To, 10 To) |
|---|---|---|---|---|
| A1. R2 + FFmpeg | petit serveur d'encodage (~5–15 €, estimé) | stockage 0,015 $/Go ; sortie gratuite | **~1,4 $** + serveur | **~15 $** + serveur |
| A2. S3 + CloudFront | idem | stockage ~0,023 $/Go ; livraison ~0,085 $/Go | **~87 $** | **~873 $** |
| B1. Cloudflare Stream | ≈ 0 | 5 $/1 000 min stockées + 1 $/1 000 min livrées | **~133 $** | **~1 333 $** |
| B2. Mux | ≈ 0 | 0,0024 $/min stockée ; 0,0008 $/min livrée (100 000 min livrées gratuites) | **~21 $** | **~844 $** |
| B3. Bunny Stream | ≈ 0 | dès 0,01 $/Go stocké + dès 0,005 $/Go livré (tarif par région, à vérifier) | **~6 $** | **~60 $** |
| C. Auto-hébergé | serveur(s) ~40–200 € + maintenance | ≈ 0 | **~40–100 €** | **~40–200 €** |

**Sauvegardes** : conserver l'original dans un second stockage (≈ doublement du coût de stockage : ~1,4 $ → ~3 $ en base). **Enregistrement des Lives** : si toutes les sessions sont enregistrées, **+~540 Go par mois** (+~1,1 To avec 4 h) ; après 12 mois, ~6,5 To, soit ~97 $/mois sur R2 et ~150 $/mois sur S3.

## 6. Impact des scénarios

- **20 Lives simultanés** : c'est un **pic** (620 personnes, 1,5 Gbps). Il dimensionne les serveurs en auto-hébergé (coût fixe) mais ne change pas la facture d'un service externe.
- **De 2 h à 4 h** : le service externe est multiplié par ~2 (2 900 $ → 6 200 $) ; l'auto-hébergé ne change pas, sauf le stockage des enregistrements.
- **De 10 à 100 établissements** : usage ×10. Service externe ~32 600 $/mois (~65 000 $ avec 4 h) au tarif public ; auto-hébergé : 15 à 31 serveurs et une vraie équipe d'exploitation. Vidéos : A2/B1/B2 ×10 ; A1 (R2) et C varient peu car la sortie de données est gratuite ou incluse.

## 7. Recommandation finale

**Phase 1 (démarrage)** : Live avec **LiveKit Cloud** ; vidéos avec un **service géré** (Mux ou Bunny, après vérification des tarifs pour nos régions). Raisons : aucune infrastructure, coût proportionnel à l'usage, mise en production rapide. À l'échelle de départ, l'écart entre un service géré et un pipeline R2 est d'environ 10 à 20 $/mois : ce n'est pas le critère.

**Phase 2 (croissance)** :
- Live : bascule vers **LiveKit auto-hébergé** dès ~50 sessions/mois régulières (à 400 sessions, ~300 € contre ~2 900 $).
- Vidéos : pipeline **R2 + FFmpeg + URL signées** au-delà de ~3 To de lecture par mois (écart ≈ 140 $/mois, et jusqu'à ~800 $/mois à 10 To).

**Sécurité et séparation des établissements** : chaque table porte un identifiant d'établissement ; les fichiers sont rangés par préfixe d'établissement ; Django vérifie le droit d'accès avant de délivrer une URL signée ou un jeton de Live.

## 8. Risques, limites et conditions de changement

**Hypothèses fragiles** : 100 % de participation et 2,5 Mbps par étudiant sont des valeurs hautes ; à 60 % de participation, les données (et la part variable) baissent d'environ 40 %. Les tarifs évoluent.

**Principaux risques** : dépendance à un fournisseur (atténuée par LiveKit open source) ; facture imprévue en cas de pic (prévoir des alertes de budget) ; charge d'exploitation de l'auto-hébergé ; coût de lecture dans la région des étudiants (à vérifier).

**Ce qui ferait changer la solution** :
- Besoin de tableau blanc et d'outils de classe prêts à l'emploi → **BigBlueButton**.
- Exigences de souveraineté ou de localisation des données → **auto-hébergé** dans la région voulue.
- Personne pour exploiter les serveurs → rester sur **service externe**.
- Usage faible (moins de ~50 sessions/mois) → service externe plus économique.
- Tarifs régionaux d'un service vidéo trop élevés pour nos étudiants → **R2 + CDN**.

## 9. Sources et vérification

Tarifs publics consultés (30–31/10/2026) : LiveKit Cloud (livekit.com/pricing : plans Ship 50 $ et Scale 500 $), Cloudflare R2 (developers.cloudflare.com/r2/pricing), Cloudflare Stream (developers.cloudflare.com/stream/pricing), Mux et Bunny Stream (comparatifs tiers, à confirmer sur mux.com/pricing et bunny.net), AWS S3/CloudFront (comparatif tiers, à confirmer sur aws.amazon.com), Hetzner (serveurs dédiés ~66–104 €/mois d'après des annonces de forums, hausses de prix en 2026 : docs.hetzner.com), BigBlueButton (docs.bigbluebutton.org : 8 cœurs et 16 Go recommandés ; ~200 utilisateurs par serveur d'après des documents communautaires).

**Comment vérifier les données manquantes** : relire les pages tarifaires officielles avant la décision, utiliser les calculateurs des fournisseurs, demander un devis, et faire un **test de charge** avec 31 participants avant d'engager un volume.
