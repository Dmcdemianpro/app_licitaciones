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

    const ticket = await prisma.ticket.findFirst({
      where: { id, deletedAt: null },
      select: { assigneeId: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }

    if (session.user.role === "USER" && ticket.assigneeId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para ver el historial de este ticket" },
        { status: 403 }
      );
    }

    // Obtener el historial de auditoría del ticket
    const historial = await prisma.auditoriaLog.findMany({
      where: {
        entidad: "TICKET",
        entidadId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ historial });
  } catch (error) {
    console.error("Error obteniendo historial de ticket:", error);
    return NextResponse.json(
      { error: "Error al obtener historial" },
      { status: 500 }
    );
  }
}
