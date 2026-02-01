# DermaCube - Dossier Technique Complet

## Document de réponse aux questions techniques, capteurs et business

---

# PARTIE 1 : LA SIMULATION (PoC)

## 1.1 Principe de la simulation

Notre PoC est une **simulation numérique** qui modélise le comportement physique d'une culture de peau dans un puits de culture. Elle ne remplace pas un prototype hardware mais démontre :

1. La **validité du modèle physique** (évaporation, consommation, régulation)
2. L'**efficacité de l'algorithme PID** pour maintenir l'ALI
3. La **différence mesurable** entre une approche manuelle et automatisée

### Ce que simule le PoC

| Élément simulé | Modèle utilisé | Réalisme |
|----------------|----------------|----------|
| Évaporation | Équation dynamique f(T, H) | Élevé - basé sur littérature |
| Consommation cellulaire | Taux constant 0.006 mL/h | Moyen - simplifié |
| Régulation PID | Algorithme standard industriel | Élevé - code identique à un vrai système |
| Ajustement manuel | 2×/jour avec ±20% erreur | Réaliste - retours terrain |

### Ce que ne simule PAS le PoC

- Les délais de réponse des capteurs réels
- Le bruit de mesure
- Les défaillances mécaniques (pompe bouchée, etc.)
- La dynamique exacte des fluides dans les canaux microfluidiques

## 1.2 Équations du modèle

### Équation différentielle principale (Bilan de masse)

```
dV/dt = Q_pompe(t) - Q_evap(T, H) - Q_conso(N_cell)
```

| Terme | Signification | Valeur typique |
|-------|---------------|----------------|
| dV/dt | Variation du volume dans le puits | Variable |
| Q_pompe | Débit d'injection (contrôlé) | 0 à 0.1 mL/min |
| Q_evap | Perte par évaporation | 0.02-0.04 mL/h (normal) |
| Q_conso | Consommation métabolique | ~0.006 mL/h |

### Modèle d'évaporation dynamique

```
Q_evap = k_base × (1 + α(T - T_opt)) × max(0.5, (100 - H)/(100 - H_opt))
```

**Interprétation :**
- `k_base = 0.03 mL/h` : taux de base à conditions optimales
- `α = 0.05` : sensibilité à la température (+5% par °C au-dessus de 37°C)
- Le terme humidité : l'évaporation explose si H < 70%

**Exemple numérique :**
- Conditions optimales (37°C, 95% H) : Q_evap = 0.03 mL/h = **0.72 mL/jour**
- Humidité basse (37°C, 70% H) : Q_evap = 0.03 × 1 × 6 = **0.18 mL/h = 4.3 mL/jour** (6× plus rapide !)

### Algorithme PID

```
Q_pompe(t) = Kp × e(t) + Ki × ∫e(τ)dτ
```

| Paramètre | Valeur | Rôle |
|-----------|--------|------|
| Kp | 0.5 | Réaction proportionnelle à l'erreur actuelle |
| Ki | 0.1 | Correction des erreurs accumulées (dérive) |
| e(t) | V_cible - V_mesurée | Erreur instantanée |

**Saturation** : Q_pompe ∈ [0, 0.1] mL/min (pas de pompage négatif, limite physique)

## 1.3 Conditions simulées vs conditions réelles

### Valeurs cibles (identiques simulation/réel)

| Paramètre | Valeur cible | Tolérance | Source |
|-----------|--------------|-----------|--------|
| Volume ALI | 1.5 mL | ±0.1 mL | Standards culture ALI |
| Température | 37°C | ±0.5°C | Physiologie cellulaire |
| CO₂ | 5% | ±0.1% | Tamponnage pH |
| Humidité | 95% | >85% | Limiter évaporation |
| pH | 7.35 | 7.2-7.5 | Viabilité cellulaire |

### Différences simulation vs réalité

| Aspect | Simulation | Réalité | Impact |
|--------|------------|---------|--------|
| Mesure niveau | Instantanée, parfaite | Délai ~1s, bruit ±2% | Nécessite filtrage signal |
| Pompe | Réponse instantanée | Inertie, pulsations | PID à retuner |
| Évaporation | Modèle lissé | Micro-fluctuations | Négligeable |
| Température | Uniforme | Gradients possibles | À caractériser |
| Contamination | Non simulée | Risque réel | Stérilité à garantir |

### Hypothèses simplificatrices

1. **Mélange parfait** : On suppose que le milieu ajouté se mélange instantanément
2. **Cellules uniformes** : Consommation constante, pas de phases de croissance
3. **Pas de diffusion latérale** : Chaque puits est indépendant
4. **Capteurs idéaux** : Pas de dérive, pas de calibration nécessaire

## 1.4 Scénarios de démonstration

### Scénario 1 : Culture normale 72h

- **Conditions** : T=37°C, H=92%, CO₂=5%
- **Sans DermaCube** : Ajustements manuels 2×/jour, dérive progressive, échec vers 24h
- **Avec DermaCube** : Niveau stable, culture réussie >72h

### Scénario 2 : Évaporation accélérée

- **Conditions** : Humidité chute à 60-70%
- **Sans DermaCube** : Échec rapide (<8h)
- **Avec DermaCube** : Compensation automatique, le système augmente Q_pompe

### Scénario 3 : Panne température

- **Conditions** : T chute à 25°C après 4h (panne incubateur)
- **Sans DermaCube** : Non détectée, culture perdue
- **Avec DermaCube** : Alerte immédiate via monitoring

### Scénario 4 : Contamination (chute pH)

- **Conditions** : pH diminue progressivement (contamination bactérienne)
- **Sans DermaCube** : Détection tardive (visuelle)
- **Avec DermaCube** : Alerte prédictive précoce

---

# PARTIE 2 : COMPATIBILITÉ INCUBATEURS

## 2.1 Positionnement de DermaCube

**Point clé : DermaCube est un système COMPLÉMENTAIRE, pas un remplacement d'incubateur.**

```
┌─────────────────────────────────────────────────────────────┐
│                      INCUBATEUR                              │
│  (Gestion MACRO : T°, CO₂, Humidité de la chambre)          │
│                                                              │
│    ┌─────────────────────────────────────────────────────┐  │
│    │                   DermaCube                          │  │
│    │  (Gestion MICRO : niveau ALI dans chaque puits)     │  │
│    │                                                      │  │
│    │   [Puits 1] [Puits 2] [Puits 3]                     │  │
│    │   [Puits 4] [Puits 5] [Puits 6]                     │  │
│    └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 2.2 Types d'incubateurs et compatibilité

### Classification des incubateurs

| Type | Régulation | Capacité | Prix | Exemples |
|------|------------|----------|------|----------|
| **Incubateur CO₂ standard** | T°, CO₂, H₂O | 50-200 L | 5-15k€ | Thermo Heracell, Eppendorf |
| **Incubateur tri-gaz** | T°, CO₂, O₂, H₂O | 50-200 L | 15-30k€ | Thermo HERAcell VIOS |
| **Incubateur hypoxie** | T°, CO₂, O₂ (<5%), H₂O | 50-150 L | 20-40k€ | Baker Ruskinn |
| **Mini-incubateur** | T°, CO₂ | 10-30 L | 2-5k€ | Benchmark MyTemp |

### Compatibilité DermaCube

| Type d'incubateur | Compatible ? | Commentaires |
|-------------------|--------------|--------------|
| **CO₂ standard** | ✅ OUI | Configuration la plus courante |
| **Tri-gaz** | ✅ OUI | Compatible, O₂ géré par l'incubateur |
| **Hypoxie** | ✅ OUI | Attention : certaines cultures peau nécessitent normoxie |
| **Mini-incubateur** | ✅ OUI | Format compact adapté |
| **Sans CO₂** (étuve simple) | ⚠️ LIMITÉ | Possible si milieu tamponné (HEPES), non recommandé |

### Exigences minimales de l'incubateur hôte

| Paramètre | Minimum requis | Recommandé | Pourquoi |
|-----------|----------------|------------|----------|
| **Température** | 32-37°C stable | 37°C ±0.1°C | Métabolisme cellulaire |
| **CO₂** | 5% ±0.5% | 5% ±0.1% | Tamponnage pH du milieu |
| **Humidité** | >80% | >90% | Limiter évaporation |
| **Espace interne** | 20×20×15 cm | 30×30×20 cm | Loger le module DermaCube |
| **Passage câbles** | 1 port | 2 ports | Alimentation + données |

### Pourquoi DermaCube fonctionne avec TOUS les incubateurs CO₂ ?

1. **DermaCube ne régule PAS T°, CO₂, O₂** → Pas de conflit avec l'incubateur
2. **DermaCube régule UNIQUEMENT le niveau de liquide** → Paramètre non géré par l'incubateur
3. **Les capteurs DermaCube MONITORENT T°, H, pH** → Pour prédiction, pas pour régulation
4. **Interface passive** : DermaCube n'émet pas de chaleur significative, ne modifie pas l'atmosphère

## 2.3 Conditions limites pour la culture de peau

### La peau peut-elle survivre aux variations d'incubateur ?

| Paramètre | Plage viable | Plage optimale | Effet hors limites |
|-----------|--------------|----------------|-------------------|
| **Température** | 30-40°C | 36-37°C | <30°C : arrêt métabolisme / >40°C : stress thermique |
| **CO₂** | 2-10% | 4.5-5.5% | Hors limites : dérive pH |
| **O₂** | 1-21% | 18-21% (normoxie) | Hypoxie : certains protocoles l'utilisent |
| **pH** | 6.8-7.6 | 7.2-7.4 | Hors limites : mort cellulaire |
| **Humidité** | >60% | >90% | <60% : évaporation critique |

### Résilience de DermaCube face aux variations

| Scénario | Impact sur incubateur | Réponse DermaCube |
|----------|----------------------|-------------------|
| Ouverture porte (30s) | T° chute 2-3°C, H chute 10-20% | Détection, compensation anticipée |
| Panne CO₂ | pH dérive en 2-4h | Alerte utilisateur (monitoring) |
| Coupure électrique | Tout s'arrête | Batterie backup possible (option) |
| Humidité basse chronique | Évaporation ×3-6 | Compensation automatique (limite pompe) |

---

# PARTIE 3 : STRATÉGIE CAPTEURS

## 3.1 Architecture de monitoring

### Capteurs nécessaires

| Capteur | Fonction | Régulation ? | Précision requise |
|---------|----------|--------------|-------------------|
| **Niveau liquide** | Mesure volume ALI | ✅ OUI (critique) | ±50 µm |
| **Température** | Monitoring | ❌ NON (info) | ±0.5°C |
| **Humidité** | Monitoring | ❌ NON (info) | ±5% |
| **pH** | Monitoring | ❌ NON (info) | ±0.1 |

**Point clé** : DermaCube régule UNIQUEMENT le niveau. Les autres capteurs servent au monitoring et à l'IA prédictive.

## 3.2 Le défi du capteur de niveau

### Problème soulevé : incertitude des capteurs électriques

> "Capteur électrique difficile car on ne peut pas trop contrôler la distance donc beaucoup d'incertitude"

C'est un point critique. Analysons les options :

### Option 1 : Capteur capacitif

| Avantages | Inconvénients |
|-----------|---------------|
| Sans contact avec le liquide | Sensible à la distance électrode-liquide |
| Peu coûteux (5-20€) | Perturbé par les variations de permittivité |
| Compact | Nécessite calibration fréquente |

**Verdict** : Utilisable si électrodes intégrées à la chambre (distance fixe)

### Option 2 : Capteur optique (réflexion/transmission)

| Avantages | Inconvénients |
|-----------|---------------|
| Très précis (±10 µm possible) | Plus cher (20-50€) |
| Insensible aux propriétés du milieu | Sensible aux bulles, turbidité |
| Sans contact | Nécessite fenêtre optique propre |

**Verdict** : Meilleure option pour la précision requise

### Option 3 : Capteur par pesée

| Avantages | Inconvénients |
|-----------|---------------|
| Très précis | Encombrant |
| Mesure absolue | Sensible aux vibrations |
| Pas de contact | Coût élevé pour multi-puits |

**Verdict** : Trop contraignant pour un système compact

### Option 4 : Capteur ultrasonique

| Avantages | Inconvénients |
|-----------|---------------|
| Sans contact | Résolution limitée (~0.5 mm) |
| Robuste | Sensible à la température |
| Peu cher | Trop imprécis pour ALI |

**Verdict** : Insuffisant pour la précision requise

## 3.3 Notre recommandation : Capteur optique intégré

### Principe

```
        LED infrarouge
             │
             ▼
    ─────────────────── Surface liquide
             │
             ▼
       Photodiode
```

La position de l'interface air-liquide est détectée par la variation d'indice de réfraction.

### Intégration dans la chambre microfluidique

```
┌─────────────────────────────────────┐
│          Chambre de culture         │
│  ┌─────────────────────────────┐   │
│  │      Air                     │   │
│  │                              │   │
│  │ ─ ─ ─ ─ Interface ALI ─ ─ ─ │◄──┼── Capteur optique (LED+photodiode)
│  │                              │   │
│  │      Milieu                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Entrée milieu]    [Sortie trop-plein]
└─────────────────────────────────────┘
```

### Spécifications visées

| Paramètre | Valeur |
|-----------|--------|
| Type | Optique infrarouge (940 nm) |
| Résolution | ±50 µm |
| Fréquence mesure | 1 Hz (1 mesure/seconde) |
| Coût composants | ~10€ par puits |
| Intégration | Moulé dans la chambre PDMS/COC |

## 3.4 Monitoring atmosphérique (T°, H, pH)

### Capteurs dans l'AIR de l'incubateur (pas dans le liquide)

| Capteur | Technologie | Coût | Placement |
|---------|-------------|------|-----------|
| Température | Thermistance NTC | 2€ | Dans le module DermaCube |
| Humidité | Capacitif (SHT40) | 5€ | Dans le module DermaCube |
| CO₂ | NDIR (optionnel) | 30€ | Dans le module (si pas dispo incubateur) |

### Pourquoi dans l'air et pas dans le liquide ?

1. **Évite la contamination** : Pas de sonde immergée = pas de risque
2. **Corrélation validée** : T° air ≈ T° liquide à l'équilibre (±0.5°C)
3. **Maintenance réduite** : Pas de nettoyage/stérilisation des sondes
4. **Coût réduit** : Capteurs air moins chers que sondes immergées

### Mesure pH : cas particulier

Le pH du milieu est critique mais difficile à mesurer sans contact.

**Options :**
1. **Indicateur colorimétrique** : Le milieu contient du rouge de phénol (change de couleur)
   - Mesure optique possible (caméra + analyse couleur)
   - Non invasif

2. **Micro-électrode pH** : Précis mais invasif et cher

3. **Estimation par modèle** : Corrélation CO₂ atmosphérique → pH milieu
   - pH ≈ 7.4 - 0.1 × (CO₂% - 5%)

**Notre choix** : Estimation par modèle + alerte si couleur milieu change (détection visuelle ou optique)

---

# PARTIE 4 : STRATÉGIE BUSINESS

## 4.1 Analyse des marges et positionnement

### Coûts de production estimés

| Composant | Coût unitaire | Quantité | Total |
|-----------|---------------|----------|-------|
| **Module DermaCube (hardware)** | | | |
| Boîtier + mécanique | 500€ | 1 | 500€ |
| Électronique (MCU, drivers) | 100€ | 1 | 100€ |
| Pompe péristaltique | 200€ | 1 | 200€ |
| Capteurs (T°, H) | 50€ | 1 | 50€ |
| Assemblage + test | 150€ | 1 | 150€ |
| **Sous-total hardware** | | | **1 000€** |
| | | | |
| **Chambre microfluidique** | | | |
| Matière (PDMS/COC) | 2€ | 1 | 2€ |
| Capteur niveau optique | 10€ | 1 | 10€ |
| Fabrication + stérilisation | 3€ | 1 | 3€ |
| **Sous-total chambre** | | | **15€** |

### Scénarios de prix et marges

| Stratégie | Prix module | Marge module | Prix chambre | Marge chambre |
|-----------|-------------|--------------|--------------|---------------|
| **Premium (notre choix)** | 5 000€ | 80% | 50€ | 70% |
| Volume moyen | 2 500€ | 60% | 30€ | 50% |
| Low-cost | 1 500€ | 33% | 20€ | 25% |

### Pourquoi choisir le positionnement PREMIUM ?

| Argument | Explication |
|----------|-------------|
| **Marché B2B** | Les labos ont des budgets équipement, pas des contraintes grand public |
| **Valeur perçue** | Réduction des échecs = économies >> prix du système |
| **Différenciation** | Seule solution intégrée dédiée peau |
| **SAV et support** | Marge permet un support technique de qualité |
| **Barrière à l'entrée** | Prix bas attire la concurrence low-cost |

### Calcul de la valeur pour le client

**Économies annuelles pour un labo (100 cultures/an) :**
- Taux d'échec actuel : 40% → 40 échecs
- Coût par échec : 1 500€
- Pertes annuelles : **60 000€**

**Avec DermaCube (taux échec <10%) :**
- Échecs : 10
- Pertes : 15 000€
- **Économie : 45 000€/an**

**ROI du client :**
- Investissement : 5 000€ (module) + 3 000€/an (consommables)
- Économie : 45 000€/an
- **ROI : 525% la première année**

## 4.2 Segmentation client et offres

### Option A : Module seul (add-on pour incubateur existant)

```
┌─────────────────────────────────────────────────────┐
│  OFFRE "DermaCube Module"                           │
├─────────────────────────────────────────────────────┤
│  Module de régulation ALI                    5 000€ │
│  Pack 10 chambres microfluidiques              500€ │
│  Logiciel (licence perpétuelle)             inclus │
│  Formation (1/2 journée)                    inclus │
│  Garantie 2 ans                             inclus │
├─────────────────────────────────────────────────────┤
│  TOTAL                                       5 500€ │
└─────────────────────────────────────────────────────┘

Consommables récurrents :
- Pack 10 chambres : 500€ (besoin ~30-50/an = 1 500-2 500€/an)
```

**Cible** : Labos ayant déjà un incubateur CO₂
**Avantage** : Prix d'entrée bas, installation rapide
**Inconvénient** : Dépend de la qualité de l'incubateur existant

### Option B : Solution intégrée (mini-incubateur + DermaCube)

```
┌─────────────────────────────────────────────────────┐
│  OFFRE "DermaCube Station"                          │
├─────────────────────────────────────────────────────┤
│  Mini-incubateur CO₂ intégré                 8 000€ │
│  Module DermaCube                            5 000€ │
│  Pack 20 chambres microfluidiques            1 000€ │
│  Logiciel Pro (1 an inclus)                 inclus │
│  Installation + Formation                   inclus │
│  Garantie 3 ans                             inclus │
├─────────────────────────────────────────────────────┤
│  TOTAL                                      14 000€ │
└─────────────────────────────────────────────────────┘

Consommables récurrents :
- Pack 20 chambres : 1 000€
- Abonnement logiciel Pro : 2 000€/an
```

**Cible** : Nouveaux labos, labos voulant une solution clé-en-main
**Avantage** : Contrôle total de l'expérience, meilleure marge
**Inconvénient** : Prix plus élevé, logistique plus complexe

### Option C : Location / Pay-per-use

```
┌─────────────────────────────────────────────────────┐
│  OFFRE "DermaCube Flex"                             │
├─────────────────────────────────────────────────────┤
│  Location module                         500€/mois  │
│  Chambres incluses                      20/mois     │
│  Logiciel + Support                       inclus    │
│  Engagement minimum                      6 mois     │
├─────────────────────────────────────────────────────┤
│  Coût annuel                               6 000€   │
└─────────────────────────────────────────────────────┘
```

**Cible** : Startups, projets pilotes, CROs avec besoins variables
**Avantage** : Pas d'investissement initial, flexibilité
**Inconvénient** : Marge plus faible, gestion du parc locatif

## 4.3 Canaux de vente par segment

### Segment 1 : Laboratoires de recherche académique

| Caractéristique | Détail |
|-----------------|--------|
| Volume | 1-2 modules/labo |
| Décideur | Chef d'équipe / Directeur labo |
| Budget | Subventions, ANR, ERC |
| Cycle de vente | 3-6 mois (appels d'offres) |
| Offre adaptée | Module seul ou Location |
| Canal | Distributeurs scientifiques (Fisher, VWR) |

### Segment 2 : Industrie cosmétique

| Caractéristique | Détail |
|-----------------|--------|
| Volume | 5-20 modules/site |
| Décideur | Responsable R&D / Achats |
| Budget | Budget interne, ROI-driven |
| Cycle de vente | 6-12 mois |
| Offre adaptée | Solution intégrée (volume) |
| Canal | Vente directe + Partenariats |

### Segment 3 : CROs (Contract Research Organizations)

| Caractéristique | Détail |
|-----------------|--------|
| Volume | 10-50 modules |
| Décideur | Direction technique |
| Budget | Refacturé aux clients |
| Cycle de vente | 3-6 mois |
| Offre adaptée | Location ou Achat volume |
| Canal | Vente directe |

### Segment 4 : Hôpitaux / Centres de thérapie cellulaire

| Caractéristique | Détail |
|-----------------|--------|
| Volume | 1-5 modules |
| Décideur | Médecin responsable + Achats |
| Budget | Budget hospitalier, marchés publics |
| Cycle de vente | 12-24 mois |
| Offre adaptée | Solution intégrée (traçabilité GMP) |
| Canal | Vente directe + Appels d'offres |

## 4.4 Recommandation stratégique

### Phase 1 (Année 1-2) : Premium + Module seul

**Pourquoi :**
- Valider le produit avec des early adopters exigeants
- Maximiser la marge pour financer le développement
- Construire des références clients prestigieuses

**Cibles prioritaires :**
1. Labos cosmétiques (L'Oréal, LVMH, Pierre Fabre)
2. CROs spécialisés dermatologie
3. Labos académiques de référence (INSERM, CEA)

**Prix :**
- Module : 5 000€
- Chambres : 50€/unité

### Phase 2 (Année 3-4) : Élargissement gamme

- Lancer l'offre intégrée (DermaCube Station)
- Introduire l'offre Location pour les petits labos
- Développer le canal distributeurs

### Phase 3 (Année 5+) : Volume et international

- Réduction progressive des prix (économies d'échelle)
- Expansion Europe puis US
- Partenariats OEM avec fabricants d'incubateurs

---

# PARTIE 5 : RÉSUMÉ EXÉCUTIF

## Questions-réponses clés

### "À quel type d'incubateur DermaCube convient-il ?"

**Réponse** : DermaCube est compatible avec TOUS les incubateurs CO₂ standards. Il ne régule pas T°, CO₂ ou humidité (c'est le travail de l'incubateur), il régule uniquement le niveau de liquide dans chaque puits. C'est un système complémentaire, pas un remplacement.

Exigences minimales : T° stable 32-37°C, CO₂ 5%, Humidité >80%, espace 20×20×15 cm.

### "Comment gérez-vous la mesure de niveau avec les incertitudes des capteurs électriques ?"

**Réponse** : Nous avons écarté les capteurs capacitifs classiques à cause de leur sensibilité à la distance. Notre solution : un capteur optique infrarouge intégré dans la chambre microfluidique. La distance est fixe (moulée dans le plastique), ce qui élimine l'incertitude. Précision visée : ±50 µm.

Les autres capteurs (T°, H) mesurent l'AIR de l'incubateur (pas le liquide), ce qui évite les problèmes de contact et contamination.

### "Vendez-vous un produit premium ou volume ?"

**Réponse** : Positionnement PREMIUM. Raisons :
1. Marché B2B où la valeur économique (réduction des échecs) justifie le prix
2. Différenciation forte (seule solution intégrée dédiée peau)
3. Marge nécessaire pour financer R&D et support technique
4. ROI client >500% la première année

Prix : Module 5 000€, Chambres 50€/unité.

### "À qui vendez-vous ?"

**Réponse** :
- **Priorité 1** : Industrie cosmétique (obligation légale de tests sans animaux)
- **Priorité 2** : CROs (Contract Research Organizations)
- **Priorité 3** : Recherche académique (labos de référence)
- **Priorité 4** : Hôpitaux (thérapie cellulaire) - marché futur

### "Module seul ou machine complète avec incubateur ?"

**Réponse** : Les deux, selon le client.
- **Module seul** (5 000€) : Pour labos ayant déjà un incubateur → prix d'entrée bas, vente rapide
- **Solution intégrée** (14 000€) : Pour nouveaux labos ou clients voulant du clé-en-main → marge maximale

La majorité du marché initial = Module seul (les labos ont déjà des incubateurs).

---

*Document préparé pour le Hackathon Owl Lifesciences - Janvier 2026*
