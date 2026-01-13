import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    return NextResponse.json({ ticket });
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

    // Actualizar el ticket
    const ticket = await prisma.ticket.update({
      where: { id },
      data: body,
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
    Object.keys(body).forEach((key) => {
      if (ticketAnterior[key as keyof typeof ticketAnterior] !== body[key]) {
        cambios[key] = {
          anterior: ticketAnterior[key as keyof typeof ticketAnterior],
          nuevo: body[key],
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

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error actualizando ticket:", error);
    return NextResponse.json(
      { error: "Error al actualizar ticket" },
      { status: 500 }
    );
  }
}
