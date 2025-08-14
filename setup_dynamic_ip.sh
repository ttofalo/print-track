#!/bin/bash

echo "=== CONFIGURACIÓN DINÁMICA DE IP ==="
echo ""

# Detectar IP del servidor
SERVER_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d'/' -f1 | head -1)

if [ -z "$SERVER_IP" ]; then
    echo "❌ No se pudo detectar la IP del servidor"
    exit 1
fi

echo "✅ IP del servidor detectada: $SERVER_IP"
echo ""

# Verificar que el servidor esté corriendo
if ! curl -s "http://$SERVER_IP:3000/api/health" > /dev/null; then
    echo "❌ El servidor no está respondiendo en http://$SERVER_IP:3000"
    echo "   Asegúrate de que el servidor esté corriendo: sudo systemctl start print-server"
    exit 1
fi

echo "✅ Servidor respondiendo correctamente"
echo ""

# Mostrar información de acceso
echo "=== INFORMACIÓN DE ACCESO ==="
echo "Dashboard: http://$SERVER_IP:3000"
echo "API Health: http://$SERVER_IP:3000/api/health"
echo ""

# Verificar datos en la base de datos
echo "=== ESTADO DE LA BASE DE DATOS ==="
TOTAL_JOBS=$(mysql -u print_user -pPor7a*sis print_server_db -e "SELECT COUNT(*) FROM print_jobs;" 2>/dev/null | tail -1)
echo "Total trabajos en BD: $TOTAL_JOBS"

if [ "$TOTAL_JOBS" -gt 0 ]; then
    echo "✅ Base de datos poblada con datos reales"
else
    echo "⚠️  Base de datos vacía - ejecuta: python procesar_logs.py --once"
fi

echo ""
echo "=== CONFIGURACIÓN COMPLETADA ==="
echo "El frontend ahora detectará automáticamente la IP del servidor."
echo "Puedes acceder al dashboard desde cualquier dispositivo en la red usando:"
echo "http://$SERVER_IP:3000" 