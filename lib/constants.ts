/**
 * Constantes del sistema para estados, tipos y configuración
 */

// Roles de usuario
export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SUPERVISOR: 'SUPERVISOR',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

// Estados de Ticket
export const TICKET_STATUS = {
  CREADO: 'CREADO',
  ASIGNADO: 'ASIGNADO',
  EN_PROGRESO: 'EN_PROGRESO',
  PENDIENTE_VALIDACION: 'PENDIENTE_VALIDACION',
  FINALIZADO: 'FINALIZADO',
  REABIERTO: 'REABIERTO',
} as const

export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS]

// Prioridades de Ticket
export const TICKET_PRIORITY = {
  ALTA: 'ALTA',
  MEDIA: 'MEDIA',
  BAJA: 'BAJA',
} as const

export type TicketPriority = typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY]

// Estados de Licitación
export const LICITACION_ESTADO = {
  EN_PREPARACION: 'EN_PREPARACION',
  ACTIVA: 'ACTIVA',
  ADJUDICADA: 'ADJUDICADA',
  DESIERTA: 'DESIERTA',
  CANCELADA: 'CANCELADA',
} as const

export type LicitacionEstado = typeof LICITACION_ESTADO[keyof typeof LICITACION_ESTADO]

// Tipos de Licitación
export const LICITACION_TIPO = {
  PUBLICA: 'PUBLICA',
  PRIVADA: 'PRIVADA',
  INTERNACIONAL: 'INTERNACIONAL',
} as const

export type LicitacionTipo = typeof LICITACION_TIPO[keyof typeof LICITACION_TIPO]

// Monedas
export const MONEDAS = {
  CLP: 'CLP',
  USD: 'USD',
  EUR: 'EUR',
} as const

export type Moneda = typeof MONEDAS[keyof typeof MONEDAS]

// Estados de Cita
export const CITA_ESTADO = {
  PROGRAMADA: 'PROGRAMADA',
  CONFIRMADA: 'CONFIRMADA',
  COMPLETADA: 'COMPLETADA',
  CANCELADA: 'CANCELADA',
} as const

export type CitaEstado = typeof CITA_ESTADO[keyof typeof CITA_ESTADO]

// Tipos de Cita
export const CITA_TIPO = {
  REUNION: 'REUNION',
  PRESENTACION: 'PRESENTACION',
  VISITA: 'VISITA',
  ENTREGA: 'ENTREGA',
  OTRO: 'OTRO',
} as const

export type CitaTipo = typeof CITA_TIPO[keyof typeof CITA_TIPO]

// Tipos de Notificación
export const NOTIFICACION_TIPO = {
  INFO: 'INFO',
  ADVERTENCIA: 'ADVERTENCIA',
  ERROR: 'ERROR',
  EXITO: 'EXITO',
} as const

export type NotificacionTipo = typeof NOTIFICACION_TIPO[keyof typeof NOTIFICACION_TIPO]

// Tipos de Referencia para Notificaciones
export const NOTIFICACION_REFERENCE = {
  TICKET: 'TICKET',
  LICITACION: 'LICITACION',
  CITA: 'CITA',
} as const

export type NotificacionReference = typeof NOTIFICACION_REFERENCE[keyof typeof NOTIFICACION_REFERENCE]

// Acciones de Auditoría
export const AUDITORIA_ACCION = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
} as const

export type AuditoriaAccion = typeof AUDITORIA_ACCION[keyof typeof AUDITORIA_ACCION]

// Entidades de Auditoría
export const AUDITORIA_ENTIDAD = {
  USER: 'USER',
  TICKET: 'TICKET',
  LICITACION: 'LICITACION',
  CITA: 'CITA',
  DOCUMENTO: 'DOCUMENTO',
  NOTA: 'NOTA',
} as const

export type AuditoriaEntidad = typeof AUDITORIA_ENTIDAD[keyof typeof AUDITORIA_ENTIDAD]

// Configuración
export const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
  ],
  ITEMS_PER_PAGE: 10,
  SESSION_TIMEOUT: 3600000, // 1 hora en ms
} as const
