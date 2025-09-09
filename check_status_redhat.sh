#!/bin/bash

echo "=========================================="
echo "  VERIFICACIÓN DE INSTALACIÓN - RED HAT"
echo "=========================================="
echo ""

# Colores para el output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' 

# Función para mostrar estado
show_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

echo "1. VERIFICANDO SISTEMA OPERATIVO..."
echo "----------------------------------------"
if [ -f /etc/redhat-release ]; then
    cat /etc/redhat-release
    show_status 0 "Sistema Red Hat detectado"
else
    show_status 1 "No se detectó sistema Red Hat"
fi
echo ""

echo "2. VERIFICANDO DEPENDENCIAS DEL SISTEMA..."
echo "----------------------------------------"
# Python
if command -v python3 &> /dev/null; then
    echo "Python3: $(python3 --version)"
    show_status 0 "Python3 instalado"
else
    show_status 1 "Python3 no encontrado"
fi

# Node.js
if command -v node &> /dev/null; then
    echo "Node.js: $(node --version)"
    show_status 0 "Node.js instalado"
else
    show_status 1 "Node.js no encontrado"
fi

# npm
if command -v npm &> /dev/null; then
    echo "npm: $(npm --version)"
    show_status 0 "npm instalado"
else
    show_status 1 "npm no encontrado"
fi

# MariaDB
if command -v mysql &> /dev/null; then
    echo "MariaDB: $(mysql --version)"
    show_status 0 "MariaDB instalado"
else
    show_status 1 "MariaDB no encontrado"
fi

# CUPS
if command -v cups-config &> /dev/null || systemctl is-active --quiet cups; then
    echo "CUPS: Instalado y funcionando"
    show_status 0 "CUPS instalado"
else
    show_status 1 "CUPS no encontrado o no funcionando"
fi
echo ""

echo "3. VERIFICANDO SERVICIOS DEL SISTEMA..."
echo "----------------------------------------"
# MariaDB
if systemctl is-active --quiet mariadb; then
    show_status 0 "MariaDB ejecutándose"
else
    show_status 1 "MariaDB no ejecutándose"
fi

# CUPS
if systemctl is-active --quiet cups; then
    show_status 0 "CUPS ejecutándose"
else
    show_status 1 "CUPS no ejecutándose"
fi
echo ""

echo "4. VERIFICANDO BASE DE DATOS..."
echo "----------------------------------------"
if mysql -u print_user -p'Por7a*sis' -e "USE print_server_db; SHOW TABLES;" &> /dev/null; then
    show_status 0 "Conexión a base de datos exitosa"
    echo "Tablas encontradas:"
    mysql -u print_user -p'Por7a*sis' -e "USE print_server_db; SHOW TABLES;" 2>/dev/null | grep -v "Tables_in"
else
    show_status 1 "Error de conexión a base de datos"
fi
echo ""

echo "5. VERIFICANDO ENTORNO VIRTUAL PYTHON..."
echo "----------------------------------------"
if [ -d "venv" ] && [ -f "venv/bin/activate" ]; then
    show_status 0 "Entorno virtual Python encontrado"
    
    # Verificar dependencias Python
    source venv/bin/activate
    if python -c "import pymysql, cryptography" &> /dev/null; then
        show_status 0 "Dependencias Python instaladas"
    else
        show_status 1 "Faltan dependencias Python"
    fi
    deactivate
else
    show_status 1 "Entorno virtual Python no encontrado"
fi
echo ""

echo "6. VERIFICANDO DEPENDENCIAS NODE.JS..."
echo "----------------------------------------"
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    show_status 0 "Dependencias Node.js instaladas"
else
    show_status 1 "Dependencias Node.js no instaladas"
fi
echo ""

echo "7. VERIFICANDO PERMISOS CUPS..."
echo "----------------------------------------"
if groups sistemas | grep -q lp; then
    show_status 0 "Usuario en grupo lp"
else
    show_status 1 "Usuario no está en grupo lp"
fi

if [ -r "/var/spool/cups" ]; then
    show_status 0 "Permisos de lectura en /var/spool/cups"
else
    show_status 1 "Sin permisos de lectura en /var/spool/cups"
fi
echo ""

echo "8. VERIFICANDO CONFIGURACIÓN CUPS..."
echo "----------------------------------------"
if sudo grep -q "LogLevel info" /etc/cups/cupsd.conf; then
    show_status 0 "CUPS configurado para logs detallados"
else
    show_status 1 "CUPS no configurado para logs detallados"
fi
echo ""

echo "9. VERIFICANDO SCRIPTS PYTHON..."
echo "----------------------------------------"
if [ -f "procesar_logs.py" ]; then
    show_status 0 "Script procesar_logs.py encontrado"
    
    # Probar script
    source venv/bin/activate
    if python procesar_logs.py --once &> /dev/null; then
        show_status 0 "Script procesar_logs.py funciona"
    else
        show_status 1 "Script procesar_logs.py falla"
    fi
    deactivate
else
    show_status 1 "Script procesar_logs.py no encontrado"
fi
echo ""

echo "10. VERIFICANDO SERVIDOR NODE.JS..."
echo "----------------------------------------"
# Iniciar servidor en background
node server.js > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3

# Verificar si está funcionando
if curl -s http://localhost:3000/api/health &> /dev/null; then
    show_status 0 "Servidor Node.js funcionando"
    echo "API Health: $(curl -s http://localhost:3000/api/health)"
else
    show_status 1 "Servidor Node.js no responde"
fi

# Detener servidor
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo ""

echo "=========================================="
echo "  RESUMEN DE VERIFICACIÓN"
echo "=========================================="
echo ""

# Contar errores
ERRORS=$(grep -c "✗" <<< "$(cat $0 | bash 2>/dev/null)")

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}¡INSTALACIÓN COMPLETADA EXITOSAMENTE!${NC}"
    echo "Todos los componentes están funcionando correctamente."
    echo ""
    echo "Próximos pasos:"
    echo "1. Configurar servicios del sistema (opcional)"
    echo "2. Configurar firewall si es necesario"
    echo "3. Acceder al dashboard en http://localhost:3000"
else
    echo -e "${YELLOW}INSTALACIÓN PARCIALMENTE COMPLETADA${NC}"
    echo "Se encontraron $ERRORS problema(s) que requieren atención."
    echo ""
    echo "Revisar los errores marcados con ✗ arriba."
fi

echo ""
echo "Para más información, consultar: README-REDHAT.md"
echo "=========================================="
