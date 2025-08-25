#!/usr/bin/env python3
"""
Procesador de logs de CUPS para el Print Server
Lee los logs y los mete en la BD MySQL
Antes usaba archivos de texto, ahora usa BD
Se puede ejecutar cada X minutos automáticamente
AHORA TAMBIÉN EXTRAE NOMBRES REALES DE DOCUMENTOS DESDE ARCHIVOS DE CONTROL DE CUPS

CONFIGURADO PARA FUNCIONAR COMO EN UBUNTU SERVER:
- Usa archivo de log legacy: /var/log/cups/page_log
- Extrae páginas y nombres de archivo directamente del log
- Procesa archivos de control de CUPS para información adicional
"""

import os
import pymysql
import logging
import glob
import re
import subprocess
from datetime import datetime
from typing import Set, List, Dict
import sys

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,  # Mostrar información esencial
    format='%(message)s',   # Sin timestamp ni nivel
    handlers=[
        logging.StreamHandler()
    ]
)

# Configuración de archivos
LOG_FILE = "/var/log/cups/page_log"  # Archivo de logs de CUPS (legacy)
CUPS_SPOOL_DIR = "/var/spool/cups"  # Directorio de archivos de control de CUPS
PROCESSED_JOBS_FILE = "trabajos_procesados.txt"  # Archivo de compatibilidad
USE_JOURNAL = False  # Usar archivo de log legacy como en Ubuntu Server

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
            
            return False
            
        except pymysql.Error as err:
            logging.error(f"Error actualizando nombre de documento: {err}")
            return False
        finally:
            if cursor:
                cursor.close()

    def update_job_pages(self, job_id: str, pages: int):
        """Actualizar el número de páginas para un trabajo existente"""
        try:
            self.ensure_connection()
            cursor = self.connection.cursor()
            
            query = "UPDATE print_jobs SET pages = %s WHERE job_id = %s"
            cursor.execute(query, (pages, job_id))
            
            if cursor.rowcount > 0:
                logging.info(f"Páginas actualizadas para trabajo {job_id}: {pages}")
                return True
            
            return False
            
        except pymysql.Error as err:
            logging.error(f"Error actualizando páginas: {err}")
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
        """Extraer información de un archivo de control de CUPS (método legacy)"""
        try:
            with open(control_file_path, 'rb') as f:
                content = f.read().decode('utf-8', errors='ignore')
            return CUPSControlFileParser.extract_job_info_from_content(content, control_file_path)
        except Exception as e:
            logging.warning(f"Error parseando archivo de control {control_file_path}: {e}")
            return {}
    
    @staticmethod
    def extract_job_info_from_content(content: str, control_file_path: str = "") -> Dict:
        """Extraer información de un archivo de control de CUPS desde su contenido"""
        try:
            job_info = {}
            
            # Extraer job-name (nombre del documento) - formato real de CUPS
            # Buscar múltiples patrones para el nombre del documento
            job_name = None
            
            # Patrón 1: job-name estándar
            job_name_match = re.search(r'job-name\s*([^\n\rB]+)', content, re.IGNORECASE)
            if job_name_match:
                job_name = job_name_match.group(1).strip()
            
            # Patrón 2: buscar en formato CUPS específico
            if not job_name or len(job_name) < 3:
                cups_name_match = re.search(r'([A-Za-z0-9\s\-\.\(\)]+\.pdf)', content)
                if cups_name_match:
                    job_name = cups_name_match.group(1).strip()
            
            # Patrón 3: buscar nombres de documentos comunes
            if not job_name or len(job_name) < 3:
                doc_name_match = re.search(r'([A-Za-z0-9\s\-\.\(\)]{5,50})', content)
                if doc_name_match:
                    potential_name = doc_name_match.group(1).strip()
                    # Filtrar nombres que parezcan documentos reales
                    if not any(x in potential_name.lower() for x in ['job-', 'printer-', 'document-format', 'stdin', 'copies']):
                        job_name = potential_name
            
            if job_name and len(job_name) > 2:
                # Limpiar el nombre del documento
                job_name = re.sub(r'[^\w\s\-\.\(\)]', '', job_name).strip()
                # Remover metadatos adicionales
                job_name = re.sub(r'Idocument-format.*$', '', job_name).strip()
                job_name = re.sub(r'job-priority.*$', '', job_name).strip()
                job_name = re.sub(r'job-uuid.*$', '', job_name).strip()
                job_name = re.sub(r'\s+', ' ', job_name).strip()  # Normalizar espacios
                
                if job_name and len(job_name) > 2:
                    job_info['document_name'] = job_name
                    logging.info(f"Nombre extraído: '{job_name}' desde archivo de control")
            
            # Extraer job-originating-user-name (usuario) - mejorar regex
            user_match = re.search(r'job-originating-user-name([^B]*?)(?:B|$)', content)
            if user_match:
                user = user_match.group(1).strip()
                if user and not user.startswith('Idocument-format'):
                    job_info['user'] = user
            
            # Extraer job-id - buscar en el nombre del archivo también
            if control_file_path:
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
                    
                    if value:
                        job_info[key] = value
                    else:
                        del job_info[key]
            
            return job_info
            
        except Exception as e:
            logging.warning(f"Error parseando contenido del archivo de control: {e}")
            return {}

class CUPSLogProcessor:
    def __init__(self, db: PrintServerDB):
        self.db = db
        self.processed_jobs = self.db.get_processed_jobs()
        self.control_parser = CUPSControlFileParser()

    def parse_journal_line(self, line: str) -> Dict:
        """Parsear una línea del journal de CUPS"""
        try:
            # Buscar líneas que contengan información de trabajos completados
            if 'total' not in line:
                return None
            
            # El formato real es: ago 22 14:22:38 AlmaLinux-9.6-Print-Server cupsd[727]: PHARI018 ph03272 2 [22/Aug/2025:14:22:38 -0300] total 1 - 10.10.3.91 escaneo (1).pdf - -
            
            # Buscar la parte que contiene la información del trabajo (después de "cupsd[727]: ")
            if 'cupsd[' not in line:
                return None
            
            # Extraer la parte después de "cupsd[727]: "
            work_info = line.split('cupsd[')[1].split(']: ')[1]
            parts = work_info.split()
            
            if len(parts) < 6:
                return None
            
            # Ahora parts contiene: ['PHARI018', 'ph03272', '2', '[22/Aug/2025:14:22:38', '-0300]', 'total', '1', '-', '10.10.3.91', 'escaneo', '(1).pdf', '-', '-']
            
            printer = parts[0]  # PHARI018
            user = parts[1]     # ph03272
            job_id = parts[2]   # 2
            
            # Extraer fecha y hora del formato [22/Aug/2025:14:22:38 -0300]
            date_part = parts[3].strip('[')  # "22/Aug/2025:14:22:38"
            time_part = parts[4].strip(']')  # "-0300"
            
            # Extraer páginas del formato "total 1"
            pages = 1  # Por defecto
            if len(parts) >= 6 and parts[5] == "total":
                try:
                    pages = int(parts[6])
                    logging.info(f"Páginas extraídas del journal: {pages}")
                except (ValueError, IndexError):
                    pages = 1
                    logging.warning(f"No se pudo parsear páginas del journal, usando valor por defecto: {pages}")
            
            # Extraer nombre del documento (después de la IP)
            document = f"Documento {job_id}"  # Placeholder por defecto
            if len(parts) >= 10:
                # El nombre del documento está después de la IP
                # Buscar el nombre real del documento de forma genérica
                doc_parts = []
                i = 9  # Empezar después de la IP
                
                # Recopilar el nombre real del documento hasta encontrar el final
                while i < len(parts) and parts[i] != "-":
                    doc_parts.append(parts[i])
                    i += 1
                
                if doc_parts:
                    document = " ".join(doc_parts)
                    logging.info(f"Nombre del documento extraído: '{document}'")
                else:
                    # Si no se pudo extraer, usar "Documento N"
                    document = f"Documento {job_id}"
                    logging.info(f"Usando nombre por defecto: {document}")
            
            # Intentar obtener el número real de páginas usando pdfinfo si es un PDF
            if document and ("pdf" in document.lower() or "word" in document.lower()):
                real_pages = self.get_real_page_count(document, job_id)
                if real_pages and real_pages > pages:
                    logging.info(f"Páginas reales detectadas: {real_pages} (vs {pages} reportadas por CUPS)")
                    pages = real_pages
                else:
                    logging.warning(f"CUPS reporta {pages} páginas para {document}, pero esto puede ser incorrecto")
            
            # Parsear fecha
            try:
                # Formato: "22/Aug/2025:14:22:38"
                timestamp = datetime.strptime(date_part, "%d/%b/%Y:%H:%M:%S")
            except ValueError:
                # Si falla, usar fecha actual
                timestamp = datetime.now()
            
            return {
                'printer': printer,
                'user': user,
                'job_id': job_id,
                'pages': pages,
                'timestamp': timestamp,
                'document': document,
                'copies': 1,
                'status': 'completed'
            }
            
        except Exception as e:
            logging.warning(f"Error parseando línea del journal: {e}")
            return None

    def parse_log_line(self, line: str) -> Dict:
        """Parsear una línea del log de CUPS (legacy) - formato real de CUPS"""
        try:
            # Quitar comillas al inicio y fin
            line = line.strip().strip('"')
            parts = line.split()
            
            if len(parts) < 6:
                return None
            
            printer = parts[0]  # %p - nombre de la impresora
            user = parts[1]     # %u - usuario
            job_id = parts[2]   # %j - job-id
            
            # Extraer fecha y hora del formato [22/Aug/2025:22:45:00 -0300]
            # La fecha puede estar en una o dos partes dependiendo de si hay zona horaria
            date_time_part = parts[3].strip("[]")
            if len(parts) > 4 and parts[4].startswith("-") or parts[4].startswith("+"):
                # Hay zona horaria separada, combinar fecha y zona
                date_time_str = date_time_part + " " + parts[4]
                # Saltar la zona horaria en el siguiente procesamiento
                timezone_offset = 1
            else:
                # No hay zona horaria separada
                date_time_str = date_time_part
                timezone_offset = 0
            
            # Extraer nombre del documento - está entre comillas después de la fecha
            document = f"Documento {job_id}"  # Placeholder por defecto
            doc_pos = 4 + timezone_offset
            if len(parts) > doc_pos:
                # El nombre del documento está entre comillas
                doc_name = parts[doc_pos].strip('"')
                if doc_name and doc_name != "-":
                    document = doc_name
                    # Sin logging para reducir verbosidad
            
            # Extraer copias - después del nombre del documento
            copies = 1  # Por defecto
            copies_pos = doc_pos + 1
            if len(parts) > copies_pos:
                try:
                    copies = int(parts[copies_pos])
                except (ValueError, IndexError):
                    copies = 1
            
            # Extraer páginas - están en la última posición (job-media-sheets-completed)
            pages = 1  # Por defecto
            if len(parts) >= 7:  # Necesitamos al menos 7 partes
                try:
                    # Las páginas están en la última posición (parts[6])
                    page_value = parts[6]
                    if page_value.isdigit():
                        pages = int(page_value)
                    else:
                        # Si no es un número, buscar en la posición anterior (parts[5])
                        if parts[5].isdigit():
                            pages = int(parts[5])
                        else:
                            pages = 1
                            logging.warning(f"No se pudo parsear páginas, usando valor por defecto: {pages}")
                except (ValueError, IndexError):
                    pages = 1
                    logging.warning(f"No se pudo parsear páginas, usando valor por defecto: {pages}")
            else:
                pages = 1
                logging.warning(f"Línea muy corta, usando valor por defecto para páginas: {pages}")
            
            # Parsear fecha
            try:
                # Formato: "22/Aug/2025:22:45:00"
                timestamp = datetime.strptime(date_time_str, "%d/%b/%Y:%H:%M:%S")
                # Ajustar año si es necesario
                if timestamp.year == 1900:
                    timestamp = timestamp.replace(year=datetime.now().year)
            except ValueError:
                # Si falla, usar fecha actual
                timestamp = datetime.now()
            
            return {
                'printer': printer,
                'user': user,
                'job_id': job_id,
                'pages': pages,
                'timestamp': timestamp,
                'document': document,
                'copies': copies,
                'status': 'completed'
            }
            
        except (ValueError, IndexError) as e:
            logging.warning(f"Error parseando línea: {line[:50]}... - {e}")
            return None

    def wait_for_control_files(self, job_id: str, max_wait_seconds: int = 30) -> bool:
        """Esperar a que el archivo de control esté disponible para un trabajo específico"""
        start_time = time.time()
        control_file_pattern = f"/var/spool/cups/c{job_id.zfill(5)}"
        
        while time.time() - start_time < max_wait_seconds:
            if os.path.exists(control_file_pattern):
                # Esperar un poco más para asegurar que el archivo esté completamente escrito
                time.sleep(2)
                return True
            time.sleep(1)
        
        return False

    def process_cups_control_files(self):
        """Procesar archivos de control de CUPS para obtener nombres reales de documentos"""
        try:
            # Verificar permisos antes de intentar acceder
            if not os.access(CUPS_SPOOL_DIR, os.R_OK):
                logging.error(f"❌ SIN PERMISOS para acceder a {CUPS_SPOOL_DIR}")
                logging.error("   El usuario actual no tiene permisos para leer archivos de control de CUPS")
                logging.error("   SOLUCIÓN: Agregar usuario al grupo lp: sudo usermod -a -G lp $USER")
                logging.error("   Luego reiniciar sesión o ejecutar: newgrp lp")
                return
            
            # Buscar archivos de control de CUPS usando find (sin sudo)
            try:
                result = subprocess.run(['find', CUPS_SPOOL_DIR, '-name', 'c*', '-type', 'f'], 
                                      capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    control_files = result.stdout.strip().split('\n') if result.stdout.strip() else []
                else:
                    logging.warning(f"Error ejecutando find: {result.stderr}")
                    control_files = []
            except Exception as e:
                logging.warning(f"Error buscando archivos de control: {e}")
                control_files = []
            
            if not control_files:
                logging.info("No se encontraron archivos de control de CUPS")
                return
            
            logging.info(f"Procesando {len(control_files)} archivos de control de CUPS...")
            
            updated_count = 0
            permission_errors = 0
            
            for control_file in control_files:
                try:
                    # Verificar permisos del archivo específico
                    if not os.access(control_file, os.R_OK):
                        permission_errors += 1
                        if permission_errors <= 3:  # Mostrar solo los primeros 3 errores
                            logging.warning(f"⚠ Sin permisos para leer: {control_file}")
                        continue
                    
                    # Leer archivo de control directamente (sin sudo)
                    with open(control_file, 'rb') as f:
                        content_bytes = f.read()
                    
                    # Decodificar con manejo de errores más robusto
                    try:
                        content = content_bytes.decode('utf-8', errors='ignore')
                    except UnicodeDecodeError:
                        # Si falla UTF-8, intentar con latin-1
                        content = content_bytes.decode('latin-1', errors='ignore')
                    
                    job_info = self.control_parser.extract_job_info_from_content(content, control_file)
                    
                    if job_info.get('job_id'):
                        # Normalizar job_id: remover ceros a la izquierda
                        job_id = str(int(job_info['job_id']))
                        
                        # Si no hay nombre del documento, usar "Documento N"
                        document_name = job_info.get('document_name')
                        if not document_name or document_name == '%N':
                            document_name = f"Documento {job_id}"
                            logging.info(f"Usando nombre por defecto para trabajo {job_id}: {document_name}")
                        
                        # SIEMPRE intentar actualizar el nombre del documento en la base de datos
                        # Esto incluye trabajos existentes y nuevos
                        if self.db.update_document_name(job_id, document_name):
                            updated_count += 1
                            logging.info(f"✅ Nombre actualizado para trabajo {job_id}: '{document_name}'")
                        else:
                            logging.warning(f"⚠ No se pudo actualizar nombre para trabajo {job_id}")
                            
                except PermissionError as e:
                    permission_errors += 1
                    if permission_errors <= 3:  # Mostrar solo los primeros 3 errores
                        logging.warning(f"⚠ Error de permisos en {control_file}: {e}")
                    continue
                except Exception as e:
                    logging.warning(f"Error procesando archivo {control_file}: {e}")
                    continue
            
            if permission_errors > 0:
                logging.warning(f"⚠ Total de errores de permisos: {permission_errors}")
                if permission_errors > 3:
                    logging.warning(f"   (Mostrados solo los primeros 3 errores)")
                logging.error("   SOLUCIÓN: Ejecutar: sudo usermod -a -G lp $USER && newgrp lp")
            
            logging.info(f"✅ Total de nombres actualizados: {updated_count}")
            
        except Exception as e:
            logging.error(f"Error procesando archivos de control de CUPS: {e}")

    def get_real_page_count(self, document_name: str, job_id: str) -> int:
        """Intentar obtener el número real de páginas usando pdfinfo"""
        try:
            # Buscar archivos de datos de CUPS que puedan contener el PDF original
            data_files = glob.glob(f"{CUPS_SPOOL_DIR}/d{job_id.zfill(6)}-*")
            
            if not data_files:
                logging.debug(f"No se encontraron archivos de datos para job {job_id}")
                return None
            
            # Probar con el primer archivo de datos
            data_file = data_files[0]
            
            # Verificar si es un PDF
            result = subprocess.run(['file', data_file], capture_output=True, text=True, timeout=10)
            if result.returncode == 0 and 'PDF' in result.stdout:
                # Es un PDF, usar pdfinfo para contar páginas
                result = subprocess.run(['pdfinfo', data_file], capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    # Buscar la línea "Pages: X"
                    for line in result.stdout.split('\n'):
                        if line.startswith('Pages:'):
                            try:
                                page_count = int(line.split(':')[1].strip())
                                logging.info(f"Páginas reales detectadas por pdfinfo: {page_count}")
                                return page_count
                            except (ValueError, IndexError):
                                continue
            
            logging.debug(f"No se pudo obtener número real de páginas para {document_name}")
            return None
            
        except Exception as e:
            logging.debug(f"Error obteniendo páginas reales: {e}")
            return None

    def process_journal(self):
        """Procesar logs desde el journal de systemd - SOLUCIÓN DEFINITIVA"""
        logging.info("Procesando logs desde journal de CUPS...")
        
        nuevos_trabajos = 0
        
        try:
            # Ejecutar journalctl para obtener logs de CUPS de las últimas 24 horas
            cmd = ['journalctl', '-u', 'cups', '--no-pager', '--since', '24 hours ago']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode != 0:
                logging.error(f"Error ejecutando journalctl: {result.stderr}")
                return
            
            lines = result.stdout.split('\n')
            
            for line_num, line in enumerate(lines, 1):
                line = line.strip()
                if not line:
                    continue
                
                job_data = self.parse_journal_line(line)
                if not job_data:
                    continue
                
                # Verificar si ya fue procesado
                if job_data['job_id'] not in self.processed_jobs:
                    # Insertar trabajo inmediatamente
                    if self.db.insert_print_job(job_data):
                        self.processed_jobs.add(job_data['job_id'])
                        nuevos_trabajos += 1
                        logging.info(f"Trabajo {job_data['job_id']} insertado desde journal: {job_data['user']} -> {job_data['printer']} ({job_data['pages']} páginas)")
                    
                    # Mostrar progreso cada 100 líneas
                    if line_num % 100 == 0:
                        logging.info(f"Procesadas {line_num} líneas del journal...")
            
            logging.info(f"Procesamiento del journal completado: {nuevos_trabajos} trabajos nuevos agregados")
            
            # SIEMPRE procesar archivos de control para obtener nombres reales
            logging.info("Procesando archivos de control para obtener nombres reales de documentos...")
            self.process_cups_control_files()
            
        except subprocess.TimeoutExpired:
            logging.error("Timeout ejecutando journalctl")
        except Exception as e:
            logging.error(f"Error procesando journal: {e}")

    def process_log_file(self, log_file_path: str):
        """Procesar archivo de log completo - SOLUCIÓN DEFINITIVA CON page_log"""
        # PRIMERO procesar desde page_log (más confiable para páginas)
        if not os.path.exists(log_file_path):
            logging.error(f"Archivo de log page_log no encontrado: {log_file_path}")
            return
        
        logging.info("Procesando logs desde page_log de CUPS...")
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
                        # Insertar trabajo inmediatamente con la información extraída
                        if self.db.insert_print_job(job_data):
                            self.processed_jobs.add(job_data['job_id'])
                            nuevos_trabajos += 1
                            logging.info(f"Trabajo {job_data['job_id']} insertado: {job_data['user']} -> {job_data['printer']} ({job_data['pages']} páginas) - '{job_data['document']}'")
                        
                        # Mostrar progreso cada 1000 líneas
                        if line_num % 1000 == 0:
                            logging.info(f"Procesadas {line_num} líneas...")
                
                logging.info(f"Procesamiento completado: {nuevos_trabajos} trabajos nuevos agregados")
            
            # SIEMPRE procesar archivos de control para obtener información más precisa
            # Esto incluye trabajos existentes y nuevos
            logging.info("Procesando archivos de control para obtener información más precisa...")
            self.process_cups_control_files()
                
        except Exception as e:
            logging.error(f"Error procesando archivo de log: {e}")
        
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
                        # Insertar trabajo inmediatamente con la información extraída
                        if self.db.insert_print_job(job_data):
                            self.processed_jobs.add(job_data['job_id'])
                            nuevos_trabajos += 1
                            logging.info(f"Trabajo {job_data['job_id']} insertado: {job_data['user']} -> {job_data['printer']} ({job_data['pages']} páginas) - '{job_data['document']}'")
                        
                        # Mostrar progreso cada 1000 líneas
                        if line_num % 1000 == 0:
                            logging.info(f"Procesadas {line_num} líneas...")
                
                logging.info(f"Procesamiento completado: {nuevos_trabajos} trabajos nuevos agregados")
            
            # SIEMPRE procesar archivos de control para obtener información más precisa
            # Esto incluye trabajos existentes y nuevos
            logging.info("Procesando archivos de control para obtener información más precisa...")
            self.process_cups_control_files()
                
        except Exception as e:
            logging.error(f"Error procesando archivo de log: {e}")



def main():
    """Función principal - Procesa logs una sola vez"""
    logging.info("Iniciando procesamiento de logs de CUPS")
    
    # Inicializar base de datos
    try:
        db = PrintServerDB(DB_CONFIG)
    except Exception as e:
        logging.error(f"No se pudo conectar a la base de datos: {e}")
        sys.exit(1)
    
    # Inicializar procesador
    processor = CUPSLogProcessor(db)
    
    # Procesar logs desde archivo legacy
    if os.path.exists(LOG_FILE):
        logging.info(f"Procesando archivo: {LOG_FILE}")
        processor.process_log_file(LOG_FILE)
    else:
        logging.error(f"No se encontró archivo de log: {LOG_FILE}")
        logging.error("Verificar que CUPS esté configurado para generar page_log")
        sys.exit(1)
    
    logging.info("Procesamiento completado")



if __name__ == "__main__":
    main()