import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ticketUpdateSchema } from "@/lib/validations/tickets";
import { buildSlaDates, getSlaStatus } from "@/lib/sla";
import { startTicketScheduler } from "@/lib/ticket-scheduler";
import { canAccessTicket } from "@/lib/ticket-access";

startTicketScheduler();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        departamento: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            color: true,
          },
        },
        unidad: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            departamentoId: true,
          },
        },
        parentTicket: {
          select: {
            id: true,
            folio: true,
            title: true,
            status: true,
          },
        },
        childTickets: {
          select: {
            id: true,
            folio: true,
            title: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }

    const role = session.user.role ?? "";
    if (role === "USER" && ticket.assigneeId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para ver este ticket" },
        { status: 403 }
      );
    }
    if (role !== "USER") {
      const canAccess = await canAccessTicket(session.user.id, role, id);
      if (!canAccess) {
        return NextResponse.json(
          { error: "No tienes permisos para ver este ticket" },
          { status: 403 }
        );
      }
    }

    // Agregar folioFormateado
    const ticketConFolio = {
      ...ticket,
      sla: getSlaStatus(ticket),
      folioFormateado: `HEC-T${String(ticket.folio).padStart(2, "0")}`,
    };

    return NextResponse.json({ ticket: ticketConFolio });
  } catch (error) {
    console.error("Error obteniendo ticket:", error);
    return NextResponse.json(
      { error: "Error al obtener ticket" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const role = session.user.role as string;
    const isManager = ["ADMIN", "SUPERVISOR"].includes(role);
    const isUser = role === "USER";

    const body = await req.json();

    // Obtener el ticket actual antes de actualizar (para auditoria)
    const ticketAnterior = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticketAnterior) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }
    if (isUser && ticketAnterior.assigneeId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para editar este ticket" },
        { status: 403 }
      );
    }
    if (!isUser) {
      const canAccess = await canAccessTicket(session.user.id, role, id);
      if (!canAccess) {
        return NextResponse.json(
          { error: "No tienes permisos para editar este ticket" },
          { status: 403 }
        );
      }
    }

    const allowedFields = isManager
      ? [
          "title",
          "description",
          "type",
          "priority",
          "status",
          "assignee",
          "assigneeId",
          "canal",
          "externalRef",
          "departamentoId",
          "unidadId",
          "parentTicketId",
        ]
      : ["status"];

    if (isUser) {
      const disallowed = Object.keys(body).filter((field) => !allowedFields.includes(field));
      if (disallowed.length > 0) {
        return NextResponse.json(
          { error: "No tienes permisos para editar estos campos" },
          { status: 403 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No hay cambios para actualizar" },
        { status: 400 }
      );
    }

    const legacyStatusMap: Record<string, string> = {
      ABIERTO: "CREADO",
      EN_PROGRESO: "EN_PROGRESO",
      INICIADO: "EN_PROGRESO",
      RESUELTO: "FINALIZADO",
      CERRADO: "FINALIZADO",
    };

    if (typeof updateData.status === "string" && legacyStatusMap[updateData.status]) {
      updateData.status = legacyStatusMap[updateData.status];
    }

    if (typeof updateData.assignee === "string") {
      updateData.assignee = updateData.assignee.trim() || null;
    }
    if (typeof updateData.departamentoId === "string") {
      updateData.departamentoId = updateData.departamentoId.trim() || null;
    }
    if (typeof updateData.unidadId === "string") {
      updateData.unidadId = updateData.unidadId.trim() || null;
    }
    if (typeof updateData.parentTicketId === "string") {
      updateData.parentTicketId = updateData.parentTicketId.trim() || null;
    }

    if (updateData.parentTicketId) {
      if (updateData.parentTicketId === id) {
        return NextResponse.json(
          { error: "El ticket padre no puede ser el mismo ticket" },
          { status: 400 }
        );
      }
      const parent = await prisma.ticket.findUnique({
        where: { id: updateData.parentTicketId as string },
        select: { id: true },
      });
      if (!parent) {
        return NextResponse.json({ error: "Ticket padre no encontrado" }, { status: 400 });
      }
    }

    if (
      isManager &&
      updateData.assigneeId &&
      !updateData.status &&
      ticketAnterior.status === "CREADO"
    ) {
      updateData.status = "ASIGNADO";
    }

    const parsed = ticketUpdateSchema.safeParse(updateData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const currentStatus = ticketAnterior.status;
    const hasStatus = Object.prototype.hasOwnProperty.call(parsed.data, "status");
    const nextStatus = hasStatus ? (parsed.data.status as string | undefined) : undefined;
    const hasAssigneeId = Object.prototype.hasOwnProperty.call(parsed.data, "assigneeId");
    const nextAssigneeId = hasAssigneeId
      ? (parsed.data.assigneeId as string | null | undefined)
      : ticketAnterior.assigneeId;

    if (isUser) {
      const isAssignee = ticketAnterior.assigneeId === session.user.id;
      if (!isAssignee) {
        return NextResponse.json(
          { error: "No tienes permisos para editar este ticket" },
          { status: 403 }
        );
      }

      if (!nextStatus) {
        return NextResponse.json(
          { error: "Debes indicar un estado" },
          { status: 400 }
        );
      }

      const allowedUserTransition =
        ((currentStatus === "ASIGNADO" || currentStatus === "REABIERTO") && nextStatus === "EN_PROGRESO") ||
        (currentStatus === "EN_PROGRESO" && nextStatus === "PENDIENTE_VALIDACION");

      if (!allowedUserTransition) {
        return NextResponse.json(
          { error: "Transicion de estado no permitida para tu rol" },
          { status: 403 }
        );
      }
    }

    if (isManager && nextStatus) {
      if (nextStatus === "EN_PROGRESO" || nextStatus === "PENDIENTE_VALIDACION") {
        return NextResponse.json(
          { error: "Solo el responsable puede cambiar a este estado" },
          { status: 403 }
        );
      }

      if (nextStatus === "ASIGNADO") {
        const nextAssignee = (parsed.data.assigneeId as string | null | undefined) ?? ticketAnterior.assigneeId;
        if (!nextAssignee) {
          return NextResponse.json(
            { error: "Debes asignar un responsable antes de asignar el ticket" },
            { status: 400 }
          );
        }
        if (!["CREADO", "REABIERTO", "ASIGNADO"].includes(currentStatus)) {
          return NextResponse.json(
            { error: "No puedes asignar desde el estado actual" },
            { status: 400 }
          );
        }
      }

      if (nextStatus === "FINALIZADO" || nextStatus === "REABIERTO") {
        if (currentStatus !== "PENDIENTE_VALIDACION") {
          return NextResponse.json(
            { error: "Solo puedes revisar tickets en validacion" },
            { status: 400 }
          );
        }
      }
    }

    const systemUpdates: Prisma.TicketUpdateInput = {};
    const now = new Date();

    if (hasAssigneeId) {
      if (nextAssigneeId && nextAssigneeId !== ticketAnterior.assigneeId) {
        systemUpdates.assignedAt = now;
      }
      if (!nextAssigneeId && ticketAnterior.assigneeId) {
        systemUpdates.assignedAt = null;
      }
    }

    if (nextStatus && nextStatus !== currentStatus) {
      if (nextStatus === "ASIGNADO") {
        systemUpdates.assignedAt = now;
      }
      if (nextStatus === "EN_PROGRESO") {
        systemUpdates.startedAt = now;
        if (ticketAnterior.firstResponseAt == null) {
          systemUpdates.firstResponseAt = now;
        }
      }
      if (nextStatus === "PENDIENTE_VALIDACION") {
        systemUpdates.pendingValidationAt = now;
        if (ticketAnterior.firstResponseAt == null) {
          systemUpdates.firstResponseAt = now;
        }
      }
      if (nextStatus === "FINALIZADO") {
        systemUpdates.closedAt = now;
        if (ticketAnterior.firstResponseAt == null) {
          systemUpdates.firstResponseAt = now;
        }
      }
      if (nextStatus === "REABIERTO") {
        systemUpdates.reopenedAt = now;
        systemUpdates.closedAt = null;
      }
    }

    const hasPriority = Object.prototype.hasOwnProperty.call(parsed.data, "priority");
    const nextPriority = (hasPriority ? parsed.data.priority : ticketAnterior.priority) as string;
    const missingSla =
      ticketAnterior.slaResponseMinutes == null ||
      ticketAnterior.slaResolutionMinutes == null ||
      ticketAnterior.slaResponseDueAt == null ||
      ticketAnterior.slaResolutionDueAt == null;
    const priorityChanged = hasPriority && parsed.data.priority !== ticketAnterior.priority;

    if (missingSla || priorityChanged) {
      const slaDates = buildSlaDates(nextPriority, ticketAnterior.createdAt);
      systemUpdates.slaResponseMinutes = slaDates.responseMinutes;
      systemUpdates.slaResolutionMinutes = slaDates.resolutionMinutes;
      systemUpdates.slaResponseDueAt = slaDates.responseDueAt;
      systemUpdates.slaResolutionDueAt = slaDates.resolutionDueAt;
    }

    const responseDueAt =
      (systemUpdates.slaResponseDueAt as Date | undefined) ?? ticketAnterior.slaResponseDueAt;
    const resolutionDueAt =
      (systemUpdates.slaResolutionDueAt as Date | undefined) ?? ticketAnterior.slaResolutionDueAt;
    const firstResponseAt =
      (systemUpdates.firstResponseAt as Date | undefined) ?? ticketAnterior.firstResponseAt;
    const closedAt =
      (systemUpdates.closedAt as Date | null | undefined) ?? ticketAnterior.closedAt;

    if (
      systemUpdates.firstResponseAt &&
      responseDueAt &&
      firstResponseAt &&
      firstResponseAt > responseDueAt &&
      ticketAnterior.slaResponseBreachedAt == null
    ) {
      systemUpdates.slaResponseBreachedAt = firstResponseAt;
    }

    if (
      systemUpdates.closedAt &&
      resolutionDueAt &&
      closedAt &&
      closedAt > resolutionDueAt &&
      ticketAnterior.slaResolutionBreachedAt == null
    ) {
      systemUpdates.slaResolutionBreachedAt = closedAt;
    }

    const updatePayload: Prisma.TicketUpdateInput = {
      ...parsed.data,
      ...systemUpdates,
    };

    // Actualizar el ticket
    const ticket = await prisma.ticket.update({
      where: { id },
      data: updatePayload,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        departamento: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            color: true,
          },
        },
        unidad: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            departamentoId: true,
          },
        },
        parentTicket: {
          select: {
            id: true,
            folio: true,
            title: true,
            status: true,
          },
        },
        childTickets: {
          select: {
            id: true,
            folio: true,
            title: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Registrar cambios en auditoria
    const cambios: Record<string, { anterior: any; nuevo: any }> = {};
    Object.keys(updatePayload).forEach((key) => {
      if (ticketAnterior[key as keyof typeof ticketAnterior] !== updatePayload[key as keyof typeof updatePayload]) {
        cambios[key] = {
          anterior: ticketAnterior[key as keyof typeof ticketAnterior],
          nuevo: updatePayload[key as keyof typeof updatePayload],
        };
      }
    });

    if (Object.keys(cambios).length > 0) {
      await prisma.auditoriaLog.create({
        data: {
          accion: "UPDATE",
          entidad: "TICKET",
          entidadId: id,
          cambios: JSON.stringify(cambios),
          userId: session.user.id,
        },
      });
    }

    if (ticket.assigneeId && ticket.assigneeId !== ticketAnterior.assigneeId) {
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

    if (ticket.status !== ticketAnterior.status) {
      if (ticket.status === "PENDIENTE_VALIDACION") {
        const supervisores = await prisma.user.findMany({
          where: { role: { in: ["SUPERVISOR", "ADMIN"] }, activo: true },
          select: { id: true },
        });
        if (supervisores.length > 0) {
          await prisma.notificacion.createMany({
            data: supervisores.map((user) => ({
              tipo: "INFO",
              titulo: "Ticket en revision",
              mensaje: `El ticket ${ticket.title} esta listo para validar`,
              userId: user.id,
              referenceType: "TICKET",
              referenceId: ticket.id,
            })),
          });
        }
      }

      if (ticket.status === "REABIERTO" && ticket.assigneeId) {
        await prisma.notificacion.create({
          data: {
            tipo: "ADVERTENCIA",
            titulo: "Ticket reabierto",
            mensaje: `El ticket ${ticket.title} requiere correcciones`,
            userId: ticket.assigneeId,
            referenceType: "TICKET",
            referenceId: ticket.id,
          },
        });
      }
    }

    // Agregar folioFormateado
    const ticketConFolio = {
      ...ticket,
      sla: getSlaStatus(ticket),
      folioFormateado: `HEC-T${String(ticket.folio).padStart(2, "0")}`,
    };

    return NextResponse.json({ ticket: ticketConFolio });
  } catch (error) {
    console.error("Error actualizando ticket:", error);
    return NextResponse.json(
      { error: "Error al actualizar ticket" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // PERMISOS: Solo ADMIN puede eliminar tickets
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar tickets. Solo el rol ADMIN puede hacerlo." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { motivo } = body;

    // Verificar que el ticket existe
    const ticketExistente = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticketExistente) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }

    // SOFT DELETE: Marcar como eliminado en lugar de borrar
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: session.user.id,
        motivoEliminacion: motivo || "Sin motivo especificado",
      },
    });

    // Registrar en auditoría
    await prisma.auditoriaLog.create({
      data: {
        accion: "DELETE",
        entidad: "TICKET",
        entidadId: id,
        cambios: JSON.stringify({
          eliminado: true,
          motivo: motivo || "Sin motivo especificado",
          ticket: ticketExistente
        }),
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, message: "Ticket eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminando ticket:", error);
    return NextResponse.json(
      { error: "Error al eliminar ticket" },
      { status: 500 }
    );
  }
}
