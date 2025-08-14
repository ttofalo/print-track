#!/bin/bash

echo "=== CREANDO PAQUETE DE INSTALACIÓN ==="
echo ""

# Obtener fecha actual
FECHA=$(date +%Y%m%d)
NOMBRE_PAQUETE="print_server_dashboard_v1.0_${FECHA}"

echo "📦 Creando paquete: $NOMBRE_PAQUETE"
echo ""

# Crear directorio temporal
TEMP_DIR="/tmp/$NOMBRE_PAQUETE"
mkdir -p "$TEMP_DIR"

echo "📁 Copiando archivos del proyecto..."

# Archivos principales del proyecto
cp server.js "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"
cp procesar_logs.py "$TEMP_DIR/"

# Archivos del frontend
cp index.html "$TEMP_DIR/"
cp login.html "$TEMP_DIR/"
cp script.js "$TEMP_DIR/"
cp style.css "$TEMP_DIR/"

# Archivos de configuración
cp database_setup.sql "$TEMP_DIR/"
cp print-server.service "$TEMP_DIR/"
cp log-processor.service "$TEMP_DIR/"
cp log-processor.timer "$TEMP_DIR/"

# Scripts de utilidad
cp check_status.sh "$TEMP_DIR/"
cp setup_dynamic_ip.sh "$TEMP_DIR/"
cp update_server_ip.sh "$TEMP_DIR/"

# Archivos de documentación
cp README.md "$TEMP_DIR/"
cp RESUMEN_INSTALACION.md "$TEMP_DIR/"
cp MANUAL_INSTALACION_COMPLETO.md "$TEMP_DIR/"

# Archivos de prueba
cp test_api.html "$TEMP_DIR/"

# Imágenes (si existen)
if [ -f "porta_icon.png" ]; then
    cp porta_icon.png "$TEMP_DIR/"
fi

if [ -f "porta_hnos.png" ]; then
    cp porta_hnos.png "$TEMP_DIR/"
fi

echo "✅ Archivos copiados correctamente"
echo ""

# Crear archivo de verificación
echo "🔍 Creando archivo de verificación..."
cat > "$TEMP_DIR/VERIFICACION_ARCHIVOS.txt" << EOF
VERIFICACIÓN DE ARCHIVOS - PRINT SERVER DASHBOARD
Fecha: $(date)
Versión: 1.0.0

ARCHIVOS PRINCIPALES:
✅ server.js - Servidor Node.js
✅ package.json - Dependencias Node.js
✅ package-lock.json - Lock de dependencias
✅ procesar_logs.py - Procesador de logs Python

ARCHIVOS FRONTEND:
✅ index.html - Dashboard principal
✅ login.html - Página de login
✅ script.js - JavaScript del frontend
✅ style.css - Estilos CSS

ARCHIVOS DE CONFIGURACIÓN:
✅ database_setup.sql - Script de base de datos
✅ print-server.service - Servicio del servidor web
✅ log-processor.service - Servicio del procesador
✅ log-processor.timer - Timer del procesador

SCRIPTS DE UTILIDAD:
✅ check_status.sh - Verificación de estado
✅ setup_dynamic_ip.sh - Configuración de IP
✅ update_server_ip.sh - Actualización de IP

DOCUMENTACIÓN:
✅ README.md - Documentación básica
✅ RESUMEN_INSTALACION.md - Resumen de instalación
✅ MANUAL_INSTALACION_COMPLETO.md - Manual completo

ARCHIVOS DE PRUEBA:
✅ test_api.html - Página de prueba de API

TOTAL ARCHIVOS: $(find "$TEMP_DIR" -type f | wc -l)
EOF

echo "✅ Archivo de verificación creado"
echo ""

# Crear archivo de instalación rápida
echo "⚡ Creando script de instalación rápida..."
cat > "$TEMP_DIR/INSTALACION_RAPIDA.sh" << 'EOF'
#!/bin/bash

echo "=== INSTALACIÓN RÁPIDA - PRINT SERVER DASHBOARD ==="
echo ""

# Verificar que estemos en el directorio correcto
if [ ! -f "server.js" ]; then
    echo "❌ Error: No se encontró server.js"
    echo "   Asegúrate de estar en el directorio del proyecto"
    exit 1
fi

echo "📋 Verificando prerequisitos..."

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 no está instalado"
    echo "   Ejecuta: sudo apt install python3 python3-pip python3-venv"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "   Ejecuta: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"
    exit 1
fi

# Verificar MySQL
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL no está instalado"
    echo "   Ejecuta: sudo apt install mysql-server"
    exit 1
fi

echo "✅ Prerequisitos verificados"
echo ""

echo "📖 Para instalación completa, consulta:"
echo "   MANUAL_INSTALACION_COMPLETO.md"
echo ""
echo "🚀 Para verificación rápida del sistema:"
echo "   ./check_status.sh"
echo ""
echo "🌐 Para obtener la URL del dashboard:"
echo "   ./setup_dynamic_ip.sh"
echo ""

echo "=== FIN DE VERIFICACIÓN ==="
EOF

chmod +x "$TEMP_DIR/INSTALACION_RAPIDA.sh"

echo "✅ Script de instalación rápida creado"
echo ""

# Crear archivo ZIP
echo "📦 Creando archivo ZIP..."
cd /tmp
zip -r "${NOMBRE_PAQUETE}.zip" "$NOMBRE_PAQUETE/"

# Mover al directorio actual
mv "${NOMBRE_PAQUETE}.zip" "/home/sistemas/print_server/"

# Limpiar directorio temporal
rm -rf "$TEMP_DIR"

echo "✅ Paquete creado exitosamente"
echo ""
echo "📁 Archivo creado: /home/sistemas/print_server/${NOMBRE_PAQUETE}.zip"
echo ""
echo "📋 Contenido del paquete:"
echo "   - Todos los archivos del proyecto"
echo "   - Manual de instalación completo"
echo "   - Scripts de configuración"
echo "   - Documentación"
echo "   - Archivos de prueba"
echo ""
echo "📤 Para distribuir:"
echo "   1. Copia el archivo ZIP a la máquina destino"
echo "   2. Extrae el contenido"
echo "   3. Sigue el MANUAL_INSTALACION_COMPLETO.md"
echo ""
echo "🎯 ¡Paquete listo para distribución!" 