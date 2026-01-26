import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const role = session.user.role ?? "";
    if (!["ADMIN", "SUPERVISOR"].includes(role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof body.nombre === "string") {
      data.nombre = body.nombre.trim();
    }
    if (typeof body.activo === "boolean") {
      data.activo = body.activo;
    }
    if (typeof body.ticketType === "string") {
      data.ticketType = body.ticketType.trim() || null;
    }
    if (typeof body.priority === "string") {
      data.priority = body.priority.trim() || null;
    }
    if (typeof body.targetRole === "string") {
      data.targetRole = body.targetRole.trim() || null;
    }
    if (Object.prototype.hasOwnProperty.call(body, "targetUserId")) {
      data.targetUserId = body.targetUserId || null;
    }
    if (Object.prototype.hasOwnProperty.call(body, "orden")) {
      const orden = Number(body.orden);
      if (Number.isFinite(orden)) {
        data.orden = orden;
      }
    }
    if (Object.prototype.hasOwnProperty.call(body, "maxActive")) {
      const maxActive = body.maxActive === "" ? null : Number(body.maxActive);
      data.maxActive = Number.isFinite(maxActive) ? maxActive : null;
    }

    if (Object.prototype.hasOwnProperty.call(data, "targetUserId") && data.targetUserId) {
      const user = await prisma.user.findFirst({
        where: { id: data.targetUserId as string, activo: true },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "Usuario no valido" }, { status: 400 });
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }

    const regla = await prisma.ticketAssignmentRule.update({
      where: { id },
      data,
    });

    return NextResponse.json({ regla });
  } catch (error) {
    console.error("Error actualizando regla:", error);
    return NextResponse.json({ error: "Error al actualizar regla" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const role = session.user.role ?? "";
    if (!["ADMIN", "SUPERVISOR"].includes(role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.ticketAssignmentRule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando regla:", error);
    return NextResponse.json({ error: "Error al eliminar regla" }, { status: 500 });
  }
}
