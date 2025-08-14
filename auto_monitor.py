#!/usr/bin/env python3
"""
Monitor automático para el procesador de logs
Se ejecuta solo cada 5 minutos en el fondo
"""

import subprocess
import time
import logging
import sys
import os
from datetime import datetime

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('monitor.log'),
        logging.StreamHandler()
    ]
)

def run_log_processor():
    """Ejecutar el procesador de logs"""
    try:
        # Ejecutar el script de procesamiento
        result = subprocess.run(
            [sys.executable, 'procesar_logs.py'],
            capture_output=True,
            text=True,
            timeout=60  # Timeout de 60 segundos
        )
        
        if result.returncode == 0:
            logging.info("✓ Procesamiento de logs completado exitosamente")
            if result.stdout:
                logging.info(f"Salida: {result.stdout.strip()}")
        else:
            logging.error(f"✗ Error en el procesamiento: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        logging.error("✗ Timeout: El procesamiento tardó más de 60 segundos")
    except Exception as e:
        logging.error(f"✗ Error ejecutando el procesador: {e}")

def main():
    """Función principal del monitoreo automático"""
    interval_minutes = 5
    interval_seconds = interval_minutes * 60
    
    logging.info(f"🚀 Iniciando monitoreo automático cada {interval_minutes} minutos")
    logging.info(f"📁 Directorio de trabajo: {os.getcwd()}")
    logging.info(f"🐍 Python ejecutable: {sys.executable}")
    
    try:
        while True:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            logging.info(f"⏰ [{current_time}] Ejecutando procesamiento de logs...")
            
            # Ejecutar el procesador
            run_log_processor()
            
            # Calcular próxima ejecución
            next_run = datetime.now().timestamp() + interval_seconds
            next_run_str = datetime.fromtimestamp(next_run).strftime("%Y-%m-%d %H:%M:%S")
            
            logging.info(f"⏳ Próxima ejecución: {next_run_str}")
            logging.info("-" * 50)
            
            # Esperar hasta la próxima ejecución
            time.sleep(interval_seconds)
            
    except KeyboardInterrupt:
        logging.info("🛑 Monitoreo detenido por el usuario")
    except Exception as e:
        logging.error(f"✗ Error en el monitoreo: {e}")

if __name__ == "__main__":
    main() 