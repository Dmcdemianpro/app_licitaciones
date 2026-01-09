#!/bin/bash
# Script de deployment para systemd SIN usar sqlcmd
# Asume que ya eliminaste las tablas manualmente en SSMS

set -e

echo "========================================="
echo "DEPLOYMENT SYSTEMD (SIN SQLCMD)"
echo "========================================="
echo ""
echo "IMPORTANTE: Antes de ejecutar este script,"
echo "debes eliminar TODAS las tablas manualmente:"
echo ""
echo "1. Abre SQL Server Management Studio o Azure Data Studio"
echo "2. Conéctate a: 10.7.71.31"
echo "3. Abre la base de datos: DB_licitaciones"
echo "4. Ejecuta el script: scripts/drop-all-tables-manual.sql"
echo "5. Verifica que TODAS las tablas fueron eliminadas"
echo ""
read -p "¿Ya eliminaste las tablas manualmente? (escribe 'SI'): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    echo "❌ Operación cancelada"
    echo ""
    echo "Pasos a seguir:"
    echo "1. Copia el archivo: scripts/drop-all-tables-manual.sql"
    echo "2. Ejecútalo en SSMS/Azure Data Studio"
    echo "3. Vuelve a ejecutar este script"
    exit 1
fi

echo ""
echo "Continuando con el deployment..."
echo ""

# 1. Detener servicio systemd
echo "========================================="
echo "1. Deteniendo servicio systemd..."
echo "========================================="
systemctl stop licitaciones
sleep 2

if systemctl is-active --quiet licitaciones; then
    echo "❌ Error: El servicio aún está corriendo"
    exit 1
else
    echo "✅ Servicio detenido correctamente"
fi
echo ""

# 2. Actualizar código
echo "========================================="
echo "2. Actualizando código desde GitHub..."
echo "========================================="
git fetch origin main
git reset --hard origin/main
echo "✅ Código actualizado"
echo ""

# 3. Aplicar parche del provider
echo "========================================="
echo "3. Aplicando parche del provider..."
echo "========================================="
if grep -q 'provider = "mssql"' prisma/schema.prisma; then
    echo "⚠️  Encontrado 'mssql', aplicando parche..."
    sed -i 's/provider = "mssql"/provider = "sqlserver"/g' prisma/schema.prisma
    echo "✅ Parche aplicado: mssql → sqlserver"
else
    echo "✅ Provider ya es 'sqlserver'"
fi
echo ""

# 4. Limpiar cachés
echo "========================================="
echo "4. Limpiando cachés y cliente de Prisma..."
echo "========================================="
rm -rf node_modules/@prisma/client
rm -rf node_modules/.prisma
rm -rf .next
npm cache clean --force
rm -rf /tmp/prisma-* 2>/dev/null || true
echo "✅ Cachés limpiados"
echo ""

# 5. Instalar dependencias
echo "========================================="
echo "5. Instalando dependencias..."
echo "========================================="
npm install
echo "✅ Dependencias instaladas"
echo ""

# 6. Generar cliente de Prisma
echo "========================================="
echo "6. Generando cliente de Prisma..."
echo "========================================="
npx prisma generate
echo "✅ Cliente generado"
echo ""

# 7. Aplicar migraciones
echo "========================================="
echo "7. Aplicando migraciones desde cero..."
echo "========================================="
echo "Como la BD está vacía, esto creará todas las tablas"
echo ""
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migraciones aplicadas correctamente"
else
    echo "❌ Error al aplicar migraciones"
    echo ""
    echo "Si obtienes error de conexión, verifica:"
    echo "1. El archivo .env tiene la DATABASE_URL correcta"
    echo "2. El servidor SQL está corriendo"
    echo "3. Las credenciales son correctas"
    echo ""
    echo "DATABASE_URL actual:"
    grep DATABASE_URL .env
    exit 1
fi
echo ""

# 8. Verificar migraciones
echo "========================================="
echo "8. Verificando migraciones..."
echo "========================================="
npx prisma migrate status
echo ""

# 9. Build
echo "========================================="
echo "9. Construyendo aplicación..."
echo "========================================="
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completado"
else
    echo "❌ Error en el build"
    exit 1
fi
echo ""

# 10. Iniciar servicio
echo "========================================="
echo "10. Iniciando servicio systemd..."
echo "========================================="
systemctl start licitaciones
sleep 3

if systemctl is-active --quiet licitaciones; then
    echo "✅ Servicio iniciado correctamente"
else
    echo "❌ Error: El servicio no inició"
    echo "Ver logs: journalctl -u licitaciones -n 50"
    exit 1
fi
echo ""

# 11. Mostrar estado
echo "========================================="
echo "11. Estado del servicio"
echo "========================================="
systemctl status licitaciones --no-pager -l
echo ""

echo "========================================="
echo "✅ DEPLOYMENT COMPLETADO"
echo "========================================="
echo ""
echo "Resumen:"
echo "- Base de datos recreada con schema completo"
echo "- 80+ campos en tabla Licitacion"
echo "- Tablas LicitacionItem y SoporteTecnico creadas"
echo "- Cliente de Prisma actualizado"
echo "- Aplicación construida"
echo "- Servicio systemd corriendo"
echo ""
echo "Verificar:"
echo "  curl http://localhost:3001"
echo "  journalctl -u licitaciones -f"
echo ""
