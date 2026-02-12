
// ========== REDESIGNED DASHBOARD VIEW (EXCEL DRIVEN) - PREMIUM EDITION V2 ==========

function renderDashboardWithKPIs() {
    return `
        <div class="dashboard-header-container" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 style="margin:0; font-size: 1.75rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Intelligence</span> Dashboard
                </h1>
                <p style="color: #64748b; font-size: 0.9rem;">Análisis de Mantenimiento Externo (SETTEPI MONTERREY)</p>
            </div>
            <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                <input type="date" id="excel-start-date" class="form-control" style="padding: 0.5rem; border-radius: 8px; border: 1px solid #cbd5e1;">
                <span style="color: #64748b;">➞</span>
                <input type="date" id="excel-end-date" class="form-control" style="padding: 0.5rem; border-radius: 8px; border: 1px solid #cbd5e1;">
                
                <button onclick="loadExternalData()" class="btn btn-primary" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: 12px; font-weight: 600; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);">
                    🔍 Filtrar
                </button>
            </div>
        </div>

        <!-- HERO KPI CARDS (3 tarjetas principales) -->
        <div id="excel-kpi-container" style="margin-bottom: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;">
            <div class="kpi-card" style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); color: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3); position: relative; overflow: hidden;">
                <div style="position: absolute; right: -20px; top: -20px; font-size: 6rem; opacity: 0.15;">💰</div>
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; opacity: 0.8;">Inversión Total</div>
                <div id="kpi-total-importe" style="font-size: 2rem; font-weight: 800; margin: 0.5rem 0;">$...</div>
                <div style="font-size: 0.7rem; opacity: 0.8;">Acumulado SETTEPI MONTERREY</div>
            </div>
            <div class="kpi-card" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3); position: relative; overflow: hidden;">
                <div style="position: absolute; right: -20px; top: -20px; font-size: 6rem; opacity: 0.15;">📊</div>
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; opacity: 0.8;">Eficiencia Promedio</div>
                <div id="kpi-avg-efficiency" style="font-size: 2rem; font-weight: 800; margin: 0.5rem 0;">...%</div>
                <div style="font-size: 0.7rem; opacity: 0.8;">Rendimiento de talleres</div>
            </div>
            <div class="kpi-card" style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3); position: relative; overflow: hidden;">
                <div style="position: absolute; right: -20px; top: -20px; font-size: 6rem; opacity: 0.15;">📋</div>
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; opacity: 0.8;">Total Registros</div>
                <div id="kpi-total-records" style="font-size: 2rem; font-weight: 800; margin: 0.5rem 0;">...</div>
                <div style="font-size: 0.7rem; opacity: 0.8;">Órdenes externas procesadas</div>
            </div>
        </div>

        <!-- SECONDARY METRICS ROW -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: white; border-radius: 16px; padding: 1.25rem; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🔧</div>
                <div>
                    <div id="kpi-correctivos" style="font-size: 1.5rem; font-weight: 800; color: #1e293b;">0</div>
                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 600;">CORRECTIVOS</div>
                </div>
            </div>
            <div style="background: white; border-radius: 16px; padding: 1.25rem; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: #f0fdf4; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🛡️</div>
                <div>
                    <div id="kpi-preventivos" style="font-size: 1.5rem; font-weight: 800; color: #1e293b;">0</div>
                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 600;">PREVENTIVOS</div>
                </div>
            </div>
            <div style="background: white; border-radius: 16px; padding: 1.25rem; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: #fef3c7; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🚛</div>
                <div>
                    <div id="kpi-unique-units" style="font-size: 1.5rem; font-weight: 800; color: #1e293b;">0</div>
                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 600;">UNIDADES ATENDIDAS</div>
                </div>
            </div>
            <div style="background: white; border-radius: 16px; padding: 1.25rem; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: #fce7f3; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">💸</div>
                <div>
                    <div id="kpi-avg-cost" style="font-size: 1.5rem; font-weight: 800; color: #1e293b;">$0</div>
                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 600;">COSTO PROMEDIO</div>
                </div>
            </div>
        </div>

        <!-- MAIN GRID -->
        <div class="dashboard-main-grid" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem;">
            <!-- Left Column -->
            <div class="dashboard-column" style="display: flex; flex-direction: column; gap: 2rem;">
                <!-- Activity Feed -->
                <div class="chart-card" style="height: 400px; display: flex; flex-direction: column; border-radius: 20px; border: 1px solid #e2e8f0; background: white;">
                    <div class="chart-header" style="flex-shrink: 0; padding: 1.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                         <div style="display: flex; align-items: center; gap: 0.75rem;">
                             <div style="background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem;">📡</div>
                             <span style="font-weight: 700; color: #1e293b;">Actividad en Tiempo Real</span>
                         </div>
                         <button onclick="loadLiveActivity()" style="font-size: 0.75rem; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-weight: 600;">↻</button>
                    </div>
                    <div id="live-activity-feed" class="timeline-container" style="overflow-y: auto; padding: 1.25rem; flex-grow: 1;">
                         <p class="loading">Cargando...</p>
                    </div>
                </div>

                <!-- Donut Chart for Service Distribution -->
                <div class="chart-card" style="border-radius: 20px; border: 1px solid #e2e8f0; background: white; padding: 1.5rem;">
                    <div class="chart-header" style="margin-bottom: 1.5rem;">
                        <span style="font-weight: 700; color: #1e293b;">Distribución por Tipo de Servicio</span>
                    </div>
                    <div id="excel-services-donut" style="display: flex; align-items: center; justify-content: center; gap: 2rem; flex-wrap: wrap;">
                        <p class="loading">Cargando...</p>
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="dashboard-column" style="display: flex; flex-direction: column; gap: 2rem;">
                <!-- TOP 5 REFACCIONES MÁS CONSUMIDAS -->
                <div class="chart-card" style="border-radius: 20px; border: 1px solid #e2e8f0; background: white; padding: 1.5rem;">
                    <div class="chart-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between;">
                        <span style="font-weight: 700; color: #1e293b;">🔩 Top 5 Refacciones Más Consumidas</span>
                        <span style="font-size: 0.7rem; color: white; background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 4px 10px; border-radius: 20px; font-weight: 700;">CONSUMO</span>
                    </div>
                    <div id="top-parts-consumed" style="display: flex; flex-direction: column; gap: 1rem;">
                        <p class="loading">Cargando...</p>
                    </div>
                </div>

                <!-- TOP 5 REFACCIONES COSTOSAS >$5000 -->
                <div class="chart-card" style="border-radius: 20px; border: 1px solid #e2e8f0; background: white; padding: 1.5rem;">
                    <div class="chart-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #1e293b;">💎 Top Refacciones Costosas (>$5,000)</span>
                        <span style="font-size: 0.7rem; color: white; background: linear-gradient(135deg, #ef4444, #f87171); padding: 4px 10px; border-radius: 20px; font-weight: 700;">ALTO VALOR</span>
                    </div>
                    <div id="top-expensive-parts" style="display: flex; flex-direction: column; gap: 1rem;">
                        <p class="loading">Analizando...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Top Units by Expense (MANTENER) -->
        <div class="chart-card" style="margin-top: 2rem; border-radius: 20px; border: 1px solid #e2e8f0; background: white; padding: 1.5rem;">
            <div class="chart-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: #1e293b;">🚛 Unidades con Mayor Inversión</span>
                <span style="font-size: 0.7rem; color: white; background: linear-gradient(135deg, #ef4444, #f87171); padding: 4px 10px; border-radius: 20px; font-weight: 700;">COST LEADERS</span>
            </div>
            <div id="excel-top-units-cost" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem;">
                <p class="loading">Analizando...</p>
            </div>
        </div>

        <!-- Cost by Service Type Horizontal Bars -->
        <div class="chart-card" style="margin-top: 2rem; border-radius: 20px; border: 1px solid #e2e8f0; background: white; padding: 1.5rem;">
            <div class="chart-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: #1e293b;">💰 Inversión por Tipo de Servicio</span>
                <span style="font-size: 0.7rem; color: white; background: linear-gradient(135deg, #8b5cf6, #a78bfa); padding: 4px 10px; border-radius: 20px; font-weight: 700;">DESGLOSE DE COSTOS</span>
            </div>
            <div id="excel-cost-by-service" style="display: flex; flex-direction: column; gap: 1rem;">
                <p class="loading">Analizando costos...</p>
            </div>
        </div>

        <!-- ============ TIMELINE / KANBAN DE TRABAJOS DE HOY ============ -->
        <div class="chart-card" style="margin-top: 2rem; border-radius: 24px; border: 1px solid #e2e8f0; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 1.5rem; color: white;">
            <div class="chart-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="font-weight: 700; font-size: 1.1rem;">📅 Programa de Trabajos de Hoy</span>
                    <p style="margin: 0.25rem 0 0; font-size: 0.75rem; color: #94a3b8;">Horario: 9AM - 5PM | Comida: 2PM - 3PM</p>
                </div>
                <button onclick="loadTodayWorkload()" style="font-size: 0.75rem; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: 600;">↻ Actualizar</button>
            </div>
            
            <!-- Timeline Header (Horas) -->
            <div id="timeline-header" style="display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; margin-bottom: 1rem;">
                <div style="width: 180px; flex-shrink: 0; font-size: 0.7rem; color: #94a3b8; font-weight: 600;">TRABAJO</div>
                <div style="flex: 1; display: flex;">
                    <div style="flex: 1; text-align: center; font-size: 0.65rem; color: #94a3b8; border-left: 1px solid rgba(255,255,255,0.1);">9AM</div>
                    <div style="flex: 1; text-align: center; font-size: 0.65rem; color: #94a3b8; border-left: 1px solid rgba(255,255,255,0.1);">10AM</div>
                    <div style="flex: 1; text-align: center; font-size: 0.65rem; color: #94a3b8; border-left: 1px solid rgba(255,255,255,0.1);">11AM</div>
                    <div style="flex: 1; text-align: center; font-size: 0.65rem; color: #94a3b8; border-left: 1px solid rgba(255,255,255,0.1);">12PM</div>
                    <div style="flex: 1; text-align: center; font-size: 0.65rem; color: #94a3b8; border-left: 1px solid rgba(255,255,255,0.1);">1PM</div>
                    <div style="flex: 1; text-align: center; font-size: 0.65rem; color: #f59e0b; background: rgba(245,158,11,0.1); border-left: 1px solid rgba(255,255,255,0.1);">2PM 🍽️</div>
                    <div style="flex: 1; text-align: center; font-size: 0.65rem; color: #94a3b8; border-left: 1px solid rgba(255,255,255,0.1);">3PM</div>
                    <div style="flex: 1; text-align: center; font-size: 0.65rem; color: #94a3b8; border-left: 1px solid rgba(255,255,255,0.1);">4PM</div>
                    <div style="flex: 1; text-align: center; font-size: 0.65rem; color: #94a3b8; border-left: 1px solid rgba(255,255,255,0.1);">5PM</div>
                </div>
            </div>
            
            <!-- Timeline Rows -->
            <div id="today-workload-timeline" style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 350px; overflow-y: auto;">
                <p class="loading" style="color: #94a3b8; text-align: center; padding: 2rem;">Cargando trabajos de hoy...</p>
            </div>
        </div>

        <!-- Full Width History Table with Scroll -->
        <div class="chart-card" style="margin-top: 2rem; border-radius: 24px; border: 1px solid #e2e8f0; background: white; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, #f8fafc, #f1f5f9);">
                <div>
                    <h3 style="margin:0; font-size: 1.1rem; font-weight: 800; color: #1e293b;">📜 Historial Detallado de Servicios</h3>
                    <p style="margin:0; font-size: 0.75rem; color: #64748b;">Scroll para ver más registros</p>
                </div>
                <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">
                    SETTEPI MTY SOURCE
                </div>
            </div>
            <div id="excel-table-container" style="max-height: 400px; overflow-y: auto; overflow-x: auto;">
                <p class="loading" style="padding: 3rem; text-align: center;">Cargando histórico...</p>
            </div>
        </div>
    `;

    // Initial Load
    loadLiveActivity();
    loadExternalData();
    loadTopPartsConsumed();
    loadTopExpensiveParts();
    loadTodayWorkload();
}

async function loadExternalData() {
    console.log('📊 Loading Excel Data...');
    const kpiImporte = document.getElementById('kpi-total-importe');
    const kpiEfficiency = document.getElementById('kpi-avg-efficiency');
    const kpiRecords = document.getElementById('kpi-total-records');
    const kpiCorrectivos = document.getElementById('kpi-correctivos');
    const kpiPreventivos = document.getElementById('kpi-preventivos');
    const kpiUniqueUnits = document.getElementById('kpi-unique-units');
    const kpiAvgCost = document.getElementById('kpi-avg-cost');

    const donutContainer = document.getElementById('excel-services-donut');
    const unitsContainer = document.getElementById('excel-top-units-cost');
    const tableContainer = document.getElementById('excel-table-container');

    const startDateInput = document.getElementById('excel-start-date');
    const endDateInput = document.getElementById('excel-end-date');
    const startDate = startDateInput ? startDateInput.value : null;
    const endDate = endDateInput ? endDateInput.value : null;

    try {
        const response = await api.getServiciosExcel(startDate, endDate);
        const { summary, data } = response;

        // 1. Update Main KPI Cards
        if (kpiImporte) kpiImporte.textContent = `$${Math.round(summary.total_importe).toLocaleString()}`;
        if (kpiEfficiency) kpiEfficiency.textContent = `${Math.round(summary.avg_efficiency)}%`;
        if (kpiRecords) kpiRecords.textContent = summary.total_records.toLocaleString();

        // 2. Secondary KPIs
        const correctivos = summary.services_by_type['CORRECTIVO'] || 0;
        const preventivos = summary.services_by_type['PREVENTIVO'] || 0;
        if (kpiCorrectivos) kpiCorrectivos.textContent = correctivos.toLocaleString();
        if (kpiPreventivos) kpiPreventivos.textContent = preventivos.toLocaleString();
        if (kpiUniqueUnits) kpiUniqueUnits.textContent = summary.unique_units || summary.top_units_cost.length;
        if (kpiAvgCost) kpiAvgCost.textContent = summary.total_records > 0 ? `$${Math.round(summary.total_importe / summary.total_records).toLocaleString()}` : '$0';

        // 3. Donut Chart for Service Types
        if (donutContainer) {
            const types = summary.services_by_type;
            const total = Object.values(types).reduce((a, b) => a + b, 0) || 1;
            const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
            let cumulativePct = 0;
            const gradientParts = [];
            const legendItems = [];

            let i = 0;
            for (const [type, count] of Object.entries(types)) {
                const pct = (count / total) * 100;
                const color = colors[i % colors.length];
                gradientParts.push(`${color} ${cumulativePct}% ${cumulativePct + pct}%`);
                legendItems.push(`<div style="display: flex; align-items: center; gap: 0.5rem;"><div style="width: 12px; height: 12px; border-radius: 3px; background: ${color};"></div><span style="font-size: 0.8rem; color: #475569; font-weight: 600;">${type} (${count})</span></div>`);
                cumulativePct += pct;
                i++;
            }

            donutContainer.innerHTML = `
                <div style="width: 150px; height: 150px; border-radius: 50%; background: conic-gradient(${gradientParts.join(', ')}); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <div style="width: 90px; height: 90px; border-radius: 50%; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: #1e293b;">${total}</div>
                        <div style="font-size: 0.65rem; color: #64748b; font-weight: 600;">SERVICIOS</div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${legendItems.join('')}
                </div>
            `;
        }

        // 4. Top Units by Cost (Enhanced Cards)
        if (unitsContainer) {
            unitsContainer.innerHTML = summary.top_units_cost.slice(0, 8).map((u, i) => {
                const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316'];
                const bgColor = colors[i % colors.length];
                return `
                <div style="background: linear-gradient(135deg, ${bgColor}15, ${bgColor}05); border: 1px solid ${bgColor}30; border-radius: 16px; padding: 1rem; text-align: center;">
                    <div style="font-size: 0.7rem; font-weight: 800; color: ${bgColor}; margin-bottom: 0.25rem;">#${i + 1}</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: #1e293b;">ECO ${u.ECO || u['ECO.'] || 'N/A'}</div>
                    <div style="font-size: 0.9rem; font-weight: 700; color: ${bgColor}; margin-top: 0.25rem;">$${Math.round(u.IMPORTE || u['IMPORTE.'] || 0).toLocaleString()}</div>
                </div>
            `}).join('');
        }

        // 5. Cost by Service Type (Horizontal Bars)
        const costServiceContainer = document.getElementById('excel-cost-by-service');
        if (costServiceContainer && summary.cost_by_service && summary.cost_by_service.length > 0) {
            const maxCost = Math.max(...summary.cost_by_service.map(s => s.cost));
            const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
            costServiceContainer.innerHTML = summary.cost_by_service.slice(0, 8).map((s, idx) => {
                const widthPct = maxCost > 0 ? (s.cost / maxCost) * 100 : 0;
                const color = colors[idx % colors.length];
                return `
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 180px; font-size: 0.8rem; font-weight: 600; color: #475569; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${s.service}</div>
                        <div style="flex-grow: 1; height: 24px; background: #f1f5f9; border-radius: 6px; overflow: hidden; position: relative;">
                            <div style="width: ${widthPct}%; height: 100%; background: linear-gradient(90deg, ${color}, ${color}99); border-radius: 6px; transition: width 0.8s ease;"></div>
                            <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; font-weight: 800; color: #1e293b;">$${Math.round(s.cost).toLocaleString()}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } else if (costServiceContainer) {
            costServiceContainer.innerHTML = '<p style="color: #94a3b8;">Sin datos de costos por servicio</p>';
        }

        // 6. Table with Scroll
        if (tableContainer) {
            tableContainer.innerHTML = `
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; min-width: 800px;">
                    <thead style="background: #f8fafc; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; position: sticky; top: 0; z-index: 10;">
                        <tr>
                            <th style="padding: 1rem; text-align: left; background: #f8fafc;">ECO</th>
                            <th style="padding: 1rem; text-align: left; background: #f8fafc;">Fecha</th>
                            <th style="padding: 1rem; text-align: left; background: #f8fafc;">Servicio</th>
                            <th style="padding: 1rem; text-align: left; background: #f8fafc;">Taller</th>
                            <th style="padding: 1rem; text-align: right; background: #f8fafc;">Importe</th>
                            <th style="padding: 1rem; text-align: center; background: #f8fafc;">Eficiencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => {
                const eff = Math.round(row.EFICIENCIA || 0);
                const effCol = eff > 90 ? '#10b981' : (eff > 75 ? '#f59e0b' : '#ef4444');
                return `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 0.875rem 1rem;">
                                        <span style="background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.75rem; color: #1e293b;">${row['ECO.'] || row.ECO || 'N/A'}</span>
                                    </td>
                                    <td style="padding: 0.875rem 1rem; color: #64748b; font-weight: 500;">${row.FECHA_STR || row.FECHA || 'N/A'}</td>
                                    <td style="padding: 0.875rem 1rem;">
                                        <div style="font-weight: 700; color: #1e293b;">${row.SERVICIO || 'N/A'}</div>
                                        <div style="font-size: 0.7rem; color: #94a3b8;">${row['T. SERVICIO'] || ''}</div>
                                    </td>
                                    <td style="padding: 0.875rem 1rem; color: #475569; font-weight: 600;">${row.TALLER || 'N/A'}</td>
                                    <td style="padding: 0.875rem 1rem; text-align: right; font-weight: 800; color: #1e293b;">$${(row['IMPORTE.'] || row.IMPORTE || 0).toLocaleString()}</td>
                                    <td style="padding: 0.875rem 1rem; text-align: center;">
                                        <span style="background: ${effCol}20; color: ${effCol}; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.7rem;">${eff}%</span>
                                    </td>
                                </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>
            `;
        }


    } catch (e) {
        console.error("Dashboard Load Error:", e);
        const errorMsg = `<div style="padding: 1.5rem; color: #ef4444; font-size: 0.85rem; font-weight: 600; text-align: center;">⚠️ Error: ${e.message}</div>`;
        if (tableContainer) tableContainer.innerHTML = errorMsg;
        if (unitsContainer) unitsContainer.innerHTML = errorMsg;
        if (donutContainer) donutContainer.innerHTML = errorMsg;

        [kpiImporte, kpiEfficiency, kpiRecords].forEach(el => {
            if (el) el.textContent = 'Error';
        });
    }
}

// ========== NEW: TOP PARTS CONSUMED ==========
async function loadTopPartsConsumed() {
    const container = document.getElementById('top-parts-consumed');
    if (!container) return;

    try {
        const parts = await api.getTopPartsConsumed(5);

        if (!parts || parts.length === 0) {
            container.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 1rem;">No hay datos de consumo de refacciones aún.</p>';
            return;
        }

        const maxConsumed = Math.max(...parts.map(p => p.total_consumed));
        const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

        container.innerHTML = parts.map((part, idx) => {
            const widthPct = maxConsumed > 0 ? (part.total_consumed / maxConsumed) * 100 : 0;
            const color = colors[idx % colors.length];
            return `
                <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: ${color}20; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 800; color: ${color};">${idx + 1}</div>
                    <div style="flex-grow: 1;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                            <strong style="font-size: 0.85rem; color: #1e293b;">${part.name}</strong>
                            <span style="font-size: 0.75rem; font-weight: 800; color: ${color};">${part.total_consumed} uds</span>
                        </div>
                        <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${widthPct}%; height: 100%; background: linear-gradient(90deg, ${color}, ${color}80); border-radius: 3px; transition: width 0.8s ease;"></div>
                        </div>
                        <div style="font-size: 0.65rem; color: #94a3b8; margin-top: 0.25rem;">Stock actual: ${part.current_stock} | $${part.cost_price.toLocaleString()} c/u</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Error loading top parts:", e);
        container.innerHTML = `<p style="color: #ef4444; text-align: center;">Error al cargar refacciones</p>`;
    }
}

// ========== NEW: TOP EXPENSIVE PARTS ==========
async function loadTopExpensiveParts() {
    const container = document.getElementById('top-expensive-parts');
    if (!container) return;

    try {
        const parts = await api.getTopExpensiveParts(5000, 5);

        if (!parts || parts.length === 0) {
            container.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 1rem;">No hay refacciones costosas consumidas aún.</p>';
            return;
        }

        container.innerHTML = parts.map((part, idx) => {
            const colors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'];
            const color = colors[idx % colors.length];
            return `
                <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: linear-gradient(90deg, ${color}10, transparent); border-radius: 12px; border-left: 3px solid ${color};">
                    <div style="flex-grow: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <strong style="font-size: 0.85rem; color: #1e293b;">${part.name}</strong>
                                <div style="font-size: 0.65rem; color: #64748b; margin-top: 0.15rem;">${part.category || 'Sin categoría'}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.9rem; font-weight: 800; color: ${color};">$${part.cost_price.toLocaleString()}</div>
                                <div style="font-size: 0.65rem; color: #94a3b8;">${part.total_consumed} consumidas</div>
                            </div>
                        </div>
                        <div style="font-size: 0.7rem; font-weight: 600; color: #ef4444; margin-top: 0.5rem; background: #fef2f2; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                            💸 Valor total consumido: $${part.total_value_consumed.toLocaleString()}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Error loading expensive parts:", e);
        container.innerHTML = `<p style="color: #ef4444; text-align: center;">Error al cargar refacciones costosas</p>`;
    }
}

// ========== NEW: TODAY WORKLOAD TIMELINE ==========
async function loadTodayWorkload() {
    const container = document.getElementById('today-workload-timeline');
    if (!container) return;

    try {
        const workload = await api.getTodayWorkload();

        if (!workload || workload.length === 0) {
            container.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 2rem;">No hay trabajos programados para hoy.</p>';
            return;
        }

        // Work hours: 9AM-5PM = 8 hours (but 2-3PM is lunch, so 7 work hours)
        // We'll represent 9 columns (9AM to 5PM inclusive)
        const startHour = 9; // 9AM
        const endHour = 17; // 5PM
        const totalHours = endHour - startHour; // 8 hours

        const statusColors = {
            'PRE_ORDER': '#94a3b8',
            'OPEN': '#6366f1',
            'IN_PROGRESS': '#10b981',
            'PAUSED': '#f59e0b',
            'COMPLETED': '#22c55e',
            'REJECTED': '#ef4444',
            'CLOSED': '#64748b'
        };

        const priorityEmojis = {
            'LOW': '🟢',
            'MEDIUM': '🟡',
            'HIGH': '🟠',
            'CRITICAL': '🔴'
        };

        // Track current position for each technician (for stacking)
        let currentHour = startHour;

        container.innerHTML = workload.map((order, idx) => {
            const color = statusColors[order.status] || '#6366f1';
            const emoji = priorityEmojis[order.priority] || '🟡';
            const hours = order.estimated_hours || 1;

            // Calculate bar width (each hour = ~11.1% of timeline, 100/9 columns)
            const hourWidth = 100 / totalHours;
            const barWidth = Math.min(hours * hourWidth, 100);

            // Offset based on index (simplified positioning - in real scenario would track by technician)
            const startOffset = (currentHour - startHour) * hourWidth;
            currentHour += hours;
            if (currentHour >= 14 && currentHour < 15) currentHour = 15; // Skip lunch hour
            if (currentHour > endHour) currentHour = startHour; // Reset for next row

            return `
                <div style="display: flex; align-items: center; min-height: 48px;">
                    <!-- Job Info -->
                    <div style="width: 180px; flex-shrink: 0; padding-right: 1rem;">
                        <div style="font-size: 0.75rem; font-weight: 700; color: white;">${emoji} Orden #${order.id}</div>
                        <div style="font-size: 0.65rem; color: #94a3b8;">ECO ${order.unit_eco} • ${order.technician_name}</div>
                    </div>
                    
                    <!-- Timeline Bar -->
                    <div style="flex: 1; position: relative; height: 36px; display: flex; align-items: center;">
                        <!-- Background grid -->
                        <div style="position: absolute; inset: 0; display: flex;">
                            ${Array(totalHours).fill().map((_, i) => `
                                <div style="flex: 1; border-left: 1px solid rgba(255,255,255,0.05); ${i === 5 ? 'background: rgba(245,158,11,0.1);' : ''}"></div>
                            `).join('')}
                        </div>
                        
                        <!-- Task bar -->
                        <div style="position: absolute; left: ${(idx % 7) * (100 / totalHours)}%; width: ${barWidth}%; height: 28px; background: linear-gradient(90deg, ${color}, ${color}cc); border-radius: 6px; display: flex; align-items: center; padding: 0 8px; box-shadow: 0 2px 8px ${color}40; cursor: pointer; transition: transform 0.2s; overflow: hidden;" 
                             onclick="showOrderModalFromDashboard(${order.id})"
                             onmouseover="this.style.transform='scale(1.02)'" 
                             onmouseout="this.style.transform='scale(1)'">
                            <span style="font-size: 0.65rem; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${order.description.substring(0, 30)}... (${hours}h)</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Error loading today workload:", e);
        container.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 2rem;">Error al cargar trabajos de hoy: ${e.message}</p>`;
    }
}

// Helper to show order modal from dashboard click
function showOrderModalFromDashboard(orderId) {
    if (typeof showOrderModal === 'function') {
        showOrderModal(orderId);
    } else {
        alert(`Ver detalles de Orden #${orderId}`);
    }
}

// Activity Feed
async function loadLiveActivity() {
    const container = document.getElementById('live-activity-feed');
    if (!container) return;

    try {
        const activities = await api.getDashboardActivity();

        if (!activities || activities.length === 0) {
            container.innerHTML = '<p style="color:#94a3b8; padding:1rem; text-align: center;">No hay actividad reciente.</p>';
            return;
        }

        container.innerHTML = activities.map((item) => {
            const date = new Date(item.timestamp);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            let timeAgo = '';

            if (diffInSeconds < 60) timeAgo = 'Ahora';
            else if (diffInSeconds < 3600) timeAgo = `${Math.floor(diffInSeconds / 60)}m`;
            else if (diffInSeconds < 86400) timeAgo = `${Math.floor(diffInSeconds / 3600)}h`;
            else timeAgo = date.toLocaleDateString();

            return `
            <div style="margin-bottom: 1rem; padding: 0.875rem; background: #f8fafc; border-radius: 12px; border-left: 3px solid ${item.severity === 'high' ? '#ef4444' : '#6366f1'};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.25rem;">
                    <span style="font-weight: 700; font-size: 0.85rem; color: #1e293b;">${item.title}</span>
                    <span style="font-size: 0.7rem; font-weight: 600; color: #94a3b8; background: white; padding: 2px 6px; border-radius: 4px;">${timeAgo}</span>
                </div>
                <p style="margin: 0; font-size: 0.8rem; color: #64748b; line-height: 1.4;">${item.description}</p>
            </div>
            `;
        }).join('');

    } catch (e) {
        console.error("Activity Error", e);
        container.innerHTML = '<p class="error">Error de conexión.</p>';
    }
}

function loadDashboardKPIs() {
    loadLiveActivity();
    loadExternalData();
    loadTopPartsConsumed();
    loadTopExpensiveParts();
    loadTodayWorkload();
}
