-- =====================================================
-- SCRIPT PARA EJECUTAR DIRECTAMENTE EN SSMS O AZURE DATA STUDIO
-- Elimina TODAS las tablas de la base de datos DB_licitaciones
-- =====================================================

USE [DB_licitaciones];
GO

PRINT '======================================';
PRINT 'Iniciando eliminación de todas las tablas';
PRINT '======================================';
PRINT '';

-- Paso 1: Desactivar todas las restricciones de clave foránea
PRINT 'Paso 1: Desactivando restricciones de clave foránea...';
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all';
PRINT 'Restricciones desactivadas';
PRINT '';

-- Paso 2: Eliminar todas las tablas
PRINT 'Paso 2: Eliminando todas las tablas...';
DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql += N'DROP TABLE ' + QUOTENAME(s.name) + '.' + QUOTENAME(t.name) + ';' + CHAR(13) + CHAR(10)
FROM sys.tables AS t
INNER JOIN sys.schemas AS s ON t.[schema_id] = s.[schema_id]
WHERE t.[type] = 'U'
ORDER BY t.name;

-- Mostrar el SQL que se ejecutará
PRINT 'Tablas a eliminar:';
PRINT @sql;
PRINT '';

-- Ejecutar la eliminación
EXEC sp_executesql @sql;

PRINT '';
PRINT '======================================';
PRINT 'TODAS LAS TABLAS HAN SIDO ELIMINADAS';
PRINT '======================================';
PRINT '';
PRINT 'Ahora puede ejecutar las migraciones de Prisma';
GO
