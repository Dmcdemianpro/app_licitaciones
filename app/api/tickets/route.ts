import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ticketCreateSchema } from "@/lib/validations/tickets";
import { buildSlaDates, getSlaStatus } from "@/lib/sla";
import { resolveAutoAssignee } from "@/lib/ticket-automation";
import { startTicketScheduler } from "@/lib/ticket-scheduler";

startTicketScheduler();

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const isTechnician = session.user.role === "USER";
    const where = {
      deletedAt: null,
      ...(isTechnician ? { assigneeId: session.user.id } : {}),
    };

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Agregar folioFormateado a cada ticket
    const ticketsConFolio = tickets.map((ticket) => ({
      ...ticket,
      sla: getSlaStatus(ticket),
      folioFormateado: `HEC-T${String(ticket.folio).padStart(2, "0")}`,
    }));

    return NextResponse.json(ticketsConFolio);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Error al obtener tickets" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ticketCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const slaDates = buildSlaDates(parsed.data.priority);
    const inputAssigneeId = parsed.data.assigneeId ?? null;
    const inputAssignee = parsed.data.assignee?.trim() || null;
    const autoAssignee = !inputAssigneeId && !inputAssignee
      ? await resolveAutoAssignee({
          type: parsed.data.type,
          priority: parsed.data.priority,
        })
      : null;
    const finalAssigneeId = inputAssigneeId ?? autoAssignee?.assigneeId ?? null;
    const finalAssigneeName =
      inputAssignee ?? autoAssignee?.assigneeName ?? autoAssignee?.assigneeEmail ?? null;
    const assignedAt = finalAssigneeId ? new Date() : null;
    const initialStatus = finalAssigneeId ? "ASIGNADO" : "CREADO";

    const ticket = await prisma.ticket.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        priority: parsed.data.priority,
        status: initialStatus,
        assignee: finalAssigneeName,
        assigneeId: finalAssigneeId,
        ownerId: session.user.id,
        assignedAt,
        slaResponseMinutes: slaDates.responseMinutes,
        slaResolutionMinutes: slaDates.resolutionMinutes,
        slaResponseDueAt: slaDates.responseDueAt,
        slaResolutionDueAt: slaDates.resolutionDueAt,
      },
    });

    await prisma.auditoriaLog.create({
      data: {
        accion: "CREATE",
        entidad: "TICKET",
        entidadId: ticket.id,
        cambios: JSON.stringify({ nuevo: ticket }),
        userId: session.user.id,
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
          titulo: "Nuevo ticket creado",
          mensaje: `Se registro un nuevo ticket: ${ticket.title}`,
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

    // Agregar folioFormateado al ticket creado
    const ticketConFolio = {
      ...ticket,
      sla: getSlaStatus(ticket),
      folioFormateado: `HEC-T${String(ticket.folio).padStart(2, "0")}`,
    };

    return NextResponse.json(ticketConFolio, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Error al crear ticket" },
      { status: 500 }
    );
  }
}
