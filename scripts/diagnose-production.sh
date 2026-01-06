#!/bin/bash
# Script de diagnóstico para producción

echo "======================================="
echo "DIAGNÓSTICO DE PRODUCCIÓN"
echo "======================================="
echo ""

echo "1. Contenido del directorio de migraciones:"
ls -la prisma/migrations/
echo ""

echo "2. Contenido de migration_lock.toml:"
cat prisma/migrations/migration_lock.toml
echo ""

echo "3. Provider en schema.prisma:"
grep -A 2 "datasource db" prisma/schema.prisma
echo ""

echo "4. Buscar 'mssql' en schema.prisma:"
if grep -n "mssql" prisma/schema.prisma; then
    echo "⚠️  ENCONTRADO 'mssql' en schema.prisma"
else
    echo "✅ No se encontró 'mssql' en schema.prisma"
fi
echo ""

echo "5. Verificar directorio de cliente generado:"
ls -la node_modules/@prisma/client/ | head -20
echo ""

echo "======================================="
echo "FIN DEL DIAGNÓSTICO"
echo "======================================="
