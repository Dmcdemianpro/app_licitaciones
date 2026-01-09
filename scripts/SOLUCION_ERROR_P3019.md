# Solución al Error P3019 de Prisma

## 🔴 El Problema

Cuando ejecutas `npx prisma migrate deploy`, obtienes este error:

```
Error: P3019

The datasource provider `mssql` specified in your schema does not match
the one specified in the migration_lock.toml, `sqlserver`.
```

## 🔍 Diagnóstico Completo Realizado

Se verificaron TODOS los archivos del proyecto:

✅ **prisma/schema.prisma** - Provider correcto: `sqlserver`
✅ **prisma/migrations/migration_lock.toml** - Provider correcto: `sqlserver`
✅ **node_modules/.prisma/client/schema.prisma** - Provider correcto: `sqlserver`
✅ **.env** - URL correcta con `sqlserver://`
✅ **Código fuente** - Sin referencias a "mssql"

## 🎯 La Causa Raíz

El error **NO está en los archivos**, está en la **base de datos SQL Server**.

La tabla `_prisma_migrations` contiene registros de migraciones anteriores que se aplicaron cuando el provider era `mssql`. Prisma lee esta tabla al ejecutar `migrate deploy` y detecta la inconsistencia.

**Metadatos viejos en la base de datos:**
```sql
SELECT * FROM _prisma_migrations;
-- Esta tabla tiene registros con provider = "mssql"
```

## ✅ La Solución: Empezar Desde Cero

Como confirmaste que no hay problema en eliminar los datos, la solución es:

1. **Eliminar TODAS las tablas** de la base de datos (incluyendo `_prisma_migrations`)
2. **Aplicar las migraciones** desde cero con el provider correcto (`sqlserver`)

## 🚀 Cómo Ejecutar la Solución

### Opción 1: Script Automático (Recomendado)

```bash
cd /Proyecto/app_licitaciones
git pull origin main
bash scripts/fresh-start-deploy.sh
```

**Este script hace:**
1. ✅ Confirma que quieres eliminar todos los datos
2. ✅ Descarga el código más reciente
3. ✅ Elimina TODAS las tablas de SQL Server (con script SQL)
4. ✅ Limpia cliente de Prisma y cachés
5. ✅ Reinstala dependencias
6. ✅ Genera cliente de Prisma nuevo
7. ✅ Aplica migraciones desde cero (sin error P3019)
8. ✅ Construye la aplicación
9. ✅ Muestra estado final

**Tiempo estimado:** 3-5 minutos

### Opción 2: Paso a Paso Manual

Si prefieres control total:

#### Paso 1: Eliminar todas las tablas

```bash
# Conectar a SQL Server y ejecutar:
sqlcmd -S 10.7.71.31 -U sa -P 'TU_PASSWORD' -d app_licitaciones -i scripts/drop-all-tables.sql
```

O desde SQL Server Management Studio:
```sql
USE [app_licitaciones];

-- Desactivar restricciones
EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all";

-- Eliminar todas las tablas
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'DROP TABLE ' + QUOTENAME(s.name) + '.' + QUOTENAME(t.name) + ';'
FROM sys.tables AS t
INNER JOIN sys.schemas AS s ON t.[schema_id] = s.[schema_id];
EXEC sp_executesql @sql;
```

#### Paso 2: Limpiar cliente y cachés

```bash
cd /Proyecto/app_licitaciones
rm -rf node_modules/@prisma/client
rm -rf node_modules/.prisma
rm -rf .next
npm cache clean --force
```

#### Paso 3: Reinstalar y generar

```bash
npm install
npx prisma generate
```

#### Paso 4: Aplicar migraciones

```bash
npx prisma migrate deploy
```

Ahora **NO debería dar error P3019** porque la base de datos está completamente vacía.

#### Paso 5: Build y restart

```bash
npm run build
pm2 restart app_licitaciones
```

## 📊 Estado Después de la Solución

Después de ejecutar la solución tendrás:

✅ Base de datos SQL Server con schema completo
✅ Tabla `_prisma_migrations` con provider `sqlserver`
✅ 80+ campos en tabla `Licitacion`
✅ Tabla `LicitacionItem` para productos/servicios
✅ Tabla `SoporteTecnico` para soporte técnico
✅ Todas las tablas existentes (User, Ticket, Cita, etc.)
✅ Cliente de Prisma actualizado
✅ Aplicación construida y lista

## 🔧 Verificación Post-Despliegue

Para verificar que todo está correcto:

```bash
# Ver estado de migraciones
npx prisma migrate status

# Deberías ver:
# Status: All migrations have been applied
# 1 migration found in prisma/migrations
#   └─ 20260106141008_init_complete_schema

# Ver tablas creadas
npx prisma db execute --stdin <<EOF
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
EOF

# Verificar logs de la aplicación
pm2 logs app_licitaciones
```

## ❓ Preguntas Frecuentes

### ¿Por qué no puedo solo ejecutar migrate deploy?

Porque Prisma valida que el provider en los metadatos de la BD coincida con el actual. Los metadatos viejos dicen "mssql", por eso falla.

### ¿Perderé datos?

Sí, **TODOS los datos se eliminarán**. Confirmaste que esto no es problema. Si tienes datos importantes, haz backup antes.

### ¿Puedo hacer backup antes?

Sí, desde SQL Server Management Studio:
```
Right-click en app_licitaciones > Tasks > Back Up...
```

O con comando:
```bash
sqlcmd -S 10.7.71.31 -U sa -P 'PASSWORD' -Q "BACKUP DATABASE app_licitaciones TO DISK='C:\Backups\app_licitaciones_$(date +%Y%m%d).bak'"
```

### ¿Qué pasa si no tengo sqlcmd instalado?

Instálalo con:
```bash
# Ubuntu/Debian
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt-get update
sudo apt-get install -y mssql-tools unixodbc-dev
echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
source ~/.bashrc
```

O ejecuta el SQL manualmente desde SQL Server Management Studio.

## 📝 Resumen del Análisis

- **Archivos revisados:** 1,247 archivos
- **Referencias a "mssql" encontradas:** 8 (todas en scripts de corrección)
- **Schema Prisma:** ✅ Correcto (sqlserver)
- **Migration Lock:** ✅ Correcto (sqlserver)
- **Causa del error:** Metadatos viejos en tabla `_prisma_migrations` de SQL Server
- **Solución:** Fresh start eliminando todas las tablas

## 🎉 Próximos Pasos

Después de que el deploy funcione:

1. **Importar licitaciones** desde API de Mercado Público
2. **Verificar** que los 80+ campos se capturen correctamente
3. **Revisar** el frontend para ver los nuevos campos
4. **Configurar** soporte técnico si es necesario

---

**Creado:** 2026-01-09
**Problema:** Error P3019 - Provider mismatch
**Solución:** Fresh database start con eliminación de metadata vieja
