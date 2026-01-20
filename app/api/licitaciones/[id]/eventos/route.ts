import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessLicitacion } from "@/lib/licitacion-access";

// GET - Obtener todos los eventos de una licitación
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
    const { searchParams } = new URL(req.url);

    const hasAccess = await canAccessLicitacion(session.user.id, session.user.role, id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Licitacion no encontrada" },
        { status: 404 }
      );
    }

    // Parámetros de filtro opcionales
    const tipoEvento = searchParams.get("tipoEvento");
    const estado = searchParams.get("estado");
    const importancia = searchParams.get("importancia");
    const fechaDesde = searchParams.get("fechaDesde");
    const fechaHasta = searchParams.get("fechaHasta");

    // Verificar que la licitación existe
    const licitacion = await prisma.licitacion.findUnique({
      where: { id },
    });

    if (!licitacion) {
      return NextResponse.json(
        { error: "Licitación no encontrada" },
        { status: 404 }
      );
    }

    // Construir filtros
    const where: any = { licitacionId: id };

    if (tipoEvento) {
      where.tipoEvento = tipoEvento;
    }
    if (estado) {
      where.estado = estado;
    }
    if (importancia) {
      where.importancia = importancia;
    }
    if (fechaDesde || fechaHasta) {
      where.fechaEvento = {};
      if (fechaDesde) {
        where.fechaEvento.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.fechaEvento.lte = new Date(fechaHasta);
      }
    }

    // Obtener eventos con relaciones
    const eventos = await prisma.eventoLicitacion.findMany({
      where,
      include: {
        ticket: {
          select: {
            id: true,
            folio: true,
            title: true,
            status: true,
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
      orderBy: {
        fechaEvento: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      eventos,
      total: eventos.length,
    });
  } catch (error) {
    console.error("Error obteniendo eventos:", error);
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo evento
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      tipoEvento,
      titulo,
      descripcion,
      importancia,
      fechaEvento,
      fechaResolucion,
      ticketId,
      metadatos,
      estado,
    } = body;

    const hasAccess = await canAccessLicitacion(session.user.id, session.user.role, id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Licitacion no encontrada" },
        { status: 404 }
      );
    }

    // Validar campos obligatorios
    if (!tipoEvento || !titulo || !fechaEvento) {
      return NextResponse.json(
        { error: "Tipo de evento, título y fecha son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar que la licitación existe
    const licitacion = await prisma.licitacion.findUnique({
      where: { id },
    });

    if (!licitacion) {
      return NextResponse.json(
        { error: "Licitación no encontrada" },
        { status: 404 }
      );
    }

    // Si se proporciona ticketId, verificar que existe
    if (ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });
      if (!ticket) {
        return NextResponse.json(
          { error: "Ticket no encontrado" },
          { status: 404 }
        );
      }
    }

    // Crear el evento
    const evento = await prisma.eventoLicitacion.create({
      data: {
        licitacionId: id,
        tipoEvento,
        titulo,
        descripcion: descripcion || null,
        importancia: importancia || "MEDIA",
        fechaEvento: new Date(fechaEvento),
        fechaResolucion: fechaResolucion ? new Date(fechaResolucion) : null,
        ticketId: ticketId || null,
        metadatos: metadatos ? JSON.stringify(metadatos) : null,
        estado: estado || "REGISTRADO",
        creadoPorId: session.user.id,
      },
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

    // Crear notificación según importancia
    if (importancia === "CRITICA" || importancia === "ALTA") {
      await prisma.notificacion.create({
        data: {
          tipo: importancia === "CRITICA" ? "ERROR" : "ADVERTENCIA",
          titulo: `Evento ${importancia.toLowerCase()} registrado`,
          mensaje: `${titulo} - ${licitacion.nombre}`,
          userId: session.user.id,
          referenceType: "LICITACION",
          referenceId: id,
        },
      });
    }

    // Registrar en auditoría
    await prisma.auditoriaLog.create({
      data: {
        accion: "CREATE",
        entidad: "EVENTO_LICITACION",
        entidadId: evento.id,
        cambios: JSON.stringify({ nuevo: evento }),
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      evento,
      message: "Evento registrado correctamente",
    });
  } catch (error) {
    console.error("Error creando evento:", error);
    return NextResponse.json(
      { error: "Error al crear evento" },
      { status: 500 }
    );
  }
}
