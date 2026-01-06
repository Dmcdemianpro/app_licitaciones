#!/bin/bash
# Script de migración para producción
# Ejecutar como: bash scripts/migrate-production.sh

set -e  # Salir si hay algún error

echo "======================================"
echo "MIGRACIÓN DE PRODUCCIÓN"
echo "======================================"
echo ""

# 1. Hacer pull de los últimos cambios
echo "1. Descargando últimos cambios del repositorio..."
git pull origin main

# 2. Instalar dependencias (por si acaso)
echo ""
echo "2. Instalando dependencias..."
npm install

# 3. Verificar el provider en schema.prisma
echo ""
echo "3. Verificando provider en schema.prisma..."
grep "provider" prisma/schema.prisma | head -2

# 4. Ejecutar la migración
echo ""
echo "4. Ejecutando migración de base de datos..."
npx prisma migrate deploy

# 5. Generar cliente de Prisma
echo ""
echo "5. Generando cliente de Prisma..."
npx prisma generate

# 6. Ver estado de las migraciones
echo ""
echo "6. Estado final de las migraciones:"
npx prisma migrate status

echo ""
echo "======================================"
echo "✅ MIGRACIÓN COMPLETADA EXITOSAMENTE"
echo "======================================"
echo ""
echo "Ahora reinicia el servidor de la aplicación con:"
echo "  pm2 restart app_licitaciones"
echo "  o"
echo "  systemctl restart app_licitaciones"
