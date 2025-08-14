#!/bin/bash

echo "🔍 Verificando configuración de IP del servidor..."
echo "=================================================="

# Verificar que la nueva IP esté configurada en los archivos principales
echo "📋 Verificando archivos principales:"

echo "✅ test_api.html:"
if grep -q "10.10.3.171" test_api.html; then
    echo "   - IP configurada correctamente"
else
    echo "   ❌ IP no encontrada"
fi

echo "✅ script.js:"
if grep -q "10.10.3.171" script.js; then
    echo "   - IP configurada correctamente"
else
    echo "   ❌ IP no encontrada"
fi

echo "✅ server.js:"
if grep -q "10.10.3.171" server.js; then
    echo "   - IP configurada correctamente"
else
    echo "   ❌ IP no encontrada"
fi

echo "✅ index.html:"
if grep -q "10.10.3.171" index.html; then
    echo "   - IP configurada correctamente"
else
    echo "   ❌ IP no encontrada"
fi

echo "✅ procesar_logs.py:"
if grep -q "10.10.3.171" procesar_logs.py; then
    echo "   - IP configurada correctamente"
else
    echo "   ❌ IP no encontrada"
fi

echo ""
echo "🔍 Verificando que no queden referencias a la IP anterior:"
if grep -r "192.168.1.23" . --exclude-dir=venv --exclude-dir=node_modules --exclude-dir=__pycache__ --exclude=verificar_configuracion_ip.sh 2>/dev/null; then
    echo "   ⚠️  Se encontraron referencias a la IP anterior"
else
    echo "   ✅ No se encontraron referencias a la IP anterior"
fi

echo ""
echo "🌐 Información de red actual:"
echo "   - IP del servidor: 10.10.3.171"
echo "   - Puerto del servidor: 3000"
echo "   - URL del dashboard: http://10.10.3.171:3000"
echo "   - URL de la API: http://10.10.3.171:3000/api"

echo ""
echo "✅ Verificación completada" 