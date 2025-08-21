# Print Server Dashboard v6 - Red Hat Enterprise Linux / AlmaLinux

Sistema completo de monitoreo de impresiones para servidores CUPS con interfaz web, base de datos MariaDB y monitoreo en tiempo real del estado de impresoras.

## Características Principales

- Dashboard en tiempo real con estadísticas de impresiones
- Sistema de autenticación
- Filtros avanzados para trabajos de impresión
- Estado de impresoras con monitoreo automático por ping
- Reporte XLSX de trabajos de impresión
- Nombres de documentos capturados automáticamente
- Interfaz responsive y moderna
- **Servicios automáticos** para funcionamiento 24/7
- **Inicio automático** al arrancar el sistema

## Arquitectura

```
Frontend (HTML/CSS/JS) ↔ Backend (Node.js) ↔ Database (MariaDB)
                              ↑
                    Python (Log Parser + Monitor)
```

## Estructura del Proyecto

```
print-track/
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
├── check_status_redhat.sh  # Script de verificación para RHEL
├── nginx.conf              # Configuración Nginx (opcional)
└── README.md
```

## Instalación en Red Hat Enterprise Linux / AlmaLinux

### Prerrequisitos
- **Red Hat Enterprise Linux 8/9/10** o **AlmaLinux 8/9/10** (Verificado en RHEL 10.0, compatible con AlmaLinux)
- Python 3.8+
- Node.js 16+
- MariaDB 10.11+ (compatible con MySQL)
- CUPS instalado y funcionando
- Usuario con privilegios sudo

### 1. Instalar Dependencias del Sistema
```bash
sudo dnf update -y
sudo dnf install -y nodejs npm mariadb-server mariadb cups cups-client git ca-certificates
```

**Nota**: En Red Hat Enterprise Linux y AlmaLinux usamos `mariadb-server` en lugar de `mysql-server` por políticas de licenciamiento, pero es 100% compatible con MySQL.

### 2. Configurar MariaDB
```bash
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Crear base de datos y usuario
sudo mysql -u root -e "CREATE DATABASE print_server_db;"
sudo mysql -u root -e "CREATE USER 'print_user'@'localhost' IDENTIFIED BY 'Por7a*sis';"
sudo mysql -u root -e "GRANT ALL PRIVILEGES ON print_server_db.* TO 'print_user'@'localhost';"
sudo mysql -u root -e "FLUSH PRIVILEGES;"
```

### 3. Configurar el Proyecto
```bash
cd print-track

# Dependencias Node.js
npm install

# Entorno virtual Python
python3 -m venv venv
source venv/bin/activate

# Dependencias Python (con certificados SSL para RHEL/AlmaLinux)
python3 -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org pymysql cryptography

# Base de datos
mysql -u print_user -p'Por7a*sis' print_server_db < database_setup.sql
```

### 4. Configurar CUPS para Acceso Externo
```bash
# Backup de configuración
sudo cp /etc/cups/cupsd.conf /etc/cups/cupsd.conf.backup

# Editar configuración
sudo nano /etc/cups/cupsd.conf

# Cambios necesarios:
# - Browsing Off → Browsing On
# - Listen localhost:631 → Port 631
# - Agregar Allow all en secciones Location

# Reiniciar CUPS
sudo systemctl restart cups
```

### 5. Configurar Permisos CUPS
```bash
# Agregar usuario al grupo lp
sudo usermod -a -G lp sistemas

# Cambiar permisos del directorio de CUPS
sudo chmod 750 /var/spool/cups/
```

### 6. Configurar Firewall
```bash
# Abrir puertos necesarios
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=631/tcp
sudo firewall-cmd --reload
```

### 7. Configurar Servicios Automáticos del Sistema
```bash
# Crear servicio del servidor principal
sudo tee /etc/systemd/system/print-server.service << 'EOF'
[Unit]
Description=Print Server Dashboard
After=network.target mariadb.service
Wants=mariadb.service

[Service]
Type=simple
User=sistemas
WorkingDirectory=/home/sistemas/print-track
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Crear servicio para procesador de logs
sudo tee /etc/systemd/system/log-processor.service << 'EOF'
[Unit]
Description=CUPS Log Processor
After=mariadb.service
Wants=mariadb.service

[Service]
Type=oneshot
User=sistemas
WorkingDirectory=/home/sistemas/print-track
ExecStart=/home/sistemas/print-track/venv/bin/python procesar_logs.py
StandardOutput=journal
StandardError=journal
EOF

# Crear timer para ejecución automática
sudo tee /etc/systemd/system/log-processor.timer << 'EOF'
[Unit]
Description=Run CUPS log processor every 5 minutes
Requires=log-processor.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
Unit=log-processor.service

[Install]
WantedBy=timers.target
EOF

# Habilitar y iniciar servicios
sudo systemctl daemon-reload
sudo systemctl enable print-server log-processor.timer
sudo systemctl start print-server log-processor.timer
```

### 8. Verificar Instalación
```bash
# Hacer ejecutable el script de verificación
chmod +x check_status_redhat.sh

# Ejecutar verificación completa
./check_status_redhat.sh

# Verificar servicios
sudo systemctl status print-server
sudo systemctl status log-processor.timer
```

## Uso

- **Dashboard**: http://IP-SERVIDOR:3000
- **API**: http://IP-SERVIDOR:3000/api
- **Estado**: http://IP-SERVIDOR:3000/api/health
- **CUPS**: http://IP-SERVIDOR:631
- **Admin CUPS**: http://IP-SERVIDOR:631/admin

## Monitoreo

- **Logs CUPS**: Procesamiento automático cada 5 minutos
- **Estado de impresoras**: Ping automático cada 30 segundos
- **Estadísticas**: Actualización en tiempo real
- **Servicios**: Inicio automático al arrancar el sistema

## Mantenimiento

- **Logs del servidor**: `sudo journalctl -u print-server -f`
- **Logs del procesador**: `sudo journalctl -u log-processor -f`
- **Estado de servicios**: `./check_status_redhat.sh`
- **Logs de CUPS**: `sudo journalctl -u cups -f`

## Diferencias con Ubuntu/Debian

1. **Gestor de paquetes**: `dnf` en lugar de `apt`
2. **Base de datos**: `mariadb-server` en lugar de `mysql-server`
3. **Configuración CUPS**: Logs se configuran manualmente
4. **Certificados SSL**: Pueden requerir configuración adicional
5. **Permisos**: Estructura de directorios puede variar
6. **Servicios**: Configuración específica de systemd para RHEL/AlmaLinux

## Verificación Final

```bash
# Verificar que todos los servicios estén funcionando
./check_status_redhat.sh

# Verificar conexión a base de datos
mysql -u print_user -p'Por7a*sis' -e "USE print_server_db; SELECT COUNT(*) FROM print_jobs;"

# Verificar que CUPS esté funcionando
sudo systemctl status cups

# Verificar permisos de usuario
groups sistemas
```

## Características Específicas de RHEL/AlmaLinux

- **Sistema de servicios**: systemd con dependencias correctas
- **Base de datos**: MariaDB 10.11+ con compatibilidad MySQL
- **Firewall**: firewalld con configuración específica
- **Permisos**: SELinux y grupos de usuarios estándar
- **Logs**: journald para servicios del sistema
- **Inicio automático**: Servicios configurados para arrancar con el sistema

## Interfaces

<img width="1552" height="903" alt="{C6591F5E-77EF-4936-B203-B96EE2F28C5B}" src="https://github.com/user-attachments/assets/96403dc1-41c5-4457-b132-9e60c478134d" />
<img width="1721" height="909" alt="image" src="https://github.com/user-attachments/assets/06402dcc-f152-4f32-8698-e4cdbb545ed3" />
<img width="910" height="696" alt="image" src="https://github.com/user-attachments/assets/452f6654-7e0a-43f5-a428-3f3ff3c250e6" />
<img width="1397" height="907" alt="image" src="https://github.com/user-attachments/assets/ab028c2d-8a5c-4cee-a3f4-d25d4e230ed1" />
<img width="318" height="557" alt="image" src="https://github.com/user-attachments/assets/ab0282d-8a5c-4cee-a3f4-d25d4e230ed1" />
<img width="327" height="106" alt="image" src="https://github.com/user-attachments/assets/96995083-b2e2-48e4-a1e9-5364767b39ba" />

---

**Sistema Verificado**: Red Hat Enterprise Linux 10.0 (Coughlan)  
**Versión del Software**: Print Server Dashboard v6  
**Última Actualización**: 19 de Agosto de 2025 - Configurado específicamente para RHEL/AlmaLinux




