import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessLicitacion } from "@/lib/licitacion-access";

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

    const hasAccess = await canAccessLicitacion(session.user.id, session.user.role, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Licitacion no encontrada" }, { status: 404 });
    }

    const notas = await prisma.nota.findMany({
      where: {
        licitacionId: id,
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

    const hasAccess = await canAccessLicitacion(session.user.id, session.user.role, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Licitacion no encontrada" }, { status: 404 });
    }
    const body = await req.json();
    const { contenido } = body;

    if (!contenido || contenido.trim() === "") {
      return NextResponse.json(
        { error: "El contenido de la nota es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la licitación existe
    const licitacion = await prisma.licitacion.findUnique({
      where: { id },
    });

    if (!licitacion) {
      return NextResponse.json(
        { error: "Licitación no encontrada" },
        { status: 404 }
      );
    }

    const nota = await prisma.nota.create({
      data: {
        contenido,
        licitacionId: id,
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

    return NextResponse.json({ nota });
  } catch (error) {
    console.error("Error creando nota:", error);
    return NextResponse.json(
      { error: "Error al crear nota" },
      { status: 500 }
    );
  }
}
