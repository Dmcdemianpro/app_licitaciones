import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessTicket } from "@/lib/ticket-access";

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
      select: { assigneeId: true, ownerId: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const role = session.user.role ?? "";
    if (role === "USER" && ticket.assigneeId !== session.user.id) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    if (role !== "USER") {
      const canAccess = await canAccessTicket(session.user.id, role, id);
      if (!canAccess) {
        return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
      }
    }

    const canSeeInternal =
      role === "ADMIN" ||
      role === "SUPERVISOR" ||
      ticket.assigneeId === session.user.id;

    const mensajes = await prisma.ticketMensaje.findMany({
      where: {
        ticketId: id,
        ...(canSeeInternal ? {} : { esInterno: false }),
      },
      include: {
        autor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ mensajes });
  } catch (error) {
    console.error("Error obteniendo mensajes:", error);
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
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
      select: { assigneeId: true, ownerId: true, canal: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const role = session.user.role ?? "";
    if (role === "USER" && ticket.assigneeId !== session.user.id) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    if (role !== "USER") {
      const canAccess = await canAccessTicket(session.user.id, role, id);
      if (!canAccess) {
        return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
      }
    }

    const canSend =
      role === "ADMIN" ||
      role === "SUPERVISOR" ||
      ticket.assigneeId === session.user.id ||
      ticket.ownerId === session.user.id;
    const canSendInternal =
      role === "ADMIN" ||
      role === "SUPERVISOR" ||
      ticket.assigneeId === session.user.id;

    if (!canSend) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json();
    const contenido = typeof body.contenido === "string" ? body.contenido.trim() : "";
    if (!contenido) {
      return NextResponse.json({ error: "Contenido requerido" }, { status: 400 });
    }

    const esInterno = Boolean(body.esInterno);
    if (esInterno && !canSendInternal) {
      return NextResponse.json({ error: "No autorizado para mensajes internos" }, { status: 403 });
    }

    const mensaje = await prisma.ticketMensaje.create({
      data: {
        ticketId: id,
        contenido,
        canal: ticket.canal || "PORTAL",
        direccion: "OUT",
        esInterno: esInterno && canSendInternal,
        autorId: session.user.id,
        autorNombre: session.user.name ?? null,
        autorEmail: session.user.email ?? null,
      },
      include: {
        autor: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ mensaje }, { status: 201 });
  } catch (error) {
    console.error("Error creando mensaje:", error);
    return NextResponse.json({ error: "Error al crear mensaje" }, { status: 500 });
  }
}
