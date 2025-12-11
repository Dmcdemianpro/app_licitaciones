#!/bin/bash
set -e
echo "🚀 Configuración de Base de Datos - Sistema de Licitaciones"
echo "=========================================================="
echo ""
echo "📝 Paso 1/4: Generando NEXTAUTH_SECRET seguro..."
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
echo "✓ Secret generado: ${NEW_SECRET:0:20}..."
echo ""
echo "📝 Paso 2/4: Actualizando archivo .env..."
if [ -f .env ]; then
    cp .env .env.backup
    echo "✓ Backup creado: .env.backup"
    if grep -q "NEXTAUTH_SECRET=" .env; then
        sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEW_SECRET\"|" .env
        echo "✓ NEXTAUTH_SECRET actualizado en .env"
    else
        echo "NEXTAUTH_SECRET=\"$NEW_SECRET\"" >> .env
        echo "✓ NEXTAUTH_SECRET agregado a .env"
    fi
else
    echo "❌ Error: Archivo .env no encontrado"
    exit 1
fi
echo ""
echo "📝 Paso 3/4: Verificando configuración..."
if grep -q "DATABASE_URL=" .env && grep -q "NEXTAUTH_SECRET=" .env && grep -q "NEXTAUTH_URL=" .env; then
    echo "✓ Variables de entorno configuradas correctamente"
else
    echo "❌ Error: Faltan variables en .env"
    exit 1
fi
echo ""
echo "📝 Paso 4/4: Poblando base de datos..."
npm run seed
echo ""
echo "=========================================================="
echo "✅ ¡Configuración completada exitosamente!"
echo "=========================================================="
echo ""
echo "🔑 Credenciales de acceso (contraseña: admin123):"
echo "   • Admin:      admin@example.com"
echo "   • Manager:    manager@example.com"
echo "   • Supervisor: supervisor@example.com"
echo "   • Usuario 1:  user1@example.com"
echo "   • Usuario 2:  user2@example.com"
echo ""
