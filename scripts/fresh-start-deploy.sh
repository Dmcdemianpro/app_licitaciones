#!/bin/bash
# Script para empezar DESDE CERO eliminando toda la base de datos
# ADVERTENCIA: Este script elimina TODOS los datos

set -e

echo "========================================="
echo "DEPLOY DESDE CERO (FRESH START)"
echo "========================================="
echo ""
echo "⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de la base de datos"
echo ""
read -p "¿Estás seguro de continuar? (escribe 'SI' para confirmar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    echo "Operación cancelada"
    exit 1
fi

echo ""
echo "Continuando con el deploy desde cero..."
echo ""

# 1. Pull código
echo "1. Descargando última versión del código..."
git pull origin main
echo "✅ Código actualizado"
echo ""

# 2. Extraer credenciales de .env
echo "2. Extrayendo credenciales de la base de datos..."
if [ ! -f .env ]; then
    echo "❌ Error: Archivo .env no encontrado"
    exit 1
fi

DB_URL=$(grep "DATABASE_URL" .env | cut -d '=' -f2-)
# Extraer componentes de la URL de SQL Server
# Formato: sqlserver://SERVER:PORT;database=DB;user=USER;password=PASS;...

echo "✅ Credenciales extraídas"
echo ""

# 3. Eliminar TODAS las tablas de la base de datos
echo "3. Eliminando TODAS las tablas de la base de datos..."
echo "   (Esto incluye _prisma_migrations con metadata vieja)"
echo ""

# Pedir credenciales al usuario
echo "Ingresa las credenciales de SQL Server:"
read -p "Servidor (default: 10.7.71.31): " DB_SERVER
DB_SERVER=${DB_SERVER:-10.7.71.31}
read -p "Usuario (default: sa): " DB_USER
DB_USER=${DB_USER:-sa}
read -sp "Contraseña: " DB_PASS
echo ""
read -p "Base de datos (default: app_licitaciones): " DB_NAME
DB_NAME=${DB_NAME:-app_licitaciones}
echo ""

# Ejecutar script SQL usando sqlcmd
echo "Ejecutando eliminación de tablas..."
sqlcmd -S "$DB_SERVER" -U "$DB_USER" -P "$DB_PASS" -d "$DB_NAME" -i scripts/drop-all-tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Todas las tablas eliminadas correctamente"
else
    echo "❌ Error al eliminar tablas"
    echo "Verifica que sqlcmd esté instalado y las credenciales sean correctas"
    exit 1
fi
echo ""

# 4. Limpiar cliente de Prisma
echo "4. Limpiando cliente de Prisma..."
rm -rf node_modules/@prisma/client
rm -rf node_modules/.prisma
rm -rf .next
echo "✅ Cliente y caché limpiados"
echo ""

# 5. Limpiar cachés
echo "5. Limpiando cachés de npm..."
npm cache clean --force
rm -rf /tmp/prisma-* 2>/dev/null || true
echo "✅ Cachés limpiados"
echo ""

# 6. Instalar dependencias
echo "6. Instalando dependencias..."
npm install
echo "✅ Dependencias instaladas"
echo ""

# 7. Generar cliente de Prisma
echo "7. Generando cliente de Prisma..."
npx prisma generate
echo "✅ Cliente generado"
echo ""

# 8. Aplicar migraciones (ahora debe funcionar sin error P3019)
echo "8. Aplicando migraciones desde cero..."
echo "   (La base de datos está vacía, sin metadata vieja)"
npx prisma migrate deploy
echo "✅ Migraciones aplicadas correctamente"
echo ""

# 9. Verificar estado
echo "9. Verificando estado de las migraciones..."
npx prisma migrate status
echo ""

# 10. Build de la aplicación
echo "10. Construyendo la aplicación..."
npm run build
echo "✅ Build completado"
echo ""

echo "========================================="
echo "✅ DEPLOY DESDE CERO COMPLETADO"
echo "========================================="
echo ""
echo "Base de datos recreada con schema completo"
echo "Todas las tablas nuevas creadas"
echo "Cliente de Prisma actualizado"
echo "Aplicación construida"
echo ""
echo "Siguiente paso:"
echo "  pm2 restart app_licitaciones"
echo ""
