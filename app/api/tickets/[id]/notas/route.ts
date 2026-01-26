import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
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
      select: {
        assigneeId: true,
        firstResponseAt: true,
        slaResponseDueAt: true,
        slaResponseBreachedAt: true,
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
        { error: "No tienes permisos para ver las notas de este ticket" },
        { status: 403 }
      );
    }

    const notas = await prisma.nota.findMany({
      where: { ticketId: id },
      include: {
        autor: {
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

    return NextResponse.json({ notas });
  } catch (error) {
    console.error("Error obteniendo notas:", error);
    return NextResponse.json(
      { error: "Error al obtener notas" },
      { status: 500 }
    );
  }
}

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
        { error: "No tienes permisos para agregar notas a este ticket" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.contenido || body.contenido.trim() === "") {
      return NextResponse.json(
        { error: "El contenido de la nota es requerido" },
        { status: 400 }
      );
    }

    const nota = await prisma.nota.create({
      data: {
        contenido: body.contenido,
        ticketId: id,
        autorId: session.user.id,
      },
      include: {
        autor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (ticket.firstResponseAt == null) {
      const now = new Date();
      const updateData: Prisma.TicketUpdateInput = {
        firstResponseAt: now,
      };
      if (
        ticket.slaResponseDueAt &&
        now > ticket.slaResponseDueAt &&
        ticket.slaResponseBreachedAt == null
      ) {
        updateData.slaResponseBreachedAt = now;
      }
      await prisma.ticket.update({
        where: { id },
        data: updateData,
      });
    }

    return NextResponse.json({ nota });
  } catch (error) {
    console.error("Error creando nota:", error);
    return NextResponse.json(
      { error: "Error al crear nota" },
      { status: 500 }
    );
  }
}
