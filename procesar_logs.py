#!/usr/bin/env python3
"""
Procesador de logs de CUPS para el Print Server
Lee los logs y los mete en la BD MySQL
Antes usaba archivos de texto, ahora usa BD
Se puede ejecutar cada X minutos automáticamente
AHORA TAMBIÉN EXTRAE NOMBRES REALES DE DOCUMENTOS DESDE ARCHIVOS DE CONTROL DE CUPS
"""

import os
import pymysql
import logging
import time
import argparse
import glob
import re
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
CUPS_SPOOL_DIR = "/var/spool/cups"  # Directorio de archivos de control de CUPS
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

    def update_document_name(self, job_id: str, document_name: str):
        """Actualizar el nombre del documento para un trabajo existente"""
        try:
            self.ensure_connection()
            cursor = self.connection.cursor()
            
            query = "UPDATE print_jobs SET document_name = %s WHERE job_id = %s"
            cursor.execute(query, (document_name, job_id))
            
            if cursor.rowcount > 0:
                logging.info(f"Nombre de documento actualizado para trabajo {job_id}: {document_name}")
                return True
            else:
                logging.warning(f"No se encontró trabajo {job_id} para actualizar nombre")
                return False
                
        except pymysql.Error as err:
            logging.error(f"Error actualizando nombre de documento para {job_id}: {err}")
            return False
        finally:
            if cursor:
                cursor.close()

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

class CUPSControlFileParser:
    """Parser para archivos de control de CUPS"""
    
    @staticmethod
    def extract_job_info(control_file_path: str) -> Dict:
        """Extraer información de un archivo de control de CUPS"""
        try:
            with open(control_file_path, 'rb') as f:
                content = f.read().decode('utf-8', errors='ignore')
            
            job_info = {}
            
            # Extraer job-name (nombre del documento) - mejorar regex
            job_name_match = re.search(r'job-name([^B]*?)(?:B|$)', content)
            if job_name_match:
                job_name = job_name_match.group(1).strip()
                if job_name and job_name != 'Idocument-format':
                    job_info['document_name'] = job_name
            
            # Extraer job-originating-user-name (usuario) - mejorar regex
            user_match = re.search(r'job-originating-user-name([^B]*?)(?:B|$)', content)
            if user_match:
                user = user_match.group(1).strip()
                if user and not user.startswith('Idocument-format'):
                    job_info['user'] = user
            
            # Extraer job-id - buscar en el nombre del archivo también
            filename = os.path.basename(control_file_path)
            if filename.startswith('c') and filename[1:].isdigit():
                job_info['job_id'] = filename[1:]  # Extraer número del nombre del archivo
            
            # También buscar job-id en el contenido
            job_id_match = re.search(r'job-id(\d+)', content)
            if job_id_match:
                job_info['job_id'] = job_id_match.group(1)
            
            # Extraer printer-uri para obtener nombre de impresora - mejorar regex
            printer_match = re.search(r'ipp://[^/]+/printers/([^B]*?)(?:B|$)', content)
            if printer_match:
                printer = printer_match.group(1).strip()
                if printer and not printer.startswith('!'):
                    job_info['printer'] = printer
            
            # Limpiar valores extraídos
            for key, value in job_info.items():
                if isinstance(value, str):
                    # Remover caracteres extraños y espacios
                    value = re.sub(r'[^\w\s\-\.]', '', value).strip()
                    
                    # Para nombres de documentos, remover metadatos adicionales
                    if key == 'document_name':
                        # Remover cualquier texto después de caracteres especiales comunes
                        value = re.sub(r'Idocument-format.*$', '', value).strip()
                        value = re.sub(r'job-priority.*$', '', value).strip()
                        value = re.sub(r'job-uuid.*$', '', value).strip()
                        value = re.sub(r'\s+', ' ', value).strip()  # Normalizar espacios
                    
                    if value:
                        job_info[key] = value
                    else:
                        del job_info[key]
            
            return job_info
            
        except Exception as e:
            logging.warning(f"Error parseando archivo de control {control_file_path}: {e}")
            return {}

class CUPSLogProcessor:
    def __init__(self, db: PrintServerDB):
        self.db = db
        self.processed_jobs = self.db.get_processed_jobs()
        self.control_parser = CUPSControlFileParser()

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
                'document': f"Documento {job_id}",  # Placeholder, se actualizará después
                'copies': 1,
                'status': 'completed'
            }
            
        except (ValueError, IndexError) as e:
            logging.warning(f"Error parseando línea: {line[:50]}... - {e}")
            return None

    def process_cups_control_files(self):
        """Procesar archivos de control de CUPS para obtener nombres reales de documentos"""
        try:
            # Buscar archivos de control de CUPS
            control_files = glob.glob(os.path.join(CUPS_SPOOL_DIR, "c*"))
            
            if not control_files:
                logging.info("No se encontraron archivos de control de CUPS")
                return
            
            logging.info(f"Procesando {len(control_files)} archivos de control de CUPS...")
            
            updated_count = 0
            for control_file in control_files:
                try:
                    job_info = self.control_parser.extract_job_info(control_file)
                    
                    if job_info.get('job_id') and job_info.get('document_name'):
                        # Normalizar job_id: remover ceros a la izquierda
                        job_id = str(int(job_info['job_id']))
                        
                        # Actualizar nombre del documento en la base de datos
                        if self.db.update_document_name(job_id, job_info['document_name']):
                            updated_count += 1
                            
                except Exception as e:
                    logging.warning(f"Error procesando archivo {control_file}: {e}")
                    continue
            
            logging.info(f"Actualizados {updated_count} nombres de documentos desde archivos de control")
            
        except Exception as e:
            logging.error(f"Error procesando archivos de control de CUPS: {e}")

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
            
            # Después de procesar el log, procesar archivos de control para actualizar nombres
            self.process_cups_control_files()
                
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