import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildSlaDates } from "@/lib/sla";
import { resolveAutoAssignee } from "@/lib/ticket-automation";
import { getDefaultTicketGrupo } from "@/lib/ticket-access";

const ALLOWED_CHANNELS = ["PORTAL", "EMAIL", "CHAT", "WHATSAPP"];

export async function POST(req: Request) {
  try {
    const token = process.env.INBOUND_TICKETS_TOKEN;
    if (token) {
      const headerToken = req.headers.get("x-inbound-token");
      if (!headerToken || headerToken !== token) {
        return NextResponse.json({ error: "Token invalido" }, { status: 401 });
      }
    } else {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
      }
    }

    const body = await req.json();
    const canal = typeof body.canal === "string" ? body.canal.toUpperCase() : "EMAIL";
    if (!ALLOWED_CHANNELS.includes(canal)) {
      return NextResponse.json({ error: "Canal no soportado" }, { status: 400 });
    }

    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const fromEmail = typeof body.fromEmail === "string" ? body.fromEmail.trim() : "";
    const fromName = typeof body.fromName === "string" ? body.fromName.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    let ownerId = typeof body.ownerId === "string" ? body.ownerId : null;
    if (!ownerId && fromEmail) {
      const owner = await prisma.user.findUnique({
        where: { email: fromEmail },
        select: { id: true },
      });
      ownerId = owner?.id ?? null;
    }

    if (!ownerId) {
      return NextResponse.json(
        { error: "OwnerId o email valido requerido" },
        { status: 400 }
      );
    }

    const ticketId = typeof body.ticketId === "string" ? body.ticketId : null;
    const prioridad = typeof body.priority === "string" ? body.priority : "MEDIA";
    const tipo = typeof body.type === "string" ? body.type : "Ingreso canal";

    if (ticketId) {
      const ticket = await prisma.ticket.findFirst({
        where: { id: ticketId, deletedAt: null },
        select: { id: true },
      });
      if (!ticket) {
        return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
      }

      const mensaje = await prisma.ticketMensaje.create({
        data: {
          ticketId,
          contenido: message,
          canal,
          direccion: "IN",
          esInterno: false,
          autorNombre: fromName || null,
          autorEmail: fromEmail || null,
        },
      });

      return NextResponse.json({ ticketId, mensajeId: mensaje.id }, { status: 201 });
    }

    const slaDates = buildSlaDates(prioridad);
    const autoAssignee = await resolveAutoAssignee({
      type: tipo,
      priority: prioridad,
    });
    const finalAssigneeId = autoAssignee?.assigneeId ?? null;
    const finalAssigneeName =
      autoAssignee?.assigneeName ?? autoAssignee?.assigneeEmail ?? null;
    const assignedAt = finalAssigneeId ? new Date() : null;
    const initialStatus = finalAssigneeId ? "ASIGNADO" : "CREADO";

    const defaultGrupo = await getDefaultTicketGrupo(ownerId);

    const ticket = await prisma.ticket.create({
      data: {
        title: subject || `Ticket ${canal}`,
        description: message,
        type: tipo,
        priority: prioridad,
        status: initialStatus,
        assignee: finalAssigneeName,
        assigneeId: finalAssigneeId,
        ownerId,
        canal,
        externalRef: typeof body.externalRef === "string" ? body.externalRef : null,
        departamentoId: defaultGrupo.departamentoId,
        unidadId: defaultGrupo.unidadId,
        assignedAt,
        slaResponseMinutes: slaDates.responseMinutes,
        slaResolutionMinutes: slaDates.resolutionMinutes,
        slaResponseDueAt: slaDates.responseDueAt,
        slaResolutionDueAt: slaDates.resolutionDueAt,
      },
    });

    await prisma.ticketMensaje.create({
      data: {
        ticketId: ticket.id,
        contenido: message,
        canal,
        direccion: "IN",
        esInterno: false,
        autorNombre: fromName || null,
        autorEmail: fromEmail || null,
      },
    });

    const supervisores = await prisma.user.findMany({
      where: {
        role: { in: ["SUPERVISOR", "ADMIN"] },
        activo: true,
      },
      select: { id: true },
    });

    if (supervisores.length > 0) {
      await prisma.notificacion.createMany({
        data: supervisores.map((user) => ({
          tipo: "INFO",
          titulo: "Nuevo ticket desde canal",
          mensaje: `Se registro un nuevo ticket via ${canal}: ${ticket.title}`,
          userId: user.id,
          referenceType: "TICKET",
          referenceId: ticket.id,
        })),
      });
    }

    if (ticket.assigneeId) {
      await prisma.notificacion.create({
        data: {
          tipo: "INFO",
          titulo: "Ticket asignado",
          mensaje: `Tienes un nuevo ticket asignado: ${ticket.title}`,
          userId: ticket.assigneeId,
          referenceType: "TICKET",
          referenceId: ticket.id,
        },
      });
    }

    return NextResponse.json({ ticketId: ticket.id }, { status: 201 });
  } catch (error) {
    console.error("Error ingresando ticket:", error);
    return NextResponse.json({ error: "Error al ingresar ticket" }, { status: 500 });
  }
}
