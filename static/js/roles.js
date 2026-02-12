
// Role-based menu configuration
const MENU_CONFIG = {
    CHOFER: [
        { view: 'checklist', icon: '✓', label: 'Checklist' },
        { view: 'profile', icon: '👤', label: 'Perfil' }
    ],
    TECNICO: [
        { view: 'orders', icon: '📋', label: 'Mis Órdenes' },
        { view: 'profile', icon: '👤', label: 'Perfil' }
    ],
    OPERACIONES: [
        { view: 'dashboard', icon: '📊', label: 'Dashboard' },
        { view: 'flota', icon: '🚛', label: 'Flota' },
        { view: 'audit', icon: '📜', label: 'Auditoría' },
        { view: 'profile', icon: '👤', label: 'Perfil' }
    ],
    PLANNER: [
        { view: 'dashboard', icon: '📊', label: 'Dashboard' },
        { view: 'flota', icon: '🚛', label: 'Flota 360' },
        { view: 'orders', icon: '📋', label: 'Gestión' },
        { view: 'warehouse', icon: '📦', label: 'Almacén' },
        { view: 'users', icon: '👥', label: 'Usuarios' },
        { view: 'audit', icon: '📜', label: 'Auditoría' },
        { view: 'ai_predict', icon: '✨', label: 'Steppi AI' },
        { view: 'profile', icon: '👤', label: 'Perfil' }
    ],
    ADMIN: [
        { view: 'dashboard', icon: '📊', label: 'Dashboard' },
        { view: 'flota', icon: '🚛', label: 'Flota 360' },
        { view: 'orders', icon: '📋', label: 'Gestión' },
        { view: 'tires', icon: '🛞', label: 'Llantas' },
        { view: 'warehouse', icon: '📦', label: 'Almacén' },
        { view: 'users', icon: '👥', label: 'Usuarios' },
        { view: 'audit', icon: '📜', label: 'Auditoría' },
        { view: 'ai_predict', icon: '✨', label: 'Steppi AI' },
        { view: 'profile', icon: '👤', label: 'Perfil' }
    ]
};

// Render menu based on role
function renderMenuForRole(role) {
    const nav = document.getElementById('bottom-nav');
    const menuItems = MENU_CONFIG[role] || MENU_CONFIG.TECNICO;

    nav.innerHTML = menuItems.map((item, index) => `
        <button data-view="${item.view}" class="nav-item ${index === 0 ? 'active' : ''}">
            <span class="icon">${item.icon}</span>
            <span class="label">${item.label}</span>
        </button>
    `).join('');

    // Re-attach navigation handlers
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.getAttribute('data-view');
            app.navigateTo(view);
        });
    });
}
