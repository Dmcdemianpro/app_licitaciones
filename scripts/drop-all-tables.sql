-- Script para eliminar TODAS las tablas de la base de datos
-- Esto incluye la tabla _prisma_migrations que contiene metadata vieja
-- ADVERTENCIA: Este script elimina TODOS los datos

USE [app_licitaciones];
GO

-- Desactivar todas las restricciones de clave foránea
EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"
GO

-- Eliminar todas las tablas
DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql += N'DROP TABLE ' + QUOTENAME(s.name) + '.' + QUOTENAME(t.name) + ';' + CHAR(13)
FROM sys.tables AS t
INNER JOIN sys.schemas AS s ON t.[schema_id] = s.[schema_id]
WHERE t.[type] = 'U';

PRINT @sql;
EXEC sp_executesql @sql;
GO

PRINT 'Todas las tablas han sido eliminadas';
PRINT 'Ahora puede ejecutar las migraciones de Prisma desde cero';
GO
