import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Obtener una unidad específica
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

    const unidad = await prisma.unidad.findUnique({
      where: { id },
      include: {
        departamento: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
        usuarios: {
          where: { activo: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                cargo: true,
              },
            },
          },
        },
        _count: {
          select: {
            usuarios: true,
            licitaciones: true,
          },
        },
      },
    });

    if (!unidad) {
      return NextResponse.json(
        { error: "Unidad no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      unidad,
    });
  } catch (error) {
    console.error("Error obteniendo unidad:", error);
    return NextResponse.json(
      { error: "Error al obtener unidad" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar una unidad
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

    const unidadExistente = await prisma.unidad.findUnique({
      where: { id },
    });

    if (!unidadExistente) {
      return NextResponse.json(
        { error: "Unidad no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos
    const esAdmin = session.user.role === "ADMIN";

    if (!esAdmin) {
      const esDepartamentoAdmin = await prisma.usuarioDepartamento.findFirst({
        where: {
          departamentoId: unidadExistente.departamentoId,
          userId: session.user.id,
          rol: "ADMIN",
          activo: true,
        },
      });

      if (!esDepartamentoAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    const body = await req.json();

    // Si cambia nombre, verificar que no exista otra con el mismo nombre
    if (body.nombre) {
      const conflicto = await prisma.unidad.findFirst({
        where: {
          departamentoId: unidadExistente.departamentoId,
          nombre: body.nombre.trim(),
          id: { not: id },
        },
      });

      if (conflicto) {
        return NextResponse.json(
          { error: "Ya existe una unidad con ese nombre en este departamento" },
          { status: 400 }
        );
      }
    }

    const unidad = await prisma.unidad.update({
      where: { id },
      data: {
        nombre: body.nombre?.trim() || undefined,
        descripcion: body.descripcion !== undefined ? body.descripcion?.trim() || null : undefined,
        codigo: body.codigo !== undefined ? body.codigo?.trim() || null : undefined,
        activo: body.activo !== undefined ? body.activo : undefined,
      },
    });

    // Registrar en auditoría
    await prisma.auditoriaLog.create({
      data: {
        accion: "UPDATE",
        entidad: "UNIDAD",
        entidadId: id,
        cambios: JSON.stringify({
          anterior: unidadExistente,
          nuevo: unidad,
        }),
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      unidad,
      message: "Unidad actualizada correctamente",
    });
  } catch (error) {
    console.error("Error actualizando unidad:", error);
    return NextResponse.json(
      { error: "Error al actualizar unidad" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar/desactivar una unidad
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const unidad = await prisma.unidad.findUnique({
      where: { id },
      include: {
        _count: {
          select: { licitaciones: true },
        },
      },
    });

    if (!unidad) {
      return NextResponse.json(
        { error: "Unidad no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos
    const esAdmin = session.user.role === "ADMIN";

    if (!esAdmin) {
      const esDepartamentoAdmin = await prisma.usuarioDepartamento.findFirst({
        where: {
          departamentoId: unidad.departamentoId,
          userId: session.user.id,
          rol: "ADMIN",
          activo: true,
        },
      });

      if (!esDepartamentoAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    // Si tiene licitaciones, solo desactivar
    if (unidad._count.licitaciones > 0) {
      await prisma.unidad.update({
        where: { id },
        data: { activo: false },
      });

      return NextResponse.json({
        success: true,
        message: "Unidad desactivada (tiene licitaciones asociadas)",
      });
    }

    // Si no tiene licitaciones, eliminar
    await prisma.unidad.delete({
      where: { id },
    });

    // Registrar en auditoría
    await prisma.auditoriaLog.create({
      data: {
        accion: "DELETE",
        entidad: "UNIDAD",
        entidadId: id,
        cambios: JSON.stringify({ eliminado: unidad }),
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Unidad eliminada correctamente",
    });
  } catch (error) {
    console.error("Error eliminando unidad:", error);
    return NextResponse.json(
      { error: "Error al eliminar unidad" },
      { status: 500 }
    );
  }
}
