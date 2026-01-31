/**
 * DermaCube PoC - Moteur de Simulation
 * Modèle physique pour la culture de peau avec interface air-liquide (ALI)
 */

class SkinCultureSimulation {
    constructor() {
        // Constantes du modèle physique
        this.constants = {
            // Volume optimal ALI (mL)
            targetVolume: 1.5,
            toleranceVolume: 0.1, // ±0.1 mL

            // Taux d'évaporation base (mL/heure) - 0.5-1 mL/jour = 0.02-0.04 mL/h
            baseEvaporationRate: 0.03,

            // Taux de consommation cellulaire (mL/heure) - 0.1-0.2 mL/jour = 0.004-0.008 mL/h
            baseCellConsumptionRate: 0.006,

            // Paramètres environnementaux optimaux
            optimalTemperature: 37.0,
            optimalCO2: 5.0,
            optimalHumidity: 95.0,
            optimalPH: 7.35,

            // Nombre de cellules (10^6)
            cellCount: 1.0,

            // Capacité maximale de la pompe (mL/min)
            maxPumpFlow: 0.1,
        };

        // État initial
        this.reset();
    }

    reset() {
        this.state = {
            // Temps simulé (heures)
            time: 0,

            // Volume de milieu actuel (mL)
            volume: this.constants.targetVolume,
            volumeWithoutControl: this.constants.targetVolume,

            // Paramètres environnementaux
            temperature: this.constants.optimalTemperature,
            co2: this.constants.optimalCO2,
            humidity: this.constants.optimalHumidity,
            ph: this.constants.optimalPH,

            // État de la pompe
            pumpFlow: 0,
            pumpActive: false,

            // Historique pour les graphiques
            history: {
                time: [],
                volumeWithControl: [],
                volumeWithoutControl: [],
                pumpFlow: [],
                temperature: [],
                co2: [],
                humidity: [],
                ph: [],
            },

            // Statistiques
            totalPumpVolume: 0,
            adjustmentCount: 0,

            // État de la culture
            cultureAlive: true,
            cultureAliveWithoutControl: true,
            failureTimeWithoutControl: null,

            // Scénario actif
            scenario: 'normal',
            incidentActive: false,
            incidentType: null,
        };

        // Contrôleur PID
        this.pid = {
            kp: 0.5,      // Gain proportionnel
            ki: 0.1,      // Gain intégral
            integralError: 0,
            lastError: 0,
        };

        // Enregistrer l'état initial dans l'historique
        this.recordHistory();
    }

    /**
     * Calcule le taux d'évaporation en fonction des conditions
     * kevap = baseRate * f(T) * f(H)
     */
    calculateEvaporationRate() {
        const { temperature, humidity } = this.state;
        const { baseEvaporationRate, optimalTemperature, optimalHumidity } = this.constants;

        // L'évaporation augmente avec la température
        const tempFactor = 1 + 0.05 * (temperature - optimalTemperature);

        // L'évaporation diminue avec l'humidité
        const humidityFactor = Math.max(0.5, (100 - humidity) / (100 - optimalHumidity));

        return baseEvaporationRate * tempFactor * humidityFactor;
    }

    /**
     * Calcule le taux de consommation cellulaire
     * kcons = baseRate * f(ncells) * f(viability)
     */
    calculateCellConsumptionRate() {
        const { baseCellConsumptionRate, cellCount } = this.constants;
        const viabilityFactor = this.state.cultureAlive ? 1 : 0;

        return baseCellConsumptionRate * cellCount * viabilityFactor;
    }

    /**
     * Contrôleur PID pour ajuster le débit de la pompe
     * Qpump(t) = Kp * e(t) + Ki * ∫e(τ)dτ
     */
    calculatePumpFlow(dt) {
        const error = this.constants.targetVolume - this.state.volume;

        // Mise à jour de l'erreur intégrale
        this.pid.integralError += error * dt;

        // Limiter l'erreur intégrale pour éviter le wind-up
        this.pid.integralError = Math.max(-1, Math.min(1, this.pid.integralError));

        // Calcul du débit de la pompe
        let pumpFlow = this.pid.kp * error + this.pid.ki * this.pid.integralError;

        // Limiter le débit aux capacités de la pompe
        pumpFlow = Math.max(0, Math.min(this.constants.maxPumpFlow, pumpFlow));

        // Ne pas pomper si le niveau est déjà optimal
        if (Math.abs(error) < 0.01) {
            pumpFlow = 0;
        }

        this.pid.lastError = error;

        return pumpFlow;
    }

    /**
     * Met à jour les paramètres environnementaux selon le scénario
     */
    updateEnvironment(dt) {
        const { scenario, incidentActive, time } = this.state;

        // Scénario normal : légères fluctuations
        if (scenario === 'normal' && !incidentActive) {
            // Fluctuations aléatoires mineures
            this.state.temperature += (Math.random() - 0.5) * 0.1;
            this.state.co2 += (Math.random() - 0.5) * 0.05;
            this.state.humidity += (Math.random() - 0.5) * 0.5;
            this.state.ph += (Math.random() - 0.5) * 0.01;
        }

        // Scénario évaporation accélérée
        if (scenario === 'evaporation') {
            this.state.humidity = Math.max(60, 70 + Math.sin(time * 0.5) * 5);
        }

        // Scénario panne de température
        if (scenario === 'temperature' && time > 4) {
            this.state.temperature = 25 + Math.random() * 2; // Température ambiante
        }

        // Scénario contamination (chute pH)
        if (scenario === 'contamination' && time > 2) {
            this.state.ph = Math.max(6.0, this.state.ph - 0.02 * dt);
        }

        // Incident manuel
        if (incidentActive) {
            switch (this.state.incidentType) {
                case 'humidity_drop':
                    this.state.humidity = Math.max(50, this.state.humidity - 2);
                    break;
                case 'temperature_spike':
                    this.state.temperature = Math.min(42, this.state.temperature + 0.5);
                    break;
                case 'ph_drop':
                    this.state.ph = Math.max(6.0, this.state.ph - 0.05);
                    break;
            }
        }

        // Stabiliser les valeurs dans des limites réalistes
        this.state.temperature = Math.max(20, Math.min(45, this.state.temperature));
        this.state.co2 = Math.max(0, Math.min(10, this.state.co2));
        this.state.humidity = Math.max(40, Math.min(100, this.state.humidity));
        this.state.ph = Math.max(5.5, Math.min(8.5, this.state.ph));
    }

    /**
     * Vérifie la viabilité de la culture
     */
    checkViability() {
        const { volume, temperature, ph, cultureAlive, cultureAliveWithoutControl, volumeWithoutControl } = this.state;
        const { targetVolume, toleranceVolume } = this.constants;

        // Conditions de mort de la culture avec DermaCube
        if (cultureAlive) {
            // Niveau ALI trop bas ou trop haut
            if (volume < targetVolume - toleranceVolume * 3 || volume > targetVolume + toleranceVolume * 3) {
                this.state.cultureAlive = false;
            }
            // Température létale
            if (temperature < 30 || temperature > 42) {
                this.state.cultureAlive = false;
            }
            // pH létal
            if (ph < 6.5 || ph > 7.8) {
                this.state.cultureAlive = false;
            }
        }

        // Conditions de mort sans DermaCube (plus strict car pas de contrôle)
        if (cultureAliveWithoutControl) {
            if (volumeWithoutControl < targetVolume - toleranceVolume * 2 ||
                volumeWithoutControl > targetVolume + toleranceVolume * 2) {
                this.state.cultureAliveWithoutControl = false;
                if (this.state.failureTimeWithoutControl === null) {
                    this.state.failureTimeWithoutControl = this.state.time;
                }
            }
        }
    }

    /**
     * Simule un pas de temps
     * dV/dt = -kevap - kcons + Qpump
     */
    step(dtHours) {
        if (!this.state.cultureAlive && !this.state.cultureAliveWithoutControl) {
            return; // Les deux cultures sont mortes
        }

        // Mettre à jour l'environnement
        this.updateEnvironment(dtHours);

        // Calculer les taux
        const evaporationRate = this.calculateEvaporationRate();
        const consumptionRate = this.calculateCellConsumptionRate();

        // Volume SANS contrôle DermaCube (référence)
        if (this.state.cultureAliveWithoutControl) {
            const dVWithout = (-evaporationRate - consumptionRate) * dtHours;
            this.state.volumeWithoutControl = Math.max(0, this.state.volumeWithoutControl + dVWithout);

            // Ajustement manuel simulé (2 fois par jour = toutes les 12h)
            if (Math.floor(this.state.time / 12) > Math.floor((this.state.time - dtHours) / 12)) {
                // Ajustement imprécis (±20% d'erreur)
                const targetAdjustment = this.constants.targetVolume - this.state.volumeWithoutControl;
                const actualAdjustment = targetAdjustment * (0.8 + Math.random() * 0.4);
                this.state.volumeWithoutControl += actualAdjustment;
            }
        }

        // Volume AVEC contrôle DermaCube
        if (this.state.cultureAlive) {
            // Calculer le débit de pompe nécessaire
            const pumpFlow = this.calculatePumpFlow(dtHours);
            this.state.pumpFlow = pumpFlow;
            this.state.pumpActive = pumpFlow > 0.001;

            // Évolution du volume
            const dV = (-evaporationRate - consumptionRate + pumpFlow * 60) * dtHours;
            this.state.volume = Math.max(0, this.state.volume + dV);

            // Comptabiliser le volume pompé
            this.state.totalPumpVolume += pumpFlow * 60 * dtHours;
            if (pumpFlow > 0.001) {
                this.state.adjustmentCount++;
            }
        }

        // Vérifier la viabilité
        this.checkViability();

        // Incrémenter le temps
        this.state.time += dtHours;

        // Enregistrer l'historique (toutes les 0.5h simulées)
        if (Math.floor(this.state.time * 2) > Math.floor((this.state.time - dtHours) * 2)) {
            this.recordHistory();
        }
    }

    /**
     * Enregistre l'état actuel dans l'historique
     */
    recordHistory() {
        const { history } = this.state;

        history.time.push(this.state.time);
        history.volumeWithControl.push(this.state.volume);
        history.volumeWithoutControl.push(this.state.volumeWithoutControl);
        history.pumpFlow.push(this.state.pumpFlow);
        history.temperature.push(this.state.temperature);
        history.co2.push(this.state.co2);
        history.humidity.push(this.state.humidity);
        history.ph.push(this.state.ph);

        // Limiter l'historique à 500 points
        const maxPoints = 500;
        Object.keys(history).forEach(key => {
            if (history[key].length > maxPoints) {
                history[key] = history[key].slice(-maxPoints);
            }
        });
    }

    /**
     * Change le scénario actif
     */
    setScenario(scenario) {
        this.state.scenario = scenario;
    }

    /**
     * Déclenche un incident
     */
    triggerIncident(type) {
        this.state.incidentActive = true;
        this.state.incidentType = type || 'humidity_drop';
    }

    /**
     * Arrête l'incident
     */
    stopIncident() {
        this.state.incidentActive = false;
        this.state.incidentType = null;
    }

    /**
     * Prédit la viabilité future (IA simplifiée)
     */
    predictViability(hoursAhead = 72) {
        // Facteurs de risque
        let riskScore = 0;

        // Écart par rapport au volume cible
        const volumeDeviation = Math.abs(this.state.volume - this.constants.targetVolume);
        riskScore += volumeDeviation * 50;

        // Écart température
        const tempDeviation = Math.abs(this.state.temperature - this.constants.optimalTemperature);
        riskScore += tempDeviation * 2;

        // Écart pH
        const phDeviation = Math.abs(this.state.ph - this.constants.optimalPH);
        riskScore += phDeviation * 20;

        // Humidité basse
        if (this.state.humidity < 85) {
            riskScore += (85 - this.state.humidity) * 0.5;
        }

        // Scénarios à risque
        if (this.state.scenario !== 'normal') {
            riskScore += 10;
        }

        // Calculer la viabilité prédite
        const viability = Math.max(0, Math.min(100, 100 - riskScore));

        return {
            viability: viability.toFixed(1),
            riskLevel: riskScore < 5 ? 'low' : riskScore < 15 ? 'medium' : 'high',
            nextAdjustment: this.predictNextAdjustment(),
        };
    }

    /**
     * Prédit le prochain ajustement nécessaire
     */
    predictNextAdjustment() {
        const evapRate = this.calculateEvaporationRate();
        const consRate = this.calculateCellConsumptionRate();
        const totalLossRate = evapRate + consRate; // mL/h

        const volumeMargin = this.state.volume - (this.constants.targetVolume - this.constants.toleranceVolume);

        if (totalLossRate <= 0) return "N/A";

        const hoursUntilAdjustment = volumeMargin / totalLossRate;

        if (hoursUntilAdjustment < 0.5) {
            return "Imminent";
        } else if (hoursUntilAdjustment < 1) {
            return `dans ${Math.round(hoursUntilAdjustment * 60)}min`;
        } else {
            return `dans ${hoursUntilAdjustment.toFixed(1)}h`;
        }
    }

    /**
     * Retourne l'état actuel pour l'affichage
     */
    getState() {
        return {
            ...this.state,
            prediction: this.predictViability(),
            levelDeviation: (this.state.volume - this.constants.targetVolume).toFixed(3),
            targetVolume: this.constants.targetVolume,
            toleranceVolume: this.constants.toleranceVolume,
        };
    }
}

// Export pour utilisation dans app.js
window.SkinCultureSimulation = SkinCultureSimulation;
