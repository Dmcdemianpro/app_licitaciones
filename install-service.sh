#!/bin/bash
# Script de instalación del servicio systemd para Sistema de Licitaciones
# Ejecutar como root: sudo bash install-service.sh

set -e

echo "🚀 Instalación del Servicio Systemd - Sistema de Licitaciones"
echo "=============================================================="
echo ""

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
   echo "❌ Este script debe ejecutarse como root (sudo)"
   exit 1
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Obtener el directorio actual
PROJECT_DIR=$(pwd)
echo "📁 Directorio del proyecto: $PROJECT_DIR"
echo ""

# 1. Compilar la aplicación para producción
echo "📦 Paso 1/5: Compilando aplicación para producción..."
npm run build
echo "✓ Aplicación compilada"
echo ""

# 2. Actualizar el archivo de servicio con la ruta correcta
echo "📝 Paso 2/5: Configurando archivo de servicio..."
sed -i "s|WorkingDirectory=.*|WorkingDirectory=$PROJECT_DIR|g" licitaciones.service
sed -i "s|EnvironmentFile=.*|EnvironmentFile=$PROJECT_DIR/.env|g" licitaciones.service
echo "✓ Archivo de servicio configurado"
echo ""

# 3. Copiar el archivo de servicio a systemd
echo "📋 Paso 3/5: Instalando servicio systemd..."
cp licitaciones.service /etc/systemd/system/
echo "✓ Servicio copiado a /etc/systemd/system/"
echo ""

# 4. Recargar systemd y habilitar el servicio
echo "🔄 Paso 4/5: Habilitando servicio..."
systemctl daemon-reload
systemctl enable licitaciones.service
echo "✓ Servicio habilitado para inicio automático"
echo ""

# 5. Iniciar el servicio
echo "▶️  Paso 5/5: Iniciando servicio..."
systemctl start licitaciones.service
echo "✓ Servicio iniciado"
echo ""

# Mostrar estado del servicio
echo "=============================================================="
echo "✅ Instalación completada exitosamente"
echo "=============================================================="
echo ""
echo "📊 Estado del servicio:"
systemctl status licitaciones.service --no-pager || true
echo ""
echo "📌 Comandos útiles:"
echo "   • Ver estado:     systemctl status licitaciones"
echo "   • Reiniciar:      systemctl restart licitaciones"
echo "   • Detener:        systemctl stop licitaciones"
echo "   • Ver logs:       journalctl -u licitaciones -f"
echo "   • Deshabilitar:   systemctl disable licitaciones"
echo ""
echo "🌐 La aplicación estará disponible en:"
echo "   http://localhost:3001"
echo "   http://$(hostname -I | awk '{print $1}'):3001"
echo ""
