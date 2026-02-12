
// ========== USERS (USUARIOS) ==========
let usersList = [];
let userCurrentFilter = 'ALL';

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderUsersView() {
    return `
        <div class="card" style="background: transparent; box-shadow: none; padding: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                     <h2 style="font-size: 1.75rem; color: var(--dark); display: flex; align-items: center; gap: 0.5rem;">
                        👥 Gestión de Usuarios
                    </h2>
                    <p style="color: var(--gray); margin-top: 0.5rem;">Administra el personal, choferes y técnicos.</p>
                </div>
                <button class="btn btn-primary" onclick="showCreateUserModal()">+ Nuevo Usuario</button>
            </div>
            
            <div class="audit-controls" style="margin-bottom: 2rem;">
                <input type="text" id="user-search" placeholder="Buscar por nombre o email..." class="form-control" style="width:100%; margin-bottom: 1rem;">
                
                <div class="filter-tabs" style="display:flex; gap:0.75rem; overflow-x:auto; padding-bottom: 5px;">
                     <button class="filter-tab active" onclick="filterUsers('ALL', this)">Todos</button>
                     <button class="filter-tab" onclick="filterUsers('CHOFER', this)">Choferes 🚛</button>
                     <button class="filter-tab" onclick="filterUsers('TECNICO', this)">Técnicos 🔧</button>
                     <button class="filter-tab" onclick="filterUsers('PLANNER', this)">Planners 📊</button>
                     <button class="filter-tab" onclick="filterUsers('ADMIN', this)">Admins 👑</button>
                </div>
            </div>

            <div id="users-grid" class="audit-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                <p class="loading">Cargando usuarios...</p>
            </div>
        </div>

        <!-- Create User Modal (Redesigned) -->
            <div id="create-user-modal" class="modal hidden">
                <div class="modal-content" style="max-width: 450px; border-radius: 24px; padding: 0; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                    <!-- Header with Gradient -->
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 1.5rem; position: relative; text-align: center;">
                        <button class="close-btn" onclick="closeUserModal()" style="position: absolute; right: 1rem; top: 1rem; color: white; background: rgba(255,255,255,0.2); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border:none; cursor: pointer;">×</button>
                        <h3 style="color: white; margin: 0; font-size: 1.5rem; font-weight: 700;">Nuevo Usuario</h3>
                        <p style="color: #bfdbfe; margin: 0.25rem 0 0; font-size: 0.9rem;">Registrar nuevo miembro del equipo</p>
                    </div>

                    <form id="create-user-form" onsubmit="event.preventDefault(); submitCreateUser();" style="padding: 2rem;">
                         <!-- Avatar Upload Section -->
                        <div style="display: flex; justify-content: center; margin-bottom: 2rem;">
                             <div style="position: relative; width: 100px; height: 100px;">
                                <div id="avatar-preview-container" style="width: 100%; height: 100%; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; border: 3px dashed #cbd5e1; overflow: hidden; cursor: pointer;" onclick="document.getElementById('user-avatar-input').click()">
                                    <span id="avatar-placeholder" style="font-size: 2rem; color: #94a3b8;">📷</span>
                                    <img id="avatar-preview" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;">
                                </div>
                                <div style="position: absolute; bottom: 0; right: 0; background: #2563eb; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; cursor: pointer; pointer-events: none;">
                                    <span style="font-size: 1rem;">+</span>
                                </div>
                                <input type="file" id="user-avatar-input" name="avatar" accept="image/*" style="display: none;" onchange="previewUserAvatar(this)">
                             </div>
                        </div>

                        <div class="form-group" style="margin-bottom: 1.25rem;">
                            <label style="font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; display: block;">Nombre Completo</label>
                            <input type="text" name="full_name" required class="form-control" placeholder="Ej. Juan Pérez" style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 1rem; transition: all 0.2s;">
                        </div>
                        <div class="form-group" style="margin-bottom: 1.25rem;">
                            <label style="font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; display: block;">Email Corporativo</label>
                            <input type="email" name="email" required class="form-control" placeholder="usuario@flota.com" style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 1rem;">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                             <div class="form-group">
                                <label style="font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; display: block;">Contraseña</label>
                                <input type="password" name="password" required class="form-control" placeholder="••••••••" style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc;">
                            </div>
                            <div class="form-group">
                                <label style="font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; display: block;">Rol</label>
                                <select name="role" required class="form-control" style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: white;">
                                    <option value="CHOFER">🚛 CHOFER</option>
                                    <option value="TECNICO">🔧 TECNICO</option>
                                    <option value="PLANNER">📊 PLANNER</option>
                                    <option value="ADMIN">👑 ADMIN</option>
                                </select>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1rem; width: 100%; padding: 1rem; border-radius: 12px; font-weight: 700; font-size: 1.1rem; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">✨ Crear Usuario</button>
                    </form>
                </div>
            </div>
        `;
}

function showCreateUserModal() {
    document.getElementById('create-user-modal').classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('create-user-modal').classList.add('hidden');
}

async function submitCreateUser() {
    const form = document.getElementById('create-user-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries()); // Gets text fields

    // Validate
    if (!data.full_name || !data.email || !data.password) {
        alert('Por favor completa todos los campos requeridos.');
        return;
    }

    try {
        // 1. Create User
        const newUser = await api.createUser({
            full_name: data.full_name,
            email: data.email,
            password: data.password,
            role: data.role
        });

        // 2. Upload Avatar if present
        const avatarInput = document.getElementById('user-avatar-input');
        if (avatarInput.files && avatarInput.files[0]) {
            try {
                const uploadData = new FormData();
                uploadData.append('file', avatarInput.files[0]);
                await api.uploadUserAvatar(newUser.id, avatarInput.files[0]);
            } catch (e) {
                console.error('Avatar upload failed', e);
                // Non-blocking error
            }
        }

        closeUserModal();
        alert('✅ Usuario creado exitosamente');
        loadUsersData(); // Reload list
        form.reset();
        document.getElementById('avatar-preview').style.display = 'none';
        document.getElementById('avatar-placeholder').style.display = 'block';

    } catch (e) {
        console.error(e);
        alert('❌ Error al crear usuario: ' + (e.detail || e.message));
    }
}

async function loadUsersData() {
    try {
        const users = await api.getUsers();
        usersList = users;
        updateUsersGrid(users);

        document.getElementById('user-search').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = usersList.filter(u =>
                (userCurrentFilter === 'ALL' || u.role === userCurrentFilter) &&
                (u.full_name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
            );
            updateUsersGrid(filtered);
        });

    } catch (e) {
        console.error(e);
        document.getElementById('users-grid').innerHTML = '<p class="error">Error al cargar usuarios</p>';
    }
}

function filterUsers(role, btn) {
    if (btn) {
        document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    userCurrentFilter = role;
    const term = document.getElementById('user-search').value.toLowerCase();

    const filtered = usersList.filter(u =>
        (role === 'ALL' || u.role === role) &&
        (u.full_name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
    );
    updateUsersGrid(filtered);
}

function updateUsersGrid(users) {
    const grid = document.getElementById('users-grid');
    if (users.length === 0) {
        grid.innerHTML = '<div style="text-align: center; color: var(--gray); padding: 3rem; grid-column: 1/-1;">No se encontraron usuarios</div>';
        return;
    }

    const roleColors = { 'ADMIN': '#7c3aed', 'PLANNER': '#2563eb', 'CHOFER': '#16a34a', 'TECNICO': '#ea580c' };
    const roleLabels = { 'ADMIN': '👑 Admin', 'PLANNER': '📊 Planner', 'CHOFER': '🚛 Chofer', 'TECNICO': '🔧 Técnico' };

    grid.innerHTML = users.map(user => {
        const color = roleColors[user.role] || '#64748b';
        const label = roleLabels[user.role] || user.role;
        const safeName = escapeHTML(user.full_name);
        const safeEmail = escapeHTML(user.email);
        // Use profile_image if available, otherwise initials
        const avatarHtml = user.profile_image
            ? `<img src="${escapeHTML(user.profile_image)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        const avatarStyle = user.profile_image
            ? `width: 80px; height: 80px; border-radius: 50%; border: 3px solid ${color}; overflow: hidden; margin: 0 auto 1rem auto;`
            : `width: 80px; height: 80px; background: ${color}20; color: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; margin: 0 auto 1rem auto; border: 3px solid ${color}40;`;

        return `
        <div class="user-card" onclick="showUserDetailModal(${user.id})" style="background: white; border-radius: 16px; padding: 1.5rem; border: 1px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); text-align: center; transition: all 0.3s ease; cursor: pointer;">
            <div style="${avatarStyle}">
                ${avatarHtml}
            </div>
            <h3 style="font-size: 1.15rem; color: var(--dark); margin-bottom: 0.25rem; font-weight:700;">${safeName}</h3>
            <p style="color: var(--gray); font-size: 0.9rem; margin-bottom: 1rem;">${safeEmail}</p>
            <span class="badge" style="background: ${color}20; color: ${color}; padding: 6px 14px; border-radius: 20px; font-weight:600;">${label}</span>
        </div>
        `;
    }).join('');
}

async function showUserDetailModal(userId) {
    const user = usersList.find(u => u.id === userId);
    if (!user) return;

    // Create modal if not exists or reuse unit detail modal structure but change content
    let modal = document.getElementById('user-detail-modal');
    if (!modal) {
        // Just recreate it dynamically
        const modalHtml = `
            <div id="user-detail-modal" class="modal hidden">
                <div class="modal-content" style="max-width: 500px; border-radius: 24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 style="margin:0;">👤 Detalles del Usuario</h3>
                        <button class="close-btn" onclick="document.getElementById('user-detail-modal').classList.add('hidden')" style="border:none; background:none; font-size:1.5rem; cursor:pointer;">×</button>
                    </div>
                    <div id="user-detail-body"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modal = document.getElementById('user-detail-modal');
    }

    const body = document.getElementById('user-detail-body');
    const roleColors = { 'ADMIN': '#7c3aed', 'PLANNER': '#2563eb', 'CHOFER': '#16a34a', 'TECNICO': '#ea580c' };
    const color = roleColors[user.role] || '#64748b';

    let extraContent = '';

    if (user.role === 'CHOFER') {
        // Fetch units to show assignment option
        try {
            const units = await api.getFlota360Data();
            // Find unit assigned to this driver (Primary driver field or User's unit_id assignment)
            const assignedUnit = units.find(u => u.driver_id === user.id || (user.unit_id && u.id === user.unit_id));

            const unitOptions = units.map(u =>
                `<option value="${u.id}" ${assignedUnit && assignedUnit.id === u.id ? 'selected' : ''}>${u.eco_number} - ${u.model || ''}</option>`
            ).join('');

            extraContent = `
                <div style="background: #f0fdf4; padding: 1rem; border-radius: 12px; margin-top: 1rem; border: 1px solid #bbf7d0;">
                    <h4 style="margin-top:0; color: #166534; display:flex; align-items:center; gap:0.5rem;">🚛 Asignación de Unidad</h4>
                    <p style="font-size:0.9rem; color: #15803d; margin-bottom:0.5rem;">Unidad actual: <strong>${assignedUnit ? assignedUnit.eco_number : 'Ninguna'}</strong></p>
                    
                    <label style="font-size:0.8rem; font-weight:600; color:#166534;">Cambiar Unidad:</label>
                    <select class="form-control" onchange="assignUnitToDriver(${user.id}, this.value)" style="margin-top:0.25rem;">
                        <option value="">-- Sin Asignar --</option>
                        ${unitOptions}
                    </select>
                </div>
            `;
        } catch (e) {
            console.error("Error loading units for driver detail", e);
        }
    }

    const safeName = escapeHTML(user.full_name);
    const safeEmail = escapeHTML(user.email);
    const safeProfileImage = escapeHTML(user.profile_image || '');
    const avatarHtml = user.profile_image
        ? `<img src="${safeProfileImage}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%; border: 4px solid ${color};">`
        : `<div style="width: 100px; height: 100px; background: ${color}20; color: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 700; border: 4px solid ${color};">${safeName.charAt(0)}</div>`;

    body.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="display:flex; justify-content:center; margin-bottom:1rem;">
                ${avatarHtml}
            </div>
            <h2 style="margin:0; color: var(--dark);">${safeName}</h2>
            <p style="color: var(--gray);">${safeEmail}</p>
            <span class="badge" style="background: ${color}20; color: ${color}; margin-top:0.5rem; display:inline-block;">${user.role}</span>
        </div>
        
        ${extraContent}

        <div style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; text-align: center;">
             <button onclick="confirmDeleteUser(${user.id}, '${user.full_name}')" class="btn btn-danger" style="width:100%;">🗑️ Eliminar Usuario</button>
        </div>
    `;

    modal.classList.remove('hidden');
}

window.assignUnitToDriver = async (driverId, unitId) => {
    try {
        if (!unitId) {
            // Handle unassignment logic if needed, complex because relation is on unit side
            alert('Para desasignar, ve a Flota 360 y desasigna desde la unidad.');
            return;
        }
        await api.updateUnit(unitId, { driver_id: parseInt(driverId) });
        alert('✅ Unidad asignada correctamente al chofer.');
        loadFlota360Data(); // Refresh fleet data
        showUserDetailModal(driverId); // Refresh modal content
    } catch (e) {
        alert('❌ Error al asignar unidad: ' + e.message);
    }
}

async function confirmDeleteUser(id, name) {
    if (confirm(`¿Eliminar usuario ${name}? Esta acción no se puede deshacer.`)) {
        try {
            await api.deleteUser(id);
            alert('✅ Usuario eliminado');
            document.getElementById('user-detail-modal').classList.add('hidden');
            loadUsersData();
        } catch (e) {
            alert('❌ Error al eliminar: ' + e.message);
        }
    }
}

// Preview helper
function previewUserAvatar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.getElementById('avatar-preview');
            const placeholder = document.getElementById('avatar-placeholder');
            img.src = e.target.result;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}
