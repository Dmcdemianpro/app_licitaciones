import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ticketCreateSchema } from "@/lib/validations/tickets";

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        deletedAt: null, // Solo tickets no eliminados
      },
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
        status: parsed.data.status ?? "ABIERTO",
        assignee: parsed.data.assignee?.trim() || null,
        ownerId: session.user.id,
      },
    });

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
