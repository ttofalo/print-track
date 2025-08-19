# Print Server Dashboard v5

Sistema completo de monitoreo de impresiones para servidores CUPS con interfaz web, base de datos MySQL y monitoreo en tiempo real del estado de impresoras.

## Características Principales

- Dashboard en tiempo real con estadísticas de impresiones
- Sistema de autenticación
- Filtros avanzados para trabajos de impresión
- Estado de impresoras con monitoreo automático por ping
- Reporte XLSX de trabajos de impresión
- Nombres de documentos capturados automáticamente
- Interfaz responsive y moderna

## Arquitectura

```
Frontend (HTML/CSS/JS) ↔ Backend (Node.js) ↔ Database (MySQL)
                              ↑
                    Python (Log Parser + Monitor)
```

## Estructura del Proyecto

```
print_server/
├── server.js               # Servidor principal Node.js
├── index.html              # Dashboard principal
├── login.html              # Sistema de autenticación
├── script.js               # Frontend JavaScript
├── style.css               # Estilos principales
├── printer-status.js       # Monitor de estado de impresoras
├── printer-status.css      # Estilos del monitor de impresoras
├── procesar_logs.py        # Procesador de logs CUPS
├── auto_monitor.py         # Monitor automático
├── database_setup.sql      # Estructura de base de datos
├── package.json            # Dependencias Node.js
├── check_status.sh         # Script de verificación
├── nginx.conf              # Configuración Nginx (opcional)
└── README.md
```

## Instalación

### Prerrequisitos
- Linux (Ubuntu/Debian)
- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- CUPS instalado y funcionando

### 1. Instalar Dependencias
```bash
sudo apt update
sudo apt install python3 python3-pip nodejs npm mysql-server mysql-client git cups -y
```

### 2. Configurar MySQL
```bash
sudo mysql_secure_installation
sudo mysql -u root -p
```

```sql
CREATE DATABASE print_server_db;
CREATE USER 'print_user'@'localhost' IDENTIFIED BY 'Por7a*sis';
GRANT ALL PRIVILEGES ON print_server_db.* TO 'print_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configurar el Proyecto
```bash
git clone <tu-repositorio>
cd print_server
git checkout version-4

# Dependencias Node.js
npm install

# Entorno virtual Python
python3 -m venv venv
source venv/bin/activate
pip install pymysql cryptography

# Base de datos
mysql -u print_user -p print_server_db < database_setup.sql
```

### 4. Configurar Permisos CUPS (CRÍTICO)
```bash
# Agregar usuario al grupo lp si no está
sudo usermod -a -G lp sistemas

# Cambiar permisos del directorio de CUPS
sudo chmod 750 /var/spool/cups/

# Cambiar permisos de archivos de control de CUPS
sudo chmod 640 /var/spool/cups/c*

# Verificar que el usuario pueda acceder
ls -la /var/spool/cups/
```

### 5. Servicios del Sistema
```bash
sudo cp *.service /etc/systemd/system/
sudo cp *.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable print-server log-processor.timer
sudo systemctl start print-server log-processor.timer
```

### 6. Verificar Instalación
```bash
./check_status.sh

# Verificar que el procesador de logs funcione
source venv/bin/activate
python procesar_logs.py --once
```

## Uso

- Dashboard: http://IP-SERVIDOR:3000
- API: http://IP-SERVIDOR:3000/api
- Estado: http://IP-SERVIDOR:3000/api/health

## Monitoreo

- Logs CUPS: Procesamiento automático cada 5 minutos
- Estado de impresoras: Ping automático cada 30 segundos
- Estadísticas: Actualización en tiempo real

## Mantenimiento

- Logs del servidor: `sudo journalctl -u print-server -f`
- Logs del procesador: `sudo journalctl -u log-processor -f`
- Estado de servicios: `./check_status.sh`

## Solución de Problemas

### Nombres de documentos no aparecen
```bash
# Verificar permisos de CUPS
sudo ls -la /var/spool/cups/
sudo ls -la /var/spool/cups/c*

# Si no hay permisos, ejecutar:
sudo chmod 750 /var/spool/cups/
sudo chmod 640 /var/spool/cups/c*

# Verificar que el usuario esté en grupo lp
groups sistemas

# Probar script manualmente
source venv/bin/activate
python procesar_logs.py --once
```

### Error de conexión a MySQL
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales en procesar_logs.py
# Usuario: print_user, Password: Por7a*sis
```

## Interfaces

<img width="1552" height="903" alt="{C6591F5E-77EF-4936-B203-B96EE2F28C5B}" src="https://github.com/user-attachments/assets/96403dc1-41c5-4457-b132-9e60c478134d" />
<img width="1721" height="909" alt="image" src="https://github.com/user-attachments/assets/06402dcc-f152-4f32-8698-e4cdbb545ed3" />
<img width="910" height="696" alt="image" src="https://github.com/user-attachments/assets/452f6654-7e0a-43f5-a428-3f3ff3c250e6" />
<img width="1397" height="907" alt="image" src="https://github.com/user-attachments/assets/9b632310-a3ba-4171-ab70-8cf0e863ac91" />
<img width="318" height="557" alt="image" src="https://github.com/user-attachments/assets/ab028c2d-8a5c-4cee-a3f4-d25d4e23099f" />
<img width="327" height="106" alt="image" src="https://github.com/user-attachments/assets/96995083-b2e2-48e4-a1e9-5364767b39ba" />



