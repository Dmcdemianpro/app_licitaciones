import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const entidad = searchParams.get("entidad");
    const soloActivos = searchParams.get("soloActivos") === "true";

    const macros = await prisma.macro.findMany({
      where: {
        ...(entidad ? { entidad } : {}),
        ...(soloActivos ? { activo: true } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ macros });
  } catch (error) {
    console.error("Error obteniendo macros:", error);
    return NextResponse.json({ error: "Error al obtener macros" }, { status: 500 });
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
    const titulo = typeof body.titulo === "string" ? body.titulo.trim() : "";
    const contenido = typeof body.contenido === "string" ? body.contenido.trim() : "";
    const entidad = typeof body.entidad === "string" && body.entidad.trim()
      ? body.entidad.trim()
      : "TICKET";
    const activo = typeof body.activo === "boolean" ? body.activo : true;

    if (!titulo || !contenido) {
      return NextResponse.json(
        { error: "Titulo y contenido son obligatorios" },
        { status: 400 }
      );
    }

    const macro = await prisma.macro.create({
      data: {
        titulo,
        contenido,
        entidad,
        activo,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ macro }, { status: 201 });
  } catch (error) {
    console.error("Error creando macro:", error);
    return NextResponse.json({ error: "Error al crear macro" }, { status: 500 });
  }
}
