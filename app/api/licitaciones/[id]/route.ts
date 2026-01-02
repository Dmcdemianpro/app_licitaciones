import { NextResponse } from "next/server";
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

    const licitacion = await prisma.licitacion.findUnique({
      where: { id },
      include: {
        responsable: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        notas: {
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
        },
        documentos: {
          include: {
            uploadedBy: {
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
        },
      },
    });

    if (!licitacion) {
      return NextResponse.json(
        { error: "Licitación no encontrada" },
        { status: 404 }
      );
    }

    // Calcular días restantes
    let diasRestantes = undefined;
    if (licitacion.fechaCierre) {
      const hoy = new Date();
      const diff = licitacion.fechaCierre.getTime() - hoy.getTime();
      diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      licitacion: {
        ...licitacion,
        diasRestantes,
        montoEstimado: licitacion.montoEstimado ? licitacion.montoEstimado.toString() : null,
      },
    });
  } catch (error) {
    console.error("Error obteniendo licitación:", error);
    return NextResponse.json(
      { error: "Error al obtener licitación" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { responsableId, estado, descripcion } = body;

    const licitacion = await prisma.licitacion.update({
      where: { id },
      data: {
        ...(responsableId !== undefined && { responsableId }),
        ...(estado && { estado }),
        ...(descripcion !== undefined && { descripcion }),
        updatedAt: new Date(),
      },
      include: {
        responsable: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ licitacion });
  } catch (error) {
    console.error("Error actualizando licitación:", error);
    return NextResponse.json(
      { error: "Error al actualizar licitación" },
      { status: 500 }
    );
  }
}
