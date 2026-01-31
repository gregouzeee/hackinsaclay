# DermaCube

**Plateforme intelligente pour la culture de peau**

*La culture de peau, enfin maîtrisée.*

---

## Le Problème

La culture de peau in vitro est devenue indispensable pour l'industrie cosmétique (tests sans animaux obligatoires depuis 2013 en UE), la recherche pharmaceutique et la médecine régénérative. Pourtant, **30 à 50% des cultures échouent**.

### Pourquoi ?

La cause principale est la difficulté à maintenir l'**interface air-liquide (ALI)** : la face supérieure de l'épiderme doit être exposée à l'air tandis que la face inférieure reste en contact avec le milieu nutritif.

```
┌─────────────────────────────┐
│      Air (différenciation)  │  ← Exposé à l'air
├─────────────────────────────┤
│         Épiderme            │
├─────────────────────────────┤
│          Derme              │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│      Membrane poreuse       │
├─────────────────────────────┤  ← Interface ALI critique
│     Milieu de culture       │  ← Niveau à maintenir constant
└─────────────────────────────┘
```

**Aujourd'hui**, les techniciens ajustent manuellement le niveau 1-2 fois par jour, ce qui est :
- Imprécis et variable selon l'opérateur
- Insuffisant (l'évaporation est continue : 0.5-1 mL/jour)
- Source de contamination (ouvertures répétées)

### Impact économique

Pour un laboratoire réalisant 100 cultures/an :
- **Taux d'échec** : 40%
- **Coût par culture** : 1 500€
- **Pertes annuelles** : 60 000€

---

## La Solution : DermaCube

DermaCube est la **première plateforme intégrée dédiée à la culture de peau**, combinant :

### 1. Enceinte de culture intelligente
- Régulation température 32-37°C (±0.1°C)
- Contrôle CO₂ à 5% (±0.1%)
- Maintien humidité >95%
- Format compact (40×40×50 cm)

### 2. Chambres microfluidiques (consommables)
- 6 puits avec membrane poreuse intégrée
- Capteur de niveau intégré
- Canaux de perfusion automatique
- Usage unique (stérilité garantie)

### 3. Logiciel et IA prédictive
- Dashboard temps réel
- **Contrôle automatique ALI** par algorithme PID
- Détection précoce des dérives
- Prédiction de viabilité
- Traçabilité complète

### Résultat

| Métrique | Sans DermaCube | Avec DermaCube |
|----------|----------------|----------------|
| Taux d'échec | 30-50% | <10% |
| Précision ALI | ±0.5 mL | ±0.05 mL |
| Interventions/jour | 2-3 manuelles | 0 (automatique) |
| Traçabilité | Partielle | Complète |

---

## Proof of Concept (PoC)

Le dossier `poc/` contient une **simulation web interactive** qui démontre :

1. **Le modèle physique** : évaporation, consommation cellulaire, régulation par pompe
2. **Le contrôleur PID** : maintien automatique du niveau ALI
3. **La comparaison** : visualisation avec/sans DermaCube
4. **L'IA prédictive** : estimation de viabilité et alertes précoces

### Lancer le PoC

```bash
# Ouvrir dans un navigateur
open poc/index.html
```

Ou simplement double-cliquer sur `poc/index.html`.

### Fonctionnalités du PoC

- **Dashboard temps réel** : Température, CO₂, pH, Humidité
- **Graphique interactif** : Évolution du niveau ALI
- **4 scénarios de démonstration** :
  1. Culture normale 72h
  2. Évaporation accélérée (humidité basse)
  3. Panne de température
  4. Contamination (chute pH)
- **Simulation d'incidents** : Tester la réactivité du système
- **Vitesse ajustable** : x1 à x100

### Documentation technique

Voir [poc/README.md](poc/README.md) pour :
- Le modèle physique détaillé
- Les équations de simulation
- L'architecture du code

---

## Marché

| Segment | Taille | Potentiel |
|---------|--------|-----------|
| Industrie cosmétique | 500+ entreprises EU | Très élevé |
| Pharma dermatologie | 200+ entreprises | Élevé |
| Recherche académique | 1000+ labos EU | Moyen |
| CROs | 100+ entreprises | Élevé |

**Marché global** : 516 M$ (2021) → 1.2 Md$ (2031) - TCAC 12-15%

---

## Modèle économique

### Sources de revenus

| Source | Part cible | Type |
|--------|------------|------|
| Équipement (enceinte) | 40% | One-shot |
| Consommables (chambres) | 35% | Récurrent |
| Logiciel SaaS | 25% | Récurrent |

### Tarification

- **Enceinte DermaCube** : 25 000€
- **Chambres microfluidiques** : 150€ / boîte de 10
- **Abonnement Pro** : 400€/mois

### LTV Client (5 ans)

- Équipement : 25 000€
- Consommables : 27 000€
- SaaS : 24 000€
- **Total : 76 000€**

---

## Roadmap

| Phase | Période | Objectifs |
|-------|---------|-----------|
| **Phase 1** | Q1-Q2 2026 | PoC logiciel, Prototype hardware v1 |
| **Phase 2** | Q3 2026 - Q2 2027 | Beta clients, Certification CE |
| **Phase 3** | Q3 2027+ | Lancement commercial France |
| **Phase 4** | 2028+ | Expansion Europe et international |

---

## Structure du projet

```
hackinsaclay/
├── README.md                 # Ce fichier
├── documents/
│   └── idée_startup.pdf      # Dossier projet complet
└── poc/
    ├── README.md             # Documentation technique du PoC
    ├── index.html            # Interface web
    ├── styles.css            # Styles (design DermaCube)
    ├── simulation.js         # Moteur de simulation physique
    └── app.js                # Logique d'application
```

---

## Technologies

### PoC
- HTML5 / CSS3 / JavaScript ES6
- Chart.js (visualisation)

### Produit futur
- **Hardware** : MCU + WiFi, capteurs, pompe péristaltique
- **Software** : React.js, Node.js, PostgreSQL
- **Cloud** : AWS/GCP pour l'IA et la traçabilité

---

## Équipe

*Hackathon Owl Lifesciences - Janvier 2026*

---

## Contact

DermaCube - La culture de peau, enfin maîtrisée.

---

## Licence

Projet développé dans le cadre du Hackathon Owl Lifesciences 2026.
