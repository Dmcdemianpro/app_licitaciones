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
      return NextResponse.json(
        { error: "Licitacion no encontrada" },
        { status: 404 }
      );
    }

    const licitacion = await prisma.licitacion.findUnique({
      where: { id },
      include: {
        departamento: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            color: true,
          },
        },
        unidad: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            departamentoId: true,
          },
        },
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
    const { responsableId, estado, descripcion, unidadResponsable, departamentoId, unidadId } = body;

    const hasAccess = await canAccessLicitacion(session.user.id, session.user.role, id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Licitacion no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que no esté eliminada
    const licitacionExistente = await prisma.licitacion.findUnique({ where: { id } });
    if (licitacionExistente?.deletedAt) {
      return NextResponse.json(
        { error: "No se puede modificar una licitación eliminada" },
        { status: 403 }
      );
    }

    const hasDepartamento = Object.prototype.hasOwnProperty.call(body, "departamentoId");
    const hasUnidad = Object.prototype.hasOwnProperty.call(body, "unidadId");

    let departamentoIdValue = departamentoId ? departamentoId : null;
    let unidadIdValue = unidadId ? unidadId : null;

    if (hasDepartamento || hasUnidad) {
      const canManageGroup = ["ADMIN", "SUPERVISOR"].includes(session.user.role ?? "");
      if (!canManageGroup) {
        return NextResponse.json(
          { error: "No autorizado para cambiar el grupo" },
          { status: 403 }
        );
      }

      if (hasUnidad && unidadIdValue) {
        const unidadRecord = await prisma.unidad.findUnique({
          where: { id: unidadIdValue },
          select: { id: true, departamentoId: true, activo: true },
        });

        if (!unidadRecord || !unidadRecord.activo) {
          return NextResponse.json(
            { error: "Unidad no encontrada" },
            { status: 400 }
          );
        }

        if (departamentoIdValue && unidadRecord.departamentoId !== departamentoIdValue) {
          return NextResponse.json(
            { error: "La unidad no pertenece al departamento seleccionado" },
            { status: 400 }
          );
        }

        if (!departamentoIdValue) {
          departamentoIdValue = unidadRecord.departamentoId;
        }
      }

      if (hasDepartamento && departamentoIdValue) {
        const departamentoRecord = await prisma.departamento.findUnique({
          where: { id: departamentoIdValue },
          select: { id: true, activo: true },
        });

        if (!departamentoRecord || !departamentoRecord.activo) {
          return NextResponse.json(
            { error: "Departamento no encontrado" },
            { status: 400 }
          );
        }
      }
    }

    const licitacion = await prisma.licitacion.update({
      where: { id },
      data: {
        ...(responsableId !== undefined && { responsableId }),
        ...(estado && { estado }),
        ...(descripcion !== undefined && { descripcion }),
        ...(unidadResponsable !== undefined && { unidadResponsable }),
        ...(hasDepartamento && { departamentoId: departamentoIdValue }),
        ...(hasUnidad && { unidadId: unidadIdValue }),
        updatedAt: new Date(),
      },
      include: {
        departamento: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            color: true,
          },
        },
        unidad: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            departamentoId: true,
          },
        },
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
