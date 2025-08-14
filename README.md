# Print Server Dashboard

Sistema de monitoreo de impresiones para servidores CUPS con interfaz web moderna y base de datos MySQL.

## Características

- 📊 Dashboard en tiempo real con estadísticas de impresiones
- 🔐 Sistema de autenticación seguro
- 📈 Gráficos históricos de actividad
- 🔍 Filtros avanzados para trabajos de impresión
- 👥 Ranking de usuarios más activos
- 🖨️ Monitoreo de impresoras
- 📱 Diseño responsive y moderno
- 🎨 Interfaz corporativa con colores personalizables
- ⚡ Monitoreo automático cada 10 minutos

## Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (HTML/CSS/JS) │◄──►│   (Node.js)     │◄──►│   (MySQL)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              ▲
                              │
                       ┌─────────────────┐
                       │   Python        │
                       │   (Log Parser)  │
                       └─────────────────┘
```

## Estructura del Proyecto

```
print_server/
├── index.html              # Dashboard principal
├── login.html              # Página de login
├── style.css               # Estilos CSS
├── script.js               # JavaScript del frontend
├── server.js               # Servidor Node.js
├── procesar_logs.py        # Procesador de logs CUPS
├── auto_monitor.py         # Monitoreo automático (Windows)
├── start_monitor.bat       # Script batch para Windows
├── start_monitor.ps1       # Script PowerShell para Windows
├── database_setup.sql      # Script de base de datos
├── package.json            # Dependencias Node.js
├── nginx.conf              # Configuración Nginx
├── print-server.service    # Servicio systemd
├── log-processor.service   # Servicio procesador
├── log-processor.timer     # Timer para ejecución automática
├── porta_hnos.png          # Logo de la empresa
├── porta_icon.png          # Icono del sitio
└── README.md               # Este archivo
```

## Instalación

### Prerrequisitos

- **Sistema Operativo**: Linux (Ubuntu/Debian recomendado) o Windows
- **Python**: 3.8 o superior
- **Node.js**: 16 o superior
- **MySQL**: 8.0 o superior
- **Nginx**: (opcional, para proxy reverso)

---

## 🐧 INSTALACIÓN EN LINUX (PRODUCCIÓN)

### 1. Actualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Dependencias del Sistema
```bash
# Instalar Python, Node.js, MySQL y herramientas
sudo apt install python3 python3-pip nodejs npm mysql-server mysql-client git curl wget -y

# Verificar versiones
python3 --version
node --version
npm --version
mysql --version
```

### 3. Configurar MySQL
```bash
# Configurar MySQL de forma segura
sudo mysql_secure_installation

# Crear base de datos y usuario
sudo mysql -u root -p
```

```sql
CREATE DATABASE print_server_db;
CREATE USER 'print_user'@'localhost' IDENTIFIED BY 'Por7a*sis';
GRANT ALL PRIVILEGES ON print_server_db.* TO 'print_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Transferir Proyecto
```bash
# Opción 1: Usar SCP desde Windows
scp -r C:\xampp\htdocs\print_server sistemas@ip-servidor:/home/sistemas/

# Opción 2: Usar WinSCP o similar
# Copiar toda la carpeta print_server al servidor

# Opción 3: Usar Git
git clone <url-del-repositorio>
cd print_server
```

### 5. Instalar Dependencias Python
```bash
cd /ruta/a/print_server

# Opción 1: Entorno virtual (Recomendada)
python3 -m venv venv
source venv/bin/activate
pip install mysql-connector-python

# Opción 2: Usar pipx
sudo apt install pipx
pipx install mysql-connector-python

# Opción 3: Instalar directamente (no recomendado)
pip3 install mysql-connector-python --break-system-packages

# Opción 4: Buscar paquetes alternativos
apt search mysql-connector
sudo apt install python3-pymysql  # Alternativa

# Verificar instalación
python3 -c "import pymysql; print('PyMySQL instalado correctamente')"
```

### 6. Instalar Dependencias Node.js
```bash
npm install

# Verificar instalación
npm list
```

### 7. Configurar Base de Datos
```bash
# Ejecutar script de configuración
mysql -u print_user -pPor7a*sis print_server_db < database_setup.sql

# Verificar tablas creadas
mysql -u print_user -pPor7a*sis print_server_db -e "SHOW TABLES;"
```

### 8. Configurar Servicios Systemd
```bash
# Copiar archivos de servicio
sudo cp print-server.service /etc/systemd/system/
sudo cp log-processor.service /etc/systemd/system/
sudo cp log-processor.timer /etc/systemd/system/

# Recargar systemd
sudo systemctl daemon-reload

# Habilitar y iniciar servicios
sudo systemctl enable print-server
sudo systemctl enable log-processor.timer
sudo systemctl start print-server
sudo systemctl start log-processor.timer

# Verificar estado
sudo systemctl status print-server
sudo systemctl status log-processor.timer
```

### 9. Configurar Nginx (Recomendado para Producción)
```bash
sudo apt install nginx -y
sudo cp nginx.conf /etc/nginx/sites-available/print-server
sudo ln -s /etc/nginx/sites-available/print-server /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remover sitio por defecto
sudo systemctl restart nginx

# Verificar configuración
sudo nginx -t
sudo systemctl status nginx
```

### 10. Configurar Firewall
```bash
# Permitir puertos necesarios
sudo ufw allow ssh
sudo ufw allow 3000/tcp  # Puerto del dashboard
sudo ufw allow 80/tcp     # HTTP (si usas Nginx)
sudo ufw allow 443/tcp    # HTTPS (si usas SSL)
sudo ufw enable

# Verificar estado
sudo ufw status
```

### 11. Configurar Logs CUPS (Opcional)
```bash
# Verificar ubicación de logs CUPS
ls -la /var/log/cups/

# Configurar permisos si es necesario
sudo chmod 644 /var/log/cups/page_log
sudo usermod -a -G lp www-data

# Editar procesar_logs.py para usar logs reales
sudo nano procesar_logs.py
# Cambiar: LOG_FILE = "/var/log/cups/page_log"
```

---

## 🪟 INSTALACIÓN EN WINDOWS (DESARROLLO)

### 1. Instalar XAMPP
- Descargar e instalar XAMPP desde https://www.apachefriends.org/
- Iniciar Apache y MySQL desde el panel de control

### 2. Instalar Python
- Descargar Python desde https://www.python.org/
- **IMPORTANTE**: Marcar "Add to PATH" durante la instalación
- Verificar instalación: `python --version`

### 3. Instalar Node.js
- Descargar Node.js desde https://nodejs.org/
- Instalar con configuración por defecto
- Verificar instalación: `node --version` y `npm --version`

### 4. Configurar Proyecto
```bash
cd C:\xampp\htdocs\print_server
pip install mysql-connector-python
npm install
```

### 5. Configurar Base de Datos
- Abrir phpMyAdmin: http://localhost/phpmyadmin
- Crear base de datos `print_server_db`
- Ejecutar `database_setup.sql`

### 6. Iniciar Servidor
```bash
npm start
```

### 7. Monitoreo Automático (Windows)
```bash
# Opción 1: Python
py auto_monitor.py

# Opción 2: Batch
start_monitor.bat

# Opción 3: PowerShell
powershell -ExecutionPolicy Bypass -File start_monitor.ps1
```

---

## 🚀 USO Y CONFIGURACIÓN

### Acceso al Dashboard
- **URL**: http://localhost:3000 (desarrollo) o http://ip-servidor (producción)
- **Usuario**: sistemas
- **Contraseña**: Por7a*sis

### Monitoreo Automático

#### En Linux (Automático)
El sistema procesa automáticamente los logs cada 10 minutos usando systemd timer.

#### En Windows (Manual)
```bash
# Ejecutar monitoreo continuo
py auto_monitor.py

# O usar el script batch
start_monitor.bat
```

### Verificar Estado de Servicios (Linux)
```bash
# Estado del servidor web
sudo systemctl status print-server

# Estado del procesador de logs
sudo systemctl status log-processor.timer

# Ver logs del sistema
sudo journalctl -u print-server -f
sudo journalctl -u log-processor -f

# Ver próximas ejecuciones del timer
sudo systemctl list-timers log-processor.timer
```

### Monitoreo Manual
```bash
# Procesar logs una vez
python3 procesar_logs.py

# Ejecutar monitoreo continuo
python3 auto_monitor.py
```

### Configuración de Logs CUPS
El sistema lee logs desde `test_log.txt`. Para configurar logs reales de CUPS:

1. **Ubicación típica de logs CUPS**:
   ```bash
   /var/log/cups/page_log
   /var/log/cups/access_log
   ```

2. **Configurar procesar_logs.py**:
   ```python
   LOG_FILE = "/var/log/cups/page_log"  # Cambiar ruta
   ```

3. **Permisos de lectura**:
   ```bash
   sudo chmod 644 /var/log/cups/page_log
   sudo usermod -a -G lp www-data  # Si es necesario
   ```

---

## 🔧 CONFIGURACIÓN AVANZADA

### Variables de Entorno
Crear archivo `.env` en el directorio raíz:

```env
DB_HOST=localhost
DB_USER=print_user
DB_PASSWORD=Por7a*sis
DB_NAME=print_server_db
PORT=3000
LOG_FILE=/var/log/cups/page_log
```

### Personalización
- **Colores**: Editar variables CSS en `style.css`
- **Credenciales**: Modificar en `login.html`
- **Intervalo de monitoreo**: Cambiar en `log-processor.timer`

### Configuración de Nginx
El archivo `nginx.conf` incluye:
- Proxy reverso al puerto 3000
- Configuración de seguridad
- Headers optimizados
- Logs personalizados

---

## 🛠️ MANTENIMIENTO

### Actualizaciones
```bash
# Actualizar código
git pull origin main

# Reiniciar servicios
sudo systemctl restart print-server
sudo systemctl restart log-processor.timer
```

### Backups
```bash
# Backup de base de datos
mysqldump -u print_user -pPor7a*sis print_server_db > backup_$(date +%Y%m%d).sql

# Backup de configuración
tar -czf config_backup_$(date +%Y%m%d).tar.gz *.service *.timer nginx.conf
```

### Logs
```bash
# Ver logs del servidor
sudo journalctl -u print-server -f

# Ver logs del procesador
sudo journalctl -u log-processor -f

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Ver logs del monitoreo (Windows)
type monitor.log
```

---

## 🔍 SOLUCIÓN DE PROBLEMAS

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos
```bash
# Verificar estado de MySQL
sudo systemctl status mysql

# Verificar credenciales
mysql -u print_user -pPor7a*sis -e "SELECT 1;"

# Verificar configuración en server.js
nano server.js
```

#### 2. Servidor No Inicia
```bash
# Verificar logs
sudo journalctl -u print-server -n 50

# Verificar puerto
sudo netstat -tlnp | grep :3000

# Verificar dependencias
npm list
```

#### 3. Logs No Se Procesan
```bash
# Verificar permisos de archivo
ls -la /var/log/cups/page_log

# Verificar estado del timer
sudo systemctl status log-processor.timer

# Verificar Python y dependencias
python3 -c "import mysql.connector"
```

#### 4. Dashboard No Carga
```bash
# Verificar firewall
sudo ufw status

# Verificar Nginx (si se usa)
sudo systemctl status nginx

# Verificar DNS/hosts
nslookup tu-dominio.com
```

#### 5. Monitoreo No Funciona (Windows)
```bash
# Verificar Python en PATH
python --version

# Verificar archivo de logs
dir test_log.txt

# Ejecutar manualmente
py procesar_logs.py
```

### Comandos Útiles
```bash
# Reiniciar todos los servicios
sudo systemctl restart print-server log-processor.timer nginx

# Ver uso de recursos
htop
df -h
free -h

# Ver procesos
ps aux | grep -E "(node|python)" | grep -v grep

# Verificar puertos
sudo netstat -tlnp | grep -E "(3000|80|443)"
```

---

## 🔒 SEGURIDAD

### Recomendaciones
1. **Cambiar contraseñas por defecto**
   ```sql
   ALTER USER 'print_user'@'localhost' IDENTIFIED BY 'nueva-contraseña-fuerte';
   ```

2. **Configurar firewall**
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 3000/tcp
   sudo ufw enable
   ```

3. **Usar HTTPS en producción**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d tu-dominio.com
   ```

4. **Mantener sistema actualizado**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

5. **Revisar logs regularmente**
   ```bash
   sudo journalctl -u print-server --since "1 hour ago"
   ```

### Configuración de Firewall
```bash
# Configurar UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 3000/tcp
sudo ufw enable

# Verificar estado
sudo ufw status verbose
```

---

## 📊 MONITOREO Y MÉTRICAS

### Métricas del Sistema
```bash
# Uso de CPU y memoria
htop

# Uso de disco
df -h

# Uso de red
iftop

# Logs del sistema
sudo journalctl -f
```

### Métricas de la Aplicación
- **Dashboard**: http://ip-servidor:3000
- **API Health**: http://ip-servidor:3000/api/health
- **Logs de aplicación**: `monitor.log`

---

## 🤝 CONTRIBUCIÓN

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

## 📄 LICENCIA

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 🆘 SOPORTE

Para soporte técnico o preguntas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo
- Revisar la documentación en línea
- Verificar logs del sistema

### Información de Contacto
- **Desarrollador**: Equipo de Sistemas
- **Empresa**: Porta Hermanos
- **Versión**: 1.0.0 