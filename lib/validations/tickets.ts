import { z } from "zod";
import { TICKET_STATUS, TICKET_PRIORITY } from "@/lib/constants";

const statusEnum = z.enum([
  TICKET_STATUS.CREADO,
  TICKET_STATUS.ASIGNADO,
  TICKET_STATUS.EN_PROGRESO,
  TICKET_STATUS.PENDIENTE_VALIDACION,
  TICKET_STATUS.FINALIZADO,
  TICKET_STATUS.REABIERTO,
]);

const priorityEnum = z.enum([
  TICKET_PRIORITY.ALTA,
  TICKET_PRIORITY.MEDIA,
  TICKET_PRIORITY.BAJA,
]);

const baseTicketSchema = z.object({
  title: z.string().min(3, "Título debe tener al menos 3 caracteres").max(255),
  description: z.string().min(5, "Descripción requerida"),
  type: z.string().min(2, "Tipo requerido").max(100),
  priority: priorityEnum,
  status: statusEnum.optional(),
  assignee: z.string().max(255).optional().nullable(),
  assigneeId: z.string().max(100).optional().nullable(),
});

export const ticketCreateSchema = baseTicketSchema.extend({
  status: statusEnum.default(TICKET_STATUS.CREADO),
});

export const ticketUpdateSchema = baseTicketSchema.partial();

// Schema para filtros
export const ticketFilterSchema = z.object({
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  type: z.string().optional(),
  assignee: z.string().optional(),
  ownerId: z.string().optional(),
  q: z.string().optional(), // búsqueda por texto
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
export type TicketFilter = z.infer<typeof ticketFilterSchema>;
