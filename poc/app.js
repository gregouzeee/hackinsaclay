/**
 * DermaCube PoC - Application principale
 * Gestion de l'interface utilisateur et de la visualisation
 */

class DermaCubeApp {
    constructor() {
        // Initialiser la simulation
        this.simulation = new SkinCultureSimulation();

        // État de l'application
        this.isRunning = false;
        this.simulationSpeed = 10; // x10 par défaut
        this.lastUpdateTime = 0;
        this.animationFrameId = null;

        // Éléments DOM
        this.elements = {};

        // Graphique
        this.chart = null;

        // Initialiser
        this.init();
    }

    init() {
        this.cacheElements();
        this.setupChart();
        this.setupEventListeners();
        this.updateUI();
        this.addLogEntry('info', 'Système initialisé. Prêt pour la simulation.');
    }

    cacheElements() {
        this.elements = {
            // Time
            simulationTime: document.getElementById('simulation-time'),

            // Cards
            tempValue: document.getElementById('temp-value'),
            tempStatus: document.getElementById('temp-status'),
            tempCard: document.getElementById('temp-card'),
            co2Value: document.getElementById('co2-value'),
            co2Status: document.getElementById('co2-status'),
            phValue: document.getElementById('ph-value'),
            phStatus: document.getElementById('ph-status'),
            humidityValue: document.getElementById('humidity-value'),
            humidityStatus: document.getElementById('humidity-status'),
            humidityCard: document.getElementById('humidity-card'),

            // AI Panel
            nextAdjustment: document.getElementById('next-adjustment'),
            viability: document.getElementById('viability'),
            failureRisk: document.getElementById('failure-risk'),

            // Comparison
            withoutStatus: document.getElementById('without-status'),
            withStatus: document.getElementById('with-status'),

            // Pump
            pumpStatus: document.getElementById('pump-status'),
            pumpFlow: document.getElementById('pump-flow'),
            pumpBar: document.getElementById('pump-bar'),

            // Chamber visualization
            mediumLevel: document.getElementById('medium-level'),
            aliLine: document.getElementById('ali-line'),
            currentLevel: document.getElementById('current-level'),
            levelDeviation: document.getElementById('level-deviation'),

            // Controls
            btnPlay: document.getElementById('btn-play'),
            btnPause: document.getElementById('btn-pause'),
            btnIncident: document.getElementById('btn-incident'),
            btnReset: document.getElementById('btn-reset'),
            scenarioSelect: document.getElementById('scenario'),
            speedSlider: document.getElementById('speed'),
            speedValue: document.getElementById('speed-value'),

            // Log
            logContainer: document.getElementById('log-container'),
        };
    }

    setupChart() {
        const ctx = document.getElementById('ali-chart').getContext('2d');

        // Zone ALI optimale (1.4 - 1.6 mL)
        const targetMin = 1.4;
        const targetMax = 1.6;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Avec DermaCube',
                        data: [],
                        borderColor: '#3db4b4',
                        backgroundColor: 'rgba(61, 180, 180, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                    },
                    {
                        label: 'Sans DermaCube',
                        data: [],
                        borderColor: '#f44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(3)} mL`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            box1: {
                                type: 'box',
                                yMin: targetMin,
                                yMax: targetMax,
                                backgroundColor: 'rgba(76, 175, 80, 0.15)',
                                borderColor: 'rgba(76, 175, 80, 0.5)',
                                borderWidth: 1,
                            },
                            line1: {
                                type: 'line',
                                yMin: 1.5,
                                yMax: 1.5,
                                borderColor: 'rgba(76, 175, 80, 0.8)',
                                borderWidth: 2,
                                borderDash: [10, 5],
                                label: {
                                    content: 'ALI Optimal',
                                    enabled: true,
                                    position: 'end',
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Temps (heures)',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Volume (mL)',
                            font: { size: 12, weight: 'bold' }
                        },
                        min: 0,
                        max: 2,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                        }
                    }
                }
            },
            plugins: [{
                id: 'zoneALI',
                beforeDraw: (chart) => {
                    const ctx = chart.ctx;
                    const yAxis = chart.scales.y;
                    const xAxis = chart.scales.x;

                    // Dessiner la zone ALI optimale
                    const yTop = yAxis.getPixelForValue(targetMax);
                    const yBottom = yAxis.getPixelForValue(targetMin);

                    ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
                    ctx.fillRect(xAxis.left, yTop, xAxis.width, yBottom - yTop);

                    // Ligne cible
                    const yTarget = yAxis.getPixelForValue(1.5);
                    ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(xAxis.left, yTarget);
                    ctx.lineTo(xAxis.right, yTarget);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }]
        });
    }

    setupEventListeners() {
        // Boutons de contrôle
        this.elements.btnPlay.addEventListener('click', () => this.start());
        this.elements.btnPause.addEventListener('click', () => this.pause());
        this.elements.btnIncident.addEventListener('click', () => this.triggerIncident());
        this.elements.btnReset.addEventListener('click', () => this.reset());

        // Sélection du scénario
        this.elements.scenarioSelect.addEventListener('change', (e) => {
            this.simulation.setScenario(e.target.value);
            this.addLogEntry('info', `Scénario changé : ${e.target.options[e.target.selectedIndex].text}`);
        });

        // Vitesse de simulation
        this.elements.speedSlider.addEventListener('input', (e) => {
            this.simulationSpeed = parseInt(e.target.value);
            this.elements.speedValue.textContent = `x${this.simulationSpeed}`;
        });
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.elements.btnPlay.disabled = true;
        this.elements.btnPause.disabled = false;
        this.lastUpdateTime = performance.now();

        this.addLogEntry('success', 'Simulation démarrée');
        this.loop();
    }

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.elements.btnPlay.disabled = false;
        this.elements.btnPause.disabled = true;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        this.addLogEntry('info', 'Simulation en pause');
    }

    reset() {
        this.pause();
        this.simulation.reset();
        this.elements.scenarioSelect.value = 'normal';
        this.elements.logContainer.innerHTML = '';
        this.addLogEntry('info', 'Système réinitialisé. Prêt pour la simulation.');
        this.updateUI();
        this.updateChart();
    }

    triggerIncident() {
        const incidents = ['humidity_drop', 'temperature_spike', 'ph_drop'];
        const incidentNames = {
            'humidity_drop': 'Chute d\'humidité',
            'temperature_spike': 'Pic de température',
            'ph_drop': 'Chute de pH',
        };

        const randomIncident = incidents[Math.floor(Math.random() * incidents.length)];
        this.simulation.triggerIncident(randomIncident);

        this.addLogEntry('danger', `INCIDENT : ${incidentNames[randomIncident]}`);

        // L'incident dure 2h simulées puis s'arrête
        setTimeout(() => {
            this.simulation.stopIncident();
            this.addLogEntry('warning', 'Incident résolu par le système');
        }, 5000); // 5 secondes réelles
    }

    loop() {
        if (!this.isRunning) return;

        const now = performance.now();
        const deltaReal = (now - this.lastUpdateTime) / 1000; // secondes réelles
        this.lastUpdateTime = now;

        // Convertir en heures simulées
        // 1 seconde réelle = simulationSpeed heures simulées / 60
        const deltaSimulated = (deltaReal * this.simulationSpeed) / 60; // heures

        // Avancer la simulation
        this.simulation.step(deltaSimulated);

        // Mettre à jour l'UI
        this.updateUI();

        // Vérifier les événements
        this.checkEvents();

        // Mettre à jour le graphique moins fréquemment
        if (Math.random() < 0.1) {
            this.updateChart();
        }

        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }

    checkEvents() {
        const state = this.simulation.getState();

        // Vérifier échec culture sans contrôle
        if (!state.cultureAliveWithoutControl && state.failureTimeWithoutControl) {
            const failTime = state.failureTimeWithoutControl.toFixed(1);
            this.elements.withoutStatus.textContent = `Échec à ${failTime}h (ALI perdue)`;
        }

        // Alertes selon les paramètres
        if (state.humidity < 80 && !this._humidityAlertShown) {
            this.addLogEntry('warning', 'Alerte : Humidité basse détectée');
            this._humidityAlertShown = true;
        }

        if (state.temperature < 35 && !this._tempLowAlertShown) {
            this.addLogEntry('danger', 'Alerte critique : Température trop basse');
            this._tempLowAlertShown = true;
        }

        if (state.ph < 7.0 && !this._phAlertShown) {
            this.addLogEntry('warning', 'Alerte : pH en baisse - risque de contamination');
            this._phAlertShown = true;
        }

        // Ajustement de pompe significatif
        if (state.pumpFlow > 0.05 && !this._pumpHighShown) {
            this.addLogEntry('info', 'Ajustement automatique du niveau ALI en cours');
            this._pumpHighShown = true;
            setTimeout(() => { this._pumpHighShown = false; }, 10000);
        }
    }

    updateUI() {
        const state = this.simulation.getState();

        // Temps de simulation
        const hours = Math.floor(state.time);
        const minutes = Math.floor((state.time % 1) * 60);
        const seconds = Math.floor(((state.time % 1) * 60 % 1) * 60);
        this.elements.simulationTime.textContent =
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Cards
        this.updateCard('temp', state.temperature, 36, 38, '°C');
        this.updateCard('co2', state.co2, 4.8, 5.2, '%');
        this.updateCard('ph', state.ph, 7.2, 7.5, '');
        this.updateCard('humidity', state.humidity, 85, 95, '%');

        // IA Prédictive
        this.elements.nextAdjustment.textContent = state.prediction.nextAdjustment;
        this.elements.viability.textContent = `${state.prediction.viability}% à 72h`;
        this.elements.failureRisk.textContent = this.getRiskLabel(state.prediction.riskLevel);
        this.elements.failureRisk.className = `prediction-value ${state.prediction.riskLevel}`;

        // Comparaison
        if (state.cultureAlive) {
            this.elements.withStatus.textContent = `Stable à ${state.time.toFixed(1)}h`;
        } else {
            this.elements.withStatus.textContent = `Échec à ${state.time.toFixed(1)}h`;
            this.elements.withStatus.parentElement.className = 'comparison-item bad';
        }

        // Pompe
        this.elements.pumpStatus.textContent = state.pumpActive ? 'ACTIF' : 'VEILLE';
        this.elements.pumpStatus.className = `pump-status ${state.pumpActive ? '' : 'inactive'}`;
        this.elements.pumpFlow.textContent = `${(state.pumpFlow * 1000).toFixed(1)} µL/min`;
        this.elements.pumpBar.style.width = `${(state.pumpFlow / 0.1) * 100}%`;
        this.elements.pumpBar.className = `pump-bar ${state.pumpActive ? 'active' : ''}`;

        // Visualisation chambre
        const levelPercent = (state.volume / 2) * 100; // 2 mL = 100%
        this.elements.mediumLevel.style.height = `${Math.min(100, Math.max(0, levelPercent))}%`;

        // Position de la ligne ALI
        const aliPosition = 55 + (1.5 - state.volume) * 20; // Ajuster visuellement
        this.elements.aliLine.style.top = `${Math.min(90, Math.max(20, aliPosition))}%`;

        // Informations de niveau
        this.elements.currentLevel.textContent = `${state.volume.toFixed(2)} mL`;
        const deviation = parseFloat(state.levelDeviation);
        this.elements.levelDeviation.textContent = `${deviation >= 0 ? '+' : ''}${deviation.toFixed(3)} mL`;
        this.elements.levelDeviation.style.color = Math.abs(deviation) < 0.1 ? '#4caf50' : '#ff9800';
    }

    updateCard(type, value, min, max, unit) {
        const valueEl = this.elements[`${type}Value`];
        const statusEl = this.elements[`${type}Status`];

        valueEl.textContent = value.toFixed(1);

        let status, statusClass;
        if (value >= min && value <= max) {
            status = 'OK';
            statusClass = 'ok';
        } else if (value >= min - (max - min) * 0.5 && value <= max + (max - min) * 0.5) {
            status = 'Attention';
            statusClass = 'warning';
        } else {
            status = 'Critique';
            statusClass = 'danger';
        }

        statusEl.textContent = status;
        statusEl.className = `card-status ${statusClass}`;
    }

    getRiskLabel(level) {
        switch (level) {
            case 'low': return 'Faible';
            case 'medium': return 'Moyen';
            case 'high': return 'Élevé';
            default: return 'Inconnu';
        }
    }

    updateChart() {
        const state = this.simulation.getState();
        const history = state.history;

        // Mettre à jour les données du graphique
        this.chart.data.labels = history.time.map(t => t.toFixed(1));
        this.chart.data.datasets[0].data = history.volumeWithControl;
        this.chart.data.datasets[1].data = history.volumeWithoutControl;

        this.chart.update('none'); // 'none' pour éviter les animations
    }

    addLogEntry(type, message) {
        const state = this.simulation.getState();
        const hours = Math.floor(state.time);
        const minutes = Math.floor((state.time % 1) * 60);
        const seconds = Math.floor(((state.time % 1) * 60 % 1) * 60);
        const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `
            <span class="log-time">${timeStr}</span>
            <span class="log-message">${message}</span>
        `;

        this.elements.logContainer.appendChild(entry);
        this.elements.logContainer.scrollTop = this.elements.logContainer.scrollHeight;

        // Limiter le nombre d'entrées
        while (this.elements.logContainer.children.length > 50) {
            this.elements.logContainer.removeChild(this.elements.logContainer.firstChild);
        }
    }
}

// Initialiser l'application au chargement
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DermaCubeApp();
});
