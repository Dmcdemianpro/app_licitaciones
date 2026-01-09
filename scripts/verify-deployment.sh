#!/bin/bash
# Script de verificación post-deployment
# Verifica que todo esté funcionando correctamente

echo "========================================="
echo "VERIFICACIÓN POST-DEPLOYMENT"
echo "========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success=0
failures=0

# Función para verificar
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((success++))
    else
        echo -e "${RED}❌ $1${NC}"
        ((failures++))
    fi
}

# 1. Verificar servicio systemd
echo "1. Verificando servicio systemd..."
systemctl is-active --quiet licitaciones
check "Servicio licitaciones está corriendo"
echo ""

# 2. Verificar puerto 3001
echo "2. Verificando puerto 3001..."
netstat -tulpn 2>/dev/null | grep -q ":3001"
check "Puerto 3001 está escuchando"
echo ""

# 3. Verificar respuesta HTTP
echo "3. Verificando respuesta HTTP..."
http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")
if [ "$http_code" = "200" ] || [ "$http_code" = "304" ]; then
    echo -e "${GREEN}✅ Aplicación responde HTTP $http_code${NC}"
    ((success++))
else
    echo -e "${RED}❌ Aplicación NO responde (HTTP $http_code)${NC}"
    ((failures++))
fi
echo ""

# 4. Verificar archivos críticos
echo "4. Verificando archivos críticos..."
[ -f ".env" ]; check "Archivo .env existe"
[ -f "package.json" ]; check "Archivo package.json existe"
[ -f "prisma/schema.prisma" ]; check "Archivo schema.prisma existe"
[ -d "node_modules" ]; check "Directorio node_modules existe"
[ -d ".next" ]; check "Directorio .next existe"
echo ""

# 5. Verificar provider en schema
echo "5. Verificando provider en schema.prisma..."
provider=$(grep -A 2 "datasource db" prisma/schema.prisma | grep "provider" | awk '{print $3}' | tr -d '"')
if [ "$provider" = "sqlserver" ]; then
    echo -e "${GREEN}✅ Provider es 'sqlserver'${NC}"
    ((success++))
else
    echo -e "${RED}❌ Provider es '$provider' (debería ser 'sqlserver')${NC}"
    ((failures++))
fi
echo ""

# 6. Verificar estado de migraciones
echo "6. Verificando migraciones..."
migrate_output=$(npx prisma migrate status 2>&1)
if echo "$migrate_output" | grep -q "All migrations have been applied"; then
    echo -e "${GREEN}✅ Todas las migraciones aplicadas${NC}"
    ((success++))
else
    echo -e "${YELLOW}⚠️  Hay migraciones pendientes${NC}"
    echo "$migrate_output"
fi
echo ""

# 7. Verificar conexión a SQL Server
echo "7. Verificando conexión a SQL Server..."
timeout 5 bash -c 'cat < /dev/null > /dev/tcp/10.7.71.31/1433' 2>/dev/null
check "Conexión a SQL Server (10.7.71.31:1433)"
echo ""

# 8. Verificar cliente de Prisma
echo "8. Verificando cliente de Prisma..."
if [ -d "node_modules/@prisma/client" ]; then
    client_date=$(stat -c %y node_modules/@prisma/client 2>/dev/null | cut -d' ' -f1)
    echo -e "${GREEN}✅ Cliente de Prisma generado (${client_date})${NC}"
    ((success++))
else
    echo -e "${RED}❌ Cliente de Prisma no encontrado${NC}"
    ((failures++))
fi
echo ""

# 9. Verificar logs recientes
echo "9. Verificando logs recientes (últimas 10 líneas)..."
echo "---------------------------------------------------"
journalctl -u licitaciones -n 10 --no-pager 2>/dev/null
echo "---------------------------------------------------"
echo ""

# 10. Verificar tablas en la base de datos
echo "10. Verificando tablas en la base de datos..."
tables=$(npx prisma db execute --stdin <<'EOF'
SELECT COUNT(*) as table_count FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
EOF
2>&1 | grep -oP '\d+' | head -1)

if [ ! -z "$tables" ] && [ "$tables" -gt 5 ]; then
    echo -e "${GREEN}✅ Base de datos tiene $tables tablas${NC}"
    ((success++))
else
    echo -e "${RED}❌ Base de datos tiene pocas tablas ($tables)${NC}"
    ((failures++))
fi
echo ""

# Resumen
echo "========================================="
echo "RESUMEN DE VERIFICACIÓN"
echo "========================================="
echo -e "${GREEN}Exitosas: $success${NC}"
echo -e "${RED}Fallidas: $failures${NC}"
echo ""

if [ $failures -eq 0 ]; then
    echo -e "${GREEN}✅ ¡TODO ESTÁ FUNCIONANDO CORRECTAMENTE!${NC}"
    echo ""
    echo "Accede a la aplicación en:"
    echo "  http://10.7.71.31:3001"
    exit 0
else
    echo -e "${YELLOW}⚠️  Hay $failures problemas detectados${NC}"
    echo ""
    echo "Comandos para investigar:"
    echo "  journalctl -u licitaciones -n 100   # Ver logs"
    echo "  systemctl status licitaciones       # Ver estado"
    echo "  npx prisma migrate status           # Ver migraciones"
    exit 1
fi
