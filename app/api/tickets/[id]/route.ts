import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ticketUpdateSchema } from "@/lib/validations/tickets";

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
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }

    if (session.user.role === "USER" && ticket.assigneeId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para ver este ticket" },
        { status: 403 }
      );
    }

    // Agregar folioFormateado
    const ticketConFolio = {
      ...ticket,
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

    if (!["ADMIN", "SUPERVISOR"].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: "No tienes permisos para editar tickets" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Obtener el ticket actual antes de actualizar (para auditoría)
    const ticketAnterior = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticketAnterior) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }

    const allowedFields = [
      "title",
      "description",
      "type",
      "priority",
      "status",
      "assignee",
      "assigneeId",
    ];

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
      EN_PROGRESO: "INICIADO",
      RESUELTO: "FINALIZADO",
      CERRADO: "FINALIZADO",
    };

    if (typeof updateData.status === "string" && legacyStatusMap[updateData.status]) {
      updateData.status = legacyStatusMap[updateData.status];
    }

    if (typeof updateData.assignee === "string") {
      updateData.assignee = updateData.assignee.trim() || null;
    }

    const parsed = ticketUpdateSchema.safeParse(updateData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Actualizar el ticket
    const ticket = await prisma.ticket.update({
      where: { id },
      data: parsed.data,
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
      },
    });

    // Registrar cambios en auditoría
    const cambios: Record<string, { anterior: any; nuevo: any }> = {};
    Object.keys(parsed.data).forEach((key) => {
      if (ticketAnterior[key as keyof typeof ticketAnterior] !== parsed.data[key as keyof typeof parsed.data]) {
        cambios[key] = {
          anterior: ticketAnterior[key as keyof typeof ticketAnterior],
          nuevo: parsed.data[key as keyof typeof parsed.data],
        };
      }
    });

    // Solo guardar en auditoría si hubo cambios
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

    // Agregar folioFormateado
    const ticketConFolio = {
      ...ticket,
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
