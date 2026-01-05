import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");

    // Construir filtros
    const where: any = {};

    if (estado && estado !== "all") {
      where.estado = estado;
    }

    const citas = await prisma.cita.findMany({
      where,
      include: {
        organizador: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participantes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });

    return NextResponse.json({ citas });
  } catch (error) {
    console.error("Error obteniendo citas:", error);
    return NextResponse.json(
      { error: "Error al obtener citas" },
      { status: 500 }
    );
  }
}
