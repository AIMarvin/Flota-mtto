// Order Management Modals - Complete with all improvements

//Create Order Modal
function showCreateOrderForm() {
    const modal = document.getElementById('order-modal');
    const content = document.getElementById('order-modal-content');

    content.innerHTML = `
        <span class="modal-close" onclick="app.closeOrderModal()">&times;</span>
        <h3>➕ Nueva Orden de Trabajo</h3>
        <form id="create-order-form">
            <div class="form-group">
                <label>Unidad *</label>
                <select id="order-unit" required>
                    <option value="">Cargando unidades...</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Prioridad *</label>
                <select id="order-priority" required>
                    <option value="">Seleccionar...</option>
                    <option value="LOW">🟢 BAJA</option>
                    <option value="MEDIUM">🟡 MEDIA</option>
                    <option value="HIGH">🟠 ALTA</option>
                    <option value="CRITICAL">🔴 CRÍTICA</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Tipo de Falla *</label>
                <select id="order-failure-type" required>
                    <option value="">Seleccionar...</option>
                    <option value="Frenos">🛑 Frenos</option>
                    <option value="Llantas">🔧 Llantas</option>
                    <option value="Motor">⚙️ Motor</option>
                    <option value="Aire Acondicionado">❄️ Aire Acondicionado</option>
                    <option value="Sistema Eléctrico">⚡ Sistema Eléctrico</option>
                    <option value="Carrocería">🚌 Carrocería</option>
                    <option value="Otro">📝 Otro</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Notas Adicionales (Opcional)</label>
                <textarea id="order-notes" rows="3" placeholder="Información adicional sobre la falla..."></textarea>
            </div>
            
            <div class="form-group">
                <label>Asignar Técnico *</label>
                <select id="order-technician" required>
                    <option value="">Cargando técnicos...</option>
                </select>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button type="button" class="btn" onclick="app.closeOrderModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Orden</button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    loadUnitsForOrder();
    loadTechniciansForOrder();

    document.getElementById('create-order-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleCreateOrderSubmit();
    });
}

async function loadUnitsForOrder() {
    try {
        const units = await api.getUnits();
        const select = document.getElementById('order-unit');
        select.innerHTML = '<option value="">Seleccionar unidad...</option>' +
            units.map(u => `<option value="${u.id}">${u.eco_number} - ${u.model || 'N/A'}</option>`).join('');
    } catch (error) {
        console.error('Error loading units:', error);
    }
}

async function loadTechniciansForOrder() {
    try {
        const technicians = await api.request('/users/technicians');
        const select = document.getElementById('order-technician');
        select.innerHTML = '<option value="">Seleccionar técnico...</option>' +
            technicians.map(t => `<option value="${t.id}">${t.full_name}</option>`).join('');
    } catch (error) {
        console.error('Error loading technicians:', error);
        const select = document.getElementById('order-technician');
        select.innerHTML = '<option value="">Error al cargar técnicos</option>';
    }
}

async function handleCreateOrderSubmit() {
    const unitId = parseInt(document.getElementById('order-unit').value);
    const priority = document.getElementById('order-priority').value;
    const failureType = document.getElementById('order-failure-type').value;
    const notes = document.getElementById('order-notes').value;
    const technicianId = document.getElementById('order-technician').value;

    if (!unitId || !priority || !failureType || !technicianId) {
        alert('Por favor completa todos los campos requeridos');
        return;
    }

    let description = failureType;
    if (notes.trim()) {
        description += `: ${notes}`;
    }

    try {
        const orderData = {
            unit_id: unitId,
            priority: priority,
            description: description,
            technician_id: parseInt(technicianId)
        };

        await api.createOrder(orderData);
        alert('✅ Orden creada exitosamente');
        closeOrderModal();
        app.showView('orders');
    } catch (error) {
        console.error('Error creating order:', error);
        alert('❌ Error al crear la orden: ' + error.message);
    }
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.add('hidden');
}

// Order Detail Modal
async function viewOrderDetails(orderId) {
    const modal = document.getElementById('order-modal');
    const content = document.getElementById('order-modal-content');

    content.innerHTML = '<p class="loading">Cargando detalles...</p>';
    modal.classList.remove('hidden');

    try {
        const order = await api.getOrder(orderId);
        const timeLogs = await api.getOrderTimeLogs(orderId);

        const token = localStorage.getItem('access_token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;

        const totalMinutes = timeLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const statusColors = {
            'PRE_ORDER': 'gray', 'OPEN': 'blue', 'IN_PROGRESS': 'orange',
            'PAUSED': 'purple', 'COMPLETED': 'green', 'REJECTED': 'red', 'CLOSED': 'gray'
        };

        const priorityIcons = {
            'LOW': '🟢', 'MEDIUM': '🟡', 'HIGH': '🟠', 'CRITICAL': '🔴'
        };

        const timeLogsHTML = timeLogs.length > 0 ? `
            <h4>⏱️ Registro de Tiempos</h4>
            <div style="max-height: 300px; overflow-y: auto;">
                <table class="orders-table" style="font-size: 0.85rem;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th>Evento</th>
                            <th>Fecha/Hora</th>
                            <th>Diferencia</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${timeLogs.reverse().map((log, index, arr) => {
            let diffText = '—';
            if (index > 0) {
                const prevDate = new Date(arr[index - 1].timestamp);
                const currDate = new Date(log.timestamp);
                const diffMs = currDate - prevDate;
                const diffMins = Math.floor(diffMs / 60000);
                const diffMinsSecs = Math.floor(diffMs / 1000);

                if (diffMins > 0) {
                    diffText = `${diffMins} min`;
                } else {
                    diffText = `${diffMinsSecs}s`;
                }
            }

            return `
                            <tr>
                                <td style="font-weight:700; color:var(--dark);">${log.event_type}</td>
                                <td>${new Date(log.timestamp).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' })}</td>
                                <td style="color:#2563eb; font-weight:600;">${diffText}</td>
                                <td style="font-size: 0.75rem; color: #64748b; max-width: 150px; overflow-wrap: break-word;">${log.reason || ''}</td>
                            </tr>
                        `;
        }).reverse().join('')}
                    </tbody>
                </table>
            </div>
            <p style="margin-top:1rem; font-weight:700; font-size:1.1rem; color:var(--primary);">Tiempo Total Activo: ${hours}h ${minutes}min</p>
        ` : '<p>Sin registros de tiempo</p>';

        // Approval/Rejection buttons ONLY for Planner/Admin when order is COMPLETED
        // Technicians see read-only view (no action buttons)
        let actionButtons = '';
        if ((userRole === 'PLANNER' || userRole === 'ADMIN') && order.status === 'COMPLETED') {
            actionButtons = `
                <button class="btn btn-success" onclick="app.approveOrder(${orderId})">
                    ✅ Aprobar / Cerrar
                </button>
                <button class="btn btn-danger" onclick="app.rejectOrder(${orderId})">
                    ❌ Rechazar
                </button>
            `;
        }

        // Show user role info for technicians (read-only indicator)
        const modeInfo = userRole === 'TECNICO' ?
            '<p style="font-style: italic; color: var(--secondary);">📖 Modo Solo Lectura</p>' : '';

        content.innerHTML = `
            <span class="modal-close" onclick="app.closeOrderModal()">&times;</span>
            <h3>📋 Detalle de Orden #${order.id}</h3>
            ${modeInfo}
            
            <div class="order-detail-grid">
                <div class="detail-row">
                    <strong>Estado:</strong>
                    <span class="badge badge-${statusColors[order.status]}">${order.status}</span>
                </div>
                
                <div class="detail-row">
                    <strong>Prioridad:</strong>
                    <span>${priorityIcons[order.priority]} ${order.priority}</span>
                </div>
                
                <div class="detail-row">
                    <strong>Unidad:</strong>
                    <span style="font-weight:700; color:var(--dark);">🚛 ${order.unit_eco || 'Unidad ' + order.unit_id}</span>
                </div>
                
                <div class="detail-row">
                    <strong>Técnico Asignado:</strong>
                    <span>
                        ${order.technician_name || 'Sin asignar'}
                    </span>
                </div>
                
                <div class="detail-row">
                    <strong>Creado:</strong>
                    <span>${new Date(order.created_at).toLocaleString('es-MX')}</span>
                </div>
                
                ${order.started_at ? `
                    <div class="detail-row">
                        <strong>Iniciado:</strong>
                        <span>${new Date(order.started_at).toLocaleString('es-MX')}</span>
                    </div>
                ` : ''}
                
                ${order.completed_at ? `
                    <div class="detail-row">
                        <strong>Completado:</strong>
                        <span>${new Date(order.completed_at).toLocaleString('es-MX')}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="detail-row" style="margin-top: 1rem;">
                <strong>Descripción:</strong>
                <p style="margin-top: 0.5rem; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                    ${order.description}
                </p>
            </div>
            
            <div style="margin-top: 1.5rem;">
                ${timeLogsHTML}
            </div>
            
            <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end; flex-wrap: wrap;">
                <button class="btn" onclick="app.closeOrderModal()">Cerrar</button>
                ${actionButtons}
            </div>
        `;

    } catch (error) {
        console.error('Error loading order details:', error);
        content.innerHTML = `
            <span class="modal-close" onclick="app.closeOrderModal()">&times;</span>
            <p style="color: var(--danger);">❌ Error al cargar detalles</p>
            <button class="btn" onclick="app.closeOrderModal()">Cerrar</button>
        `;
    }
}

async function approveOrderAction(orderId) {
    if (!confirm('¿Aprobar y cerrar esta orden?')) return;

    try {
        await api.request(`/orders/${orderId}/approve`, { method: 'POST' });
        alert('✅ Orden aprobada y cerrada');
        closeOrderModal();
        app.showView('orders');
    } catch (error) {
        console.error('Error approving order:', error);
        alert('❌ Error al aprobar: ' + error.message);
    }
}

async function rejectOrderAction(orderId) {
    if (!confirm('¿Rechazar esta orden? Se marcará como REJECTED.')) return;

    try {
        await api.request(`/orders/${orderId}/reject`, { method: 'POST' });
        alert('❌ Orden rechazada');
        closeOrderModal();
        app.showView('orders');
    } catch (error) {
        console.error('Error rejecting order:', error);
        alert('❌ Error al rechazar: ' + error.message);
    }
}

async function deleteOrderAction(orderId) {
    if (!confirm('¿Estás seguro?\n\nEsta acción NO se puede deshacer.')) {
        return;
    }

    if (!confirm('CONFIRMACIÓN FINAL:\n¿Eliminar permanentemente la orden #' + orderId + '?')) {
        return;
    }

    try {
        await api.request(`/orders/${orderId}`, { method: 'DELETE' });
        alert('🗑️ Orden eliminada');
        app.showView('orders');
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('❌ Error al eliminar: ' + error.message);
    }
}

async function promptAssignTechnician(orderId) {
    // 1. Get technicians list
    let techs = [];
    try {
        techs = await api.request('/users/technicians');
    } catch (e) {
        alert('Error cargando técnicos');
        return;
    }

    // 2. Simple prompt overlay
    const modalId = 'tech-select-modal';
    let existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const options = techs.map(t => `<option value="${t.id}">${t.full_name} (${t.email})</option>`).join('');

    const modalHtml = `
        <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:10000; display:flex; align-items:center; justify-content:center;">
             <div style="background:white; padding:2rem; border-radius:12px; width:90%; max-width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                <h3>👷 Asignar Técnico</h3>
                <p>Selecciona el técnico para la Orden #${orderId}</p>
                <select id="new-tech-select" style="width:100%; padding:10px; margin:10px 0; border-radius:8px; border:1px solid #cbd5e1;">
                    <option value="">-- Seleccionar --</option>
                    ${options}
                </select>
                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                    <button id="cancel-assign" class="btn">Cancelar</button>
                    <button id="confirm-assign" class="btn btn-primary">Asignar</button>
                </div>
             </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('cancel-assign').onclick = () => document.getElementById(modalId).remove();

    document.getElementById('confirm-assign').onclick = async () => {
        const techId = document.getElementById('new-tech-select').value;
        if (!techId) {
            alert('Selecciona un técnico');
            return;
        }

        try {
            await api.updateOrder(orderId, { technician_id: parseInt(techId), status: 'OPEN' });
            alert('✅ Técnico asignado');
            document.getElementById(modalId).remove();
            app.closeOrderModal();
            app.showView('orders');
        } catch (e) {
            console.error(e);
            alert('Error al asignar: ' + e.message);
        }
    };
}
