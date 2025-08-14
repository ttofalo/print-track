# Cambios de Configuración de IP del Servidor

## Resumen
Se han actualizado todas las configuraciones de IP del proyecto para cambiar de la IP anterior (10.10.4.88) a la nueva IP del servidor (10.10.3.171).

## Archivos Modificados

### 1. **test_api.html**
- **Cambio**: URL de la API de `http://10.10.4.88:3000/api/print-jobs` a `http://10.10.3.171:3000/api/print-jobs`
- **Propósito**: Archivo de prueba para verificar la conectividad de la API

### 2. **script.js**
- **Cambio**: URL base de la API de `http://10.10.4.88:3000/api` a `http://10.10.3.171:3000/api`
- **Propósito**: Configuración principal de la URL base para todas las llamadas API del frontend

### 3. **server.js**
- **Cambio**: Mensajes de consola actualizados para mostrar la nueva IP
- **Propósito**: Información de depuración y estado del servidor

### 4. **index.html**
- **Cambio**: Meta tag `server-ip` actualizado de `10.10.4.88` a `10.10.3.171`
- **Propósito**: Metadata para el frontend

### 5. **procesar_logs.py**
- **Cambio**: IP por defecto actualizada de `10.10.4.88` a `10.10.3.171`
- **Propósito**: IP de respaldo para el procesamiento de logs

### 6. **database_setup.sql**
- **Cambio**: IPs de ejemplo de impresoras actualizadas del rango `10.10.4.110-114` al rango `10.10.3.110-114`
- **Propósito**: Datos de ejemplo para la base de datos

### 7. **server-monitoring.js**
- **Cambio**: IPs de ejemplo de impresoras actualizadas del rango `10.10.4.100-111` al rango `10.10.3.100-111`
- **Propósito**: Configuración de monitoreo de impresoras

## Archivos Creados

### 1. **verificar_configuracion_ip.sh**
- **Propósito**: Script para verificar que todas las configuraciones de IP estén correctas
- **Uso**: `./verificar_configuracion_ip.sh`

### 2. **CAMBIOS_IP_SERVIDOR.md** (este archivo)
- **Propósito**: Documentación de todos los cambios realizados

## URLs Actualizadas

### Dashboard
- **Anterior**: http://10.10.4.88:3000
- **Nueva**: http://10.10.3.171:3000

### API
- **Anterior**: http://10.10.4.88:3000/api
- **Nueva**: http://10.10.3.171:3000/api

### Estado del Servidor
- **Anterior**: http://10.10.4.88:3000/api/health
- **Nueva**: http://10.10.3.171:3000/api/health

## Verificación

Para verificar que todos los cambios se han aplicado correctamente, ejecutar:

```bash
./verificar_configuracion_ip.sh
```

## Notas Importantes

1. **Base de datos**: Las IPs de ejemplo en `database_setup.sql` y `server-monitoring.js` han sido actualizadas para usar el rango 10.10.3.x
2. **Configuración dinámica**: Los scripts `setup_dynamic_ip.sh` y `update_server_ip.sh` detectan automáticamente la IP del servidor
3. **Servicios**: Los archivos de servicio (`print-server.service`, `log-processor.service`) no requieren cambios ya que usan configuraciones locales
4. **Nginx**: La configuración de nginx (`nginx.conf`) usa `localhost` internamente, por lo que no requiere cambios

## Próximos Pasos

1. Reiniciar el servidor si está ejecutándose
2. Verificar la conectividad desde otros equipos de la red
3. Actualizar cualquier documentación externa que haga referencia a la IP anterior
4. Probar todas las funcionalidades del dashboard

---
**Fecha de actualización**: $(date)
**IP anterior**: 10.10.4.88
**IP nueva**: 10.10.3.171 