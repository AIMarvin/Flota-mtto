
// ========== FLOTA 360 VIEW ==========

function renderFlota360View() {
    return `
        <div class="card" style="background: transparent; box-shadow: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="color: var(--primary-dark); font-size: 1.5rem; margin: 0;">🚛 Flota 360°</h2>
                <div style="display:flex; gap: 10px;">
                     <button class="btn btn-sm btn-success" onclick="showUnitModal()">+ Nueva Unidad</button>
                     <button class="btn btn-sm btn-primary" onclick="loadFlota360Data()">🔄 Actualizar</button>
                </div>
            </div>
            <div id="flota-grid" class="fleet-grid">
                <p class="loading">Cargando estado de la flota...</p>
            </div>
        </div>
    `;
}

function showUnitModal() {
    document.getElementById('unit-modal').classList.remove('hidden');
}

function closeUnitModal() {
    document.getElementById('unit-modal').classList.add('hidden');
}

async function submitCreateUnit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const unitData = {
        eco_number: formData.get('eco_number'),
        model: formData.get('model'),
        vin: formData.get('vin'),
        status: 'OPERATIVA'
    };

    try {
        await api.createUnit(unitData);
        closeUnitModal();
        alert('✅ Unidad creada exitosamente');
        form.reset();
        loadFlota360Data(); // Refresh grid
    } catch (error) {
        alert('❌ Error al crear unidad: ' + error.message);
    }
}

async function loadFlota360Data() {
    try {
        const units = await api.getFlota360Data();
        const container = document.getElementById('flota-grid');

        if (!units || units.length === 0) {
            container.innerHTML = '<p>No hay unidades registradas</p>';
            return;
        }

        // We need to keep a reference to units for modal
        window.currentUnits = units;

        container.innerHTML = units.map(unit => {
            // Determine card color/status
            let statusColor = 'var(--secondary)'; // Green default
            let statusIcon = '✅';
            let statusText = 'Operativa';

            if (unit.health_score < 50) {
                statusColor = 'var(--danger)';
                statusIcon = '🚨';
            } else if (unit.health_score < 80) {
                statusColor = 'var(--warning)';
                statusIcon = '⚠️';
            }

            if (unit.status === 'EN_TALLER') {
                statusIcon = '🛠️';
                statusText = 'En Taller';
                statusColor = 'var(--warning)';
            } else if (unit.status === 'BAJA') {
                statusIcon = '⛔';
                statusText = 'Baja';
                statusColor = 'var(--gray)';
            }

            return `
                <div class="fleet-card" style="border-left: 5px solid ${statusColor}; cursor: pointer;" onclick="showUnitDetailModal(${unit.id})">
                    <div class="fleet-card-header">
                        <div class="fleet-icon">🚛</div>
                        <div>
                            <h3 style="margin: 0;">${unit.eco_number}</h3>
                            <span style="font-size: 0.8rem; color: var(--gray);">${unit.model || 'Modelo N/A'}</span>
                        </div>
                        <div class="health-badge" style="background: ${statusColor}20; color: ${statusColor};">
                            ${statusIcon} ${unit.health_score}%
                        </div>
                    </div>
                    
                    <div class="fleet-stats">
                        <div class="fleet-stat-item">
                            <span class="stat-label">Estado</span>
                            <span class="stat-value" style="color: ${statusColor}">${statusText}</span>
                        </div>
                        <div class="fleet-stat-item">
                            <span class="stat-label">Órdenes</span>
                            <span class="stat-value">${unit.open_orders_count}</span>
                        </div>
                    </div>

                    <p style="font-size: 0.8rem; margin: 0.5rem 0; color: var(--dark);">
                        👤 <span style="font-weight: 600;">${unit.driver_name || 'Sin Chofer'}</span>
                    </p>

                    <div class="health-bar-container">
                        <div class="health-bar" style="width: ${unit.health_score}%; background: ${statusColor};"></div>
                    </div>
                    <p style="font-size: 0.75rem; color: var(--gray); margin-top: 5px; text-align: right;">
                        Salud Operativa
                    </p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading fleet 360:', error);
        document.getElementById('flota-grid').innerHTML = '<p class="error">Error al cargar datos de la flota</p>';
    }
}

async function showUnitDetailModal(unitId) {
    const modal = document.getElementById('unit-detail-modal');
    const detailBody = document.getElementById('unit-detail-body');
    const deleteBtn = document.getElementById('btn-delete-unit');

    modal.classList.remove('hidden');
    detailBody.innerHTML = '<p class="loading">Cargando detalles...</p>';

    // Find unit in local cache or fetch
    const unit = window.currentUnits ? window.currentUnits.find(u => u.id === unitId) : null;

    if (!unit) {
        detailBody.innerHTML = '<p>Error al cargar información.</p>';
        return;
    }

    // Load available drivers
    let drivers = [];
    try {
        drivers = await api.getUsers('CHOFER');
    } catch (e) {
        console.error("Error loading drivers", e);
    }

    // Sort drivers alphabetically
    drivers.sort((a, b) => a.full_name.localeCompare(b.full_name));

    const driverOptions = drivers.map(d =>
        `<option value="${d.id}" ${unit.driver_id === d.id ? 'selected' : ''}>${d.full_name}</option>`
    ).join('');

    detailBody.innerHTML = `
        <div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
            <div style="display:flex; justify-content:center; margin-bottom:1rem;">
                 <div style="width:80px; height:80px; background:#e0f2fe; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2.5rem;">🚛</div>
            </div>
            <div style="text-align:center; margin-bottom: 1.5rem;">
                <h3 style="font-size: 1.5rem; margin:0;">${unit.eco_number}</h3>
                <p style="color:var(--gray);">${unit.model || 'Modelo no especificado'}</p>
                 <span class="badge" style="background:${unit.status === 'OPERATIVA' ? '#dcfce7' : '#fee2e2'}; color:${unit.status === 'OPERATIVA' ? '#166534' : '#991b1b'}">
                    ${unit.status}
                </span>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div style="background:white; padding:10px; border-radius:8px;">
                     <div style="font-size:0.75rem; color:var(--gray);">VIN / Serie</div>
                     <div style="font-weight:600;">${unit.vin || 'N/A'}</div>
                </div>
                 <div style="background:white; padding:10px; border-radius:8px;">
                     <div style="font-size:0.75rem; color:var(--gray);">Salud</div>
                     <div style="font-weight:600;">${unit.health_score}%</div>
                </div>
                <div style="background:white; padding:10px; border-radius:8px;">
                     <div style="font-size:0.75rem; color:var(--gray);">Órdenes Abiertas</div>
                     <div style="font-weight:600;">${unit.open_orders_count}</div>
                </div>
                <div style="background:white; padding:10px; border-radius:8px; grid-column: 1 / -1;">
                     <div style="font-size:0.75rem; color:var(--gray); margin-bottom: 4px;">Chofer Asignado</div>
                     
                     <div style="position: relative;">
                         <input type="text" id="driver-search-${unit.id}" class="form-control" placeholder="Buscar chofer..." 
                                style="margin-bottom: 5px; font-size: 0.9rem;"
                                onkeyup="filterDriverOptions(${unit.id})">
                         <select id="driver-select-${unit.id}" class="form-control" style="width: 100%; padding: 8px;" onchange="assignDriver(${unit.id}, this.value)">
                            <option value="">-- Sin Asignar --</option>
                            ${driverOptions}
                         </select>
                     </div>
                     <div style="font-size: 0.75rem; color: var(--gray); margin-top: 4px;">
                        * Selecciona un chofer para asignarlo a esta unidad.
                     </div>
                </div>
            </div>
        </div>
    `;

    deleteBtn.onclick = () => confirmDeleteUnit(unitId, unit.eco_number);

    // Inject Timeline HTML
    const timelineHtml = `
            <div id="unit-timeline-container" style="margin-top: 1.5rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                <h4 style="color: var(--dark); margin-bottom: 1rem;">📜 Historial Reciente</h4>
                <div id="unit-timeline-${unit.id}" class="timeline-container">
                    <p class="loading">Cargando historia...</p>
                </div>
            </div>
    `;
    const checkExist = document.getElementById(`unit-timeline-${unit.id}`);
    if (!checkExist) {
        document.querySelector('#unit-detail-body > div').insertAdjacentHTML('beforeend', timelineHtml);
    }

    loadUnitTimeline(unitId);
}

function closeUnitDetailModal() {
    document.getElementById('unit-detail-modal').classList.add('hidden');
}

async function confirmDeleteUnit(id, eco) {
    if (confirm(`¿Estás seguro que deseas eliminar la unidad ${eco}?`)) {
        if (confirm(`⚠️ ESTA ACCIÓN ES IRREVERSIBLE.\n\n¿Realmente deseas eliminar ${eco} y todo su historial?`)) {
            try {
                await api.deleteUnit(id);
                alert('✅ Unidad eliminada.');
                closeUnitDetailModal();
                loadFlota360Data();
            } catch (e) {
                alert('❌ Error al eliminar: ' + e.message);
            }
        }
    }
}

async function loadUnitTimeline(unitId) {
    const container = document.getElementById(`unit-timeline-${unitId}`);
    if (!container) return;

    try {
        const events = await api.getUnitTimeline(unitId);

        if (!events || events.length === 0) {
            container.innerHTML = '<p style="color:var(--gray); font-size: 0.9rem;">No hay historial reciente.</p>';
            return;
        }

        container.innerHTML = `<div class="timeline-line"></div>` + events.map(ev => {
            const date = new Date(ev.timestamp).toLocaleDateString();
            return `
                <div class="timeline-item">
                    <div class="timeline-icon-wrapper" style="color: ${ev.color}; border-color: ${ev.color}; background: #fff;">
                        ${ev.icon}
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <span class="timeline-title">${ev.title}</span>
                            <span class="timeline-time">${date}</span>
                        </div>
                        <p class="timeline-desc">${ev.description}</p>
                         <div class="timeline-footer">
                            <span>${ev.user_name}</span>
                        </div>
                    </div>
                </div>
             `;
        }).join('');

    } catch (e) {
        console.error("Timeline error", e);
        container.innerHTML = '<p class="error">Error cargando historial.</p>';
    }
}

// Helper to filter dropdown options
window.filterDriverOptions = (unitId) => {
    const input = document.getElementById(`driver-search-${unitId}`);
    const filter = input.value.toLowerCase();
    const select = document.getElementById(`driver-select-${unitId}`);
    const options = select.getElementsByTagName('option');

    for (let i = 0; i < options.length; i++) {
        const txtValue = options[i].textContent || options[i].innerText;
        if (txtValue.toLowerCase().indexOf(filter) > -1) {
            options[i].style.display = "";
        } else {
            options[i].style.display = "none";
        }
    }
};

// Global function for onchange
window.assignDriver = async (unitId, driverId) => {
    try {
        await api.updateUnit(unitId, { driver_id: driverId ? parseInt(driverId) : null });
        loadFlota360Data(); // Refresh to update visuals if needed
    } catch (e) {
        alert('Error al asignar chofer: ' + e.message);
    }
};
