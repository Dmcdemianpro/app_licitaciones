import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para restaurar licitaciones" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const licitacionExistente = await prisma.licitacion.findUnique({ where: { id } });

    if (!licitacionExistente) {
      return NextResponse.json({ error: "Licitación no encontrada" }, { status: 404 });
    }

    if (!licitacionExistente.deletedAt) {
      return NextResponse.json({ error: "La licitación no está eliminada" }, { status: 400 });
    }

    const licitacion = await prisma.licitacion.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        motivoEliminacion: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Licitación restaurada correctamente",
      licitacion,
    });
  } catch (error) {
    console.error("Error restaurando licitación:", error);
    return NextResponse.json({ error: "Error al restaurar licitación" }, { status: 500 });
  }
}
