# Arquitectura del Proyecto - Flota Mantenimiento PWA

## Visión General

Este proyecto es un **"Monolito Modular"**: toda la aplicación vive en un solo servidor, pero está internamente organizado en módulos independientes. Esta arquitectura permite:
- Desarrollo rápido y sencillo
- Fácil migración a microservicios en el futuro (si es necesario)
- Código mantenible y comprensible

---

## Estructura de Carpetas

```
Flota_Mantenimiento_PWA/
│
├── app/                        # 🔧 BACKEND (FastAPI - Python)
│   ├── api/v1/                 # Endpoints REST por módulo
│   │   ├── auth.py             # Login y tokens JWT
│   │   ├── orders.py           # Órdenes de trabajo
│   │   ├── checklists.py       # Inspecciones de choferes
│   │   ├── units.py            # Gestión de unidades (camiones)
│   │   ├── users.py            # Gestión de usuarios
│   │   ├── inventory.py        # Almacén y refacciones
│   │   ├── dashboard.py        # KPIs y métricas
│   │   └── external_data.py    # Importación de datos Excel
│   │
│   ├── models/                 # Modelos SQLAlchemy (ORM)
│   │   ├── user.py
│   │   ├── unit.py
│   │   ├── work_order.py
│   │   ├── checklist.py
│   │   ├── time_log.py
│   │   └── inventory.py
│   │
│   ├── schemas/                # Validación Pydantic (entrada/salida)
│   │
│   ├── core/                   # Configuración y seguridad
│   │   ├── config.py           # Variables de entorno
│   │   └── security.py         # Hashing, JWT
│   │
│   └── db/                     # Conexión a base de datos
│
├── static/                     # 🎨 FRONTEND (PWA - JavaScript)
│   ├── index.html              # Punto de entrada HTML
│   ├── manifest.json           # Configuración PWA
│   ├── sw.js                   # Service Worker (offline)
│   │
│   ├── css/
│   │   └── style.css           # Estilos globales
│   │
│   ├── js/
│   │   ├── app.js              # ⭐ CONTROLADOR PRINCIPAL (~400 líneas)
│   │   ├── api.js              # Cliente HTTP para llamadas al backend
│   │   ├── db.js               # IndexedDB para modo offline
│   │   ├── sync.js             # SyncManager para cola offline
│   │   ├── roles.js            # Configuración de menú por rol
│   │   ├── modals.js           # Lógica de modales globales
│   │   ├── compressor.js       # Compresión de imágenes/video
│   │   │
│   │   └── views/              # 📦 MÓDULOS DE VISTAS
│   │       ├── dashboard.js    # Panel de KPIs
│   │       ├── orders.js       # Órdenes (Planner y Técnico)
│   │       ├── checklist.js    # Formulario de inspección
│   │       ├── audit.js        # Revisión de checklists
│   │       ├── flota.js        # Flota 360 - detalle de unidades
│   │       ├── users.js        # Gestión de usuarios
│   │       ├── warehouse.js    # Inventario y almacén
│   │       ├── tires.js        # Gestión de llantas
│   │       └── ai.js           # Analítica predictiva
│   │
│   └── img/                    # Imágenes y logos
│
├── scripts/                    # 🛠️ UTILIDADES Y MIGRACIONES
│   ├── seed_*.py               # Poblar base de datos con datos iniciales
│   ├── migrate_*.py            # Migraciones manuales de esquema
│   ├── import_*.py             # Importación de datos externos
│   └── create_*.py             # Creación de usuarios de prueba
│
├── tests/                      # 🧪 Pruebas automatizadas
│
├── uploads/                    # Archivos subidos (fotos, videos)
│
├── main.py                     # Punto de entrada del servidor
├── requirements.txt            # Dependencias Python
└── flota.db                    # Base de datos SQLite
```

---

## Flujo de Datos

```
[Usuario en teléfono]
        │
        ▼
   ┌─────────────────────┐
   │   PWA (Frontend)    │  ← index.html + static/js/
   │   - Interfaz visual │
   │   - Modo offline    │
   └─────────┬───────────┘
             │ HTTP/JSON
             ▼
   ┌─────────────────────┐
   │ FastAPI (Backend)   │  ← main.py + app/
   │   - REST APIs       │
   │   - Autenticación   │
   │   - Lógica negocio  │
   └─────────┬───────────┘
             │
             ▼
   ┌─────────────────────┐
   │ SQLite (flota.db)   │
   │   - Datos persistentes
   └─────────────────────┘
```

---

## Roles de Usuario

| Rol | Acceso Principal | Funciones |
|-----|------------------|-----------|
| **ADMIN** | Todo | Gestión completa de usuarios, órdenes y sistema |
| **PLANNER** | Dashboard, Órdenes, Flota, Almacén | Planifica y asigna trabajos |
| **TECNICO** | Órdenes (propias), Perfil | Ejecuta reparaciones |
| **CHOFER** | Checklist, Perfil | Inspecciones diarias |
| **GERENTE_OPERACIONES** | Dashboard, Auditoría | Supervisa y aprueba |

---

## Cómo Agregar un Nuevo Módulo

### Paso 1: Backend
1. Crear modelo en `app/models/nuevo_modulo.py`
2. Crear schema en `app/schemas/nuevo_modulo.py`  
3. Crear endpoints en `app/api/v1/nuevo_modulo.py`
4. Registrar router en `app/api/v1/__init__.py`

### Paso 2: Frontend
1. Crear vista en `static/js/views/nuevo_modulo.js` con funciones:
   - `renderNuevoModuloView()` - Retorna HTML
   - `loadNuevoModuloData()` - Carga datos async
2. Agregar `<script>` en `index.html`
3. Agregar case en `showView()` de `app.js`
4. Agregar entrada en `roles.js` para visibilidad por rol

---

## Comandos Útiles

```bash
# Iniciar servidor de desarrollo
python main.py

# Listar usuarios (debugging)
python scripts/list_users.py

# Poblar datos de prueba
python scripts/seed_all_roles.py

# Ejecutar tests
pytest tests/
```

---

## Notas de Mantenimiento

- **app.js** debe mantenerse < 500 líneas. Si crece, extraer a vistas.
- Cada archivo en `views/` es independiente y puede moverse a microservicio.
- Los modals globales viven en `modals.js`. 
- El sistema offline usa IndexedDB (`db.js`) + SyncManager (`sync.js`).
