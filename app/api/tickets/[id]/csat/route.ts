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
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, ownerId: true, assigneeId: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const role = session.user.role ?? "";
    if (role === "USER") {
      const allowed =
        ticket.ownerId === session.user.id || ticket.assigneeId === session.user.id;
      if (!allowed) {
        return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
      }
    } else {
      const canAccess = await canAccessTicket(session.user.id, role, id);
      if (!canAccess) {
        return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
      }
    }

    const survey = await prisma.ticketSurvey.findUnique({
      where: { ticketId: id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ survey });
  } catch (error) {
    console.error("Error obteniendo CSAT:", error);
    return NextResponse.json({ error: "Error al obtener CSAT" }, { status: 500 });
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
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, ownerId: true, status: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    if (ticket.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Solo el solicitante puede responder" }, { status: 403 });
    }

    if (ticket.status !== "FINALIZADO") {
      return NextResponse.json({ error: "El ticket aun no esta finalizado" }, { status: 400 });
    }

    const existente = await prisma.ticketSurvey.findUnique({
      where: { ticketId: id },
      select: { id: true },
    });

    if (existente) {
      return NextResponse.json({ error: "La encuesta ya fue enviada" }, { status: 409 });
    }

    const body = await req.json();
    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Calificacion invalida" }, { status: 400 });
    }

    const comentario =
      typeof body.comentario === "string" ? body.comentario.trim() : "";

    const survey = await prisma.ticketSurvey.create({
      data: {
        ticketId: id,
        rating,
        comentario: comentario || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ survey }, { status: 201 });
  } catch (error) {
    console.error("Error creando CSAT:", error);
    return NextResponse.json({ error: "Error al guardar CSAT" }, { status: 500 });
  }
}
