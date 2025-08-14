# Print Server Dashboard

Sistema de monitoreo de impresiones para servidores CUPS con interfaz web y base de datos MySQL.

##  Características

- Dashboard en tiempo real con estadísticas de impresiones
- Sistema de autenticación
- Filtros avanzados para trabajos de impresión
- Ranking de usuarios más activos
- Monitoreo automático cada 5 minutos
- Interfaz responsive y moderna

## 🏗️ Arquitectura

```
Frontend (HTML/CSS/JS) ↔ Backend (Node.js) ↔ Database (MySQL)
                              ↑
                    Python (Log Parser)
```

## 📁 Estructura del Proyecto

```
print_server/
├── server.js               # Servidor principal
├── index.html              # Dashboard
├── login.html              # Login
├── script.js               # Frontend JS
├── style.css               # Estilos
├── procesar_logs.py        # Procesador de logs CUPS
├── auto_monitor.py         # Monitor automático
├── database_setup.sql      # Estructura BD
├── package.json            # Dependencias Node.js
├── check_status.sh         # Script de estado
├── nginx.conf              # Config Nginx (opcional)
└── README.md
```

## 🛠️ Instalación

### Prerrequisitos
- Linux (Ubuntu/Debian)
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
git clone <tu-repositorio>
cd print_server

# Instalar dependencias Node.js
npm install

# Crear entorno virtual Python
python3 -m venv venv
source venv/bin/activate
pip install pymysql

# Configurar base de datos
mysql -u print_user -p print_server_db < database_setup.sql
```

### 4. Configurar Servicios
```bash
# Copiar servicios systemd
sudo cp print-server.service /etc/systemd/system/
sudo cp log-processor.service /etc/systemd/system/
sudo cp log-processor.timer /etc/systemd/system/

# Habilitar y arrancar servicios
sudo systemctl daemon-reload
sudo systemctl enable print-server
sudo systemctl enable log-processor.timer
sudo systemctl start print-server
sudo systemctl start log-processor.timer
```

### 5. Verificar Instalación
```bash
./check_status.sh
```

## 🚀 Uso

- **Dashboard**: http://IP-SERVIDOR:3000
- **API**: http://IP-SERVIDOR:3000/api
- **Health Check**: http://IP-SERVIDOR:3000/api/health

## 📊 Monitoreo

El sistema procesa automáticamente los logs de CUPS cada 5 minutos y actualiza las estadísticas en tiempo real.

## 🔧 Mantenimiento

- **Logs del servidor**: `sudo journalctl -u print-server -f`
- **Logs del procesador**: `sudo journalctl -u log-processor -f`
- **Estado de servicios**: `./check_status.sh`

## 📄 Licencia

MIT License 