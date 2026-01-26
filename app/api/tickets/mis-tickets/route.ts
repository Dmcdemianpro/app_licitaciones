import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSlaStatus } from "@/lib/sla";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        assigneeId: session.user.id,
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
      sla: getSlaStatus(ticket),
      folioFormateado: `HEC-T${String(ticket.folio).padStart(2, "0")}`,
    }));

    return NextResponse.json(ticketsConFolio);
  } catch (error) {
    console.error("Error fetching mis tickets:", error);
    return NextResponse.json(
      { error: "Error al obtener mis tickets" },
      { status: 500 }
    );
  }
}
