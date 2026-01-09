# Pasos para Deployment Manual (Sin sqlcmd)

## 🎯 Resumen

Como no tienes `sqlcmd` instalado, harás el deployment en 2 fases:
1. **Fase 1:** Eliminar tablas usando SQL Server Management Studio (SSMS)
2. **Fase 2:** Ejecutar script bash que hace el resto

---

## 📋 Fase 1: Eliminar Tablas en SSMS

### Paso 1.1: Conectar al Servidor SQL

1. Abre **SQL Server Management Studio** o **Azure Data Studio**
2. Conéctate con estas credenciales:
   - Servidor: `10.7.71.31`
   - Usuario: `usr_DB_licitaciones`
   - Contraseña: (tu contraseña)
   - Base de datos: `DB_licitaciones`

### Paso 1.2: Copiar el Script SQL

Desde el servidor Linux, copia el contenido del script:

```bash
cat /Proyecto/app_licitaciones/scripts/drop-all-tables-manual.sql
```

O descárgalo desde GitHub:
- https://github.com/Dmcdemianpro/app_licitaciones/blob/main/scripts/drop-all-tables-manual.sql

### Paso 1.3: Ejecutar el Script

1. En SSMS/Azure Data Studio, crea una **Nueva Consulta**
2. **Pega** el contenido del script `drop-all-tables-manual.sql`
3. Verifica que esté conectado a la base de datos `DB_licitaciones`
4. Haz clic en **Ejecutar** o presiona `F5`

**Salida esperada:**
```
======================================
Iniciando eliminación de todas las tablas
======================================

Paso 1: Desactivando restricciones de clave foránea...
Restricciones desactivadas

Paso 2: Eliminando todas las tablas...
Tablas a eliminar:
DROP TABLE [dbo].[Cita];
DROP TABLE [dbo].[Documento];
DROP TABLE [dbo].[Licitacion];
DROP TABLE [dbo].[LicitacionItem];
DROP TABLE [dbo].[Nota];
DROP TABLE [dbo].[SoporteTecnico];
DROP TABLE [dbo].[Ticket];
DROP TABLE [dbo].[User];
DROP TABLE [dbo].[_prisma_migrations];

======================================
TODAS LAS TABLAS HAN SIDO ELIMINADAS
======================================
```

### Paso 1.4: Verificar que las Tablas Fueron Eliminadas

En SSMS, expande:
```
DB_licitaciones > Tablas
```

**Debe estar vacío.** Si aún ves tablas, ejecútalas manualmente:

```sql
DROP TABLE [dbo].[Cita];
DROP TABLE [dbo].[Documento];
DROP TABLE [dbo].[LicitacionItem];
DROP TABLE [dbo].[Nota];
DROP TABLE [dbo].[SoporteTecnico];
DROP TABLE [dbo].[Ticket];
DROP TABLE [dbo].[Licitacion];
DROP TABLE [dbo].[User];
DROP TABLE [dbo].[_prisma_migrations];
```

---

## 🚀 Fase 2: Ejecutar Script Bash

### Paso 2.1: Conectar al Servidor Linux

```bash
ssh root@10.7.71.31
cd /Proyecto/app_licitaciones
```

### Paso 2.2: Actualizar Código

```bash
git pull origin main
```

### Paso 2.3: Ejecutar Script de Deployment

```bash
bash scripts/deploy-systemd-sin-sqlcmd.sh
```

El script te preguntará:
```
¿Ya eliminaste las tablas manualmente? (escribe 'SI'):
```

Escribe `SI` y presiona Enter.

### Paso 2.4: Esperar a que Termine

El script hará automáticamente:
- ✅ Detener servicio systemd
- ✅ Actualizar código
- ✅ Aplicar parche del provider
- ✅ Limpiar cachés
- ✅ Instalar dependencias
- ✅ Generar cliente de Prisma
- ✅ Aplicar migraciones (crear todas las tablas)
- ✅ Construir aplicación
- ✅ Iniciar servicio

**Tiempo:** 5-7 minutos

---

## ✅ Verificación

### Verificar Servicio

```bash
systemctl status licitaciones
# Debe decir: Active: active (running)
```

### Verificar Logs

```bash
journalctl -u licitaciones -f
# Debe mostrar: Ready on http://0.0.0.0:3001
```

### Verificar Tablas en SSMS

En SSMS, refresca las tablas:
```
DB_licitaciones > Tablas > (Refresh)
```

**Debes ver:**
- ✅ Cita
- ✅ Documento
- ✅ Licitacion (con 80+ columnas)
- ✅ LicitacionItem ← **NUEVA**
- ✅ Nota
- ✅ SoporteTecnico ← **NUEVA**
- ✅ Ticket
- ✅ User
- ✅ _prisma_migrations

### Verificar Aplicación

Desde tu navegador:
```
http://10.7.71.31:3001
```

Debe cargar la aplicación.

---

## 🔧 Script SQL Completo

Si prefieres copiar y pegar directamente, aquí está el script completo:

```sql
USE [DB_licitaciones];
GO

PRINT 'Eliminando todas las tablas...';

-- Desactivar restricciones
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all';

-- Eliminar todas las tablas
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'DROP TABLE ' + QUOTENAME(s.name) + '.' + QUOTENAME(t.name) + ';'
FROM sys.tables AS t
INNER JOIN sys.schemas AS s ON t.[schema_id] = s.[schema_id]
WHERE t.[type] = 'U';

EXEC sp_executesql @sql;

PRINT 'Todas las tablas eliminadas';
GO
```

---

## 🆘 Problemas Comunes

### Error: "Cannot drop table 'X' because it is being referenced by a FOREIGN KEY constraint"

**Solución:** Ejecuta primero:
```sql
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all';
```

Luego ejecuta el DROP de nuevo.

### Error: "The database is in use"

**Solución:**
```sql
USE master;
GO

-- Cerrar todas las conexiones
ALTER DATABASE DB_licitaciones SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO

-- Volver a multi-user
ALTER DATABASE DB_licitaciones SET MULTI_USER;
GO

USE DB_licitaciones;
GO
```

### El script bash falla con "Error al aplicar migraciones"

**Verificar:**
1. DATABASE_URL en `.env` es correcta:
```bash
cat .env | grep DATABASE_URL
```

2. La conexión funciona:
```bash
npx prisma db execute --stdin <<'EOF'
SELECT 1 as test;
EOF
```

---

## 📞 Comandos Útiles

```bash
# Ver estado del servicio
systemctl status licitaciones

# Ver logs en tiempo real
journalctl -u licitaciones -f

# Reiniciar servicio
systemctl restart licitaciones

# Verificar migraciones
npx prisma migrate status

# Ver tablas creadas
npx prisma db execute --stdin <<'EOF'
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
EOF
```

---

## 🎉 ¡Listo!

Después de seguir estos pasos tendrás:
- ✅ Base de datos limpia con schema completo
- ✅ 80+ campos en Licitacion
- ✅ Nuevas tablas: LicitacionItem, SoporteTecnico
- ✅ Servicio corriendo
- ✅ Sin error P3019

---

**Última actualización:** 2026-01-09
**Método:** Manual (sin sqlcmd)
