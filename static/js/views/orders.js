// ========== ORDERS MODULE - Technician & Planner Views ==========

// Store for technician-specific state
let _techFilter = 'TODO';
let _currentTechOrders = [];

// ===== RENDER FUNCTIONS =====

function renderOrdersView() {
    return `
        <div class="card">
            <div class="card-header">📋 Órdenes de Trabajo</div>
            <div id="orders-container">
                <p class="loading">Cargando órdenes...</p>
            </div>
        </div>
    `;
}

function renderPlannerOrdersView(orders) {
    if (!orders) return '<p class="loading">Cargando...</p>';

    const counts = {
        ALL: orders.length,
        PENDING: orders.filter(o => o.status === 'PRE_ORDER' || o.status === 'OPEN').length,
        IN_PROGRESS: orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'PAUSED').length,
        COMPLETED: orders.filter(o => o.status === 'COMPLETED' || o.status === 'CLOSED').length
    };

    const statusBadge = (status) => {
        const colors = {
            PRE_ORDER: 'gray',
            OPEN: 'blue',
            IN_PROGRESS: 'orange',
            PAUSED: 'purple',
            COMPLETED: 'green',
            CLOSED: 'gray'
        };
        return `<span class="badge badge-${colors[status] || 'gray'}">${status}</span>`;
    };

    const priorityBadge = (priority) => {
        const cls = priority.toLowerCase();
        return `<span class="priority-tag priority-${cls}">${priority}</span>`;
    };

    const formatDuration = (start, end) => {
        if (!start) return '-';
        const startTime = new Date(start);
        const endTime = end ? new Date(end) : new Date();

        let diffMs = endTime - startTime;
        if (diffMs < 0) diffMs = 0;

        const diffSeconds = Math.floor(diffMs / 1000);
        const days = Math.floor(diffSeconds / (3600 * 24));
        const hours = Math.floor((diffSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);

        return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const rows = orders.map(order => {
        const isCompleted = order.status === 'COMPLETED' || order.status === 'CLOSED';
        const endTime = isCompleted ? order.completed_at : null;
        const duration = formatDuration(order.created_at, endTime);

        return `
        <tr class="order-row" data-id="${order.id}" data-status="${order.status}" data-text="${order.description.toLowerCase()} ${order.unit_id}">
            <td style="font-weight: 600; color: var(--primary);">#${order.id}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem;">🚛</span>
                    <span style="font-weight:700;">${order.unit_eco || 'Unidad ' + order.unit_id}</span>
                </div>
            </td>
            <td>
                <div style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${order.description}">
                    ${order.description}
                </div>
            </td>
            <td>${statusBadge(order.status)}</td>
            <td>${priorityBadge(order.priority)}</td>
            <td style="font-family: monospace; font-size: 0.9rem; color: #475569;">${duration}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 1rem;">👤</span>
                    <span style="font-size: 0.9rem;">${order.technician_name || '<i>Sin asignar</i>'}</span>
                </div>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick="app.viewOrderDetails(${order.id})" title="Ver detalle">👁️</button>
                    <button class="btn-icon btn-icon-danger" onclick="app.deleteOrder(${order.id})" title="Eliminar">🗑️</button>
                </div>
            </td>
        </tr>
    `}).join('');

    return `
        <div class="management-controls">
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" id="order-search" class="search-input" placeholder="Buscar por descripción o unidad...">
            </div>
            
            <div class="filter-tabs">
                <button class="filter-tab active" data-filter="ALL">Todos (${counts.ALL})</button>
                <button class="filter-tab" data-filter="PENDING">Sin iniciar (${counts.PENDING})</button>
                <button class="filter-tab" data-filter="IN_PROGRESS">En Progreso/Pausados (${counts.IN_PROGRESS})</button>
                <button class="filter-tab" data-filter="COMPLETED">Terminados (${counts.COMPLETED})</button>
            </div>

            <button class="btn btn-primary" onclick="app.showCreateOrderForm()" style="padding: 0.6rem 1.2rem; font-size: 0.9rem; border-radius: 0.75rem;">
                + Nueva Orden
            </button>
        </div>

        <div style="overflow-x: auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #f1f5f9;">
            <table class="orders-table">
                <thead style="background: #f8fafc; border-bottom: 2px solid #f1f5f9;">
                    <tr>
                        <th>ID</th>
                        <th>Unidad</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th>Prioridad</th>
                        <th>Tiempo</th>
                        <th>Técnico</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="planner-orders-body">
                    ${rows || '<tr><td colspan="8" class="text-center p-1">No hay órdenes disponibles</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function renderTechnicianOrdersView(orders) {
    if (!orders) return '<p class="loading">Cargando...</p>';

    // Categorize orders for Kanban columns
    const kanbanColumns = {
        OPEN: orders.filter(o => o.status === 'OPEN'),
        IN_PROGRESS: orders.filter(o => o.status === 'IN_PROGRESS'),
        PAUSED: orders.filter(o => o.status === 'PAUSED'),
        COMPLETED: orders.filter(o => ['COMPLETED', 'CLOSED'].includes(o.status))
    };

    // Productivity Stats Section (Header)
    const statsSection = `
        <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 1.25rem; border-radius: 16px; border: 1px solid #334155;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="margin: 0; font-size: 1.1rem;">📊 Mi Productividad</h3>
                    <p style="margin: 0.25rem 0 0 0; color: #94a3b8; font-size: 0.8rem;">Rendimiento personal</p>
                </div>
                <div class="stats-period-selector" style="background: rgba(255,255,255,0.1); border-radius: 10px; padding: 3px; display: flex; gap: 3px;">
                    <button onclick="loadTechnicianStats('HOY')" class="period-btn active" data-period="HOY" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 10px; border-radius: 7px; font-size: 0.75rem; cursor: pointer; font-weight: 600;">Hoy</button>
                    <button onclick="loadTechnicianStats('SEMANA')" class="period-btn" data-period="SEMANA" style="background: transparent; border: none; color: #94a3b8; padding: 4px 10px; border-radius: 7px; font-size: 0.75rem; cursor: pointer; font-weight: 600;">Semana</button>
                    <button onclick="loadTechnicianStats('MES')" class="period-btn" data-period="MES" style="background: transparent; border: none; color: #94a3b8; padding: 4px 10px; border-radius: 7px; font-size: 0.75rem; cursor: pointer; font-weight: 600;">Mes</button>
                </div>
            </div>

            <div id="tech-stats-container" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                <div style="background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 1.25rem; font-weight: 700;">--</div>
                    <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">Completadas</div>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 1.25rem; font-weight: 700; color: #fbbf24;">--</div>
                    <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">Pendientes</div>
                </div>
            </div>
            
            <div style="margin-top: 1rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #cbd5e1; margin-bottom: 0.4rem;">
                    <span>Eficiencia de Cierre</span>
                    <span id="efficiency-val">0%</span>
                </div>
                <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                    <div id="efficiency-bar" style="width: 0%; height: 100%; background: #22c55e; border-radius: 3px; transition: width 0.5s ease;"></div>
                </div>
            </div>
        </div>
    `;

    const token = localStorage.getItem('access_token');
    let userName = 'Técnico';
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userName = payload.full_name || 'Técnico';
        } catch (e) { }
    }

    // Helper function to render a single Kanban card
    const renderKanbanCard = (order) => {
        const priorityColors = {
            'CRITICAL': '#ef4444',
            'HIGH': '#f97316',
            'MEDIUM': '#eab308',
            'LOW': '#22c55e'
        };
        const priorityColor = priorityColors[order.priority] || '#64748b';
        const priorityEmoji = order.priority === 'CRITICAL' ? '🔴' : (order.priority === 'HIGH' ? '🟠' : (order.priority === 'MEDIUM' ? '🟡' : '🟢'));

        let actionBtn = '';
        switch (order.status) {
            case 'OPEN':
                actionBtn = `<button onclick="app.startWork(${order.id})" style="width:100%; padding: 8px; border-radius: 8px; background: #3b82f6; color: white; border: none; font-weight: 700; font-size: 0.75rem; cursor: pointer;">▶️ INICIAR</button>`;
                break;
            case 'IN_PROGRESS':
                actionBtn = `
                    <div style="display: flex; gap: 4px;">
                        <button onclick="app.pauseWork(${order.id})" style="flex:1; padding: 8px; border-radius: 8px; background: #f59e0b; color: white; border: none; font-weight: 700; font-size: 0.7rem; cursor: pointer;">⏸️</button>
                        <button onclick="app.finishWork(${order.id})" style="flex:1; padding: 8px; border-radius: 8px; background: #10b981; color: white; border: none; font-weight: 700; font-size: 0.7rem; cursor: pointer;">✅</button>
                    </div>`;
                break;
            case 'PAUSED':
                actionBtn = `<button onclick="app.resumeWork(${order.id})" style="width:100%; padding: 8px; border-radius: 8px; background: #8b5cf6; color: white; border: none; font-weight: 700; font-size: 0.75rem; cursor: pointer;">▶️ REANUDAR</button>`;
                break;
            case 'COMPLETED':
            case 'CLOSED':
                actionBtn = `<div style="text-align: center; padding: 6px; background: #dcfce7; color: #166534; border-radius: 6px; font-size: 0.7rem; font-weight: 600;">✅ Completado</div>`;
                break;
        }

        return `
            <div class="kanban-card" style="background: white; border-radius: 12px; padding: 12px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s;" onclick="app.viewOrderDetails(${order.id})">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 800; color: #1e293b; font-size: 0.9rem;">#${order.id}</span>
                    <span style="font-size: 0.65rem; font-weight: 700; color: ${priorityColor};">${priorityEmoji} ${order.priority}</span>
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; background: #f8fafc; padding: 8px; border-radius: 8px;">
                    <span style="font-size: 1.25rem;">🚛</span>
                    <div>
                        <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 600;">UNIDAD</div>
                        <div style="font-size: 0.9rem; font-weight: 800; color: #1e293b;">ECO ${order.unit_eco || order.unit_id}</div>
                    </div>
                </div>
                
                <p style="font-size: 0.75rem; color: #475569; margin: 0 0 10px 0; line-height: 1.4; max-height: 40px; overflow: hidden; text-overflow: ellipsis;">
                    ${order.description || 'Sin descripción'}
                </p>
                
                <div onclick="event.stopPropagation()">
                    ${actionBtn}
                </div>
            </div>
        `;
    };

    // Column configurations
    const columns = [
        { key: 'OPEN', title: 'Sin Iniciar', icon: '⏳', color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#93c5fd' },
        { key: 'IN_PROGRESS', title: 'En Proceso', icon: '🔨', color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fcd34d' },
        { key: 'PAUSED', title: 'Pausada', icon: '⏸️', color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#c4b5fd' },
        { key: 'COMPLETED', title: 'Terminada', icon: '✅', color: '#10b981', bgColor: '#ecfdf5', borderColor: '#6ee7b7' }
    ];

    const kanbanBoard = columns.map(col => {
        const columnOrders = kanbanColumns[col.key] || [];
        const cardsHtml = columnOrders.length > 0
            ? columnOrders.map(o => renderKanbanCard(o)).join('')
            : `<div style="text-align: center; padding: 2rem 1rem; color: #94a3b8; font-size: 0.8rem;">
                   <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.4;">📭</div>
                   Sin órdenes
               </div>`;

        return `
            <div class="kanban-column" style="flex: 1; min-width: 260px; max-width: 320px; background: ${col.bgColor}; border-radius: 16px; border: 2px solid ${col.borderColor}; overflow: hidden;">
                <div style="padding: 12px 16px; background: ${col.color}; color: white; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem;">${col.icon}</span>
                        <span style="font-weight: 700; font-size: 0.9rem;">${col.title}</span>
                    </div>
                    <span style="background: rgba(255,255,255,0.3); padding: 2px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 800;">${columnOrders.length}</span>
                </div>
                <div class="kanban-cards" style="padding: 12px; max-height: calc(100vh - 350px); overflow-y: auto;">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }).join('');

    const totalOrders = orders.length;

    return `
        <div style="padding: 0 1rem; padding-bottom: 2rem;">
            <!-- Header -->
            <div style="margin-bottom: 1rem;">
                <h2 style="font-size: 1.5rem; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                    👋 Hola, ${userName}
                </h2>
                <p style="color: #64748b; margin: 0.25rem 0 0 0; font-size: 0.9rem;">
                    Tienes <strong>${totalOrders}</strong> órdenes asignadas
                </p>
            </div>

            ${statsSection}

            <!-- Kanban Board -->
            <div style="margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
                <h3 style="margin: 0; font-size: 1.1rem; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                    📋 Mis Órdenes de Trabajo
                </h3>
                <button onclick="loadOrdersData()" style="background: #f1f5f9; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; cursor: pointer; color: #64748b; font-weight: 600;">
                    ↻ Actualizar
                </button>
            </div>

            <div class="kanban-board" style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem;">
                ${kanbanBoard}
            </div>
        </div>
    `;
}

function renderOrderButtons(order) {
    const btnStyle = "padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; font-size: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: none; cursor: pointer; transition: transform 0.1s;";

    switch (order.status) {
        case 'OPEN':
            return `<button onclick="app.startWork(${order.id})" style="${btnStyle} background: var(--primary); color: white;">
                ▶️ INICIAR TRABAJO
            </button>`;

        case 'IN_PROGRESS':
            return `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <button onclick="app.pauseWork(${order.id})" style="${btnStyle} background: #f59e0b; color: white;">
                        ⏸️ PAUSAR
                    </button>
                    <button onclick="app.finishWork(${order.id})" style="${btnStyle} background: #10b981; color: white;">
                        ✅ TERMINAR
                    </button>
                </div>
            `;

        case 'PAUSED':
            return `<button onclick="app.resumeWork(${order.id})" style="${btnStyle} background: var(--primary); color: white;">
                ▶️ REANUDAR TAREA
            </button>`;

        case 'COMPLETED':
            return `
                <div style="text-align: center; padding: 0.5rem; color: var(--success); background: #dcfce7; border-radius: 8px; font-weight: 600;">
                    ✨ Trabajo completado con éxito
                </div>
            `;

        default:
            return '';
    }
}

// ===== HANDLER FUNCTIONS =====

async function loadOrdersData() {
    const container = document.getElementById('orders-container');

    try {
        const orders = await api.getOrders();

        // Get current user info from token
        const token = localStorage.getItem('access_token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;

        if (userRole === 'PLANNER' || userRole === 'ADMIN') {
            // PLANNER VIEW: Control panel with all orders
            _currentTechOrders = orders;
            container.innerHTML = renderPlannerOrdersView(orders);
            attachPlannerHandlers(orders);
        } else {
            // TECHNICIAN VIEW: My orders with execution buttons
            _currentTechOrders = orders;
            container.innerHTML = renderTechnicianOrdersView(orders);
            attachTechnicianHandlers(orders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = '<p style="color: var(--danger);">❌ Error al cargar órdenes</p>';
    }
}

function setTechFilter(filter) {
    _techFilter = filter;
    const container = document.getElementById('orders-container');
    if (container) {
        container.innerHTML = renderTechnicianOrdersView(_currentTechOrders);
    }
}

function attachPlannerHandlers(orders) {
    const searchInput = document.getElementById('order-search');
    const tabs = document.querySelectorAll('.filter-tab');
    const rows = document.querySelectorAll('.order-row');

    let currentFilter = 'ALL';
    let currentSearch = '';

    const updateView = () => {
        let visibleCount = 0;
        rows.forEach(row => {
            const status = row.getAttribute('data-status');
            const text = row.getAttribute('data-text');

            let matchesFilter = currentFilter === 'ALL';
            if (currentFilter === 'PENDING') {
                matchesFilter = status === 'PRE_ORDER' || status === 'OPEN';
            } else if (currentFilter === 'IN_PROGRESS') {
                matchesFilter = status === 'IN_PROGRESS' || status === 'PAUSED';
            } else if (currentFilter === 'COMPLETED') {
                matchesFilter = status === 'COMPLETED' || status === 'CLOSED';
            }

            const matchesSearch = text.includes(currentSearch.toLowerCase());

            if (matchesFilter && matchesSearch) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Show "no results" if needed
        const body = document.getElementById('planner-orders-body');
        const noResults = document.getElementById('no-results-row');
        if (visibleCount === 0) {
            if (!noResults) {
                const tr = document.createElement('tr');
                tr.id = 'no-results-row';
                tr.innerHTML = `<td colspan="7" class="text-center p-1" style="color: var(--gray);">No se encontraron órdenes</td>`;
                body.appendChild(tr);
            }
        } else if (noResults) {
            noResults.remove();
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            updateView();
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter');
            updateView();
        });
    });

    console.log('Planner view handlers attached');
}

function attachTechnicianHandlers(orders) {
    // Technician-specific handlers
    console.log('Technician view loaded with', orders.length, 'orders');

    // Load initial stats
    loadTechnicianStats('HOY');
}

async function loadTechnicianStats(period) {
    const container = document.getElementById('tech-stats-container');
    if (!container) return; // View changed

    // Update active button
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = '#94a3b8';

        if (btn.dataset.period === period) {
            btn.classList.add('active');
            btn.style.background = 'rgba(255,255,255,0.2)';
            btn.style.color = 'white';
        }
    });

    try {
        const stats = await api.getTechnicianStats(period);

        // Render Stats
        container.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700;">${stats.completed}</div>
                <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Completadas</div>
                ${stats.avg_completion_time_hours > 0 ? `<div style="font-size: 0.6rem; color: #4ade80; margin-top:4px;">⏱️ ~${stats.avg_completion_time_hours} hrs</div>` : ''}
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #fbbf24;">${stats.pending}</div>
                <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Pendientes</div>
                <div style="font-size: 0.6rem; color: #94a3b8; margin-top:4px;">Total Asignado: ${stats.total_assigned}</div>
            </div>
        `;

        // Update Efficiency Bar
        const bar = document.getElementById('efficiency-bar');
        const val = document.getElementById('efficiency-val');
        if (bar && val) {
            setTimeout(() => {
                bar.style.width = `${stats.completion_rate}%`;
                val.textContent = `${stats.completion_rate}%`;

                // Color coding for efficiency
                if (stats.completion_rate < 50) bar.style.background = '#fbbf24';
                else if (stats.completion_rate < 80) bar.style.background = '#3b82f6';
                else bar.style.background = '#22c55e';
            }, 100);
        }

    } catch (error) {
        console.error('Error loading stats:', error);
        container.innerHTML = `<p style="grid-column: span 2; font-size: 0.8rem; color: #ef4444; text-align:center;">Error al cargar datos</p>`;
    }
}
