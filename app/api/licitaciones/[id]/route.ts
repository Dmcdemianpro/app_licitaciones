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
        deletedBy: {
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
        items: {
          orderBy: {
            correlativo: "asc",
          },
        },
        adjudicacion: true,
        soporteTecnico: {
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

    // SOFT DELETE: Verificar permiso ADMIN para ver eliminadas
    if (licitacion.deletedAt && session.user.role !== "ADMIN") {
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
        folioFormateado: `HEC-L${String(licitacion.folio).padStart(2, "0")}`,
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
    const { responsableId, estado, descripcion, unidadResponsable } = body;

    // Verificar que no esté eliminada
    const licitacionExistente = await prisma.licitacion.findUnique({ where: { id } });
    if (licitacionExistente?.deletedAt) {
      return NextResponse.json(
        { error: "No se puede modificar una licitación eliminada" },
        { status: 403 }
      );
    }

    const licitacion = await prisma.licitacion.update({
      where: { id },
      data: {
        ...(responsableId !== undefined && { responsableId }),
        ...(estado && { estado }),
        ...(descripcion !== undefined && { descripcion }),
        ...(unidadResponsable !== undefined && { unidadResponsable }),
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // PERMISOS: Solo ADMIN puede eliminar licitaciones
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar licitaciones. Solo el rol ADMIN puede hacerlo." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const motivo = searchParams.get("motivo");

    if (!motivo || motivo.trim().length < 10) {
      return NextResponse.json(
        { error: "Debe proporcionar un motivo de eliminación (mínimo 10 caracteres)" },
        { status: 400 }
      );
    }

    const licitacionExistente = await prisma.licitacion.findUnique({ where: { id } });

    if (!licitacionExistente) {
      return NextResponse.json({ error: "Licitación no encontrada" }, { status: 404 });
    }

    if (licitacionExistente.deletedAt) {
      return NextResponse.json({ error: "La licitación ya está eliminada" }, { status: 400 });
    }

    const licitacion = await prisma.licitacion.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: session.user.id,
        motivoEliminacion: motivo,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Licitación eliminada correctamente",
      licitacion,
    });
  } catch (error) {
    console.error("Error eliminando licitación:", error);
    return NextResponse.json({ error: "Error al eliminar licitación" }, { status: 500 });
  }
}
