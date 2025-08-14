# RESUMEN DE INSTALACIÓN - PRINT SERVER

## ✅ CONFIGURACIÓN COMPLETADA

### Servicios Configurados
- **MySQL**: Base de datos funcionando
- **Print Server**: Dashboard web en puerto 3000
- **Log Processor**: Procesamiento automático cada 5 minutos
- **CUPS**: Servidor de impresión configurado

### Acceso al Dashboard
- **URL Local**: http://localhost:3000
- **URL Red**: http://[IP-SERVIDOR]:3000
- **Usuario**: sistemas
- **Contraseña**: Por7a*sis

#### Detectar IP automáticamente:
```bash
./setup_dynamic_ip.sh
```

**Nota**: El frontend detecta automáticamente la IP del servidor, por lo que funcionará sin importar en qué red esté el servidor.

### Base de Datos
- **Usuario**: print_user
- **Contraseña**: Por7a*sis
- **Base de datos**: print_server_db
- **Trabajos procesados**: 20 (datos de ejemplo)

### Logs de CUPS
- **Ubicación**: /var/log/cups/page_log
- **Formato**: Procesado automáticamente
- **Frecuencia**: Cada 5 minutos

## 🚀 INICIO AUTOMÁTICO

Todos los servicios están configurados para iniciar automáticamente cuando el servidor arranque:

```bash
# Verificar estado
sudo systemctl status print-server
sudo systemctl status log-processor.timer
sudo systemctl status mysql

# Verificar inicio automático
sudo systemctl is-enabled print-server
sudo systemctl is-enabled log-processor.timer
sudo systemctl is-enabled mysql
```

## 🔧 COMANDOS ÚTILES

### Verificar Estado Completo
```bash
./check_status.sh
```

### Ver Logs del Servidor
```bash
sudo journalctl -u print-server -f
```

### Ver Logs del Procesador
```bash
sudo journalctl -u log-processor -f
```

### Reiniciar Servicios
```bash
sudo systemctl restart print-server
sudo systemctl restart log-processor.timer
```

### Procesar Logs Manualmente
```bash
source venv/bin/activate
python procesar_logs.py
```

## 📊 MONITOREO

### Dashboard
- Estadísticas en tiempo real
- Filtros por usuario, fecha, impresora
- Ranking de usuarios más activos
- Gráficos de actividad

### API Endpoints
- `/api/stats` - Estadísticas del dashboard
- `/api/print-jobs` - Trabajos de impresión
- `/api/printers` - Lista de impresoras
- `/api/health` - Estado del servidor

## 🔒 SEGURIDAD

- Contraseña segura configurada
- Usuario específico para la base de datos
- Permisos de archivos configurados
- Firewall configurado (inactivo para red interna)

## 📝 NOTAS IMPORTANTES

1. **IP Dinámica**: La IP puede cambiar al reiniciar la máquina virtual
2. **Verificación**: Usar `./check_status.sh` para verificar el estado
3. **Logs**: Los logs de CUPS se procesan automáticamente
4. **Backup**: Considerar hacer backup de la base de datos regularmente

## 🆘 SOLUCIÓN DE PROBLEMAS

### Si el dashboard no carga:
1. Verificar que el servidor esté corriendo: `sudo systemctl status print-server`
2. Verificar la IP: `ip addr show`
3. Verificar el puerto: `ss -tlnp | grep :3000`

### Si no se procesan logs:
1. Verificar CUPS: `sudo systemctl status cups`
2. Verificar permisos: `ls -la /var/log/cups/`
3. Verificar el timer: `sudo systemctl status log-processor.timer`

### Si hay problemas de base de datos:
1. Verificar MySQL: `sudo systemctl status mysql`
2. Probar conexión: `mysql -u print_user -pPor7a*sis -e "SELECT 1;"` 