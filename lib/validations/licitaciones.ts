import { z } from 'zod'
import { LICITACION_ESTADO, LICITACION_TIPO, MONEDAS } from '@/lib/constants'

// Schema para crear licitación
export const licitacionCreateSchema = z.object({
  codigoExterno: z.string().max(100).optional(),
  nombre: z.string().min(5, 'El nombre debe tener al menos 5 caracteres').max(500),
  descripcion: z.string().max(5000).optional(),
  entidad: z.string().min(3, 'La entidad es requerida').max(255),
  tipo: z.enum([LICITACION_TIPO.PUBLICA, LICITACION_TIPO.PRIVADA, LICITACION_TIPO.INTERNACIONAL]),
  estado: z.enum([
    LICITACION_ESTADO.EN_PREPARACION,
    LICITACION_ESTADO.ACTIVA,
    LICITACION_ESTADO.ADJUDICADA,
    LICITACION_ESTADO.DESIERTA,
    LICITACION_ESTADO.CANCELADA,
  ]).default(LICITACION_ESTADO.EN_PREPARACION),
  montoEstimado: z.number().positive().optional(),
  moneda: z.enum([MONEDAS.CLP, MONEDAS.USD, MONEDAS.EUR]).default(MONEDAS.CLP),
  fechaPublicacion: z.coerce.date().optional(),
  fechaCierre: z.coerce.date().optional(),
  fechaAdjudicacion: z.coerce.date().optional(),
  urlExterna: z.string().url().max(500).optional().or(z.literal('')),
  responsableId: z.string().optional(),
}).refine((data) => {
  // Validar que fechaCierre sea posterior a fechaPublicacion
  if (data.fechaPublicacion && data.fechaCierre) {
    return data.fechaCierre > data.fechaPublicacion
  }
  return true
}, {
  message: 'La fecha de cierre debe ser posterior a la fecha de publicación',
  path: ['fechaCierre'],
})

// Schema para actualizar licitación
export const licitacionUpdateSchema = licitacionCreateSchema.partial()

// Schema para búsqueda/filtros
export const licitacionFilterSchema = z.object({
  q: z.string().optional(),
  estado: z.enum([
    LICITACION_ESTADO.EN_PREPARACION,
    LICITACION_ESTADO.ACTIVA,
    LICITACION_ESTADO.ADJUDICADA,
    LICITACION_ESTADO.DESIERTA,
    LICITACION_ESTADO.CANCELADA,
  ]).optional(),
  tipo: z.enum([LICITACION_TIPO.PUBLICA, LICITACION_TIPO.PRIVADA, LICITACION_TIPO.INTERNACIONAL]).optional(),
  entidad: z.string().optional(),
  responsableId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})
