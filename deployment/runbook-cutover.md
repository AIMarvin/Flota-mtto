# Runbook de Cutover (<= 30 min)

## 1. Pre-checks (T-24h)
1. Confirmar backup reciente de SQLite y snapshot de Managed Postgres.
2. Validar despliegue de staging con misma imagen/commit de producción.
3. Ejecutar smoke tests en staging:
   - `GET /health/live`
   - `GET /health/ready`
   - login + refresh + logout
   - upload media a Spaces

## 2. Ventana de mantenimiento (T0)
1. Activar freeze de escrituras en sistema local.
2. Exportar SQLite final (`.backup`) y checksum.
3. Ejecutar ETL SQLite -> Postgres.
4. Subir `uploads/media` a Spaces y mapear `object_key`.
5. Ejecutar migraciones Alembic en Postgres.

## 3. Validaciones post-migracion (T0 + 10m)
1. Validar conteos por tabla (`users`, `units`, `work_orders`, `checklists`, `media`).
2. Validar consistencia referencial:
   - `checklists.user_id -> users.id`
   - `checklists.unit_id -> units.id`
   - `work_orders.unit_id -> units.id`
3. Ejecutar smoke tests API y UI.

## 4. Apertura (T0 + 20m)
1. Cambiar DNS/endpoint al App Platform.
2. Confirmar sesión cookie-based en cliente actualizado.
3. Mantener compatibilidad Bearer por ventana de transición.

## 5. Rollback (si falla)
1. Poner app cloud en maintenance.
2. Revertir DNS al entorno local previo.
3. Restaurar snapshot previo de Postgres.
4. Desactivar escrituras en cloud hasta completar RCA.
