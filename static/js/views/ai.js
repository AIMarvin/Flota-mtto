
// ========== STEPPI AI COMMAND CENTER ==========

// Simulated data for the AI dashboard
const AI_CONFIG = {
    fleetHealth: 87,
    activeUnits: 24,
    predictedFailures: 3,
    maintenanceScheduled: 7,
    modelAccuracy: 94.2,
    units: [
        { id: 'ECO-001', risk: 'low' }, { id: 'ECO-002', risk: 'low' },
        { id: 'ECO-003', risk: 'medium' }, { id: 'ECO-004', risk: 'low' },
        { id: 'ECO-005', risk: 'high' }, { id: 'ECO-006', risk: 'low' },
        { id: 'ECO-007', risk: 'low' }, { id: 'ECO-008', risk: 'critical' },
        { id: 'ECO-009', risk: 'medium' }, { id: 'ECO-010', risk: 'low' },
        { id: 'ECO-011', risk: 'low' }, { id: 'ECO-012', risk: 'low' },
        { id: 'ECO-013', risk: 'medium' }, { id: 'ECO-014', risk: 'low' },
        { id: 'ECO-015', risk: 'low' }
    ],
    components: [
        { name: 'Sistema de Frenos', daysLeft: 12, total: 90, status: 'critical' },
        { name: 'Neumáticos Delanteros', daysLeft: 28, total: 120, status: 'warning' },
        { name: 'Aceite de Motor', daysLeft: 45, total: 60, status: 'good' },
        { name: 'Filtro de Aire', daysLeft: 67, total: 90, status: 'good' }
    ],
    anomalies: [
        { icon: '⚠️', title: 'Vibración Anómala Detectada', desc: 'ECO-008 presenta patrones de vibración inusuales en el eje trasero.', severity: 'warning', time: 'Hace 2 min' },
        { icon: '🔴', title: 'Alerta de Temperatura', desc: 'Sistema de refrigeración de ECO-005 reporta lecturas elevadas.', severity: 'critical', time: 'Hace 5 min' },
        { icon: '🔵', title: 'Mantenimiento Predictivo', desc: 'Se recomienda inspección de frenos para ECO-003 en los próximos 7 días.', severity: 'info', time: 'Hace 12 min' },
        { icon: '✅', title: 'Análisis Completado', desc: 'Modelo de predicción actualizado con datos de las últimas 24 horas.', severity: 'success', time: 'Hace 30 min' }
    ],
    chatResponses: {
        '¿Cuál es el estado de la flota?': 'Actualmente, la flota tiene un índice de salud del 87%. Hay 3 unidades que requieren atención prioritaria: ECO-005, ECO-008 y ECO-003. Te recomiendo programar mantenimiento preventivo para esta semana.',
        '¿Qué unidad necesita atención urgente?': 'La unidad ECO-008 requiere atención urgente. El modelo ha detectado patrones de vibración anómalos y existe un 78% de probabilidad de fallo en el sistema de suspensión en los próximos 5 días.',
        'Genera reporte de predicciones': 'Generando reporte de predicciones ML...\n\n📊 **Resumen Semanal:**\n- 3 fallas potenciales identificadas\n- 7 mantenimientos preventivos sugeridos\n- Ahorro estimado: $45,000 MXN\n- Precisión del modelo: 94.2%',
        'Optimizar rutas de mantenimiento': 'Analizando datos históricos y geolocalización...\n\n🗺️ **Ruta Óptima Sugerida:**\n1. ECO-008 (Taller Central) - Urgente\n2. ECO-005 (Taller Norte)\n3. ECO-003 (Taller Central)\n\nTiempo estimado: 4.5 horas\nReducción de traslados: 23%'
    }
};

// Main render function
function renderAIView() {
    return `
        <div class="ai-command-center">
            <!-- Header -->
            <div class="ai-header">
                <div class="ai-header-left">
                    <h1>
                        <span class="ai-icon">🧠</span>
                        Steppi AI Command Center
                    </h1>
                    <p>Inteligencia Artificial para Mantenimiento Predictivo de Flotas</p>
                </div>
                <div class="ai-header-right">
                    <div class="ai-version">Modelo: Transformer v4.2.0 | TensorFlow.js</div>
                    <div class="ai-status">
                        <span class="status-dot"></span>
                        Sistema Operativo - Procesando en tiempo real
                    </div>
                </div>
            </div>

            <!-- Prototype Banner -->
            <div class="ai-prototype-banner">
                🚧 <strong>Prototipo Funcional:</strong> Este módulo demuestra las capacidades de Machine Learning con datos simulados. Los modelos de producción se entrenarían con datos históricos reales de la flota.
            </div>

            <!-- Main Grid -->
            <div class="ai-grid">
                <!-- Column 1: Fleet Health & Status -->
                <div class="ai-col-1">
                    <div class="ai-card">
                        <div class="ai-card-header">
                            <span class="ai-card-title">❤️ Salud de Flota</span>
                            <span class="ai-card-badge badge-ml">ML Score</span>
                        </div>
                        <div class="health-gauge-container">
                            <div class="health-gauge">
                                <svg viewBox="0 0 100 100">
                                    <circle class="gauge-bg" cx="50" cy="50" r="42"></circle>
                                    <circle class="gauge-fill" cx="50" cy="50" r="42" 
                                        stroke="url(#healthGradient)"
                                        stroke-dasharray="264" 
                                        stroke-dashoffset="34"
                                        id="health-gauge-fill"></circle>
                                    <defs>
                                        <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stop-color="#10b981"/>
                                            <stop offset="50%" stop-color="#6366f1"/>
                                            <stop offset="100%" stop-color="#a855f7"/>
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div class="gauge-center">
                                    <div class="gauge-value" id="fleet-health-value">0</div>
                                    <div class="gauge-label">% Salud</div>
                                </div>
                            </div>
                        </div>
                        <div class="ai-stats-grid">
                            <div class="ai-stat">
                                <div class="ai-stat-value text-green" id="active-units">0</div>
                                <div class="ai-stat-label">Unidades Activas</div>
                            </div>
                            <div class="ai-stat">
                                <div class="ai-stat-value text-red" id="predicted-failures">0</div>
                                <div class="ai-stat-label">Fallas Predichas</div>
                            </div>
                            <div class="ai-stat">
                                <div class="ai-stat-value text-yellow" id="maintenance-scheduled">0</div>
                                <div class="ai-stat-label">Mtto. Programado</div>
                            </div>
                            <div class="ai-stat">
                                <div class="ai-stat-value text-purple" id="model-accuracy">0</div>
                                <div class="ai-stat-label">Precisión Modelo</div>
                            </div>
                        </div>
                    </div>

                    <!-- Neural Network Visualization -->
                    <div class="ai-card" style="margin-top: 1rem;">
                        <div class="ai-card-header">
                            <span class="ai-card-title">🔮 Red Neuronal</span>
                            <span class="ai-card-badge badge-neural">Deep Learning</span>
                        </div>
                        <div class="neural-viz">
                            <div class="neural-layer input">
                                ${[1, 2, 3, 4].map(() => '<div class="neural-node"></div>').join('')}
                            </div>
                            <div class="neural-layer hidden1">
                                ${[1, 2, 3, 4, 5, 6].map(() => '<div class="neural-node"></div>').join('')}
                            </div>
                            <div class="neural-layer hidden2">
                                ${[1, 2, 3, 4, 5, 6].map(() => '<div class="neural-node"></div>').join('')}
                            </div>
                            <div class="neural-layer output">
                                ${[1, 2, 3].map(() => '<div class="neural-node"></div>').join('')}
                            </div>
                        </div>
                        <p style="font-size: 0.75rem; color: #64748b; text-align: center; margin-top: 0.75rem;">
                            Arquitectura: 4 → 6 → 6 → 3 (Predicción de Fallas)
                        </p>
                    </div>
                </div>

                <!-- Column 2: Main Visualizations -->
                <div class="ai-col-2">
                    <!-- Risk Heatmap -->
                    <div class="ai-card">
                        <div class="ai-card-header">
                            <span class="ai-card-title">🗺️ Mapa de Riesgo de Unidades</span>
                            <span class="ai-card-badge badge-live">● LIVE</span>
                        </div>
                        <div class="risk-heatmap" id="risk-heatmap">
                            ${AI_CONFIG.units.map(u => `
                                <div class="heatmap-cell risk-${u.risk}" title="${u.id}">
                                    <span style="font-size: 0.8rem;">${u.id.split('-')[1]}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="heatmap-legend">
                            <div class="legend-item-ai">
                                <div class="legend-dot" style="background: linear-gradient(135deg, #10b981, #059669);"></div>
                                <span>Bajo</span>
                            </div>
                            <div class="legend-item-ai">
                                <div class="legend-dot" style="background: linear-gradient(135deg, #f59e0b, #d97706);"></div>
                                <span>Medio</span>
                            </div>
                            <div class="legend-item-ai">
                                <div class="legend-dot" style="background: linear-gradient(135deg, #ef4444, #dc2626);"></div>
                                <span>Alto</span>
                            </div>
                            <div class="legend-item-ai">
                                <div class="legend-dot" style="background: linear-gradient(135deg, #dc2626, #991b1b);"></div>
                                <span>Crítico</span>
                            </div>
                        </div>
                    </div>

                    <!-- Component RUL -->
                    <div class="ai-card" style="margin-top: 1rem;">
                        <div class="ai-card-header">
                            <span class="ai-card-title">⏱️ Vida Útil Restante (RUL)</span>
                            <span class="ai-card-badge badge-ml">Regresión</span>
                        </div>
                        <div class="rul-list" id="rul-list">
                            ${AI_CONFIG.components.map(c => `
                                <div class="rul-item">
                                    <div class="rul-header">
                                        <span class="rul-component">${c.name}</span>
                                        <span class="rul-days ${c.status}">${c.daysLeft} días</span>
                                    </div>
                                    <div class="rul-bar">
                                        <div class="rul-bar-fill ${c.status}" style="width: ${(c.daysLeft / c.total) * 100}%;"></div>
                                    </div>
                                    <div class="rul-details">
                                        <span>Confianza: ${85 + Math.floor(Math.random() * 12)}%</span>
                                        <span>Ciclo: ${c.total} días</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Model Insights -->
                    <div class="ai-card" style="margin-top: 1rem;">
                        <div class="ai-card-header">
                            <span class="ai-card-title">💡 Insights del Modelo</span>
                        </div>
                        <div class="model-insights">
                            <div class="insight-card">
                                <div class="insight-header">
                                    <span class="insight-title">🔧 Optimización de Rutas</span>
                                    <span class="insight-confidence confidence-high">95% Conf.</span>
                                </div>
                                <p class="insight-text">Las unidades ECO-005 y ECO-008 deberían rotar sus rutas asignadas. Esto podría extender la vida útil de neumáticos en un <strong>15%</strong> basado en patrones históricos.</p>
                                <button class="insight-action">✨ Aplicar Sugerencia</button>
                            </div>
                            <div class="insight-card">
                                <div class="insight-header">
                                    <span class="insight-title">📊 Patrón Detectado</span>
                                    <span class="insight-confidence confidence-medium">78% Conf.</span>
                                </div>
                                <p class="insight-text">Los reportes de frenos aumentan 40% los Lunes. Posible correlación con condiciones de la Ruta Norte durante el fin de semana.</p>
                                <button class="insight-action">🔍 Investigar</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Column 3: AI Interaction & Feed -->
                <div class="ai-col-3">
                    <!-- Live Anomaly Feed -->
                    <div class="ai-card">
                        <div class="ai-card-header">
                            <span class="ai-card-title">📡 Feed de Anomalías</span>
                            <span class="ai-card-badge badge-live">● LIVE</span>
                        </div>
                        <div class="live-feed" id="live-feed">
                            ${AI_CONFIG.anomalies.map(a => `
                                <div class="feed-item severity-${a.severity}">
                                    <span class="feed-icon">${a.icon}</span>
                                    <div class="feed-content">
                                        <div class="feed-title">${a.title}</div>
                                        <div class="feed-desc">${a.desc}</div>
                                        <div class="feed-time">${a.time}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Chat Interface -->
                    <div class="ai-card" style="margin-top: 1rem;">
                        <div class="ai-card-header">
                            <span class="ai-card-title">💬 Pregunta a Steppi</span>
                            <span class="ai-card-badge badge-neural">NLP</span>
                        </div>
                        <div class="chat-container">
                            <div class="chat-messages" id="chat-messages">
                                <div class="chat-message bot">
                                    ¡Hola! Soy Steppi AI 🤖 Tu asistente de mantenimiento predictivo. ¿En qué puedo ayudarte hoy?
                                </div>
                            </div>
                            <div class="chat-suggestions" id="chat-suggestions">
                                ${Object.keys(AI_CONFIG.chatResponses).map(q => `
                                    <button class="chat-suggestion" onclick="handleChatSuggestion('${q}')">${q}</button>
                                `).join('')}
                            </div>
                            <div class="chat-input-container">
                                <input type="text" class="chat-input" placeholder="Escribe tu pregunta..." id="chat-input" onkeypress="handleChatKeypress(event)">
                                <button class="chat-send" onclick="sendChatMessage()">➤</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Initialize the AI Dashboard with animations
function initAIDashboard() {
    // Animate counters
    animateCounter('fleet-health-value', AI_CONFIG.fleetHealth, '%');
    animateCounter('active-units', AI_CONFIG.activeUnits);
    animateCounter('predicted-failures', AI_CONFIG.predictedFailures);
    animateCounter('maintenance-scheduled', AI_CONFIG.maintenanceScheduled);
    animateCounter('model-accuracy', AI_CONFIG.modelAccuracy, '%');

    // Start live feed simulation
    startAnomalyFeed();
}

// Animate number counters
function animateCounter(elementId, target, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;

    let current = 0;
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = (Number.isInteger(target) ? Math.round(current) : current.toFixed(1)) + suffix;
    }, stepTime);
}

// Simulate live anomaly feed
function startAnomalyFeed() {
    const newAnomalies = [
        { icon: '🔔', title: 'Revisión Programada', desc: 'ECO-012 tiene revisión de aceite en 3 días.', severity: 'info' },
        { icon: '⚡', title: 'Consumo Elevado', desc: 'ECO-007 muestra consumo de combustible 15% sobre promedio.', severity: 'warning' },
        { icon: '✅', title: 'Mantenimiento Completado', desc: 'ECO-002 completó mantenimiento preventivo exitosamente.', severity: 'success' },
        { icon: '🔴', title: 'Presión de Llantas', desc: 'ECO-009 reporta presión baja en llanta trasera derecha.', severity: 'critical' },
        { icon: '📈', title: 'Modelo Recalibrado', desc: 'Precisión del modelo mejoró a 94.5% con nuevos datos.', severity: 'success' },
        { icon: '⚠️', title: 'Batería Baja', desc: 'ECO-014 tiene batería al 22% de capacidad.', severity: 'warning' }
    ];

    let index = 0;
    setInterval(() => {
        const feed = document.getElementById('live-feed');
        if (!feed) return;

        const anomaly = newAnomalies[index % newAnomalies.length];
        const newItem = document.createElement('div');
        newItem.className = `feed-item severity-${anomaly.severity}`;
        newItem.innerHTML = `
            <span class="feed-icon">${anomaly.icon}</span>
            <div class="feed-content">
                <div class="feed-title">${anomaly.title}</div>
                <div class="feed-desc">${anomaly.desc}</div>
                <div class="feed-time">Ahora</div>
            </div>
        `;

        feed.insertBefore(newItem, feed.firstChild);

        // Remove old items to prevent overflow
        while (feed.children.length > 8) {
            feed.removeChild(feed.lastChild);
        }

        index++;
    }, 8000); // New anomaly every 8 seconds
}

// Handle chat suggestion click
function handleChatSuggestion(question) {
    const messagesContainer = document.getElementById('chat-messages');
    const input = document.getElementById('chat-input');

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = question;
    messagesContainer.appendChild(userMsg);

    // Simulate typing delay
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-message bot';
        botMsg.innerHTML = AI_CONFIG.chatResponses[question] || 'Procesando tu consulta con el modelo de ML...';
        messagesContainer.appendChild(botMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 800);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    if (input) input.value = '';
}

// Handle chat keypress (Enter to send)
function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// Send chat message
function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');

    if (!input || !input.value.trim()) return;

    const question = input.value.trim();

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = question;
    messagesContainer.appendChild(userMsg);

    // Find best matching response or give generic
    let response = AI_CONFIG.chatResponses[question];
    if (!response) {
        // Check for partial matches
        const keys = Object.keys(AI_CONFIG.chatResponses);
        const match = keys.find(k => question.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
        response = match ? AI_CONFIG.chatResponses[match] :
            '🤔 Interesante pregunta. Basándome en los datos actuales de la flota:\n\n' +
            '• La salud general es del 87%\n' +
            '• Hay 3 unidades que requieren atención\n' +
            '• El modelo tiene 94.2% de precisión\n\n' +
            '¿Te gustaría que profundice en algún aspecto específico?';
    }

    // Simulate typing delay
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-message bot';
        botMsg.innerHTML = response;
        messagesContainer.appendChild(botMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1000);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    input.value = '';
}

// Called when the view is rendered
if (typeof window !== 'undefined') {
    window.initAIDashboard = initAIDashboard;
    window.handleChatSuggestion = handleChatSuggestion;
    window.handleChatKeypress = handleChatKeypress;
    window.sendChatMessage = sendChatMessage;
}
