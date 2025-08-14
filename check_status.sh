#!/bin/bash

echo "=== PRINT SERVER STATUS CHECK ==="
echo "Fecha: $(date)"
echo ""

# Obtener IP del servidor
IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d'/' -f1 | head -1)
echo "IP del servidor: $IP"
echo ""

# Verificar servicios
echo "=== ESTADO DE SERVICIOS ==="
echo "MySQL: $(systemctl is-active mysql)"
echo "Print Server: $(systemctl is-active print-server)"
echo "Log Processor Timer: $(systemctl is-active log-processor.timer)"
echo ""

# Verificar puertos
echo "=== PUERTOS ABIERTOS ==="
echo "Puerto 3000 (Dashboard): $(ss -tlnp | grep :3000 | wc -l) procesos"
echo ""

# Verificar base de datos
echo "=== BASE DE DATOS ==="
echo "Conexión: $(mysql -u print_user -pPor7a*sis -e "SELECT 1;" 2>/dev/null && echo "OK" || echo "ERROR")"
echo "Total trabajos: $(mysql -u print_user -pPor7a*sis print_server_db -e "SELECT COUNT(*) FROM print_jobs;" 2>/dev/null | tail -1)"
echo ""

# Verificar API
echo "=== API STATUS ==="
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "API: OK"
    echo "Dashboard disponible en: http://$IP:3000"
else
    echo "API: ERROR"
fi
echo ""

# Verificar logs de CUPS
echo "=== LOGS CUPS ==="
if [ -f "/var/log/cups/page_log" ]; then
    echo "Log file: OK"
    echo "Últimas líneas del log:"
    tail -3 /var/log/cups/page_log 2>/dev/null || echo "Log vacío o sin permisos"
else
    echo "Log file: NO ENCONTRADO"
fi
echo ""

echo "=== FIN DE VERIFICACIÓN ===" 