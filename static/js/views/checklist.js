// ========== CHECKLIST MODULE - Driver's Daily Inspection ==========

function renderChecklistView() {
    const token = localStorage.getItem('access_token');
    let userName = 'Conductor';
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userName = payload.full_name || 'Conductor';
        } catch (e) { }
    }

    return `
        <div style="max-width: 800px; margin: 0 auto; padding-bottom: 2rem;">
            <!-- Header Card -->
            <div class="card" style="border:none; background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.75rem; font-weight: 800; letter-spacing: -0.5px;">✓ Checklist Diario</h2>
                        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">HOLA, <span style="font-weight: 700;">${userName.toUpperCase()}</span></p>
                    </div>
                    <div style="font-size: 3rem; opacity: 0.3;">📋</div>
                </div>
            </div>

            <form id="checklist-form">
                <!-- Unit Assignment Card -->
                <div class="card" style="border-radius: 20px; border: 1px solid #e1e8ed; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--dark); display:flex; align-items:center; gap:0.5rem;">
                        🚛 Unidad a Inspeccionar
                    </h3>
                    <div id="unit-selection-container">
                         <div class="form-group" style="margin-bottom:0;">
                            <label style="font-size: 0.8rem; color: var(--gray); font-weight: 600;">TU ECO ASIGNADO</label>
                            <select id="unit-select" required class="login-input" style="width:100%; font-weight: 700; color: var(--primary);">
                                <option value="">Buscando tu unidad...</option>
                            </select>
                         </div>
                    </div>
                </div>

                <!-- Pre-Trip Inspection Card -->
                <div class="card" style="border-radius: 20px; border: 1px solid #e1e8ed; padding: 1.5rem; margin-bottom: 1.5rem; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);">
                    <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--dark); display:flex; align-items:center; gap:0.5rem;">
                        🛡️ Previsión Previaje
                    </h3>
                    <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1.5rem;">Verificaciones de seguridad antes de iniciar el viaje</p>
                    
                    <div class="inspection-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                        ${_renderInspectionItem('Revisión Niveles', 'niveles', '🛢️')}
                        ${_renderInspectionItem('Presión de Llantas', 'presion_llantas', '🔄')}
                    </div>
                </div>

                <!-- Inspection Points -->
                <div class="card" style="border-radius: 20px; border: 1px solid #e1e8ed; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.1rem; margin-bottom: 1.5rem; color: var(--dark); display:flex; align-items:center; gap:0.5rem;">
                        🔍 Puntos de Revisión
                    </h3>
                    
                    <div class="inspection-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                        ${_renderInspectionItem('Aire Acondicionado', 'aire', '❄️')}
                        ${_renderInspectionItem('Asientos / Interior', 'asientos', '💺')}
                        ${_renderInspectionItem('Exterior / Carrocería', 'exterior', '🎨')}
                        ${_renderInspectionItem('Falla Mecánica', 'mecanica', '⚙️')}
                        ${_renderInspectionItem('Iluminación / LEDs', 'led', '💡')}
                        ${_renderInspectionItem('Limpieza', 'limpieza', '🧹')}
                    </div>
                </div>

                <!-- Media Section -->
                <div class="card" style="border-radius: 20px; border: 1px solid #e1e8ed; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.1rem; margin-bottom: 1.5rem; color: var(--dark); display:flex; align-items:center; gap:0.5rem;">
                        📸 Evidencia Multimedia
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label style="font-size: 0.85rem; font-weight: 700; color: #475569;">FOTOS (4)</label>
                            <div style="position: relative;">
                                <button type="button" class="btn" style="width: 100%; border: 2px dashed #3b82f6; background: #eff6ff; color: #3b82f6; border-radius: 12px; padding: 1rem; font-weight: 700;" onclick="document.getElementById('photos').click()">
                                    📸 Capturar
                                </button>
                                <input type="file" id="photos" accept="image/*" capture="environment" multiple required style="display:none;">
                            </div>
                            <div id="photo-preview" class="media-preview" style="margin-top:0.5rem; font-size: 0.8rem;"></div>
                        </div>
                        <div class="form-group">
                            <label style="font-size: 0.85rem; font-weight: 700; color: #475569;">VIDEO (1)</label>
                            <div style="position: relative;">
                                <button type="button" class="btn" style="width: 100%; border: 2px dashed #f59e0b; background: #fffbeb; color: #f59e0b; border-radius: 12px; padding: 1rem; font-weight: 700;" onclick="document.getElementById('video').click()">
                                    🎥 Capturar
                                </button>
                                <input type="file" id="video" accept="video/*" capture="environment" required style="display:none;">
                            </div>
                            <div id="video-preview" class="media-preview" style="margin-top:0.5rem; font-size: 0.8rem;"></div>
                        </div>
                </div>

                <!-- Comments Section (Optional) -->
                <div class="card" style="border-radius: 20px; border: 1px solid #e1e8ed; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--dark); display:flex; align-items:center; gap:0.5rem;">
                        💬 Comentarios <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 400;">(Opcional)</span>
                    </h3>
                    <div class="form-group" style="margin-bottom: 0;">
                        <textarea 
                            id="driver-comments" 
                            name="comments"
                            placeholder="Escribe aquí cualquier observación adicional sobre la unidad, fallas detectadas, o comentarios importantes..."
                            style="width: 100%; min-height: 100px; padding: 1rem; border-radius: 12px; border: 2px solid #e2e8f0; font-size: 0.95rem; resize: vertical; font-family: inherit; transition: all 0.2s;"
                            onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)';"
                            onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none';"
                        ></textarea>
                        <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem; margin-bottom: 0;">
                            💡 Puedes agregar detalles sobre fallas, condiciones especiales, o cualquier información relevante para mantenimiento.
                        </p>
                    </div>
                </div>

                <!-- Submit -->
                <button type="submit" class="btn btn-primary btn-block" id="submit-checklist" style="padding: 1.25rem; border-radius: 16px; font-weight: 800; font-size: 1.1rem; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4); margin-bottom: 3rem;">
                    🚀 FINALIZAR Y ENVIAR INSPECCIÓN
                </button>
                <p id="checklist-status" class="text-center mt-1" style="color: var(--gray); display: none; font-weight: 600;"></p>
            </form>
        </div>
    `;
}

function _renderInspectionItem(label, name, emoji) {
    return `
        <div style="background: #f8fafc; padding: 1.25rem; border-radius: 16px; border: 1px solid #f1f5f9; display: flex; flex-direction: column; justify-content: space-between;">
            <label style="display: block; font-size: 0.9rem; font-weight: 800; color: #1e293b; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px;">
                <span style="font-size:1.2rem; margin-right: 0.5rem;">${emoji}</span> ${label}
            </label>
            <div style="display: flex; gap: 0.5rem;">
                <button type="button" onclick="this.parentElement.nextElementSibling.value='ok'; Array.from(this.parentElement.children).forEach(b=>b.classList.remove('active')); this.classList.add('active')" class="btn-check btn-ok active" style="flex: 1; border-radius: 10px; padding: 0.75rem; border: 2px solid #10b981; background: white; color: #10b981; font-weight: 800; cursor: pointer; transition: all 0.2s;">✅ OK</button>
                <button type="button" onclick="this.parentElement.nextElementSibling.value='fail'; Array.from(this.parentElement.children).forEach(b=>b.classList.remove('active')); this.classList.add('active')" class="btn-check btn-fail" style="flex: 1; border-radius: 10px; padding: 0.75rem; border: 2px solid #ef4444; background: white; color: #ef4444; font-weight: 800; cursor: pointer; transition: all 0.2s;">❌ FALLA</button>
            </div>
            <input type="hidden" name="${name}" value="ok" class="inspection-select">
        </div>
    `;
}

async function loadChecklistHandlers() {
    // Load units for dropdown
    try {
        const token = localStorage.getItem('access_token');
        let assignedUnitId = null;
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                assignedUnitId = payload.unit_id;
            } catch (e) { }
        }

        // Fallback: If not in token, fetch from profile API (for older sessions)
        if (!assignedUnitId) {
            try {
                const profile = await api.getMe();
                assignedUnitId = profile.unit_id;
            } catch (e) {
                console.log("Could not fetch profile for auto-assignment fallback");
            }
        }

        const units = await api.getUnits();
        const unitSelect = document.getElementById('unit-select');

        if (assignedUnitId) {
            console.log('🔍 Attempting to auto-select unit:', assignedUnitId);
            const assignedUnit = units.find(u => u.id == assignedUnitId);
            if (assignedUnit) {
                unitSelect.innerHTML = `<option value="${assignedUnit.id}" selected>${assignedUnit.eco_number} - ${assignedUnit.model || 'N/A'}</option>`;
                unitSelect.style.pointerEvents = 'none';
                unitSelect.style.background = '#f0fdf4';
                unitSelect.style.borderColor = '#bbf7d0';
                unitSelect.parentElement.insertAdjacentHTML('beforeend', '<p style="color: #16a34a; font-size: 0.75rem; font-weight: 800; margin-top: 6px; display: flex; align-items: center; gap: 4px;">🛡️ UNIDAD VINCULADA A TU PERFIL</p>');
            } else {
                _fillUnitSelect(unitSelect, units, assignedUnitId);
            }
        } else {
            _fillUnitSelect(unitSelect, units, null);
        }
    } catch (error) {
        console.error('Error loading units:', error);
    }

    // Photo preview
    const photosInput = document.getElementById('photos');
    const photoPreview = document.getElementById('photo-preview');
    const compressedPhotos = [];

    photosInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);

        if (files.length !== 4) {
            alert('Se requieren exactamente 4 fotos');
            e.target.value = '';
            return;
        }

        photoPreview.innerHTML = '<p>Comprimiendo imágenes...</p>';
        compressedPhotos.length = 0; // Clear array

        try {
            for (const file of files) {
                const compressedBlob = await mediaCompressor.compressImage(file);
                compressedPhotos.push({
                    blob: compressedBlob,
                    name: file.name
                });
            }

            // Show preview
            photoPreview.innerHTML = `<p style="color: var(--secondary);">✅ ${compressedPhotos.length} fotos listas</p>`;
        } catch (error) {
            console.error('Error compressing photos:', error);
            photoPreview.innerHTML = '<p style="color: var(--danger);">❌ Error al comprimir fotos</p>';
        }
    });

    // Video preview
    const videoInput = document.getElementById('video');
    const videoPreview = document.getElementById('video-preview');
    let processedVideo = null;

    videoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        videoPreview.innerHTML = '<p>Validando video...</p>';

        try {
            processedVideo = await mediaCompressor.processVideo(file);
            videoPreview.innerHTML = `<p style="color: var(--secondary);">✅ Video listo (${(processedVideo.size / 1024 / 1024).toFixed(1)}MB)</p>`;
        } catch (error) {
            console.error('Error processing video:', error);
            videoPreview.innerHTML = `<p style="color: var(--danger);">❌ ${error.message}</p>`;
            processedVideo = null;
            e.target.value = '';
        }
    });

    // Form submission
    const form = document.getElementById('checklist-form');
    const statusEl = document.getElementById('checklist-status');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate media
        if (compressedPhotos.length !== 4) {
            alert('Se requieren exactamente 4 fotos');
            return;
        }
        if (!processedVideo) {
            alert('Se requiere 1 video');
            return;
        }

        // Disable submit button
        const submitBtn = document.getElementById('submit-checklist');
        submitBtn.disabled = true;
        submitBtn.textContent = '💾 Guardando...';
        statusEl.style.display = 'block';
        statusEl.textContent = 'Preparando datos...';

        try {
            // Collect form data
            const unitId = parseInt(document.getElementById('unit-select').value);
            const inspectionSelects = document.querySelectorAll('.inspection-select');
            const answers = {};
            let hasFailed = false;

            inspectionSelects.forEach(select => {
                answers[select.name] = select.value;
                if (select.value === 'fail') hasFailed = true;
            });

            // Get optional driver comments
            const driverComments = document.getElementById('driver-comments').value.trim() || null;

            // Generate local IDs for media
            const mediaIds = [];
            const localChecklistId = Date.now();

            // Save photos to IndexedDB
            statusEl.textContent = 'Guardando fotos...';
            for (let i = 0; i < compressedPhotos.length; i++) {
                const mediaId = `photo_${localChecklistId}_${i}`;
                await offlineDB.add('media', {
                    id: mediaId,
                    blob: compressedPhotos[i].blob,
                    filename: compressedPhotos[i].name,
                    type: 'IMAGE'
                });
                mediaIds.push(mediaId);
            }

            // Save video to IndexedDB
            statusEl.textContent = 'Guardando video...';
            const videoMediaId = `video_${localChecklistId}_0`;
            await offlineDB.add('media', {
                id: videoMediaId,
                blob: processedVideo,
                filename: videoInput.files[0].name,
                type: 'VIDEO'
            });
            mediaIds.push(videoMediaId);

            // Save checklist to IndexedDB
            statusEl.textContent = 'Guardando checklist...';
            await offlineDB.add('checklists', {
                id: localChecklistId,
                unit_id: unitId,
                answers: answers,
                has_failed: hasFailed,
                comments: driverComments,
                created_at: new Date().toISOString()
            });

            // Add to sync queue
            await offlineDB.addToSyncQueue({
                type: 'CREATE_CHECKLIST',
                payload: {
                    localChecklistId: localChecklistId,
                    checklistData: {
                        unit_id: unitId,
                        answers: answers,
                        has_failed: hasFailed,
                        comments: driverComments,
                        created_at: new Date().toISOString()
                    },
                    mediaIds: mediaIds
                }
            });

            console.log('✅ Checklist saved offline');
            statusEl.textContent = '✅ Guardado en modo offline';
            statusEl.style.color = 'var(--secondary)';

            // Try to sync if online
            if (navigator.onLine) {
                statusEl.textContent = '🔄 Sincronizando...';
                await syncManager.processSyncQueue();
                statusEl.textContent = '✅ Sincronizado con el servidor';
            }

            // Show success WITHOUT redirecting (UX improvement for chofer)
            alert('✅ Checklist enviado exitosamente');
            form.reset();
            statusEl.textContent = 'Listo para nuevo checklist';
            statusEl.style.color = 'var(--primary)';
            submitBtn.disabled = false;
            submitBtn.textContent = '💾 Guardar Checklist';

        } catch (error) {
            console.error('❌ Error saving checklist:', error);
            statusEl.textContent = '❌ Error al guardar: ' + error.message;
            statusEl.style.color = 'var(--danger)';
            submitBtn.disabled = false;
            submitBtn.textContent = '💾 Guardar Checklist';
        }
    });
}

function _fillUnitSelect(select, units, selectedId) {
    select.innerHTML = '<option value="">-- Selecciona Unidad --</option>';
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = `${unit.eco_number} - ${unit.model || 'N/A'}`;
        if (selectedId && unit.id === selectedId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}
