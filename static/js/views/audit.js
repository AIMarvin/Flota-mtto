

// ========== AUDIT (AUDITORÍA) ==========
let auditData = [];
let currentAuditFilter = 'all';

function renderAuditView() {
    return `
        <div class="card" style="background: transparent; box-shadow: none; padding: 0;">
            <div class="card-header" style="margin-bottom: 2rem; padding: 0; background: transparent; border-bottom: none;">
                <h2 style="font-size: 1.75rem; color: var(--dark); display: flex; align-items: center; gap: 0.5rem;">
                    📜 Auditoría de Inspecciones
                </h2>
                <p style="color: var(--gray); margin-top: 0.5rem;">Historial completo y evidencia de flota.</p>
            </div>
            
            <div class="audit-controls" style="margin-bottom: 2rem;">
                <input type="text" id="audit-search" placeholder="Buscar por unidad, chofer o fecha..." class="form-control" style="width:100%; margin-bottom: 1rem;">
                
                <div class="filter-tabs" style="display:flex; gap:0.75rem; overflow-x:auto; padding-bottom: 5px;">
                     <button class="filter-tab active" onclick="applyAuditFilters('all', this)">Todos</button>
                     <button class="filter-tab" onclick="applyAuditFilters('fail', this)">Con Fallos 🚨</button>
                     <button class="filter-tab" onclick="applyAuditFilters('high-priority', this)">Prioridad Alta 🔥</button>
                     <button class="filter-tab" onclick="applyAuditFilters('ok', this)">Sin Fallos ✅</button>
                     <button class="filter-tab" onclick="applyAuditFilters('no-inspection', this)">Sin Inspección (7d) ⚠️</button>
                </div>
            </div>

            <div id="audit-grid" class="audit-grid">
                <p class="loading">Cargando inspecciones...</p>
            </div>
        </div>

        <div id="audit-detail-modal" class="modal hidden">
            <div class="modal-content" style="max-height:90vh; overflow-y:auto; border-radius: 24px; padding: 0; border: none; max-width: 600px;">
                 <div class="modal-header-custom" style="position: sticky; top: 0; z-index: 10; background: white; padding: 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 1.25rem;">Detalle de Inspección</h3>
                    <button class="close-btn" onclick="closeAuditModal()" style="background: #f1f5f9; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">×</button>
                </div>
                <div class="modal-body" id="audit-modal-body" style="padding: 1.5rem;">
                    <p>Cargando detalles...</p>
                </div>
            </div>
        </div>
    `;
}

async function loadAuditHistory() {
    try {
        const data = await api.getChecklists();

        // Filter to keep only the latest inspection per unit
        const latestMap = {};
        data.forEach(item => {
            const unitKey = item.unit ? item.unit.eco_number : `ID_${item.unit_id}`;
            if (!latestMap[unitKey] || new Date(item.created_at) > new Date(latestMap[unitKey].created_at)) {
                latestMap[unitKey] = item;
            }
        });

        auditData = Object.values(latestMap);

        // Default sort by date desc
        auditData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        updateAuditView(auditData);

        document.getElementById('audit-search').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            // If current filter is no-inspection, we search in that subset, but for simplicity let's just filter auditData for now unless we are in that mode.
            // A simplified approach:
            applyAuditFilters(currentAuditFilter, null, term);
        });
    } catch (e) {
        console.error(e);
        document.getElementById('audit-grid').innerHTML = '<p class="error">Error al cargar datos</p>';
    }
}

async function applyAuditFilters(type, btn, searchTerm = '') {
    if (btn) {
        document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentAuditFilter = type;
        // Reset search when changing tabs for better UX usually, but let's keep it simple
        const searchInput = document.getElementById('audit-search');
        if (searchInput) searchTerm = searchInput.value.toLowerCase();
    }

    // Handle "No Inspection > 7 Days"
    if (type === 'no-inspection') {
        renderNoInspectionView(searchTerm);
        return;
    }

    let filtered = auditData;

    // NEW LOGIC: For "fail" filter, only show items with RELEVANT failures
    // Relevant failures = failures NOT in "Exterior" or "Limpieza"
    if (type === 'fail') {
        filtered = auditData.filter(i => hasRelevantFailures(i));
    }

    // High priority: must have relevant failures AND be marked as priority
    if (type === 'high-priority') {
        filtered = auditData.filter(i => hasRelevantFailures(i) && i.is_priority);
    }

    // OK filter: items without ANY failures (keep original logic)
    if (type === 'ok') filtered = auditData.filter(i => !i.has_failed);

    if (searchTerm) {
        filtered = filtered.filter(item =>
            (item.unit && item.unit.eco_number.toLowerCase().includes(searchTerm)) ||
            (item.user && item.user.full_name.toLowerCase().includes(searchTerm))
        );
    }

    updateAuditView(filtered);
}

// Helper function to check if a checklist has failures in categories other than Exterior/Limpieza
function hasRelevantFailures(item) {
    if (!item.has_failed) return false;

    const answers = item.answers || {};
    const excludedCategories = ['exterior', 'limpieza'];

    // Check if there's at least one failure in a non-excluded category
    for (const [category, status] of Object.entries(answers)) {
        if (status === 'fail') {
            const categoryLower = category.toLowerCase().trim();
            // If this failure is NOT in excluded categories, it's relevant
            if (!excludedCategories.includes(categoryLower)) {
                return true;
            }
        }
    }

    // All failures are in Exterior or Limpieza, so not relevant for the filter
    return false;
}

// Special renderer for the "No Inspection" use case
async function renderNoInspectionView(searchTerm) {
    const grid = document.getElementById('audit-grid');
    grid.innerHTML = '<p class="loading">Analizando flota...</p>';

    try {
        // Fetch fresh fleet data to get last_checklist status
        const units = await api.getFlota360Data();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const missing = units.filter(u => {
            // Check if matches search term
            if (searchTerm && !u.eco_number.toLowerCase().includes(searchTerm)) return false;

            if (!u.last_checklist_date) return true; // Never inspected
            const lastDate = new Date(u.last_checklist_date);
            return lastDate < sevenDaysAgo;
        });

        if (missing.length === 0) {
            grid.innerHTML = '<div style="text-align: center; color: var(--success); padding: 3rem; grid-column: 1/-1;">✅ ¡Excelente! Todas las unidades han sido inspeccionadas recientemente.</div>';
            return;
        }

        grid.innerHTML = missing.map(u => {
            const lastDateStr = u.last_checklist_date
                ? new Date(u.last_checklist_date).toLocaleDateString()
                : 'Nunca';

            return `
                 <div class="audit-card status-fail" style="border-left: 4px solid var(--warning);">
                    <div class="audit-card-header">
                        <div class="audit-unit-info">
                            <div class="audit-icon-circle" style="background:#fff7ed; color:var(--warning);">⚠️</div>
                            <div>
                                <h4 class="audit-unit-name">${u.eco_number}</h4>
                                <span class="audit-date" style="color:var(--danger);">Última insp: ${lastDateStr}</span>
                            </div>
                        </div>
                    </div>
                    <div class="audit-card-body">
                         <div style="font-size:0.9rem; color:var(--gray); margin-bottom:0.5rem;">
                            ${u.model || 'Modelo estándar'}
                         </div>
                         <button class="btn btn-sm btn-primary" onclick="alert('Programar inspección para ${u.eco_number}')" style="width:100%;">Programar Ahora</button>
                    </div>
                 </div>
            `;
        }).join('');

    } catch (e) {
        grid.innerHTML = '<p class="error">Error al analizar flota</p>';
    }
}

function updateAuditView(data) {
    const grid = document.getElementById('audit-grid');
    if (!data || data.length === 0) {
        grid.innerHTML = '<div style="text-align: center; color: var(--gray); padding: 3rem; grid-column: 1/-1;">No se encontraron registros</div>';
        return;
    }

    grid.innerHTML = data.map(item => {
        const statusClass = item.has_failed ? 'status-fail' : 'status-ok';
        const statusLabel = item.has_failed ? '❌ Fallo' : '✅ OK';

        return `
        <div class="audit-card ${statusClass}" onclick="showAuditDetailModal(${item.id})" style="cursor: pointer;">
            <div class="audit-card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="audit-unit-info" style="display: flex; gap: 1rem; align-items: center;">
                    <div class="audit-icon-circle" style="width: 45px; height: 45px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🚛</div>
                    <div>
                        <h4 class="audit-unit-name" style="margin: 0; font-size: 1.1rem; color: #334155;">${item.unit ? item.unit.eco_number : 'N/A'}</h4>
                        <span class="audit-date" style="font-size: 0.85rem; color: #94a3b8;">${new Date(item.created_at).toLocaleDateString()} ${new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                <div class="audit-status-badge" style="padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: ${item.has_failed ? '#fef2f2' : '#ecfdf5'}; color: ${item.has_failed ? '#ef4444' : '#10b981'}; border: 1px solid ${item.has_failed ? '#fca5a5' : '#6ee7b7'};">
                    ${statusLabel}
                </div>
            </div>
            
            <div class="audit-card-body">
                ${item.has_failed ? `<div style="font-size: 0.8rem; color: var(--danger); margin-top: 5px;">⚠️ Requiere Atención</div>` : ''}
                ${item.is_priority ? `<div style="font-size: 0.8rem; background: #fff7ed; color: #c2410c; border: 1px solid #fdba74; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-top: 5px; font-weight: 700;">🔥 Alta Prioridad</div>` : ''}
            </div>
        </div>
    `}).join('');
}

async function showAuditDetailModal(id) {
    const modal = document.getElementById('audit-detail-modal');
    const body = document.getElementById('audit-modal-body');
    modal.classList.remove('hidden');
    body.innerHTML = '<div style="display:flex; justify-content:center; padding:2rem;"><div class="loading-spinner"></div></div>';

    try {
        const response = await api.request('/checklists/' + id);

        const isFail = response.has_failed;
        const statusColor = isFail ? '#ef4444' : '#10b981';
        const statusBg = isFail ? '#fef2f2' : '#ecfdf5';
        const statusText = isFail ? 'FALLO DETECTADO' : 'INSPECCIÓN EXITOSA';
        const statusIcon = isFail ? '🚨' : '✅';

        // Filter failures if any
        const issues = Object.entries(response.answers || {}).filter(([k, v]) => v === 'fail');

        body.innerHTML = `
            <!-- Top Hero Section -->
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: ${statusBg}; color: ${statusColor}; font-size: 2.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    ${statusIcon}
                </div>
                <h2 style="margin: 0; color: #1e293b; font-size: 1.5rem;">${response.unit ? response.unit.eco_number : 'Unidad Desconocida'}</h2>
                <p style="color: #64748b; margin: 0.5rem 0 0 0;">${new Date(response.created_at).toLocaleString()}</p>
                <div style="margin-top: 1rem;">
                    <span style="background: ${statusBg}; color: ${statusColor}; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.5px;">
                        ${statusText}
                    </span>
                </div>
            </div>

            <!-- Main Info Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                <div style="background: #f8fafc; padding: 1rem; border-radius: 12px;">
                    <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Operador</div>
                    <div style="font-weight: 600; color: #334155; font-size: 1rem;">${response.user ? response.user.full_name : 'No registrado'}</div>
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 12px;">
                     <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Puntos Revisados</div>
                     <div style="font-weight: 600; color: #334155; font-size: 1rem;">${Object.keys(response.answers || {}).length} Puntos</div>
                </div>
            </div>

            <!-- Issues Section (Conditional) -->
            ${isFail ? `
                <div style="margin-bottom: 2rem; border: 1px solid #fca5a5; background: #fef2f2; border-radius: 12px; padding: 1rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #991b1b; display: flex; align-items: center; gap: 0.5rem;">
                        ⚠️ Reporte de Fallas
                    </h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${issues.map(([k]) => `
                            <span style="background: white; border: 1px solid #fecaca; color: #dc2626; padding: 4px 12px; border-radius: 6px; font-size: 0.9rem; font-weight: 500; text-transform: capitalize;">
                                ${k}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Priority Action (Manager Only) -->
            <div id="priority-action-container">
               ${renderPriorityButton(response, isFail)}
            </div>

            <!-- Inspection Points Accordion/List -->
            <div style="margin-bottom: 2rem;">
                <h4 style="margin-bottom: 1rem; color: #334155;">📋 Detalle de Puntos</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem;">
                    ${Object.entries(response.answers || {}).map(([k, v]) => `
                        <div style="padding: 0.75rem; border-radius: 8px; border: 1px solid ${v === 'ok' ? '#e2e8f0' : '#fca5a5'}; background: ${v === 'ok' ? 'white' : '#fff1f2'};">
                            <div style="font-size:0.8rem; color: #64748b; text-transform: capitalize; margin-bottom: 4px;">${k}</div>
                            <div style="font-weight: 600; color: ${v === 'ok' ? '#166534' : '#991b1b'}; font-size: 0.9rem;">
                                ${v === 'ok' ? 'Correcto' : 'Falla'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Evidence Gallery -->
            <div>
                <h4 style="margin-bottom: 1rem; color: #334155;">📸 Evidencia Capturada</h4>
                
                ${(!response.photos?.length && !response.videos?.length)
                ? '<div style="background: #f8fafc; padding: 2rem; border-radius: 12px; text-align: center; color: #94a3b8;">Sin evidencia adjunta</div>'
                : ''}
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                     ${(response.photos || []).map(url => `
                        <div onclick="window.open('${url}', '_blank')" style="aspect-ratio: 4/3; background: #000; border-radius: 12px; overflow: hidden; position: relative; cursor: zoom-in; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9; transition: opacity 0.2s;">
                            <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">FOTO</div>
                        </div>
                    `).join('')}
                </div>

                ${(response.videos || []).length > 0 ? `
                    <div style="margin-top: 1rem;">
                        ${(response.videos || []).map(url => `
                            <div style="border-radius: 12px; overflow: hidden; background: #000; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                                <video src="${url}" controls style="width: 100%; display: block;"></video>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            </div>
            
            <div style="height: 100px;"></div> <!-- Spacer for scrolling -->
        `;

    } catch (e) {
        console.error(e);
        body.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--danger);">❌ Error al cargar los detalles de la inspección.</div>';
    }
}

function closeAuditModal() {
    document.getElementById('audit-detail-modal').classList.add('hidden');
}

function renderPriorityButton(response, isFail) {
    // Check if user is manager/admin
    const token = localStorage.getItem('access_token');
    let userRole = '';
    if (token) {
        try {
            userRole = JSON.parse(atob(token.split('.')[1])).role;
        } catch (e) { }
    }

    if ((userRole === 'OPERACIONES' || userRole === 'ADMIN') && isFail) {
        if (response.is_priority) {
            // Check if order scheduling is needed
            const scheduleSection = response.generated_order_id ? `
                <div style="margin-top: 1.5rem; border-top: 1px solid #fed7aa; padding-top: 1rem; text-align: left;">
                    <h5 style="color: #c2410c; margin-bottom: 0.5rem;">📅 Programación de Mantenimiento</h5>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                         <input type="datetime-local" id="schedule-date-${response.generated_order_id}" class="form-control" style="flex:1;">
                         <button onclick="scheduleMaintenance(${response.generated_order_id})" style="background: #ea580c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            Confirmar Programación
                         </button>
                    </div>
                </div>
            ` : '';

            return `
                <div style="margin-bottom: 2rem; background: #fff7ed; border: 1px solid #fdba74; color: #c2410c; padding: 1rem; border-radius: 12px; text-align: center; font-weight: 700;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                         <span>🔥</span> ESTA INSPECCIÓN YA ES PRIORIDAD
                    </div>
                    ${scheduleSection}
                </div>
            `;
        } else {
            return `
                <div style="margin-bottom: 2rem; text-align: center;">
                    <button id="btn-priority-${response.id}" onclick="markAsPriority(${response.id})" style="background: #f97316; color: white; border: none; padding: 0.75rem 2rem; border-radius: 30px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.4); transition: transform 0.2s; font-size: 1rem;">
                        🔥 Marcar como Prioridad
                    </button>
                    <p style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--gray);">Esto elevará la prioridad de la orden de trabajo asociada y permitirá su programación.</p>
                </div>
            `;
        }
    }
    return '';
}

async function scheduleMaintenance(orderId) {
    const input = document.getElementById(`schedule-date-${orderId}`);
    if (!input || !input.value) {
        alert('Por favor selecciona una fecha y hora.');
        return;
    }

    try {
        await api.scheduleOrder(orderId, input.value);
        alert('✅ Mantenimiento programado y Orden Generada (Abierta).');
        closeAuditModal();
        // Maybe refresh something or show status
    } catch (e) {
        console.error(e);
        alert('Error al programar');
    }
}

async function markAsPriority(id) {
    if (!confirm('¿Estás seguro de marcar esta inspección como ALTA PRIORIDAD?')) return;

    try {
        await api.setChecklistPriority(id);
        alert('Prioridad actualizada correctamente');
        // Reload modal
        showAuditDetailModal(id);
        // Refresh grid
        loadAuditHistory();
    } catch (e) {
        console.error(e);
        alert('Error al actualizar prioridad');
    }
}
