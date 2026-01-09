# Guía Completa de Deployment para Producción

## 📋 Información del Sistema

- **Servicio:** systemd (licitaciones.service)
- **Usuario:** root
- **Directorio:** /Proyecto/app_licitaciones
- **Puerto:** 3001
- **Base de datos:** SQL Server (10.7.71.31)

---

## 🚀 Pasos Completos para Deploy (Fresh Start)

### Paso 1: Conectarse al Servidor

```bash
ssh root@10.7.71.31
# O el método que uses para conectarte al servidor
```

---

### Paso 2: Detener el Servicio Systemd

```bash
# Detener el servicio
systemctl stop licitaciones

# Verificar que se detuvo
systemctl status licitaciones
# Debe mostrar: "Active: inactive (dead)"
```

---

### Paso 3: Navegar al Directorio del Proyecto

```bash
cd /Proyecto/app_licitaciones

# Verificar que estás en el directorio correcto
pwd
# Debe mostrar: /Proyecto/app_licitaciones
```

---

### Paso 4: Hacer Backup (OPCIONAL pero RECOMENDADO)

```bash
# Backup de la base de datos
sqlcmd -S 10.7.71.31 -U sa -Q "BACKUP DATABASE app_licitaciones TO DISK='/var/opt/mssql/backup/app_licitaciones_backup_$(date +%Y%m%d_%H%M%S).bak'"

# Backup del código actual (por si acaso)
cd /Proyecto
tar -czf app_licitaciones_backup_$(date +%Y%m%d_%H%M%S).tar.gz app_licitaciones/
cd app_licitaciones
```

**NOTA:** Si no tienes espacio o no necesitas backup, puedes saltarte este paso.

---

### Paso 5: Actualizar el Código desde GitHub

```bash
# Descargar últimos cambios
git fetch origin main

# Ver qué cambios hay
git log HEAD..origin/main --oneline

# Aplicar los cambios (forzado)
git reset --hard origin/main

# Verificar que estás en el último commit
git log -1 --oneline
# Debe mostrar: c01b781 fix: Solución definitiva al error P3019...
```

---

### Paso 6: Aplicar el Parche del Provider (IMPORTANTE)

Este es el "parche" que mencionaste. Corrige el provider si está incorrecto:

```bash
# Verificar el provider actual
grep "provider" prisma/schema.prisma | grep -v "^//"

# Si muestra 'provider = "mssql"', aplicar el parche:
sed -i 's/provider = "mssql"/provider = "sqlserver"/g' prisma/schema.prisma

# Verificar que el parche se aplicó correctamente
grep "provider" prisma/schema.prisma | grep -v "^//"
# Debe mostrar:
#   provider = "prisma-client-js"
#   provider = "sqlserver"
```

---

### Paso 7: Ejecutar el Script de Fresh Start

Este script hará TODO el trabajo:

```bash
bash scripts/fresh-start-deploy.sh
```

**El script te pedirá:**

1. **Confirmación** → Escribe `SI` (en mayúsculas) y presiona Enter

2. **Servidor** → Presiona Enter para usar default (10.7.71.31)

3. **Usuario** → Presiona Enter para usar default (sa)

4. **Contraseña** → Escribe la contraseña de SQL Server: `T00r.HIS.2018$`

5. **Base de datos** → Presiona Enter para usar default (app_licitaciones)

**El script ejecutará automáticamente:**
- ✅ Eliminar todas las tablas de SQL Server
- ✅ Limpiar cachés de Prisma y Next.js
- ✅ Reinstalar dependencias (npm install)
- ✅ Generar cliente de Prisma nuevo
- ✅ Aplicar migraciones desde cero (sin error P3019)
- ✅ Construir la aplicación (npm run build)

**Tiempo estimado:** 5-7 minutos

---

### Paso 8: Verificar que No Hubo Errores

Al final del script deberías ver:

```
=========================================
✅ DEPLOY DESDE CERO COMPLETADO
=========================================

Base de datos recreada con schema completo
Todas las tablas nuevas creadas
Cliente de Prisma actualizado
Aplicación construida

Siguiente paso:
  pm2 restart app_licitaciones
```

**Si hay errores:**
- Lee el mensaje de error
- Verifica que sqlcmd esté instalado
- Verifica credenciales de SQL Server
- Verifica que el puerto 1433 esté abierto

---

### Paso 9: Reiniciar el Servicio Systemd

```bash
# Iniciar el servicio
systemctl start licitaciones

# Verificar que inició correctamente
systemctl status licitaciones
# Debe mostrar: "Active: active (running)"
```

---

### Paso 10: Verificar los Logs

```bash
# Ver logs en tiempo real
journalctl -u licitaciones -f

# O ver las últimas 100 líneas
journalctl -u licitaciones -n 100
```

**Logs que debes ver (exitosos):**
```
info  - Ready on http://0.0.0.0:3001
```

**Si ves errores:**
- `EADDRINUSE`: El puerto 3001 ya está en uso (verifica con `netstat -tulpn | grep 3001`)
- `Database connection failed`: Verifica el .env y la conexión a SQL Server
- `Module not found`: Ejecuta `npm install` de nuevo

---

### Paso 11: Verificar que la Aplicación Funciona

```bash
# Desde el servidor, hacer un curl
curl http://localhost:3001

# Debe retornar HTML de la página

# Verificar el endpoint de API
curl http://localhost:3001/api/health
```

Desde tu navegador, accede a:
```
http://10.7.71.31:3001
```

Deberías ver la aplicación corriendo.

---

### Paso 12: Verificar las Migraciones en la Base de Datos

```bash
# Ver estado de las migraciones
npx prisma migrate status

# Debe mostrar:
# Status: All migrations have been applied
# 1 migration found in prisma/migrations
#   └─ 20260106141008_init_complete_schema [Applied]
```

```bash
# Verificar tablas creadas
npx prisma db execute --stdin <<EOF
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
EOF
```

**Tablas que deben existir:**
- Cita
- Documento
- Licitacion ← **CON 80+ CAMPOS**
- LicitacionItem ← **NUEVA**
- Nota
- SoporteTecnico ← **NUEVA**
- Ticket
- User
- _prisma_migrations ← **Con provider 'sqlserver'**

---

## 🔧 Comandos Útiles de Systemd

```bash
# Ver estado del servicio
systemctl status licitaciones

# Iniciar servicio
systemctl start licitaciones

# Detener servicio
systemctl stop licitaciones

# Reiniciar servicio
systemctl restart licitaciones

# Habilitar inicio automático al bootear
systemctl enable licitaciones

# Deshabilitar inicio automático
systemctl disable licitaciones

# Ver logs en tiempo real
journalctl -u licitaciones -f

# Ver logs desde hace 1 hora
journalctl -u licitaciones --since "1 hour ago"

# Ver logs con prioridad de error
journalctl -u licitaciones -p err

# Ver uso de recursos
systemctl show licitaciones --property=CPUUsageNSec,MemoryCurrent
```

---

## 🆘 Solución de Problemas

### Problema 1: Error P3019 persiste

```bash
# Verificar provider en schema.prisma
cat prisma/schema.prisma | grep "provider"

# Si todavía dice "mssql", aplicar parche manual:
sed -i 's/provider = "mssql"/provider = "sqlserver"/g' prisma/schema.prisma

# Verificar migration_lock.toml
cat prisma/migrations/migration_lock.toml

# Debe decir: provider = "sqlserver"
```

### Problema 2: sqlcmd no encontrado

```bash
# Instalar SQL Server tools
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt-get update
sudo ACCEPT_EULA=Y apt-get install -y mssql-tools unixodbc-dev

# Agregar al PATH
echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
source ~/.bashrc
```

### Problema 3: El servicio no inicia

```bash
# Ver logs detallados
journalctl -u licitaciones -n 200 --no-pager

# Verificar que el puerto 3001 no esté en uso
netstat -tulpn | grep 3001

# Si está en uso, matar el proceso:
kill -9 $(lsof -t -i:3001)

# Verificar permisos
ls -la /Proyecto/app_licitaciones

# Verificar que .env existe
ls -la /Proyecto/app_licitaciones/.env
```

### Problema 4: Error de conexión a SQL Server

```bash
# Verificar conectividad
ping 10.7.71.31

# Verificar puerto 1433 abierto
telnet 10.7.71.31 1433

# O con nc
nc -zv 10.7.71.31 1433

# Verificar DATABASE_URL en .env
grep DATABASE_URL /Proyecto/app_licitaciones/.env

# Debe ser algo como:
# DATABASE_URL="sqlserver://10.7.71.31:1433;database=app_licitaciones;user=sa;password=T00r.HIS.2018$;..."
```

### Problema 5: Build de Next.js falla

```bash
# Limpiar todo y reconstruir
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

---

## 📊 Checklist Post-Deployment

Marca cada item después de verificar:

- [ ] Servicio systemd corriendo (`systemctl status licitaciones`)
- [ ] Sin errores en logs (`journalctl -u licitaciones -n 50`)
- [ ] Aplicación responde en http://10.7.71.31:3001
- [ ] Login funciona correctamente
- [ ] Base de datos tiene las tablas correctas
- [ ] Migraciones aplicadas (`npx prisma migrate status`)
- [ ] Cliente de Prisma actualizado
- [ ] 80+ campos en tabla Licitacion
- [ ] Tabla LicitacionItem existe
- [ ] Tabla SoporteTecnico existe

---

## 🎯 Resumen del Parche

El **parche** que se aplica es:

```bash
sed -i 's/provider = "mssql"/provider = "sqlserver"/g' prisma/schema.prisma
```

**Por qué es necesario:**
- Prisma cambió la nomenclatura de "mssql" a "sqlserver"
- El código en desarrollo usa "sqlserver"
- Algunas versiones viejas podrían tener "mssql"
- El parche asegura consistencia

**Ubicación del parche:**
- Está incluido en `fresh-start-deploy.sh` (línea 30)
- También en otros scripts de migración
- Se aplica automáticamente antes de generar el cliente

---

## 📞 Contacto y Soporte

Si algo falla:

1. **Lee los logs:** `journalctl -u licitaciones -n 100`
2. **Verifica errores de Prisma:** `npx prisma migrate status`
3. **Verifica conexión a BD:** `telnet 10.7.71.31 1433`
4. **Revisa el .env:** Variables correctas
5. **Consulta la documentación:** [scripts/SOLUCION_ERROR_P3019.md](./scripts/SOLUCION_ERROR_P3019.md)

---

**Última actualización:** 2026-01-09
**Versión del script:** fresh-start-deploy.sh
**Problema resuelto:** Error P3019 - Provider mismatch
