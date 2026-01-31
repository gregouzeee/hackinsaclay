# DermaCube PoC - Documentation Technique

## Vue d'ensemble

Ce Proof of Concept (PoC) est une **simulation interactive** démontrant le fonctionnement de la plateforme DermaCube pour la culture de peau. Il illustre l'automatisation du maintien de l'interface air-liquide (ALI), élément critique pour la réussite des cultures de peau in vitro.

---

## Comment utiliser le PoC

### Lancement

1. Ouvrir le fichier `index.html` dans un navigateur moderne (Chrome, Firefox, Safari, Edge)
2. La simulation se charge automatiquement avec les valeurs initiales

### Contrôles

| Bouton | Action |
|--------|--------|
| **Play** | Démarre la simulation |
| **Pause** | Met en pause la simulation |
| **Incident** | Déclenche un incident aléatoire (chute humidité, pic température, chute pH) |
| **Reset** | Réinitialise la simulation à l'état initial |

### Paramètres

- **Scénario** : Choisir parmi 4 scénarios de démonstration
- **Vitesse** : Ajuster la vitesse de simulation (x1 à x100)

### Les 4 scénarios de démonstration

| # | Scénario | Description | Sans DermaCube | Avec DermaCube |
|---|----------|-------------|----------------|----------------|
| 1 | Culture normale 72h | Conditions standards | Échec ~24h (dérive ALI) | Stable >72h |
| 2 | Évaporation accélérée | Humidité basse (60-70%) | Échec <8h | Compensation automatique |
| 3 | Panne température | Chute à 25°C après 4h | Non détectée, culture perdue | Alerte immédiate |
| 4 | Contamination | Chute progressive du pH | Détection tardive | Alerte prédictive précoce |

---

## Architecture technique

```
┌─────────────────────────────────────────────────────────┐
│                    index.html                           │
│                 (Interface utilisateur)                 │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐          ┌───────────────┐
│   styles.css  │          │    app.js     │
│   (Design)    │          │  (Contrôleur) │
└───────────────┘          └───────┬───────┘
                                   │
                                   ▼
                          ┌───────────────┐
                          │ simulation.js │
                          │   (Modèle     │
                          │  physique)    │
                          └───────────────┘
```

### Fichiers

| Fichier | Rôle | Taille |
|---------|------|--------|
| `index.html` | Structure HTML du dashboard | ~9 KB |
| `styles.css` | Styles CSS (design DermaCube) | ~13 KB |
| `simulation.js` | Moteur de simulation physique | ~14 KB |
| `app.js` | Logique d'application et UI | ~18 KB |

### Dépendances externes

- **Chart.js** (CDN) : Bibliothèque de graphiques pour la visualisation temps réel

---

## Modèle physique de simulation

### Équation principale

Le niveau de milieu V(t) évolue selon l'équation différentielle :

```
dV/dt = -k_evap(T, H) - k_cons(n_cells) + Q_pump(t)
```

Où :
- **k_evap** : Taux d'évaporation (fonction de la température T et de l'humidité H)
- **k_cons** : Taux de consommation cellulaire (fonction du nombre de cellules)
- **Q_pump** : Débit de la pompe (variable de contrôle)

### Paramètres du modèle

#### Constantes physiques

| Paramètre | Valeur | Unité | Description |
|-----------|--------|-------|-------------|
| Volume cible ALI | 1.5 | mL | Niveau optimal de milieu |
| Tolérance | ±0.1 | mL | Marge acceptable |
| Taux évaporation base | 0.03 | mL/h | ~0.7 mL/jour à 95% humidité |
| Taux consommation base | 0.006 | mL/h | ~0.15 mL/jour pour 10⁶ cellules |
| Débit max pompe | 0.1 | mL/min | Capacité maximale |

#### Conditions optimales

| Paramètre | Valeur optimale | Plage acceptable |
|-----------|-----------------|------------------|
| Température | 37.0°C | 36-38°C |
| CO₂ | 5.0% | 4.8-5.2% |
| Humidité | 95% | 85-95% |
| pH | 7.35 | 7.2-7.5 |

### Calcul du taux d'évaporation

```javascript
k_evap = baseRate × f(T) × f(H)

f(T) = 1 + 0.05 × (T - T_optimal)     // Augmente avec la température
f(H) = max(0.5, (100 - H) / (100 - H_optimal))  // Diminue avec l'humidité
```

**Exemple** : À 37°C et 70% d'humidité
- f(T) = 1 + 0.05 × (37 - 37) = 1.0
- f(H) = (100 - 70) / (100 - 95) = 6.0
- k_evap = 0.03 × 1.0 × 6.0 = **0.18 mL/h** (évaporation 6× plus rapide)

### Contrôleur PID

Le système utilise un régulateur PID simplifié pour maintenir le niveau ALI :

```
Q_pump(t) = Kp × e(t) + Ki × ∫e(τ)dτ
```

Où :
- **e(t)** = V_cible - V_mesurée (erreur)
- **Kp** = 0.5 (gain proportionnel)
- **Ki** = 0.1 (gain intégral)

#### Fonctionnement

1. **Mesure** : Le capteur mesure le niveau actuel (1 mesure/minute simulée)
2. **Calcul erreur** : Différence entre niveau cible (1.5 mL) et niveau mesuré
3. **Commande** : Le PID calcule le débit de pompe nécessaire
4. **Action** : La pompe injecte du milieu pour compenser les pertes

```
┌──────────┐    Mesure    ┌────────────┐   Commande   ┌──────────┐
│ Capteur  │─────────────▶│ Contrôleur │─────────────▶│  Pompe   │
│ niveau   │              │    PID     │              │péristalt.│
└──────────┘              └────────────┘              └────┬─────┘
     ▲                                                     │
     │                    Milieu                           │
     └─────────────────────────────────────────────────────┘
                         Feedback
```

### Simulation "Sans DermaCube"

Pour comparaison, le PoC simule également une culture sans contrôle automatique :

- **Pas de régulation continue** du niveau ALI
- **Ajustement manuel simulé** : 2 fois par jour (toutes les 12h)
- **Imprécision** : ±20% d'erreur sur chaque ajustement manuel
- **Résultat** : Dérive progressive et échec de la culture

---

## IA Prédictive

### Calcul du score de risque

```javascript
riskScore = 0
riskScore += |V - V_cible| × 50        // Écart volume
riskScore += |T - T_optimal| × 2       // Écart température
riskScore += |pH - pH_optimal| × 20    // Écart pH
riskScore += max(0, 85 - Humidité) × 0.5  // Humidité basse
riskScore += 10 si scénario ≠ normal   // Scénario à risque
```

### Niveaux de risque

| Score | Niveau | Couleur |
|-------|--------|---------|
| < 5 | Faible | Vert |
| 5-15 | Moyen | Orange |
| > 15 | Élevé | Rouge |

### Viabilité prédite

```
Viabilité = max(0, min(100, 100 - riskScore))
```

### Prédiction prochain ajustement

Basée sur le taux de perte total et la marge disponible :

```javascript
tauxPerte = k_evap + k_cons
margeVolume = V_actuel - (V_cible - tolérance)
tempsAvantAjustement = margeVolume / tauxPerte
```

---

## Interface utilisateur

### Dashboard - Cartes de monitoring

Les 4 cartes affichent les paramètres critiques avec un code couleur :

| Status | Condition | Couleur |
|--------|-----------|---------|
| OK | Dans la plage optimale | Vert |
| Attention | Proche des limites | Orange |
| Critique | Hors limites | Rouge |

### Graphique temps réel

- **Axe X** : Temps simulé (heures)
- **Axe Y** : Volume de milieu (mL)
- **Courbe turquoise** : Niveau avec DermaCube (contrôlé)
- **Courbe rouge pointillée** : Niveau sans DermaCube (dérive)
- **Zone verte** : Plage ALI optimale (1.4-1.6 mL)

### Visualisation de la chambre

Représentation schématique de la chambre de culture :

```
┌─────────────────────────────┐
│      Air (différenciation)  │  ← Face exposée à l'air
├─────────────────────────────┤
│         Épiderme            │  ← Couche supérieure de peau
├─────────────────────────────┤
│          Derme              │  ← Couche inférieure
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│      Membrane poreuse       │  ← Support poreux
├─────────────────────────────┤
│                             │
│     Milieu de culture       │  ← Niveau contrôlé par DermaCube
│         (animé)             │
└─────────────────────────────┘
```

### Journal des événements

Log en temps réel des événements :
- **Info** (bleu) : Événements système
- **Succès** (vert) : Actions réussies
- **Attention** (orange) : Alertes mineures
- **Danger** (rouge) : Alertes critiques

---

## Technologies utilisées

| Composant | Technologie |
|-----------|-------------|
| Frontend | HTML5, CSS3, JavaScript ES6 |
| Visualisation | Chart.js |
| Style | CSS custom (variables CSS) |
| Simulation | JavaScript vanilla (calculs côté client) |

### Compatibilité navigateurs

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

## Structure du code

### simulation.js - Classe `SkinCultureSimulation`

```javascript
class SkinCultureSimulation {
    constructor()           // Initialise les constantes et l'état
    reset()                 // Réinitialise la simulation
    calculateEvaporationRate()    // Calcule k_evap
    calculateCellConsumptionRate() // Calcule k_cons
    calculatePumpFlow(dt)   // Contrôleur PID
    updateEnvironment(dt)   // Met à jour T, CO2, pH, H selon scénario
    checkViability()        // Vérifie si la culture est vivante
    step(dtHours)           // Avance la simulation d'un pas de temps
    predictViability()      // IA prédictive
    getState()              // Retourne l'état pour l'affichage
}
```

### app.js - Classe `DermaCubeApp`

```javascript
class DermaCubeApp {
    constructor()           // Initialise l'application
    init()                  // Cache les éléments DOM, setup chart
    setupChart()            // Configure Chart.js
    setupEventListeners()   // Attache les événements
    start() / pause() / reset()  // Contrôle simulation
    triggerIncident()       // Déclenche un incident
    loop()                  // Boucle principale (requestAnimationFrame)
    updateUI()              // Met à jour l'interface
    updateChart()           // Met à jour le graphique
    addLogEntry()           // Ajoute une entrée au journal
}
```

---

## Améliorations futures possibles

1. **Export des données** : CSV/JSON des historiques
2. **Mode multi-puits** : Simuler 6 puits indépendants
3. **Paramètres personnalisables** : Permettre de modifier les constantes
4. **Animations avancées** : Visualisation 3D de la chambre
5. **Mode hors-ligne** : Service Worker pour PWA
6. **Intégration API** : Connexion à un backend pour persistance

---

## Crédits

**DermaCube** - Hackathon Owl Lifesciences, Janvier 2026

*La culture de peau, enfin maîtrisée.*
