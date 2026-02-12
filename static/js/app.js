// ========== FLOTA PWA - Main Application Controller ==========
// This file is the "orchestrator" - it handles navigation and app initialization.
// All view-specific logic lives in static/js/views/*.js

class FlotaApp {
    constructor() {
        this.currentView = null;
        this.currentUser = null;
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Flota PWA...');

        // Initialize IndexedDB
        await offlineDB.init();
        console.log('✅ IndexedDB initialized');

        // Check if user is logged in
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userRole = payload.role;
                renderMenuForRole(userRole);
                const firstView = MENU_CONFIG[userRole][0].view;
                this.showView(firstView);
                document.getElementById('bottom-nav').classList.remove('hidden');
            } catch (e) {
                // Invalid token
                this.showView('login');
            }
        } else {
            this.showView('login');
        }

        // Setup navigation
        this.setupNavigation();

        // Setup online/offline detection
        this.setupConnectivityListeners();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-item');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.getAttribute('data-view');
                this.navigateTo(view);
            });
        });
    }

    navigateTo(viewName) {
        // Update active nav button
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Show view
        this.showView(viewName);
    }

    showView(viewName) {
        const container = document.getElementById('view-container');

        switch (viewName) {
            case 'login':
                container.innerHTML = this.renderLogin();
                this.attachLoginHandlers();
                break;
            case 'dashboard':
                container.innerHTML = renderDashboardWithKPIs();
                loadDashboardKPIs();
                break;
            case 'orders':
                container.innerHTML = renderOrdersView();
                loadOrdersData();
                break;
            case 'checklist':
                container.innerHTML = renderChecklistView();
                loadChecklistHandlers();
                break;
            case 'audit':
                container.innerHTML = renderAuditView();
                loadAuditHistory();
                break;
            case 'profile':
                container.innerHTML = this.renderProfile();
                this.attachProfileHandlers();
                break;
            case 'flota':
                container.innerHTML = renderFlota360View();
                loadFlota360Data();
                break;
            case 'users':
                container.innerHTML = renderUsersView();
                loadUsersData();
                break;
            case 'ai_predict':
                container.innerHTML = renderAIView();
                if (typeof initAIDashboard === 'function') {
                    initAIDashboard();
                }
                break;
            case 'warehouse':
                if (typeof renderWarehouseView === 'function') {
                    container.innerHTML = renderWarehouseView();
                    loadWarehouseData();
                } else {
                    container.innerHTML = '<div class="error">Módulo no cargado</div>';
                }
                break;
            case 'tires':
                if (typeof renderTiresView === 'function') {
                    container.innerHTML = renderTiresView();
                } else {
                    container.innerHTML = '<div class="error">Módulo de llantas no cargado</div>';
                }
                break;
            default:
                container.innerHTML = '<div class="card"><p>Vista no encontrada</p></div>';
        }

        this.currentView = viewName;
    }

    // ===== LOGIN VIEW =====
    renderLogin() {
        return `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-logo-container">
                        <img src="img/steppi_logo.svg" alt="Steppi Logo" class="login-logo">
                        <h1 class="login-title">Flota Mantenimiento</h1>
                        <p class="login-subtitle">Gestión de Mantenimiento de Flota</p>
                    </div>
                    <form id="login-form" class="login-form">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="email" required placeholder="tu@email.com" class="login-input">
                        </div>
                        <div class="form-group">
                            <label>Contraseña</label>
                            <input type="password" id="password" required placeholder="••••••••" class="login-input">
                        </div>
                        <button type="submit" class="btn btn-login">Iniciar Sesión</button>
                    </form>
                    <p id="login-error" class="text-center mt-1" style="color: var(--danger); display: none;"></p>
                    <div class="login-footer">
                        &copy; 2026 Steppi - Todos los derechos reservados
                    </div>
                </div>
            </div>
        `;
    }

    attachLoginHandlers() {
        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await api.login(email, password);

                // Get user role from token
                const token = localStorage.getItem('access_token');
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userRole = payload.role;

                // Render menu based on role
                renderMenuForRole(userRole);

                document.getElementById('bottom-nav').classList.remove('hidden');

                // Navigate to first menu item
                const firstView = MENU_CONFIG[userRole][0].view;
                this.showView(firstView);
            } catch (error) {
                console.error('Login error:', error);
                const errorEl = document.getElementById('login-error');
                errorEl.textContent = 'Error: Email o contraseña incorrectos';
                errorEl.style.display = 'block';
            }

        });
    }

    // ===== PROFILE VIEW =====
    renderProfile() {
        const token = localStorage.getItem('access_token');
        let user = { full_name: 'Usuario', email: '...', role: '...', user_id: '?' };

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                user = {
                    full_name: payload.full_name || 'Usuario',
                    email: payload.sub || '',
                    role: payload.role || 'N/A',
                    user_id: payload.user_id || payload.id || '?',
                    unit_id: payload.unit_id || null
                };
            } catch (e) { console.error(e); }
        }

        const initials = user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const roleColors = { 'ADMIN': '#7c3aed', 'PLANNER': '#2563eb', 'CHOFER': '#16a34a', 'TECNICO': '#ea580c' };
        const roleColor = roleColors[user.role] || '#64748b';

        return `
            <div style="max-width: 600px; margin: 0 auto; padding-bottom: 2rem;">
                <!-- Profile Header Card -->
                <div class="card" style="border: none; overflow: hidden; padding: 0; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, ${roleColor}, #1e293b); height: 100px;"></div>
                    <div style="margin-top: -50px; text-align: center; padding-bottom: 2rem;">
                        <div style="width: 100px; height: 100px; background: white; border-radius: 50%; padding: 4px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                            <div style="width: 100%; height: 100%; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 700; color: ${roleColor};">
                                ${initials}
                            </div>
                        </div>
                        
                        <h2 style="margin: 1rem 0 0.25rem 0; color: #1e293b; font-size: 1.5rem;">${user.full_name}</h2>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span class="badge" style="background: ${roleColor}20; color: ${roleColor}; font-size: 0.8rem; padding: 4px 12px;">${user.role}</span>
                        </div>
                        <p style="color: #64748b; margin: 0;">${user.email}</p>
                    </div>
                </div>

                <!-- Stats / Info Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <div class="card" style="text-align: center; padding: 1.5rem; margin: 0;">
                        <div style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">ID Usuario</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #1e293b;">#${user.user_id}</div>
                    </div>
                    <div class="card" style="text-align: center; padding: 1.5rem; margin: 0;">
                        <div style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Estado</div>
                        <div style="font-size: 1.2rem; font-weight: 600; color: #16a34a;">🟢 Activo</div>
                    </div>
                </div>

                <!-- Settings List like -->
                <div class="card" style="margin-top: 1rem; padding: 0; overflow: hidden;">
                    <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569;">Preferencias</div>
                    
                    <div style="padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-size: 1.2rem;">🔔</span>
                            <span>Notificaciones</span>
                        </div>
                        <div style="width: 40px; height: 20px; background: #cbd5e1; border-radius: 10px; position: relative;">
                            <div style="width: 16px; height: 16px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px;"></div>
                        </div>
                    </div>

                    <div style="padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-size: 1.2rem;">🌙</span>
                            <span>Modo Oscuro</span>
                        </div>
                        <div style="width: 40px; height: 20px; background: #cbd5e1; border-radius: 10px; position: relative;">
                             <div style="width: 16px; height: 16px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px;"></div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 2rem; text-align: center;">
                    <p style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 1rem;">Flota Mantenimiento PWA v1.2.0 • Build 2026</p>
                    <button id="logout-btn" class="btn btn-danger btn-block" style="padding: 1rem; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);">Cerrar Sesión</button>
                    ${!user.full_name || user.full_name === 'Usuario' ? '<p style="color: var(--warning); font-size: 0.8rem; margin-top: 10px;">⚠️ Vuelve a iniciar sesión para ver tu nombre completo.</p>' : ''}
                </div>
            </div>
        `;
    }

    attachProfileHandlers() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await api.logout();
                document.getElementById('bottom-nav').classList.add('hidden');
                this.showView('login');
            });
        }
    }

    // ===== HELPERS FOR AUDIT MODAL =====
    showAuditDetail(checklistId) {
        showAuditDetailModal(checklistId);
    }

    closeAuditModal() {
        closeAuditModal();
    }

    // ===== ORDER ACTION METHODS (Technician) =====
    async startWork(orderId) {
        // Show modal to select parts needed for the job
        const modal = document.createElement('div');
        modal.id = 'parts-selection-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding: 1rem;';

        modal.innerHTML = `
            <div style="background:white; border-radius:20px; width:100%; max-width:500px; max-height:90vh; overflow-y:auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 1.5rem; border-radius: 20px 20px 0 0;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 2rem;">🔧</span>
                        <div>
                            <h3 style="margin: 0; font-size: 1.25rem;">Iniciar Orden #${orderId}</h3>
                            <p style="margin: 0; opacity: 0.8; font-size: 0.85rem;">Selecciona las refacciones necesarias</p>
                        </div>
                    </div>
                </div>

                <!-- Content -->
                <div style="padding: 1.5rem;">
                    <!-- Search -->
                    <div style="margin-bottom: 1rem;">
                        <input type="text" id="parts-search" placeholder="🔍 Buscar refacción..." 
                            style="width:100%; padding: 12px 16px; border-radius: 12px; border: 2px solid #e2e8f0; font-size: 0.95rem; transition: all 0.2s;">
                    </div>

                    <!-- Available Parts List -->
                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; font-size: 0.9rem;">📦 Refacciones Disponibles</div>
                        <div id="available-parts-list" style="max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <div style="padding: 2rem; text-align: center; color: #94a3b8;">Cargando refacciones...</div>
                        </div>
                    </div>

                    <!-- Selected Parts -->
                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center;">
                            <span>🛒 Refacciones Seleccionadas</span>
                            <span id="selected-count" style="background: #3b82f6; color: white; padding: 2px 10px; border-radius: 20px; font-size: 0.75rem;">0</span>
                        </div>
                        <div id="selected-parts-list" style="min-height: 60px; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 12px;">
                            <div style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 1rem;">
                                Haz clic en una refacción para agregarla
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <button id="cancel-start" style="padding: 14px; background: #f1f5f9; color: #64748b; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 0.95rem;">
                            ✕ Cancelar
                        </button>
                        <button id="confirm-start" style="padding: 14px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                            ▶️ Iniciar Trabajo
                        </button>
                    </div>

                    <p style="text-align: center; color: #94a3b8; font-size: 0.75rem; margin-top: 1rem;">
                        💡 Puedes iniciar sin seleccionar refacciones si no las necesitas ahora
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // State
        let allProducts = [];
        let selectedParts = []; // [{id, name, quantity, stock}]

        // Load products
        try {
            allProducts = await api.getProducts();
            this.renderAvailablePartsList(allProducts, selectedParts);
        } catch (e) {
            document.getElementById('available-parts-list').innerHTML = `
                <div style="padding: 1rem; text-align: center; color: #ef4444;">Error al cargar refacciones</div>
            `;
        }

        // Search functionality
        document.getElementById('parts-search').oninput = (e) => {
            const val = e.target.value.toLowerCase();
            const filtered = allProducts.filter(p =>
                p.name.toLowerCase().includes(val) ||
                p.sku.toLowerCase().includes(val) ||
                (p.category && p.category.toLowerCase().includes(val))
            );
            this.renderAvailablePartsList(filtered, selectedParts);
        };

        // Cancel
        document.getElementById('cancel-start').onclick = () => {
            document.body.removeChild(modal);
        };

        // Confirm and start
        document.getElementById('confirm-start').onclick = async () => {
            document.body.removeChild(modal);

            // Start the order with selected parts
            await this.startOrderWithParts(orderId, selectedParts);
        };

        // Store functions in window for onclick handlers
        window._addPartToSelection = (productId) => {
            const product = allProducts.find(p => p.id === productId);
            if (!product || product.current_stock <= 0) return;

            const existing = selectedParts.find(p => p.id === productId);
            if (existing) {
                if (existing.quantity < product.current_stock) {
                    existing.quantity++;
                }
            } else {
                selectedParts.push({
                    id: product.id,
                    name: product.name,
                    quantity: 1,
                    stock: product.current_stock,
                    cost: product.cost_price || 0
                });
            }
            this.renderSelectedPartsList(selectedParts);
            this.renderAvailablePartsList(allProducts.filter(p => {
                const search = document.getElementById('parts-search').value.toLowerCase();
                return p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
            }), selectedParts);
        };

        window._updatePartQuantity = (productId, delta) => {
            const part = selectedParts.find(p => p.id === productId);
            if (!part) return;

            part.quantity += delta;
            if (part.quantity <= 0) {
                selectedParts = selectedParts.filter(p => p.id !== productId);
            } else if (part.quantity > part.stock) {
                part.quantity = part.stock;
            }
            this.renderSelectedPartsList(selectedParts);
        };

        window._removePart = (productId) => {
            selectedParts = selectedParts.filter(p => p.id !== productId);
            this.renderSelectedPartsList(selectedParts);
            this.renderAvailablePartsList(allProducts.filter(p => {
                const search = document.getElementById('parts-search').value.toLowerCase();
                return p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
            }), selectedParts);
        };
    }

    renderAvailablePartsList(products, selectedParts) {
        const container = document.getElementById('available-parts-list');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: #94a3b8;">No se encontraron refacciones</div>`;
            return;
        }

        const selectedIds = selectedParts.map(p => p.id);

        container.innerHTML = products.map(p => {
            const isSelected = selectedIds.includes(p.id);
            const isOutOfStock = p.current_stock <= 0;
            const bgColor = isSelected ? '#ecfdf5' : (isOutOfStock ? '#fef2f2' : 'white');
            const borderColor = isSelected ? '#10b981' : '#f1f5f9';

            return `
                <div onclick="${!isOutOfStock ? `_addPartToSelection(${p.id})` : ''}" 
                     style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; cursor: ${isOutOfStock ? 'not-allowed' : 'pointer'}; 
                            background: ${bgColor}; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center;
                            ${isSelected ? `border-left: 3px solid ${borderColor};` : ''}">
                    <div>
                        <div style="font-weight: 600; color: ${isOutOfStock ? '#94a3b8' : '#1e293b'}; font-size: 0.9rem;">${p.name}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">${p.sku} • ${p.category || 'Sin categoría'}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.8rem; font-weight: 700; color: ${isOutOfStock ? '#ef4444' : '#10b981'};">
                            ${isOutOfStock ? '❌ Agotado' : `${p.current_stock} disp.`}
                        </div>
                        ${p.cost_price ? `<div style="font-size: 0.7rem; color: #94a3b8;">$${p.cost_price.toLocaleString()}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderSelectedPartsList(selectedParts) {
        const container = document.getElementById('selected-parts-list');
        const countEl = document.getElementById('selected-count');
        if (!container) return;

        if (countEl) countEl.textContent = selectedParts.length;

        if (selectedParts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 1rem;">
                    Haz clic en una refacción para agregarla
                </div>
            `;
            return;
        }

        const totalCost = selectedParts.reduce((sum, p) => sum + (p.cost * p.quantity), 0);

        container.innerHTML = selectedParts.map(p => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #f8fafc; border-radius: 10px; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #1e293b; font-size: 0.85rem;">${p.name}</div>
                    <div style="font-size: 0.7rem; color: #64748b;">$${(p.cost * p.quantity).toLocaleString()} total</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button onclick="_updatePartQuantity(${p.id}, -1)" 
                            style="width: 28px; height: 28px; border-radius: 6px; border: none; background: #e2e8f0; cursor: pointer; font-weight: 700; font-size: 1rem;">−</button>
                    <span style="font-weight: 700; min-width: 30px; text-align: center;">${p.quantity}</span>
                    <button onclick="_updatePartQuantity(${p.id}, 1)" 
                            style="width: 28px; height: 28px; border-radius: 6px; border: none; background: #3b82f6; color: white; cursor: pointer; font-weight: 700; font-size: 1rem;">+</button>
                    <button onclick="_removePart(${p.id})" 
                            style="width: 28px; height: 28px; border-radius: 6px; border: none; background: #fecaca; color: #ef4444; cursor: pointer; font-size: 0.8rem;">✕</button>
                </div>
            </div>
        `).join('') + `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e2e8f0; display: flex; justify-content: space-between; font-weight: 700;">
                <span style="color: #64748b;">Costo Estimado:</span>
                <span style="color: #1e293b;">$${totalCost.toLocaleString()}</span>
            </div>
        `;
    }

    async startOrderWithParts(orderId, selectedParts) {
        try {
            // First, create stock movements for each selected part (OUT)
            for (const part of selectedParts) {
                await api.createStockMovement({
                    product_id: part.id,
                    change_amount: -part.quantity, // Negative for OUT
                    movement_type: 'OUT',
                    reason: `Orden de trabajo #${orderId}`
                });
            }

            // Then change order status to IN_PROGRESS
            await api.changeOrderStatus(orderId, 'IN_PROGRESS');
            console.log(`✅ Order ${orderId} started with ${selectedParts.length} parts`);

            // Reload orders view
            this.showView('orders');
        } catch (error) {
            console.error('Error starting order:', error);
            alert('Error al iniciar la orden: ' + error.message);
        }
    }

    async pauseWork(orderId) {
        // Create modal for reason selection
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; display:flex; align-items:center; justify-content:center;';

        modal.innerHTML = `
            <div id="pause-modal-content" style="background:white; padding:2rem; border-radius:12px; width:90%; max-width:400px; text-align:center; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                <h3 style="margin-top:0; color:#1f2937;">⏸️ Motivo de Pausa</h3>
                <p style="color:#6b7280; margin-bottom:1.5rem;">Por favor selecciona la razón de la pausa:</p>
                
                <div id="pause-reasons" style="display:grid; gap:10px;">
                    <button id="reason-parts" style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:white; font-weight:600; color:#374151; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        🔧 Esperando Refacción
                    </button>
                    <button id="reason-job" style="padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:white; font-weight:600; color:#374151; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                        📋 Cambio de Trabajo
                    </button>
                </div>

                <button id="cancel-pause" style="margin-top:1.5rem; color:#ef4444; background:none; border:none; font-weight:600; cursor:pointer;">Cancelar</button>
            </div>
        `;

        document.body.appendChild(modal);

        return new Promise((resolve) => {
            const cleanup = () => document.body.removeChild(modal);

            document.getElementById('reason-parts').onclick = async () => {
                // Change modal content to parts selection
                const content = document.getElementById('pause-modal-content');
                content.innerHTML = `
                    <h3 style="margin-top:0; color:#1f2937;">🛠️ Seleccionar Refacción</h3>
                    <p style="color:#6b7280; margin-bottom:1.5rem;">Busca y selecciona la pieza necesaria:</p>
                    
                    <div style="text-align: left; margin-bottom: 1rem;">
                        <input type="text" id="part-search" placeholder="Buscar refacción..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; margin-bottom:10px;">
                        <select id="part-select" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; height: 150px;" size="5">
                             <option value="">Cargando refacciones...</option>
                        </select>
                        <div style="margin-top: 1rem;">
                            <label style="font-size: 0.85rem; font-weight: 600; color: #4b5563;">Cantidad:</label>
                            <input type="number" id="part-qty" value="1" min="1" step="1" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <button id="confirm-part" style="padding:12px; background:var(--primary); color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer;">Confirmar</button>
                        <button id="back-pause" style="padding:12px; background:#f3f4f6; color:#4b5563; border:none; border-radius:8px; font-weight:600; cursor:pointer;">Volver</button>
                    </div>
                `;

                // Load parts
                let allProducts = [];
                try {
                    allProducts = await api.getProducts();
                    const select = document.getElementById('part-select');
                    const renderParts = (parts) => {
                        select.innerHTML = parts.map(p => `<option value="${p.id}">${p.name} (Stock: ${p.current_stock})</option>`).join('');
                    };
                    renderParts(allProducts);

                    document.getElementById('part-search').oninput = (e) => {
                        const val = e.target.value.toLowerCase();
                        const filtered = allProducts.filter(p => p.name.toLowerCase().includes(val) || p.sku.toLowerCase().includes(val));
                        renderParts(filtered);
                    };
                } catch (e) {
                    alert("Error cargando inventario");
                }

                document.getElementById('confirm-part').onclick = async () => {
                    const select = document.getElementById('part-select');
                    const productId = select.value;
                    const qty = document.getElementById('part-qty').value;
                    const partName = select.options[select.selectedIndex]?.text || 'Refacción';

                    if (!productId || !qty) {
                        alert("Selecciona una pieza y cantidad");
                        return;
                    }
                    cleanup();
                    await this.changeOrderStatus(orderId, 'PAUSED', '⏸️ Pausando (Refacción)...', `Refacción: ${partName} (x${qty})`, productId, qty);
                    resolve();
                };

                document.getElementById('back-pause').onclick = () => {
                    cleanup();
                    this.pauseWork(orderId).then(resolve);
                };
            };

            document.getElementById('reason-job').onclick = async () => {
                cleanup();
                await this.changeOrderStatus(orderId, 'PAUSED', '⏸️ Pausando (Cambio de Trabajo)...', 'Cambio de Trabajo');
                resolve();
            };

            document.getElementById('cancel-pause').onclick = () => {
                cleanup();
                resolve();
            };
        });
    }

    async resumeWork(orderId) {
        await this.changeOrderStatus(orderId, 'IN_PROGRESS', '▶️ Reanudando...');
    }

    async finishWork(orderId) {
        await this.changeOrderStatus(orderId, 'COMPLETED', '✅ Finalizando...');
    }

    async changeOrderStatus(orderId, newStatus, loadingMsg, reason = null, productId = null, quantity = null) {
        const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
        if (orderCard) {
            orderCard.style.opacity = '0.5';
        }

        try {
            if (navigator.onLine) {
                // Online: call API directly
                await api.changeOrderStatus(orderId, newStatus, null, reason, productId, quantity);
                console.log(`✅ Order ${orderId} status changed to ${newStatus}`);

                // Reload orders view
                this.showView('orders');
            } else {
                // Offline: add to sync queue
                const queueItem = {
                    type: 'CHANGE_ORDER_STATUS',
                    payload: {
                        orderId: orderId,
                        status: newStatus,
                        timestamp: new Date().toISOString(),
                        reason: reason,
                        product_id: productId,
                        quantity: quantity
                    }
                };
                await offlineDB.addToSyncQueue(queueItem);
                console.log('📴 Status change queued for sync');

                alert('Sin conexión. El cambio se sincronizará cuando recuperes la red.');
                this.showView('orders');
            }
        } catch (error) {
            console.error('Error changing order status:', error);
            alert('Error: ' + error.message);
            if (orderCard) {
                orderCard.style.opacity = '1';
            }
        }
    }

    // ===== MODAL PROXIES (From modals.js) =====
    showCreateOrderForm() {
        showCreateOrderForm();
    }

    viewOrderDetails(orderId) {
        viewOrderDetails(orderId);
    }

    closeOrderModal() {
        closeOrderModal();
    }

    closeOrder(orderId) {
        closeOrderAction(orderId);
    }

    approveOrder(orderId) {
        approveOrderAction(orderId);
    }

    rejectOrder(orderId) {
        rejectOrderAction(orderId);
    }

    promptAssignTechnician(orderId) {
        promptAssignTechnician(orderId);
    }

    deleteOrder(orderId) {
        deleteOrderAction(orderId);
    }

    toggleOrderDetail(orderId) {
        const fullDesc = document.getElementById(`desc-full-${orderId}`);
        const shortDesc = document.getElementById(`desc-short-${orderId}`);
        const toggle = document.getElementById(`toggle-${orderId}`);

        if (fullDesc.classList.contains('hidden')) {
            fullDesc.classList.remove('hidden');
            shortDesc.classList.add('hidden');
            toggle.textContent = '▲ Ocultar Detalles';
        } else {
            fullDesc.classList.add('hidden');
            shortDesc.classList.remove('hidden');
            toggle.textContent = '▼ Ver Detalles';
        }
    }

    // ===== CONNECTIVITY =====
    setupConnectivityListeners() {
        window.addEventListener('online', () => {
            console.log('✅ Connection restored');
            this.updateOnlineStatus(true);
            this.syncPendingData();
        });

        window.addEventListener('offline', () => {
            console.log('⚠️ Connection lost - Offline mode');
            this.updateOnlineStatus(false);
        });

        // Initial status
        this.updateOnlineStatus(navigator.onLine);
    }

    updateOnlineStatus(isOnline) {
        const statusEl = document.getElementById('online-status');
        if (statusEl) {
            statusEl.textContent = isOnline ? 'Online' : 'Offline';
            statusEl.style.color = isOnline ? 'var(--secondary)' : 'var(--danger)';
        }
    }

    async syncPendingData() {
        console.log('🔄 Triggering sync from connectivity change...');
        await syncManager.processSyncQueue();
    }
}

// Initialize app when DOM is ready
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new FlotaApp();
    });
} else {
    app = new FlotaApp();
}
