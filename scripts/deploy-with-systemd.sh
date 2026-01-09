#!/bin/bash
# Script completo de deployment para systemd
# Incluye todos los pasos: detener servicio, actualizar, aplicar parche, fresh start, reiniciar

set -e

echo "========================================="
echo "DEPLOYMENT COMPLETO PARA SYSTEMD"
echo "========================================="
echo ""
echo "Este script realizará:"
echo "1. Detener el servicio licitaciones (systemd)"
echo "2. Actualizar código desde GitHub"
echo "3. Aplicar parche del provider"
echo "4. Eliminar base de datos y empezar desde cero"
echo "5. Reinstalar dependencias y construir"
echo "6. Reiniciar el servicio"
echo ""
echo "⚠️  ADVERTENCIA: Eliminará TODOS los datos de la base de datos"
echo ""
read -p "¿Continuar? (escribe 'SI' en mayúsculas): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    echo "❌ Operación cancelada"
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

# Verificar que se detuvo
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
echo "Verificando provider actual en schema.prisma..."
if grep -q 'provider = "mssql"' prisma/schema.prisma; then
    echo "⚠️  Encontrado 'mssql', aplicando parche..."
    sed -i 's/provider = "mssql"/provider = "sqlserver"/g' prisma/schema.prisma
    echo "✅ Parche aplicado: mssql → sqlserver"
else
    echo "✅ Provider ya es 'sqlserver', no se necesita parche"
fi
echo ""

# 4. Pedir credenciales de SQL Server
echo "========================================="
echo "4. Credenciales de SQL Server"
echo "========================================="
read -p "Servidor (default: 10.7.71.31): " DB_SERVER
DB_SERVER=${DB_SERVER:-10.7.71.31}
read -p "Usuario (default: sa): " DB_USER
DB_USER=${DB_USER:-sa}
read -sp "Contraseña: " DB_PASS
echo ""
read -p "Base de datos (default: app_licitaciones): " DB_NAME
DB_NAME=${DB_NAME:-app_licitaciones}
echo ""

# 5. Eliminar todas las tablas
echo "========================================="
echo "5. Eliminando TODAS las tablas de SQL Server..."
echo "========================================="
sqlcmd -S "$DB_SERVER" -U "$DB_USER" -P "$DB_PASS" -d "$DB_NAME" -i scripts/drop-all-tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Todas las tablas eliminadas"
else
    echo "❌ Error al eliminar tablas"
    echo "Iniciando servicio de nuevo..."
    systemctl start licitaciones
    exit 1
fi
echo ""

# 6. Limpiar cachés
echo "========================================="
echo "6. Limpiando cachés y cliente de Prisma..."
echo "========================================="
rm -rf node_modules/@prisma/client
rm -rf node_modules/.prisma
rm -rf .next
npm cache clean --force
rm -rf /tmp/prisma-* 2>/dev/null || true
echo "✅ Cachés limpiados"
echo ""

# 7. Instalar dependencias
echo "========================================="
echo "7. Instalando dependencias..."
echo "========================================="
npm install
echo "✅ Dependencias instaladas"
echo ""

# 8. Generar cliente de Prisma
echo "========================================="
echo "8. Generando cliente de Prisma..."
echo "========================================="
npx prisma generate
echo "✅ Cliente generado"
echo ""

# 9. Aplicar migraciones
echo "========================================="
echo "9. Aplicando migraciones desde cero..."
echo "========================================="
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migraciones aplicadas correctamente"
else
    echo "❌ Error al aplicar migraciones"
    echo "Revisa el error arriba. El servicio NO será iniciado."
    exit 1
fi
echo ""

# 10. Build
echo "========================================="
echo "10. Construyendo aplicación..."
echo "========================================="
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completado"
else
    echo "❌ Error en el build"
    echo "Revisa el error arriba. El servicio NO será iniciado."
    exit 1
fi
echo ""

# 11. Verificar estado de migraciones
echo "========================================="
echo "11. Verificando estado de las migraciones..."
echo "========================================="
npx prisma migrate status
echo ""

# 12. Iniciar servicio
echo "========================================="
echo "12. Iniciando servicio systemd..."
echo "========================================="
systemctl start licitaciones
sleep 3

# Verificar que inició
if systemctl is-active --quiet licitaciones; then
    echo "✅ Servicio iniciado correctamente"
else
    echo "❌ Error: El servicio no inició"
    echo "Revisa los logs con: journalctl -u licitaciones -n 50"
    exit 1
fi
echo ""

# 13. Mostrar estado y logs
echo "========================================="
echo "13. Estado del servicio"
echo "========================================="
systemctl status licitaciones --no-pager -l
echo ""

echo "========================================="
echo "✅ DEPLOYMENT COMPLETADO EXITOSAMENTE"
echo "========================================="
echo ""
echo "Resumen:"
echo "- Base de datos recreada con schema completo (80+ campos)"
echo "- Cliente de Prisma actualizado"
echo "- Aplicación construida"
echo "- Servicio systemd corriendo"
echo ""
echo "Comandos útiles:"
echo "  Ver logs en tiempo real: journalctl -u licitaciones -f"
echo "  Estado del servicio: systemctl status licitaciones"
echo "  Reiniciar servicio: systemctl restart licitaciones"
echo "  Detener servicio: systemctl stop licitaciones"
echo ""
echo "Verifica que la aplicación responde:"
echo "  curl http://localhost:3001"
echo "  O desde tu navegador: http://10.7.71.31:3001"
echo ""
