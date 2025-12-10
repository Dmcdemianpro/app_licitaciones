import { z } from 'zod'
import { CITA_ESTADO, CITA_TIPO } from '@/lib/constants'

// Schema para crear cita
export const citaCreateSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(255),
  descripcion: z.string().max(5000).optional(),
  tipo: z.enum([
    CITA_TIPO.REUNION,
    CITA_TIPO.PRESENTACION,
    CITA_TIPO.VISITA,
    CITA_TIPO.ENTREGA,
    CITA_TIPO.OTRO,
  ]).default(CITA_TIPO.REUNION),
  estado: z.enum([
    CITA_ESTADO.PROGRAMADA,
    CITA_ESTADO.CONFIRMADA,
    CITA_ESTADO.COMPLETADA,
    CITA_ESTADO.CANCELADA,
  ]).default(CITA_ESTADO.PROGRAMADA),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
  ubicacion: z.string().max(255).optional(),
  urlReunion: z.string().url().max(500).optional().or(z.literal('')),
  licitacionId: z.string().optional(),
  participantes: z.array(z.string()).optional(),
}).refine((data) => {
  // Validar que fechaFin sea posterior a fechaInicio
  return data.fechaFin > data.fechaInicio
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fechaFin'],
})

// Schema para actualizar cita
export const citaUpdateSchema = citaCreateSchema.partial()

// Schema para filtros
export const citaFilterSchema = z.object({
  estado: z.enum([
    CITA_ESTADO.PROGRAMADA,
    CITA_ESTADO.CONFIRMADA,
    CITA_ESTADO.COMPLETADA,
    CITA_ESTADO.CANCELADA,
  ]).optional(),
  tipo: z.enum([
    CITA_TIPO.REUNION,
    CITA_TIPO.PRESENTACION,
    CITA_TIPO.VISITA,
    CITA_TIPO.ENTREGA,
    CITA_TIPO.OTRO,
  ]).optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})
