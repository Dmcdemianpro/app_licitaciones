import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ticketCreateSchema } from "@/lib/validations/tickets";

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

    const ticket = await prisma.ticket.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        priority: parsed.data.priority,
        status: "CREADO",
        assignee: parsed.data.assignee?.trim() || null,
        assigneeId: parsed.data.assigneeId ?? null,
        ownerId: session.user.id,
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

    // Agregar folioFormateado al ticket creado
    const ticketConFolio = {
      ...ticket,
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
