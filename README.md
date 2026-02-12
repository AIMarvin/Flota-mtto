# 🚛 Flota Mantenimiento PWA

Sistema de Gestión de Mantenimiento de Flota - Progressive Web App con capacidad 100% Offline

## 🚀 Inicio Rápido

### Prerrequisitos
- Python 3.8+
- pip

### Instalación

```bash
# 1. Activar entorno virtual
.\venv\Scripts\activate

# 2. Instalar dependencias (ya instaladas)
# pip install -r requirements.txt

# 3. Ejecutar migraciones (ya ejecutadas)
# .\venv\Scripts\alembic upgrade head

# 4. Iniciar servidor
python main.py

# 5. Ejecutar tests
$env:PYTHONPATH='.'
.\venv\Scripts\pytest -q -p no:cacheprovider

# 6. Dependencias E2E (opcional)
.\venv\Scripts\python -m pip install -r requirements-e2e.txt
# .\venv\Scripts\playwright install
```

El servidor estará disponible en: `http://localhost:8000`

### Acceso
- **PWA**: `http://localhost:8000/static/index.html`
- **API Docs**: `http://localhost:8000/api/v1/docs`
- **Health Live**: `http://localhost:8000/health/live`
- **Health Ready**: `http://localhost:8000/health/ready`

## 📚 Documentación

Ver [walkthrough.md](C:/Users/L03572099/.gemini/antigravity/brain/59ff756c-4164-4d40-9aa6-40de5b9f9ffb/walkthrough.md) para documentación completa.

## 🔐 Seguridad y Producción

- Usa `.env.production.example` como base para producción.
- En producción debes usar:
  - `ALLOW_SELF_REGISTER=false`
  - `COOKIE_SECURE=true`
  - `USE_S3=true` con DigitalOcean Spaces
  - `CORS_ORIGINS` con dominios explícitos (sin `*`)

## 🛠️ Stack Tecnológico

- **Backend**: FastAPI + SQLAlchemy
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **Frontend**: HTML5 + Vanilla JavaScript
- **PWA**: Service Workers + IndexedDB
- **Auth**: JWT (JSON Web Tokens)

## 📱 Características

- ✅ Autenticación con JWT
- ✅ Gestión de Unidades
- ✅ Sistema de Roles (Planner, Técnico, Operaciones, Admin)
- ✅ Modo Offline con IndexedDB
- ✅ Service Worker para caché
- ✅ PWA instalable
- ✅ Responsive Design

## 🗄️ Modelos de Datos

- Users (Usuarios)
- Units (Unidades)
- WorkOrders (Órdenes de Trabajo)
- Checklists (Inspecciones)
- Media (Fotos/Videos)
- TimeLogs (Registro de Tiempos)

## 🔐 Crear Usuario de Prueba

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@flota.com",
    "password": "123456",
    "full_name": "Admin Test",
    "role": "ADMIN"
  }'
```

## 📄 Licencia

Propiedad de Manuel Marquez - Uso Interno

## Cloud y Cutover

- App Platform spec: `deployment/digitalocean/app-spec.yaml`
- Runbook de cutover: `deployment/runbook-cutover.md`
- Script base ETL SQLite -> Postgres: `scripts/migrate_sqlite_to_postgres.py`
