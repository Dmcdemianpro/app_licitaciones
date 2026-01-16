-- Normalize legacy ticket statuses to the current enum values.
UPDATE tickets SET status = 'CREADO' WHERE status = 'ABIERTO';
UPDATE tickets SET status = 'EN_PROGRESO' WHERE status = 'INICIADO';
UPDATE tickets SET status = 'FINALIZADO' WHERE status IN ('RESUELTO', 'CERRADO');
