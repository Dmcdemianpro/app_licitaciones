import { z } from "zod";

const statusEnum = z.enum(["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO"]);
const priorityEnum = z.enum(["ALTA", "MEDIA", "BAJA"]);

const baseTicketSchema = z.object({
  title: z.string().min(3, "Título muy corto"),
  description: z.string().min(5, "Descripción requerida"),
  type: z.string().min(2, "Tipo requerido"),
  priority: priorityEnum,
  status: statusEnum.optional(),
  assignee: z.string().optional().nullable(),
});

export const ticketCreateSchema = baseTicketSchema.extend({
  status: statusEnum.default("ABIERTO"),
});

export const ticketUpdateSchema = baseTicketSchema.partial();

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
