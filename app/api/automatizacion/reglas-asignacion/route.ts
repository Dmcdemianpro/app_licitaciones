import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const role = session.user.role ?? "";
    if (!["ADMIN", "SUPERVISOR"].includes(role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const reglas = await prisma.ticketAssignmentRule.findMany({
      orderBy: { orden: "asc" },
      include: {
        targetUser: { select: { id: true, name: true, email: true, role: true, activo: true } },
      },
    });

    return NextResponse.json({ reglas });
  } catch (error) {
    console.error("Error obteniendo reglas:", error);
    return NextResponse.json({ error: "Error al obtener reglas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const role = session.user.role ?? "";
    if (!["ADMIN", "SUPERVISOR"].includes(role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json();
    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
    if (!nombre) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const orden = Number.isFinite(Number(body.orden)) ? Number(body.orden) : 1;
    const maxActive =
      body.maxActive === null || body.maxActive === ""
        ? null
        : Number.isFinite(Number(body.maxActive))
          ? Number(body.maxActive)
          : null;

    const data = {
      nombre,
      activo: typeof body.activo === "boolean" ? body.activo : true,
      orden,
      ticketType: typeof body.ticketType === "string" ? body.ticketType.trim() || null : null,
      priority: typeof body.priority === "string" ? body.priority.trim() || null : null,
      targetRole: typeof body.targetRole === "string" ? body.targetRole.trim() || null : null,
      targetUserId: typeof body.targetUserId === "string" ? body.targetUserId : null,
      maxActive,
    };

    if (data.targetUserId) {
      const user = await prisma.user.findFirst({
        where: { id: data.targetUserId, activo: true },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "Usuario no valido" }, { status: 400 });
      }
    }

    const regla = await prisma.ticketAssignmentRule.create({ data });
    return NextResponse.json({ regla }, { status: 201 });
  } catch (error) {
    console.error("Error creando regla:", error);
    return NextResponse.json({ error: "Error al crear regla" }, { status: 500 });
  }
}
