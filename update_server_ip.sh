#!/bin/bash

echo "=== ACTUALIZANDO IP DEL SERVIDOR ==="
echo ""

# Detectar IP del servidor
SERVER_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d'/' -f1 | head -1)

if [ -z "$SERVER_IP" ]; then
    echo "❌ No se pudo detectar la IP del servidor"
    exit 1
fi

echo "✅ IP del servidor detectada: $SERVER_IP"
echo ""

# Actualizar la IP en el HTML
echo "📝 Actualizando index.html..."
sed -i "s/<meta name=\"server-ip\" content=\"[^\"]*\"/<meta name=\"server-ip\" content=\"$SERVER_IP\"/" index.html

if [ $? -eq 0 ]; then
    echo "✅ IP actualizada en index.html"
else
    echo "❌ Error actualizando index.html"
    exit 1
fi

# Verificar que el servidor esté corriendo
echo "🔍 Verificando servidor..."
if curl -s "http://$SERVER_IP:3000/api/health" > /dev/null; then
    echo "✅ Servidor respondiendo correctamente"
else
    echo "❌ El servidor no está respondiendo"
    echo "   Ejecuta: sudo systemctl start print-server"
    exit 1
fi

echo ""
echo "=== CONFIGURACIÓN COMPLETADA ==="
echo "IP del servidor actualizada: $SERVER_IP"
echo "Dashboard disponible en: http://$SERVER_IP:3000"
echo ""
echo "💡 Para acceder desde cualquier dispositivo en la red:"
echo "   http://$SERVER_IP:3000" 