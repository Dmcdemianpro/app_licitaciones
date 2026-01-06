#!/bin/bash
# Script definitivo para producción - USA MIGRATE DEPLOY
# migrate deploy NO valida providers, solo aplica migraciones pendientes

set -e

echo "======================================"
echo "DEPLOY PRODUCCIÓN (FINAL)"
echo "======================================"
echo ""

# 1. Pull
echo "1. Descargando última versión..."
git pull origin main

# 2. Corregir schema.prisma
echo ""
echo "2. Corrigiendo provider en schema.prisma..."
sed -i 's/provider = "mssql"/provider = "sqlserver"/g' prisma/schema.prisma
echo "✅ Schema corregido"

# 3. Verificar schema
echo ""
echo "3. Verificando datasource en schema..."
grep -A 2 "datasource db" prisma/schema.prisma

# 4. Instalar dependencias
echo ""
echo "4. Instalando dependencias..."
npm install

# 5. Generar cliente
echo ""
echo "5. Generando cliente de Prisma..."
npx prisma generate

# 6. Aplicar migraciones pendientes (PRODUCCIÓN)
echo ""
echo "6. Aplicando migraciones pendientes con MIGRATE DEPLOY..."
echo "   (Este comando es para producción y NO valida providers)"
npx prisma migrate deploy

# 7. Estado final
echo ""
echo "7. Estado de las migraciones:"
npx prisma migrate status

echo ""
echo "======================================"
echo "✅ DEPLOY COMPLETADO"
echo "======================================"
echo ""
echo "Siguiente paso:"
echo "  pm2 restart app_licitaciones"
