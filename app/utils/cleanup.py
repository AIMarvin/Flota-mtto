import os
import time
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.media import Media
import logging

# Configurar logs para ver qué se borra
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Cleanup")

MEDIA_DIR = "uploads/media"

def cleanup_old_media(days=30):
    """
    Borra archivos físicos y registros de la tabla 'media' más antiguos que 'days'.
    No afecta a los checklists ni a las órdenes de trabajo.
    """
    db: Session = SessionLocal()
    try:
        # Calcular fecha límite
        limit_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Buscar registros antiguos en la DB
        old_media = db.query(Media).filter(Media.uploaded_at < limit_date).all()
        
        if not old_media:
            logger.info(f"🧹 No hay archivos multimedia con más de {days} días para limpiar.")
            return

        logger.info(f"🧹 Iniciando limpieza de {len(old_media)} archivos multimedia antiguos...")
        
        count = 0
        for item in old_media:
            # 1. Intentar borrar el archivo físico del disco
            if item.file_path:
                # El file_path suele ser relativo o absoluto
                full_path = item.file_path
                if not os.path.isabs(full_path):
                    full_path = os.path.join(os.getcwd(), full_path)
                
                if os.path.exists(full_path):
                    try:
                        os.remove(full_path)
                        logger.info(f"🗑️ Archivo borrado: {os.path.basename(full_path)}")
                    except Exception as e:
                        logger.error(f"❌ No se pudo borrar el archivo {full_path}: {e}")
                else:
                    logger.warning(f"⚠️ Archivo no encontrado en disco: {full_path}")

            # 2. Borrar el registro de la base de datos
            db.delete(item)
            count += 1

        db.commit()
        logger.info(f"✅ Limpieza completada. Se eliminaron {count} registros de multimedia.")
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error durante la limpieza: {e}")
    finally:
        db.close()
