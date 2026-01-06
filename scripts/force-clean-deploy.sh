#!/bin/bash
# Script de limpieza forzada y deploy desde cero
# Este script elimina TODO y reconstruye desde cero

set -e

echo "======================================="
echo "LIMPIEZA FORZADA Y DEPLOY"
echo "======================================="
echo ""

# 1. Pull forzado
echo "1. Descargando última versión (forzado)..."
git fetch origin main
git reset --hard origin/main
echo "✅ Código actualizado"
echo ""

# 2. Eliminar cliente de Prisma generado
echo "2. Eliminando cliente de Prisma antiguo..."
rm -rf node_modules/@prisma/client
rm -rf node_modules/.prisma
echo "✅ Cliente eliminado"
echo ""

# 3. Verificar y corregir schema.prisma
echo "3. Verificando schema.prisma..."
if grep -q "mssql" prisma/schema.prisma; then
    echo "⚠️  Corrigiendo provider en schema.prisma..."
    sed -i 's/provider = "mssql"/provider = "sqlserver"/g' prisma/schema.prisma
    echo "✅ Provider corregido"
else
    echo "✅ Provider ya es correcto"
fi
echo ""

# 4. Mostrar migraciones actuales
echo "4. Migraciones actuales en el sistema:"
ls -la prisma/migrations/
echo ""

# 5. Verificar migration_lock.toml
echo "5. Verificando migration_lock.toml:"
cat prisma/migrations/migration_lock.toml
echo ""

# 6. Limpiar caché de Prisma
echo "6. Limpiando caché de Prisma..."
rm -rf /tmp/prisma-* 2>/dev/null || true
rm -rf ~/.cache/prisma 2>/dev/null || true
echo "✅ Caché limpiado"
echo ""

# 7. Reinstalar dependencias
echo "7. Reinstalando dependencias..."
npm ci
echo "✅ Dependencias instaladas"
echo ""

# 8. Generar cliente de Prisma
echo "8. Generando nuevo cliente de Prisma..."
npx prisma generate --schema=prisma/schema.prisma
echo "✅ Cliente generado"
echo ""

# 9. Aplicar migraciones
echo "9. Aplicando migraciones a la base de datos..."
echo "   (Este comando recreará la base de datos desde cero)"
npx prisma migrate deploy
echo "✅ Migraciones aplicadas"
echo ""

# 10. Verificar estado
echo "10. Estado final de las migraciones:"
npx prisma migrate status
echo ""

echo "======================================="
echo "✅ LIMPIEZA Y DEPLOY COMPLETADOS"
echo "======================================="
echo ""
echo "Siguiente paso:"
echo "  pm2 restart app_licitaciones"
