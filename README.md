# Print Server Dashboard v4

Sistema completo de monitoreo de impresiones para servidores CUPS con interfaz web, base de datos MySQL y monitoreo en tiempo real del estado de impresoras.

## Características Principales

- Dashboard en tiempo real con estadísticas de impresiones
- Sistema de autenticación
- Filtros avanzados para trabajos de impresión
- Estado de impresoras con monitoreo automático por ping
- Reporte XLSX de trabajos de impresión
- Nombres de documentos capturados automáticamente
- Interfaz responsive y moderna

## 🏗️ Arquitectura

```
Frontend (HTML/CSS/JS) ↔ Backend (Node.js) ↔ Database (MySQL)
                              ↑
                    Python (Log Parser + Monitor)
```

## 📁 Estructura del Proyecto

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
└── README.md
```

## 🛠️ Instalación

### Prerrequisitos
- Linux (Ubuntu 22.04 LTS)
- Python 3.8+
- Node.js 16+
- MySQL 8.0+

### 1. Instalar Dependencias
```bash
sudo apt update
sudo apt install python3 python3-pip nodejs npm mysql-server mysql-client git -y
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
git clone <https://github.com/ttofalo/print-track>
cd print_server

# Dependencias Node.js
npm install

# Entorno virtual Python
python3 -m venv venv
source venv/bin/activate
pip install pymysql

# Base de datos
mysql -u print_user -p print_server_db < database_setup.sql
```

### 4. Servicios del Sistema
```bash
sudo cp *.service /etc/systemd/system/
sudo cp *.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable print-server log-processor.timer
sudo systemctl start print-server log-processor.timer
```

### 5. Verificar Instalación
```bash
./check_status.sh
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

