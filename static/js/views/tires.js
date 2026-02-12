
// ========== TIRES MODULE - TIRE MANAGEMENT FROM EXCEL ==========

// Global state for tire data
let tiresState = {
    data: [],
    cuentas: [],
    selectedCuenta: null
};

function renderTiresView() {
    // Schedule data load after DOM is ready
    setTimeout(() => loadTiresData(), 100);

    return `
        <div class="tires-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 style="margin:0; font-size: 1.75rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 0.75rem;">
                    <span style="background: linear-gradient(135deg, #1e293b, #475569); color: white; width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🛞</span>
                    Control de Llantas
                </h1>
                <p style="color: #64748b; font-size: 0.9rem; margin-top: 0.5rem;">Estado de llantas de la flota - Datos desde archivo Excel</p>
            </div>
            <div style="display: flex; gap: 0.75rem; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label style="font-size: 0.8rem; font-weight: 600; color: #64748b;">Cuenta:</label>
                    <select id="cuenta-filter" onchange="filterByCuenta()" style="padding: 0.6rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; font-weight: 600; min-width: 200px;">
                        <option value="">Todas las cuentas</option>
                    </select>
                </div>
                <button onclick="loadTiresData()" class="btn btn-secondary" style="padding: 0.6rem 1.2rem; border-radius: 12px; font-weight: 600; border: 1px solid #e2e8f0; background: white; cursor: pointer;">
                    ↻ Actualizar
                </button>
            </div>
        </div>

        <!-- KPI Cards -->
        <div id="tires-kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); color: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3); position: relative; overflow: hidden;">
                <div style="position: absolute; right: -15px; top: -15px; font-size: 5rem; opacity: 0.15;">⚠️</div>
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; opacity: 0.9;">Críticas (≤4mm)</div>
                <div id="kpi-tires-critical" style="font-size: 2.5rem; font-weight: 800; margin: 0.25rem 0;">--</div>
                <div style="font-size: 0.7rem; opacity: 0.8;">Unidades con llantas críticas</div>
            </div>
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3); position: relative; overflow: hidden;">
                <div style="position: absolute; right: -15px; top: -15px; font-size: 5rem; opacity: 0.15;">👀</div>
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; opacity: 0.9;">Atención (5-6mm)</div>
                <div id="kpi-tires-warning" style="font-size: 2.5rem; font-weight: 800; margin: 0.25rem 0;">--</div>
                <div style="font-size: 0.7rem; opacity: 0.8;">Unidades en observación</div>
            </div>
            <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3); position: relative; overflow: hidden;">
                <div style="position: absolute; right: -15px; top: -15px; font-size: 5rem; opacity: 0.15;">✅</div>
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; opacity: 0.9;">Buen Estado (>6mm)</div>
                <div id="kpi-tires-good" style="font-size: 2.5rem; font-weight: 800; margin: 0.25rem 0;">--</div>
                <div style="font-size: 0.7rem; opacity: 0.8;">Unidades en buenas condiciones</div>
            </div>
            <div style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); color: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3); position: relative; overflow: hidden;">
                <div style="position: absolute; right: -15px; top: -15px; font-size: 5rem; opacity: 0.15;">🚛</div>
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; opacity: 0.9;">Total Unidades</div>
                <div id="kpi-tires-total" style="font-size: 2.5rem; font-weight: 800; margin: 0.25rem 0;">--</div>
                <div style="font-size: 0.7rem; opacity: 0.8;">Unidades monitoreadas</div>
            </div>
        </div>

        <!-- Legend -->
        <div class="card" style="border-radius: 16px; padding: 1rem 1.5rem; margin-bottom: 2rem; background: #f8fafc; display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                <div style="width: 24px; height: 24px; border-radius: 6px; background: #ef4444; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.7rem;">≤4</div>
                <span style="font-weight: 600; color: #ef4444;">Crítico (≤4mm)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                <div style="width: 24px; height: 24px; border-radius: 6px; background: #f59e0b; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.7rem;">5-6</div>
                <span style="font-weight: 600; color: #f59e0b;">Atención (5-6mm)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                <div style="width: 24px; height: 24px; border-radius: 6px; background: #22c55e; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.7rem;">>6</div>
                <span style="font-weight: 600; color: #22c55e;">Bueno (>6mm)</span>
            </div>
        </div>

        <!-- Top 10 Most Critical Units -->
        <div class="chart-card" style="border-radius: 20px; border: 2px solid #fecaca; background: linear-gradient(135deg, #fef2f2 0%, #fff 100%); padding: 1.5rem; margin-bottom: 2rem;">
            <div class="chart-header" style="margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #ef4444, #dc2626); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">🚨</div>
                    <div>
                        <span style="font-weight: 800; color: #1e293b; font-size: 1.1rem; display: block;">Top 10 Unidades Más Críticas</span>
                        <span style="font-size: 0.75rem; color: #64748b;">Ordenadas por menor profundidad promedio</span>
                    </div>
                </div>
                <span style="font-size: 0.7rem; color: white; background: linear-gradient(135deg, #ef4444, #dc2626); padding: 6px 14px; border-radius: 20px; font-weight: 700;">ACCIÓN REQUERIDA</span>
            </div>
            <div id="top-critical-units" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
                <p class="loading" style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">Analizando unidades...</p>
            </div>
        </div>

        <!-- Tire Visual Map -->
        <div class="chart-card" style="border-radius: 20px; border: 1px solid #e2e8f0; background: white; padding: 1.5rem; margin-bottom: 2rem;">
            <div class="chart-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: #1e293b; font-size: 1.1rem;">🗺️ Mapa Visual de Llantas por Unidad</span>
                <span id="units-count" style="font-size: 0.75rem; color: #64748b;"></span>
            </div>
            <div id="tires-visual-map" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
                <p class="loading" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #94a3b8;">Cargando datos de llantas...</p>
            </div>
        </div>
    `;
}

async function loadTiresData() {
    console.log('🛞 Loading tire data from Excel...');

    try {
        const response = await api.getLlantasExcel(tiresState.selectedCuenta);
        tiresState.data = response.data || [];
        tiresState.cuentas = response.cuentas || [];

        // Populate cuenta filter dropdown
        const cuentaFilter = document.getElementById('cuenta-filter');
        if (cuentaFilter && tiresState.cuentas.length > 0) {
            cuentaFilter.innerHTML = '<option value="">Todas las cuentas</option>' +
                tiresState.cuentas.map(c =>
                    `<option value="${c}" ${tiresState.selectedCuenta === c ? 'selected' : ''}>${c}</option>`
                ).join('');
        }

        // Update KPIs
        const summary = response.summary || {};
        updateElement('kpi-tires-critical', summary.critical || 0);
        updateElement('kpi-tires-warning', summary.warning || 0);
        updateElement('kpi-tires-good', summary.good || 0);
        updateElement('kpi-tires-total', summary.total || 0);
        updateElement('units-count', `${summary.total || 0} unidades encontradas`);

        // Calculate average depth for each unit and render Top 10
        renderTop10Critical(tiresState.data);

        // Render visual map
        renderTiresVisualMap(tiresState.data);

        console.log('🛞 Tire data loaded:', tiresState.data.length, 'units');

    } catch (error) {
        console.error('Error loading tire data:', error);
        const visualMap = document.getElementById('tires-visual-map');
        if (visualMap) {
            visualMap.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #ef4444;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                    <div style="font-weight: 600;">Error al cargar datos de llantas</div>
                    <div style="font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">${error.message || 'Verifica que el archivo Llantas.xlsx esté disponible'}</div>
                    <button onclick="loadTiresData()" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Reintentar</button>
                </div>
            `;
        }
        const topCritical = document.getElementById('top-critical-units');
        if (topCritical) {
            topCritical.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #94a3b8;">No hay datos disponibles</p>';
        }
    }
}

function renderTop10Critical(data) {
    const container = document.getElementById('top-critical-units');
    if (!container) return;

    // Calculate average depth for each unit
    const unitsWithAvg = data.map(unit => {
        const tires = unit.tires || {};
        const depths = Object.values(tires)
            .map(t => t.mm)
            .filter(mm => mm !== null && mm !== undefined);

        const avgDepth = depths.length > 0
            ? depths.reduce((a, b) => a + b, 0) / depths.length
            : 999; // If no data, put at the end

        const minDepth = depths.length > 0 ? Math.min(...depths) : null;

        return {
            ...unit,
            avgDepth,
            minDepth,
            tiresCount: depths.length
        };
    });

    // Sort by average depth (lowest first = most critical)
    const top10 = unitsWithAvg
        .filter(u => u.avgDepth < 999) // Filter out units with no data
        .sort((a, b) => a.avgDepth - b.avgDepth)
        .slice(0, 10);

    if (top10.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #10b981;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
                <div style="font-weight: 600;">No hay unidades críticas</div>
                <div style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">Todas las unidades están en buen estado</div>
            </div>
        `;
        return;
    }

    container.innerHTML = top10.map((unit, index) => {
        const avgDepth = unit.avgDepth.toFixed(1);
        const minDepth = unit.minDepth !== null ? unit.minDepth.toFixed(1) : 'N/A';

        // Determine severity colors
        let bgColor, borderColor, textColor, statusLabel, statusBg;
        if (unit.avgDepth <= 4) {
            bgColor = '#fef2f2';
            borderColor = '#ef4444';
            textColor = '#dc2626';
            statusLabel = 'CRÍTICO';
            statusBg = '#ef4444';
        } else if (unit.avgDepth <= 6) {
            bgColor = '#fffbeb';
            borderColor = '#f59e0b';
            textColor = '#d97706';
            statusLabel = 'ATENCIÓN';
            statusBg = '#f59e0b';
        } else {
            bgColor = '#f0fdf4';
            borderColor = '#22c55e';
            textColor = '#16a34a';
            statusLabel = 'BUENO';
            statusBg = '#22c55e';
        }

        return `
            <div style="background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 16px; padding: 1rem; display: flex; align-items: center; gap: 1rem;">
                <!-- Ranking -->
                <div style="width: 36px; height: 36px; border-radius: 50%; background: ${statusBg}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1rem; flex-shrink: 0;">
                    ${index + 1}
                </div>
                
                <!-- Info -->
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; flex-wrap: wrap;">
                        <div>
                            <div style="font-weight: 800; color: #1e293b; font-size: 1rem;">ECO ${unit.eco_sap || 'N/A'}</div>
                            <div style="font-size: 0.7rem; color: #64748b;">Placa: ${unit.placa || 'N/A'}</div>
                        </div>
                        <span style="font-size: 0.65rem; color: white; background: ${statusBg}; padding: 3px 8px; border-radius: 12px; font-weight: 700;">${statusLabel}</span>
                    </div>
                    
                    <!-- Metrics -->
                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                        <div style="text-align: center;">
                            <div style="font-size: 1.25rem; font-weight: 800; color: ${textColor};">${avgDepth}</div>
                            <div style="font-size: 0.6rem; color: #94a3b8; text-transform: uppercase;">Promedio mm</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 1.25rem; font-weight: 800; color: ${unit.minDepth <= 4 ? '#ef4444' : textColor};">${minDepth}</div>
                            <div style="font-size: 0.6rem; color: #94a3b8; text-transform: uppercase;">Mínimo mm</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 1.25rem; font-weight: 800; color: #64748b;">${unit.critical_count || 0}</div>
                            <div style="font-size: 0.6rem; color: #94a3b8; text-transform: uppercase;">Críticas</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function filterByCuenta() {
    const filter = document.getElementById('cuenta-filter');
    tiresState.selectedCuenta = filter ? filter.value || null : null;
    loadTiresData();
}

function renderTiresVisualMap(data) {
    const visualMap = document.getElementById('tires-visual-map');
    if (!visualMap) return;

    if (!data || data.length === 0) {
        visualMap.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #94a3b8;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                <div style="font-weight: 600;">No se encontraron unidades</div>
                <div style="font-size: 0.85rem; margin-top: 0.5rem;">Selecciona otra cuenta o verifica los datos</div>
            </div>
        `;
        return;
    }

    visualMap.innerHTML = data.map(unit => renderUnitTireCard(unit)).join('');
}

function renderUnitTireCard(unit) {
    // Determine overall status styling
    const statusStyles = {
        critical: { bg: '#fef2f2', border: '#fecaca', badge: '#ef4444', badgeBg: '#fee2e2', label: '⛔ Crítico' },
        warning: { bg: '#fffbeb', border: '#fde68a', badge: '#f59e0b', badgeBg: '#fef3c7', label: '⚠️ Alerta' },
        good: { bg: '#f0fdf4', border: '#bbf7d0', badge: '#22c55e', badgeBg: '#dcfce7', label: '✅ OK' }
    };
    const style = statusStyles[unit.overall_status] || statusStyles.good;

    // Get tire data for each position
    const tires = unit.tires || {};

    // Map position columns to display positions
    // Layout:  1  2    (front)
    //         34 56    (rear)
    const pos1 = tires['pos1'] || tires['Pos1'] || { mm: null, color: '#94a3b8', label: 'N/A' };
    const pos2 = tires['pos2'] || tires['Pos2'] || { mm: null, color: '#94a3b8', label: 'N/A' };
    const pos3 = tires['pos3'] || tires['Pos3'] || { mm: null, color: '#94a3b8', label: 'N/A' };
    const pos4 = tires['pos4'] || tires['Pos4'] || { mm: null, color: '#94a3b8', label: 'N/A' };
    const pos5 = tires['pos5'] || tires['Pos5'] || { mm: null, color: '#94a3b8', label: 'N/A' };
    const pos6 = tires['pos6'] || tires['Pos6'] || { mm: null, color: '#94a3b8', label: 'N/A' };

    return `
        <div style="background: ${style.bg}; border: 2px solid ${style.border}; border-radius: 20px; padding: 1.25rem; transition: all 0.2s; hover:transform:translateY(-2px);">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                    <div style="font-weight: 800; color: #1e293b; font-size: 1.1rem;">ECO ${unit.eco_sap || 'N/A'}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">Placa: ${unit.placa || 'N/A'}</div>
                    ${unit.cuenta ? `<div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">${unit.cuenta}</div>` : ''}
                </div>
                <div style="font-size: 0.75rem; padding: 4px 12px; border-radius: 20px; font-weight: 700; background: ${style.badgeBg}; color: ${style.badge};">
                    ${style.label}
                </div>
            </div>
            
            <!-- Truck Tire Diagram -->
            <div style="background: white; border-radius: 12px; padding: 1rem; border: 1px solid ${style.border};">
                <!-- Front axle label -->
                <div style="text-align: center; font-size: 0.65rem; color: #94a3b8; font-weight: 600; margin-bottom: 4px;">DELANTERO</div>
                
                <!-- Front tires: 1 2 -->
                <div style="display: flex; justify-content: center; gap: 2rem; margin-bottom: 1rem;">
                    ${renderTireBox(pos1, '1')}
                    ${renderTireBox(pos2, '2')}
                </div>
                
                <!-- Truck body representation -->
                <div style="height: 8px; background: linear-gradient(90deg, #e2e8f0, #cbd5e1, #e2e8f0); border-radius: 4px; width: 60%; margin: 0 auto 1rem;"></div>
                
                <!-- Rear axle label -->
                <div style="text-align: center; font-size: 0.65rem; color: #94a3b8; font-weight: 600; margin-bottom: 4px;">TRASERO</div>
                
                <!-- Rear tires: 34 56 -->
                <div style="display: flex; justify-content: center; gap: 0.75rem;">
                    <div style="display: flex; gap: 4px;">
                        ${renderTireBox(pos3, '3')}
                        ${renderTireBox(pos4, '4')}
                    </div>
                    <div style="width: 20px;"></div>
                    <div style="display: flex; gap: 4px;">
                        ${renderTireBox(pos5, '5')}
                        ${renderTireBox(pos6, '6')}
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 0.7rem; color: #64748b;">
                    📅 ${unit.fecha || 'Sin fecha'}
                </div>
                ${unit.critical_count > 0 ? `<div style="font-size: 0.7rem; color: #ef4444; font-weight: 700;">⚠️ ${unit.critical_count} críticas</div>` : ''}
                ${unit.warning_count > 0 && unit.critical_count === 0 ? `<div style="font-size: 0.7rem; color: #f59e0b; font-weight: 700;">👀 ${unit.warning_count} en observación</div>` : ''}
            </div>
        </div>
    `;
}

function renderTireBox(tire, position) {
    const mm = tire.mm !== null && tire.mm !== undefined ? tire.mm : '--';
    const color = tire.color || '#94a3b8';
    const label = tire.label || 'N/A';

    // Determine background and text based on status
    let bgColor = color;
    let textColor = 'white';

    // If unknown/null, use gray
    if (tire.status === 'unknown' || mm === '--') {
        bgColor = '#e2e8f0';
        textColor = '#64748b';
    }

    return `
        <div style="position: relative;">
            <div style="
                width: 40px; 
                height: 55px; 
                background: ${bgColor}; 
                border-radius: 6px; 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                color: ${textColor}; 
                font-weight: 800; 
                border: 3px solid ${bgColor}88; 
                box-shadow: 0 3px 8px ${bgColor}40;
                transition: transform 0.2s;
            " title="Posición ${position}: ${mm}mm - ${label}">
                <div style="font-size: 0.55rem; opacity: 0.8;">P${position}</div>
                <div style="font-size: 1rem; line-height: 1;">${mm === '--' ? '--' : Math.round(mm)}</div>
                <div style="font-size: 0.5rem; opacity: 0.8;">mm</div>
            </div>
        </div>
    `;
}
