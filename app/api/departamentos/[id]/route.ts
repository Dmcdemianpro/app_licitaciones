import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Obtener un departamento específico
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

    const departamento = await prisma.departamento.findUnique({
      where: { id },
      include: {
        unidades: {
          orderBy: { nombre: "asc" },
          include: {
            _count: {
              select: { usuarios: true, licitaciones: true },
            },
          },
        },
        usuarios: {
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
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            usuarios: true,
            unidades: true,
            licitaciones: true,
          },
        },
      },
    });

    if (!departamento) {
      return NextResponse.json(
        { error: "Departamento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      departamento,
    });
  } catch (error) {
    console.error("Error obteniendo departamento:", error);
    return NextResponse.json(
      { error: "Error al obtener departamento" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar un departamento
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Solo ADMIN puede editar departamentos
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const departamentoExistente = await prisma.departamento.findUnique({
      where: { id },
    });

    if (!departamentoExistente) {
      return NextResponse.json(
        { error: "Departamento no encontrado" },
        { status: 404 }
      );
    }

    // Si cambia nombre o código, verificar que no exista otro igual
    if (body.nombre || body.codigo) {
      const conflicto = await prisma.departamento.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                body.nombre ? { nombre: body.nombre.trim() } : {},
                body.codigo ? { codigo: body.codigo.trim() } : {},
              ],
            },
          ],
        },
      });

      if (conflicto) {
        return NextResponse.json(
          { error: "Ya existe un departamento con ese nombre o código" },
          { status: 400 }
        );
      }
    }

    const departamento = await prisma.departamento.update({
      where: { id },
      data: {
        nombre: body.nombre?.trim() || undefined,
        descripcion: body.descripcion !== undefined ? body.descripcion?.trim() || null : undefined,
        codigo: body.codigo !== undefined ? body.codigo?.trim() || null : undefined,
        color: body.color !== undefined ? body.color || null : undefined,
        activo: body.activo !== undefined ? body.activo : undefined,
      },
    });

    // Registrar en auditoría
    await prisma.auditoriaLog.create({
      data: {
        accion: "UPDATE",
        entidad: "DEPARTAMENTO",
        entidadId: id,
        cambios: JSON.stringify({
          anterior: departamentoExistente,
          nuevo: departamento,
        }),
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      departamento,
      message: "Departamento actualizado correctamente",
    });
  } catch (error) {
    console.error("Error actualizando departamento:", error);
    return NextResponse.json(
      { error: "Error al actualizar departamento" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar/desactivar un departamento
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Solo ADMIN puede eliminar departamentos
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    const departamento = await prisma.departamento.findUnique({
      where: { id },
      include: {
        _count: {
          select: { licitaciones: true },
        },
      },
    });

    if (!departamento) {
      return NextResponse.json(
        { error: "Departamento no encontrado" },
        { status: 404 }
      );
    }

    // Si tiene licitaciones, solo desactivar
    if (departamento._count.licitaciones > 0) {
      await prisma.departamento.update({
        where: { id },
        data: { activo: false },
      });

      return NextResponse.json({
        success: true,
        message: "Departamento desactivado (tiene licitaciones asociadas)",
      });
    }

    // Si no tiene licitaciones, eliminar
    await prisma.departamento.delete({
      where: { id },
    });

    // Registrar en auditoría
    await prisma.auditoriaLog.create({
      data: {
        accion: "DELETE",
        entidad: "DEPARTAMENTO",
        entidadId: id,
        cambios: JSON.stringify({ eliminado: departamento }),
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Departamento eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando departamento:", error);
    return NextResponse.json(
      { error: "Error al eliminar departamento" },
      { status: 500 }
    );
  }
}
