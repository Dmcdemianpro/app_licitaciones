-- Verificar si las columnas folio existen
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('tickets', 'citas')
AND COLUMN_NAME = 'folio'
ORDER BY TABLE_NAME;
