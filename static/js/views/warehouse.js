
// Warehouse & Purchasing View
let warehouseData = {
    products: [],
    purchases: []
};
let currentWarehouseTab = 'inventory';
let inventoryFilters = {
    search: '',
    status: 'ALL' // ALL, IN_STOCK, LOW_STOCK
};

function renderWarehouseView() {
    return `
        <div class="warehouse-container fade-in">
            <!-- Header -->
            <div class="warehouse-header">
                <div>
                    <h2 class="view-title">📦 Almacén y Compras</h2>
                    <p class="view-subtitle">Gestión de inventario y reabastecimiento</p>
                </div>
                <div class="warehouse-actions">
                    <button class="btn btn-secondary" onclick="openNewPurchaseModal()">+ Solicitud Compra</button>
                    <button class="btn btn-primary" onclick="openNewProductModal()">+ Nuevo Producto</button>
                </div>
            </div>

            <!-- Tabs -->
            <div class="warehouse-tabs">
                <button class="tab-btn active" onclick="switchWarehouseTab('inventory', this)">
                    📦 Inventario
                </button>
                <button class="tab-btn" onclick="switchWarehouseTab('purchases', this)">
                    🛒 Órdenes de Compra
                </button>
            </div>

            <!-- Inventory Controls (Only visible in inventory tab) -->
            <div id="inventory-controls" class="inventory-controls">
                <div class="search-box-wrapper">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="inventory-search" placeholder="Buscar por descripción o SKU..." oninput="handleInventorySearch(this.value)">
                </div>
                <div class="filter-buttons">
                    <button class="filter-btn active" id="filter-all" onclick="setInventoryStatusFilter('ALL')">Todos</button>
                    <button class="filter-btn" id="filter-instock" onclick="setInventoryStatusFilter('IN_STOCK')">✅ En Stock</button>
                    <button class="filter-btn" id="filter-lowstock" onclick="setInventoryStatusFilter('LOW_STOCK')">⚠️ Stock Bajo</button>
                </div>
            </div>

            <!-- Content Area -->
            <div id="warehouse-content" class="warehouse-content">
                <p class="loading">Cargando datos del almacén...</p>
            </div>
        </div>
    `;
}

async function loadWarehouseData() {
    try {
        const [products, purchases] = await Promise.all([
            api.getProducts(),
            api.getPurchaseOrders()
        ]);

        // Sorting alphabetically by description as requested
        warehouseData.products = products.sort((a, b) => {
            const descA = (a.description || a.name).toLowerCase();
            const descB = (b.description || b.name).toLowerCase();
            return descA.localeCompare(descB);
        });

        warehouseData.purchases = purchases;

        renderCurrentTab();
    } catch (e) {
        console.error("Error loading warehouse data", e);
        document.getElementById('warehouse-content').innerHTML = `
            <div class="error-state">
                <p>❌ Error al cargar datos.</p>
                <button class="btn btn-sm btn-outline" onclick="loadWarehouseData()">Reintentar</button>
            </div>
        `;
    }
}

function handleInventorySearch(val) {
    inventoryFilters.search = val.toLowerCase();
    renderCurrentTab();
}

function setInventoryStatusFilter(status) {
    inventoryFilters.status = status;

    // Update UI buttons
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (status === 'ALL') document.getElementById('filter-all').classList.add('active');
    if (status === 'IN_STOCK') document.getElementById('filter-instock').classList.add('active');
    if (status === 'LOW_STOCK') document.getElementById('filter-lowstock').classList.add('active');

    renderCurrentTab();
}

function switchWarehouseTab(tab, btn) {
    currentWarehouseTab = tab;
    // Update UI
    document.querySelectorAll('.warehouse-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const controls = document.getElementById('inventory-controls');
    if (controls) {
        controls.style.display = (tab === 'inventory') ? 'flex' : 'none';
    }

    renderCurrentTab();
}

function renderCurrentTab() {
    const container = document.getElementById('warehouse-content');
    if (!container) return;

    if (currentWarehouseTab === 'inventory') {
        renderInventoryGrid(container);
    } else {
        renderPurchasesList(container);
    }
}

function renderInventoryGrid(container) {
    let filtered = warehouseData.products;

    // Apply Search
    if (inventoryFilters.search) {
        filtered = filtered.filter(p =>
            (p.name || '').toLowerCase().includes(inventoryFilters.search) ||
            (p.description || '').toLowerCase().includes(inventoryFilters.search) ||
            (p.sku || '').toLowerCase().includes(inventoryFilters.search)
        );
    }

    // Apply Status Filter
    if (inventoryFilters.status === 'IN_STOCK') {
        filtered = filtered.filter(p => p.current_stock > p.min_stock_level);
    } else if (inventoryFilters.status === 'LOW_STOCK') {
        filtered = filtered.filter(p => p.current_stock <= p.min_stock_level);
    }

    if (!filtered.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>Sin resultados</h3>
                <p>No se encontraron productos con los filtros aplicados.</p>
                ${!warehouseData.products.length ? '<button class="btn btn-primary btn-sm" onclick="openNewProductModal()">Crear primer producto</button>' : ''}
            </div>
        `;
        return;
    }

    const gridHTML = filtered.map(p => {
        const isLow = p.current_stock <= p.min_stock_level;
        const stockClass = isLow ? 'stock-low' : 'stock-ok';
        const stockLabel = isLow ? '⚠️ Stock Bajo' : '✅ En Stock';

        return `
            <div class="product-card">
                <div class="product-image">
                    ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}">` : '<div class="no-image">📷</div>'}
                    <span class="stock-badge ${stockClass}">${stockLabel}</span>
                </div>
                <div class="product-details">
                    <div class="product-header">
                        <span class="product-sku">${p.sku}</span>
                        <span class="product-cat">${p.category || 'General'}</span>
                    </div>
                    <h3 class="product-name">${p.name}</h3>
                    <p class="product-desc">${p.description || 'Sin descripción'}</p>
                    
                    <div class="product-stats">
                        <div class="stat-item">
                            <span class="stat-label">Existencia</span>
                            <span class="stat-value ${stockClass}">${p.current_stock}</span>
                        </div>
                        <div class="stat-item align-right">
                            <span class="stat-label">Costo</span>
                            <span class="stat-value text-dark">$${p.cost_price.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="product-actions">
                        <button class="btn-icon" onclick="adjustStock(${p.id})">± Ajustar</button>
                        <button class="btn-icon" onclick="editProduct(${p.id})">✏️ Editar</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="inventory-summary-bar"> Mostrando ${filtered.length} productos </div>
        <div class="inventory-grid">${gridHTML}</div>
    `;
}

function renderPurchasesList(container) {
    if (!warehouseData.purchases.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h3>Sin Órdenes</h3>
                <p>No hay órdenes de compra registradas.</p>
            </div>
        `;
        return;
    }

    const listHTML = warehouseData.purchases.map(po => {
        const statusMap = {
            'REQUESTED': { color: 'blue', label: 'Solicitada' },
            'APPROVED': { color: 'orange', label: 'Aprobada' },
            'RECEIVED': { color: 'green', label: 'Recibida' },
            'CANCELLED': { color: 'red', label: 'Cancelada' }
        };
        const st = statusMap[po.status] || { color: 'gray', label: po.status };

        const itemsList = po.items.map(i => `<li>${i.quantity_requested}x <strong>${i.product_name}</strong></li>`).join('');

        return `
            <div class="po-card">
                <div class="po-header">
                    <span class="po-id">${po.display_id}</span>
                    <span class="po-date">${new Date(po.created_at).toLocaleDateString()}</span>
                </div>
                <div class="po-body">
                    <div class="po-status badge-${st.color}">${st.label}</div>
                    <div class="po-info">
                        <p><strong>Solicita:</strong> ${po.requested_by_name || '?'}</p>
                        <ul class="po-items-list">${itemsList}</ul>
                    </div>
                </div>
                <div class="po-footer">
                    ${po.status !== 'RECEIVED' ? `
                        <button class="btn-sm btn-outline" onclick="changePOStatus(${po.id}, 'RECEIVED')">✅ Marcar Recibido</button>
                    ` : '<span class="text-success text-sm">Completado</span>'}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="purchases-list">${listHTML}</div>`;
}

async function openNewProductModal() {
    const name = prompt("Nombre del producto:");
    if (!name) return;
    const sku = prompt("SKU (Único):", "PROD-" + Math.floor(Math.random() * 1000));
    const stock = parseFloat(prompt("Stock Inicial:", "0"));
    const price = parseFloat(prompt("Costo Unitario:", "0.0"));

    try {
        await api.createProduct({
            name, sku,
            initial_stock: stock,
            cost_price: price,
            min_stock_level: 5.0
        });
        alert('✅ Producto creado');
        loadWarehouseData();
    } catch (e) {
        alert('Error al crear producto: ' + e.message);
    }
}

async function openNewPurchaseModal() {
    const products = warehouseData.products;
    if (products.length === 0) return alert("Crea productos primero.");

    const prodId = prompt("ID del Producto (ver en listado):");
    if (!prodId) return;
    const qty = parseFloat(prompt("Cantidad a pedir:", "10"));

    try {
        await api.createPurchaseOrder({
            items: [{ product_id: parseInt(prodId), quantity: qty }],
            notes: "Solicitud rápida desde web"
        });
        alert('✅ Orden creada');
        switchWarehouseTab('purchases', document.querySelectorAll('.warehouse-tabs .tab-btn')[1]);
        loadWarehouseData();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function adjustStock(id) {
    const qty = parseFloat(prompt("Cantidad a agregar (positivo) o restar (negativo):", "0"));
    if (!qty) return;

    try {
        await api.createStockMovement({
            product_id: id,
            change_amount: qty,
            movement_type: qty > 0 ? "IN" : "OUT",
            reason: "Manual Adjustment"
        });
        alert('Stock actualizado');
        loadWarehouseData();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function changePOStatus(id, status) {
    if (!confirm(`¿Cambiar estado a ${status}? Esto actualizará el stock.`)) return;

    try {
        await api.updatePurchaseOrderStatus(id, status);
        alert('Estado actualizado');
        loadWarehouseData();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function editProduct(id) {
    alert("Funcionalidad de edición completa en desarrollo.");
}

// Check styles injection
(function injectWarehouseStyles() {
    const styleId = 'warehouse-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Warehouse Specific Styles */
        .warehouse-container {
            padding: 1rem;
            max-width: 1200px;
            margin: 0 auto;
            padding-bottom: 80px; 
        }
        
        .warehouse-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .view-title { font-size: 2rem; color: var(--dark); margin: 0; font-weight: 800; letter-spacing: -1px; }
        .view-subtitle { color: var(--gray); margin: 0.5rem 0 0 0; }
        
        .warehouse-tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 1px;
        }
        
        .tab-btn {
            background: none;
            border: none;
            padding: 1rem;
            font-weight: 600;
            color: var(--gray);
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
            font-size: 1rem;
        }
        
        .tab-btn.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
        }

        /* Controls */
        .inventory-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
        }

        .search-box-wrapper {
            position: relative;
            flex: 1;
            min-width: 300px;
        }

        .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
        }

        #inventory-search {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            font-size: 0.95rem;
            transition: all 0.2s;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        #inventory-search:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .filter-buttons {
            display: flex;
            gap: 0.5rem;
            background: #f1f5f9;
            padding: 4px;
            border-radius: 12px;
        }

        .filter-btn {
            padding: 0.5rem 1rem;
            border-radius: 8px;
            border: none;
            background: none;
            font-size: 0.85rem;
            font-weight: 600;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s;
        }

        .filter-btn.active {
            background: white;
            color: var(--dark);
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .inventory-summary-bar {
            margin-bottom: 1rem;
            font-size: 0.85rem;
            color: #64748b;
            font-weight: 600;
        }
        
        /* Grid */
        .inventory-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
        }
        
        .product-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
            transition: transform 0.2s, box-shadow 0.2s;
            border: 1px solid #f1f5f9;
        }
        
        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }
        
        .product-image {
            height: 160px;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .no-image { font-size: 3rem; opacity: 0.3; }
        
        .stock-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            backdrop-filter: blur(4px);
        }
        .stock-low { background: rgba(254, 242, 242, 0.9); color: #ef4444; border: 1px solid #fecaca; }
        .stock-ok { background: rgba(240, 253, 244, 0.9); color: #10b981; border: 1px solid #bbf7d0; }
        
        .product-details { padding: 1.5rem; }
        .product-header { display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; }
        .product-sku { font-family: monospace; }
        .product-name { margin: 0 0 0.5rem 0; font-size: 1.25rem; color: #1e293b; }
        .product-desc { font-size: 0.9rem; color: #64748b; margin-bottom: 1.5rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        
        .product-stats { display: flex; justify-content: space-between; margin-bottom: 1.5rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
        .stat-item { display: flex; flex-direction: column; }
        .stat-label { font-size: 0.75rem; color: #94a3b8; margin-bottom: 2px; }
        .stat-value { font-weight: 700; font-size: 1.1rem; }
        .text-dark { color: #1e293b; }
        .align-right { text-align: right; }
        
        .product-actions { display: flex; gap: 0.5rem; }
        .btn-icon { flex: 1; padding: 0.5rem; border: 1px solid #e2e8f0; background: white; border-radius: 8px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; }
        .btn-icon:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
        
        /* Purchases List */
        .purchases-list { display: flex; flex-direction: column; gap: 1rem; max-width: 800px; margin: 0 auto; }
        .po-card { background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #e2e8f0; display: grid; gap: 1rem; }
        
        .po-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; }
        .po-id { font-weight: 800; font-size: 1.1rem; color: var(--primary); }
        .po-date { color: #94a3b8; font-size: 0.9rem; }
        
        .po-body { display: flex; align-items: flex-start; gap: 1rem; }
        .po-status { padding: 4px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; align-self: flex-start; }
        .badge-blue { background: #eff6ff; color: #1d4ed8; }
        .badge-orange { background: #fff7ed; color: #c2410c; }
        .badge-green { background: #f0fdf4; color: #15803d; }
        .badge-red { background: #fef2f2; color: #b91c1c; }
        .badge-gray { background: #f8fafc; color: #64748b; }
        
        .po-info { flex: 1; }
        .po-info p { margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #64748b; }
        .po-items-list { margin: 0; padding-left: 1.2rem; color: #334155; font-size: 0.95rem; }
        
        .po-footer { text-align: right; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
        
        /* Empty States */
        .empty-state { text-align: center; padding: 4rem 1rem; color: #94a3b8; }
        .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
    `;
    document.head.appendChild(style);
})();
