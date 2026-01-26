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
    if (typeof body.titulo === "string") {
      data.titulo = body.titulo.trim();
    }
    if (typeof body.contenido === "string") {
      data.contenido = body.contenido.trim();
    }
    if (typeof body.entidad === "string") {
      data.entidad = body.entidad.trim();
    }
    if (typeof body.activo === "boolean") {
      data.activo = body.activo;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }

    const macro = await prisma.macro.update({
      where: { id },
      data,
    });

    return NextResponse.json({ macro });
  } catch (error) {
    console.error("Error actualizando macro:", error);
    return NextResponse.json({ error: "Error al actualizar macro" }, { status: 500 });
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
    await prisma.macro.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando macro:", error);
    return NextResponse.json({ error: "Error al eliminar macro" }, { status: 500 });
  }
}
