#!/usr/bin/env python3
"""
Procesador de logs de CUPS para el Print Server
Lee los logs y los mete en la BD MySQL
Antes usaba archivos de texto, ahora usa BD
Se puede ejecutar cada X minutos automáticamente
"""

import os
import pymysql
import logging
import time
import argparse
from datetime import datetime
from typing import Set, List, Dict
import sys

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Solo mostrar en consola para Windows
    ]
)

# Configuración de archivos
LOG_FILE = "/var/log/cups/page_log"  # Archivo de logs de CUPS
PROCESSED_JOBS_FILE = "trabajos_procesados.txt"  # Archivo de compatibilidad

# Configuración de la base de datos
DB_CONFIG = {
    'host': 'localhost',
    'user': 'print_user',
    'password': 'Por7a*sis',  # Contraseña de producción
    'database': 'print_server_db',
    'charset': 'utf8mb4',
    'autocommit': True
}

class PrintServerDB:
    def __init__(self, config: Dict):
        self.config = config
        self.connection = None
        self.connect()

    def connect(self):
        """Establecer conexión con la base de datos"""
        try:
            self.connection = pymysql.connect(**self.config)
            logging.info("Conexión a MySQL establecida correctamente")
        except pymysql.Error as err:
            logging.error(f"Error conectando a MySQL: {err}")
            sys.exit(1)

    def ensure_connection(self):
        """Asegurar que la conexión esté activa"""
        try:
            self.connection.ping(reconnect=True)
        except:
            self.connect()

    def get_processed_jobs(self) -> Set[str]:
        """Obtener trabajos ya procesados desde la base de datos"""
        try:
            self.ensure_connection()
            cursor = self.connection.cursor()
            
            cursor.execute("SELECT job_id FROM print_jobs")
            results = cursor.fetchall()
            
            # Crear set de trabajos procesados
            processed = set()
            for (job_id,) in results:
                processed.add(job_id)
            
            cursor.close()
            return processed
            
        except pymysql.Error as err:
            logging.error(f"Error obteniendo trabajos procesados: {err}")
            return set()

    def insert_printer(self, name: str, ip_address: str = None, location: str = None):
        """Insertar o actualizar impresora"""
        try:
            self.ensure_connection()
            cursor = self.connection.cursor()
            
            # Si no tenemos IP, usar un placeholder
            if not ip_address:
                ip_address = "10.10.3.171"  # IP por defecto
            
            query = """
                INSERT INTO printers (name, ip_address, location) 
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    ip_address = VALUES(ip_address),
                    location = VALUES(location),
                    updated_at = CURRENT_TIMESTAMP
            """
            cursor.execute(query, (name, ip_address, location))
            
            cursor.close()
            logging.debug(f"Impresora {name} registrada/actualizada")
            
        except pymysql.Error as err:
            logging.error(f"Error insertando impresora {name}: {err}")

    def insert_print_job(self, job_data: Dict):
        """Insertar trabajo de impresión"""
        try:
            self.ensure_connection()
            cursor = self.connection.cursor()
            
            # Primero asegurar que la impresora existe
            self.insert_printer(job_data['printer'])
            
            # Obtener printer_id
            cursor.execute("SELECT id FROM printers WHERE name = %s", (job_data['printer'],))
            result = cursor.fetchone()
            if not result:
                logging.error(f"Impresora {job_data['printer']} no encontrada después de insertar")
                return False
            
            printer_id = result[0]
            
            # Insertar trabajo de impresión
            query = """
                INSERT INTO print_jobs 
                (job_id, user_id, printer_id, document_name, pages, copies, status, timestamp)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (
                job_data['job_id'],
                job_data['user'],
                printer_id,
                job_data['document'],
                job_data['pages'],
                job_data['copies'],
                job_data['status'],
                job_data['timestamp']
            ))
            
            cursor.close()
            logging.info(f"Trabajo de impresión registrado: {job_data['user']} -> {job_data['printer']} ({job_data['pages']} páginas)")
            return True
            
        except pymysql.Error as err:
            logging.error(f"Error insertando trabajo de impresión: {err}")
            return False

class CUPSLogProcessor:
    def __init__(self, db: PrintServerDB):
        self.db = db
        self.processed_jobs = self.db.get_processed_jobs()

    def parse_log_line(self, line: str) -> Dict:
        """Parsear una línea del log de CUPS"""
        try:
            # Quitar comillas al inicio y fin
            line = line.strip().strip('"')
            parts = line.split()
            
            if len(parts) < 6:
                return None
            
            printer = parts[0]
            user = parts[1]
            job_id = parts[2]
            
            # Extraer fecha y hora del formato [31/Jul/2025:13:55:02 -0300]
            date_time_part = parts[3].strip("[]")
            # Separar fecha/hora de la zona horaria
            date_time_str = date_time_part.split(" ")[0]  # "31/Jul/2025:13:55:02"
            
            # Extraer páginas del formato "total 1"
            pages = 1  # Por defecto
            if len(parts) >= 6 and parts[5] == "total":
                try:
                    pages = int(parts[6])
                except (ValueError, IndexError):
                    pages = 1
            
            # Parsear fecha
            try:
                # Formato: "31/Jul/2025:13:55:02"
                timestamp = datetime.strptime(date_time_str, "%d/%b/%Y:%H:%M:%S")
            except ValueError:
                # Si falla, usar fecha actual
                timestamp = datetime.now()
            
            return {
                'printer': printer,
                'user': user,
                'job_id': job_id,
                'pages': pages,
                'timestamp': timestamp,
                'document': f"Documento {job_id}",
                'copies': 1,
                'status': 'completed'
            }
            
        except (ValueError, IndexError) as e:
            logging.warning(f"Error parseando línea: {line[:50]}... - {e}")
            return None

    def process_log_file(self, log_file_path: str):
        """Procesar archivo de log completo"""
        if not os.path.exists(log_file_path):
            logging.error(f"Archivo de log no encontrado: {log_file_path}")
            return
        
        nuevos_trabajos = 0
        
        try:
            with open(log_file_path, 'r') as file:
                for line_num, line in enumerate(file, 1):
                    line = line.strip()
                    if not line:
                        continue
                    
                    job_data = self.parse_log_line(line)
                    if not job_data:
                        continue
                    
                    # Verificar si ya fue procesado
                    if job_data['job_id'] not in self.processed_jobs:
                        if self.db.insert_print_job(job_data):
                            self.processed_jobs.add(job_data['job_id'])
                            nuevos_trabajos += 1
                    
                    # Mostrar progreso cada 1000 líneas
                    if line_num % 1000 == 0:
                        logging.info(f"Procesadas {line_num} líneas...")
            
            logging.info(f"Procesamiento completado: {nuevos_trabajos} trabajos nuevos agregados")
                
        except Exception as e:
            logging.error(f"Error procesando archivo de log: {e}")

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(description='Procesador de logs de CUPS')
    parser.add_argument('--monitor', action='store_true', 
                       help='Ejecutar en modo monitoreo continuo')
    parser.add_argument('--interval', type=int, default=5,
                       help='Intervalo en minutos para el monitoreo (default: 5)')
    parser.add_argument('--once', action='store_true',
                       help='Procesar una sola vez y salir')
    
    args = parser.parse_args()
    
    logging.info("Iniciando procesamiento de logs de CUPS")
    
    # Crear directorio de logs si no existe (solo para Linux)
    # os.makedirs('/var/log/print_reports', exist_ok=True)
    
    # Inicializar base de datos
    try:
        db = PrintServerDB(DB_CONFIG)
    except Exception as e:
        logging.error(f"No se pudo conectar a la base de datos: {e}")
        sys.exit(1)
    
    # Inicializar procesador
    processor = CUPSLogProcessor(db)
    
    if args.monitor:
        # Modo monitoreo continuo
        logging.info(f"Modo monitoreo activado - Intervalo: {args.interval} minutos")
        monitor_logs(processor, args.interval)
    else:
        # Procesar archivo de log único
        if os.path.exists(LOG_FILE):
            logging.info(f"Procesando archivo: {LOG_FILE}")
            processor.process_log_file(LOG_FILE)
        else:
            logging.error(f"Archivo de log no encontrado: {LOG_FILE}")
        logging.info("Procesamiento completado")

def monitor_logs(processor, interval_minutes):
    """Ejecutar monitoreo continuo de logs"""
    interval_seconds = interval_minutes * 60
    
    try:
        while True:
            logging.info(f"Procesando logs... (próxima ejecución en {interval_minutes} minutos)")
            if os.path.exists(LOG_FILE):
                processor.process_log_file(LOG_FILE)
            
            # Esperar hasta la próxima ejecución
            time.sleep(interval_seconds)
            
    except KeyboardInterrupt:
        logging.info("Monitoreo detenido por el usuario")
    except Exception as e:
        logging.error(f"Error en el monitoreo: {e}")

if __name__ == "__main__":
    main()