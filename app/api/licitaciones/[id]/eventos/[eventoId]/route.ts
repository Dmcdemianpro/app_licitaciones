import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessLicitacion } from "@/lib/licitacion-access";

// GET - Obtener un evento específico
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; eventoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id, eventoId } = await params;

    const hasAccess = await canAccessLicitacion(session.user.id, session.user.role, id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Licitacion no encontrada" },
        { status: 404 }
      );
    }

    const evento = await prisma.eventoLicitacion.findUnique({
      where: { id: eventoId },
      include: {
        licitacion: {
          select: {
            id: true,
            folio: true,
            nombre: true,
            codigoExterno: true,
          },
        },
        ticket: {
          select: {
            id: true,
            folio: true,
            title: true,
            status: true,
            priority: true,
          },
        },
        creadoPor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!evento || evento.licitacionId !== id) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      evento,
    });
  } catch (error) {
    console.error("Error obteniendo evento:", error);
    return NextResponse.json(
      { error: "Error al obtener evento" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar un evento
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; eventoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id, eventoId } = await params;
    const body = await req.json();

    const hasAccess = await canAccessLicitacion(session.user.id, session.user.role, id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Licitacion no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el evento existe y pertenece a la licitación
    const eventoExistente = await prisma.eventoLicitacion.findUnique({
      where: { id: eventoId },
    });

    if (!eventoExistente || eventoExistente.licitacionId !== id) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Si se proporciona ticketId, verificar que existe
    if (body.ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: body.ticketId },
      });
      if (!ticket) {
        return NextResponse.json(
          { error: "Ticket no encontrado" },
          { status: 404 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (body.tipoEvento !== undefined) updateData.tipoEvento = body.tipoEvento;
    if (body.titulo !== undefined) updateData.titulo = body.titulo;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.importancia !== undefined) updateData.importancia = body.importancia;
    if (body.fechaEvento !== undefined) updateData.fechaEvento = new Date(body.fechaEvento);
    if (body.fechaResolucion !== undefined) {
      updateData.fechaResolucion = body.fechaResolucion ? new Date(body.fechaResolucion) : null;
    }
    if (body.ticketId !== undefined) updateData.ticketId = body.ticketId || null;
    if (body.metadatos !== undefined) {
      updateData.metadatos = body.metadatos ? JSON.stringify(body.metadatos) : null;
    }
    if (body.estado !== undefined) updateData.estado = body.estado;

    // Actualizar el evento
    const evento = await prisma.eventoLicitacion.update({
      where: { id: eventoId },
      data: updateData,
      include: {
        ticket: {
          select: {
            id: true,
            folio: true,
            title: true,
          },
        },
        creadoPor: {
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
    Object.keys(body).forEach((key) => {
      const keyTyped = key as keyof typeof eventoExistente;
      if (eventoExistente[keyTyped] !== body[key]) {
        cambios[key] = {
          anterior: eventoExistente[keyTyped],
          nuevo: body[key],
        };
      }
    });

    if (Object.keys(cambios).length > 0) {
      await prisma.auditoriaLog.create({
        data: {
          accion: "UPDATE",
          entidad: "EVENTO_LICITACION",
          entidadId: eventoId,
          cambios: JSON.stringify(cambios),
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      evento,
      message: "Evento actualizado correctamente",
    });
  } catch (error) {
    console.error("Error actualizando evento:", error);
    return NextResponse.json(
      { error: "Error al actualizar evento" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un evento
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; eventoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id, eventoId } = await params;

    const hasAccess = await canAccessLicitacion(session.user.id, session.user.role, id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Licitacion no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el evento existe y pertenece a la licitación
    const eventoExistente = await prisma.eventoLicitacion.findUnique({
      where: { id: eventoId },
    });

    if (!eventoExistente || eventoExistente.licitacionId !== id) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el evento
    await prisma.eventoLicitacion.delete({
      where: { id: eventoId },
    });

    // Registrar eliminación en auditoría
    await prisma.auditoriaLog.create({
      data: {
        accion: "DELETE",
        entidad: "EVENTO_LICITACION",
        entidadId: eventoId,
        cambios: JSON.stringify({ eliminado: eventoExistente }),
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Evento eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando evento:", error);
    return NextResponse.json(
      { error: "Error al eliminar evento" },
      { status: 500 }
    );
  }
}
