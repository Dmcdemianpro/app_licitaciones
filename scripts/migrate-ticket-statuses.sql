-- Normalize legacy ticket statuses to the current enum values.
UPDATE tickets SET status = 'CREADO' WHERE status = 'ABIERTO';
UPDATE tickets SET status = 'INICIADO' WHERE status = 'EN_PROGRESO';
UPDATE tickets SET status = 'FINALIZADO' WHERE status IN ('RESUELTO', 'CERRADO');
