#!/bin/bash
# Script simple y directo para producción

set -e

echo "======================================="
echo "DEPLOY LIMPIO - SIMPLE"
echo "======================================="
echo ""

# 1. Pull
echo "1. Actualizando código..."
git pull origin main
echo ""

# 2. ELIMINAR cliente viejo de Prisma (CRÍTICO)
echo "2. Eliminando cliente de Prisma antiguo..."
rm -rf node_modules/@prisma/client
rm -rf node_modules/.prisma
echo "✅ Cliente eliminado"
echo ""

# 3. Limpiar caché de npm y Prisma
echo "3. Limpiando cachés..."
npm cache clean --force
rm -rf /tmp/prisma-* 2>/dev/null || true
echo "✅ Cachés limpiados"
echo ""

# 4. Instalar dependencias
echo "4. Instalando dependencias..."
npm install
echo "✅ Dependencias instaladas"
echo ""

# 5. Generar cliente NUEVO
echo "5. Generando cliente de Prisma NUEVO..."
npx prisma generate
echo "✅ Cliente generado"
echo ""

# 6. Aplicar migraciones
echo "6. Aplicando migraciones..."
npx prisma migrate deploy
echo "✅ Migraciones aplicadas"
echo ""

# 7. Verificar
echo "7. Estado final:"
npx prisma migrate status
echo ""

echo "======================================="
echo "✅ DEPLOY COMPLETADO"
echo "======================================="
echo ""
echo "Reinicia el servidor:"
echo "  pm2 restart app_licitaciones"
