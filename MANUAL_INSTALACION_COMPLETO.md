# MANUAL DE INSTALACIÓN - PRINT SERVER DASHBOARD
## Guía Completa de Implementación

---

### 📋 INFORMACIÓN DEL PROYECTO

**Nombre**: Print Server Dashboard  
**Versión**: 1.0.0  
**Descripción**: Sistema de monitoreo de impresiones en tiempo real con dashboard web  
**Tecnologías**: Node.js, Python, MySQL, CUPS  
**Autor**: Porta Hermanos  

---

## 🎯 OBJETIVO

Este manual proporciona las instrucciones detalladas para implementar el Print Server Dashboard en un servidor Linux Ubuntu desde cero, incluyendo todas las dependencias, configuraciones y verificaciones necesarias.

---

## 📋 PREREQUISITOS

### Sistema Operativo
- **Ubuntu Server 22.04 LTS** (recomendado)
- **Ubuntu Desktop 22.04 LTS** (alternativo)
- Mínimo 2GB RAM
- 10GB espacio libre en disco

### Acceso Requerido
- Acceso root o sudo
- Conexión a internet para descargar dependencias
- Acceso a la red local donde estará el servidor

---

## 🚀 PASO 1: PREPARACIÓN DEL SISTEMA

### 1.1 Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instalar herramientas básicas
```bash
sudo apt install -y curl wget git unzip
```

### 1.3 Verificar la IP del servidor
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```
**Nota**: Anota la IP que aparece (ej: 192.168.1.100) - la necesitarás más adelante.

---

## 🐍 PASO 2: INSTALACIÓN DE PYTHON

### 2.1 Instalar Python 3 y pip
```bash
sudo apt install -y python3 python3-pip python3-venv
```

### 2.2 Verificar la instalación
```bash
python3 --version
pip3 --version
```

**Resultado esperado**: Python 3.x.x y pip versión correspondiente

---

## 🟢 PASO 3: INSTALACIÓN DE NODE.JS

### 3.1 Agregar el repositorio de NodeSource
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

### 3.2 Instalar Node.js
```bash
sudo apt install -y nodejs
```

### 3.3 Verificar la instalación
```bash
node --version
npm --version
```

**Resultado esperado**: Node.js 18.x.x y npm versión correspondiente

---

## 🗄️ PASO 4: INSTALACIÓN DE MYSQL

### 4.1 Instalar MySQL Server
```bash
sudo apt install -y mysql-server
```

### 4.2 Configurar seguridad de MySQL
```bash
sudo mysql_secure_installation
```

**Durante la configuración:**
- ¿Configurar VALIDATE PASSWORD component? → **Y**
- Nivel de contraseña → **1** (MEDIUM)
- Nueva contraseña root → **Anota esta contraseña**
- ¿Remover usuarios anónimos? → **Y**
- ¿Deshabilitar login root remoto? → **Y**
- ¿Remover test database? → **Y**
- ¿Recargar privilege tables? → **Y**

### 4.3 Verificar que MySQL esté corriendo
```bash
sudo systemctl status mysql
```

**Resultado esperado**: `Active: active (running)`

---

## 🖨️ PASO 5: INSTALACIÓN Y CONFIGURACIÓN DE CUPS

### 5.1 Instalar CUPS
```bash
sudo apt install -y cups cups-client
```

### 5.2 Configurar CUPS para logging
```bash
sudo mkdir -p /var/log/cups
sudo chown root:lp /var/log/cups
sudo chmod 755 /var/log/cups
```

### 5.3 Configurar CUPS para permitir acceso web
```bash
sudo usermod -a -G lp $USER
sudo cupsctl --share-printers
```

### 5.4 Reiniciar CUPS
```bash
sudo systemctl restart cups
sudo systemctl enable cups
```

### 5.5 Verificar que CUPS esté corriendo
```bash
sudo systemctl status cups
```

**Resultado esperado**: `Active: active (running)`

---

## 📁 PASO 6: PREPARACIÓN DEL PROYECTO

### 6.1 Crear directorio del proyecto
```bash
sudo mkdir -p /home/sistemas/print_server
sudo chown sistemas:sistemas /home/sistemas/print_server
cd /home/sistemas/print_server
```

### 6.2 Extraer el archivo del proyecto
```bash
# Si tienes el archivo ZIP:
unzip print_server_dashboard.zip

# O si tienes los archivos en una carpeta:
# Copiar todos los archivos del proyecto a /home/sistemas/print_server/
```

### 6.3 Verificar estructura del proyecto
```bash
ls -la
```

**Archivos que deben estar presentes:**
- `server.js`
- `package.json`
- `procesar_logs.py`
- `index.html`
- `login.html`
- `script.js`
- `style.css`
- `database_setup.sql`
- `print-server.service`
- `log-processor.service`
- `log-processor.timer`

---

## 🗄️ PASO 7: CONFIGURACIÓN DE LA BASE DE DATOS

### 7.1 Acceder a MySQL como root
```bash
sudo mysql -u root -p
```

### 7.2 Crear la base de datos y usuario
```sql
CREATE DATABASE print_server_db;
CREATE USER 'print_user'@'localhost' IDENTIFIED BY 'Por7a*sis';
GRANT ALL PRIVILEGES ON print_server_db.* TO 'print_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 7.3 Ejecutar el script de configuración de la base de datos
```bash
mysql -u print_user -pPor7a*sis print_server_db < database_setup.sql
```

### 7.4 Verificar que las tablas se crearon
```bash
mysql -u print_user -pPor7a*sis print_server_db -e "SHOW TABLES;"
```

**Resultado esperado**: Lista de tablas incluyendo `print_jobs`, `printers`, etc.

---

## 🐍 PASO 8: CONFIGURACIÓN DE PYTHON

### 8.1 Crear entorno virtual
```bash
cd /home/sistemas/print_server
python3 -m venv venv
```

### 8.2 Activar el entorno virtual
```bash
source venv/bin/activate
```

### 8.3 Instalar dependencias de Python
```bash
pip install pymysql
```

### 8.4 Verificar la instalación
```bash
python -c "import pymysql; print('PyMySQL instalado correctamente')"
```

---

## 🟢 PASO 9: CONFIGURACIÓN DE NODE.JS

### 9.1 Instalar dependencias de Node.js
```bash
cd /home/sistemas/print_server
npm install
```

### 9.2 Verificar la instalación
```bash
node -e "console.log('Node.js funcionando correctamente')"
```

---

## ⚙️ PASO 10: CONFIGURACIÓN DE SERVICIOS SYSTEMD

### 10.1 Copiar archivos de servicio
```bash
sudo cp print-server.service /etc/systemd/system/
sudo cp log-processor.service /etc/systemd/system/
sudo cp log-processor.timer /etc/systemd/system/
```

### 10.2 Recargar configuración de systemd
```bash
sudo systemctl daemon-reload
```

### 10.3 Habilitar servicios para inicio automático
```bash
sudo systemctl enable print-server
sudo systemctl enable log-processor.timer
```

---

## 🔧 PASO 11: CONFIGURACIÓN DE IP DINÁMICA

### 11.1 Obtener la IP actual del servidor
```bash
SERVER_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d'/' -f1 | head -1)
echo "IP del servidor: $SERVER_IP"
```

### 11.2 Actualizar la IP en el HTML
```bash
sed -i "s/<meta name=\"server-ip\" content=\"[^\"]*\"/<meta name=\"server-ip\" content=\"$SERVER_IP\"/" index.html
```

### 11.3 Actualizar la IP en el JavaScript
```bash
sed -i "s|this.baseURL = 'http://[^']*'|this.baseURL = 'http://$SERVER_IP:3000/api'|" script.js
```

---

## 🚀 PASO 12: INICIO DE SERVICIOS

### 12.1 Iniciar el servidor web
```bash
sudo systemctl start print-server
```

### 12.2 Verificar que el servidor esté corriendo
```bash
sudo systemctl status print-server
```

**Resultado esperado**: `Active: active (running)`

### 12.3 Iniciar el procesador de logs
```bash
sudo systemctl start log-processor.timer
```

### 12.4 Verificar que el timer esté activo
```bash
sudo systemctl status log-processor.timer
```

**Resultado esperado**: `Active: active (waiting)`

---

## 📊 PASO 13: PROCESAMIENTO INICIAL DE LOGS

### 13.1 Procesar logs existentes de CUPS
```bash
cd /home/sistemas/print_server
source venv/bin/activate
python procesar_logs.py --once
```

### 13.2 Verificar que se procesaron datos
```bash
mysql -u print_user -pPor7a*sis print_server_db -e "SELECT COUNT(*) as total_trabajos FROM print_jobs;"
```

**Resultado esperado**: Número mayor a 0 (dependiendo de los logs existentes)

---

## 🔒 PASO 14: CONFIGURACIÓN DE FIREWALL (OPCIONAL)

### 14.1 Habilitar UFW
```bash
sudo ufw enable
```

### 14.2 Permitir SSH
```bash
sudo ufw allow ssh
```

### 14.3 Permitir puerto del dashboard
```bash
sudo ufw allow 3000/tcp
```

### 14.4 Verificar estado del firewall
```bash
sudo ufw status
```

---

## ✅ PASO 15: VERIFICACIÓN FINAL

### 15.1 Verificar que todos los servicios estén corriendo
```bash
sudo systemctl status mysql
sudo systemctl status cups
sudo systemctl status print-server
sudo systemctl status log-processor.timer
```

### 15.2 Verificar que el servidor esté escuchando
```bash
ss -tlnp | grep :3000
```

**Resultado esperado**: `LISTEN 0 511 0.0.0.0:3000`

### 15.3 Probar la API
```bash
curl -s "http://localhost:3000/api/health" | python3 -m json.tool
```

**Resultado esperado**: JSON con `"status": "ok"`

### 15.4 Probar la API desde la IP del servidor
```bash
SERVER_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d'/' -f1 | head -1)
curl -s "http://$SERVER_IP:3000/api/print-jobs" | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'Total trabajos: {len(data)}')"
```

**Resultado esperado**: Número de trabajos mayor a 0

---

## 🌐 PASO 16: ACCESO AL DASHBOARD

### 16.1 Obtener la URL de acceso
```bash
SERVER_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d'/' -f1 | head -1)
echo "Dashboard disponible en: http://$SERVER_IP:3000"
```

### 16.2 Credenciales de acceso
- **URL**: `http://[IP-DEL-SERVIDOR]:3000`
- **Usuario**: `sistemas`
- **Contraseña**: `Por7a*sis`

### 16.3 Verificar acceso
1. Abrir navegador web
2. Ir a la URL del dashboard
3. Iniciar sesión con las credenciales
4. Verificar que se muestren los datos

---

## 🔧 COMANDOS ÚTILES PARA MANTENIMIENTO

### Verificar estado completo del sistema
```bash
./check_status.sh
```

### Ver logs del servidor web
```bash
sudo journalctl -u print-server -f
```

### Ver logs del procesador
```bash
sudo journalctl -u log-processor -f
```

### Reiniciar servicios
```bash
sudo systemctl restart print-server
sudo systemctl restart log-processor.timer
```

### Procesar logs manualmente
```bash
cd /home/sistemas/print_server
source venv/bin/activate
python procesar_logs.py --once
```

### Verificar base de datos
```bash
mysql -u print_user -pPor7a*sis print_server_db -e "SELECT COUNT(*) FROM print_jobs;"
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Problema: El dashboard no carga
**Solución:**
1. Verificar que el servidor esté corriendo: `sudo systemctl status print-server`
2. Verificar la IP: `ip addr show`
3. Verificar el puerto: `ss -tlnp | grep :3000`
4. Verificar firewall: `sudo ufw status`

### Problema: No se procesan logs
**Solución:**
1. Verificar CUPS: `sudo systemctl status cups`
2. Verificar archivo de log: `ls -la /var/log/cups/page_log`
3. Verificar permisos: `sudo chown root:lp /var/log/cups`
4. Procesar manualmente: `python procesar_logs.py --once`

### Problema: Error de base de datos
**Solución:**
1. Verificar MySQL: `sudo systemctl status mysql`
2. Verificar conexión: `mysql -u print_user -pPor7a*sis -e "SELECT 1;"`
3. Verificar tablas: `mysql -u print_user -pPor7a*sis print_server_db -e "SHOW TABLES;"`

### Problema: IP cambió
**Solución:**
1. Ejecutar: `./update_server_ip.sh`
2. O actualizar manualmente en `index.html` y `script.js`

---

## 📝 NOTAS IMPORTANTES

1. **Seguridad**: Cambiar las contraseñas por defecto en producción
2. **Backup**: Hacer backup regular de la base de datos
3. **Monitoreo**: Verificar logs regularmente
4. **Actualizaciones**: Mantener el sistema actualizado
5. **Red**: Asegurar que el puerto 3000 esté accesible desde la red

---

## 📞 SOPORTE

Para problemas técnicos o consultas:
- Revisar logs del sistema
- Verificar estado de servicios
- Consultar este manual
- Contactar al equipo de desarrollo

---

**Versión del manual**: 1.0  
**Fecha de actualización**: Agosto 2025  
**Compatible con**: Print Server Dashboard v1.0.0 