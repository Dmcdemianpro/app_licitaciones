import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Obtener usuarios de una unidad
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

    const usuarios = await prisma.usuarioUnidad.findMany({
      where: { unidadId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            cargo: true,
            telefono: true,
            activo: true,
          },
        },
      },
      orderBy: [{ rol: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      usuarios,
    });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// POST - Agregar usuario a una unidad
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

    // Obtener la unidad y su departamento
    const unidad = await prisma.unidad.findUnique({
      where: { id },
      select: { departamentoId: true },
    });

    if (!unidad) {
      return NextResponse.json(
        { error: "Unidad no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos
    const esAdmin = session.user.role === "ADMIN";
    const esSupervisor = session.user.role === "SUPERVISOR";

    if (!esAdmin && !esSupervisor) {
      // Verificar si es admin de la unidad o del departamento
      const esUnidadAdmin = await prisma.usuarioUnidad.findFirst({
        where: {
          unidadId: id,
          userId: session.user.id,
          rol: "ADMIN",
          activo: true,
        },
      });

      const esDepartamentoAdmin = await prisma.usuarioDepartamento.findFirst({
        where: {
          departamentoId: unidad.departamentoId,
          userId: session.user.id,
          rol: "ADMIN",
          activo: true,
        },
      });

      if (!esUnidadAdmin && !esDepartamentoAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { userId, rol } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "El ID de usuario es obligatorio" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que no esté ya en la unidad
    const existente = await prisma.usuarioUnidad.findUnique({
      where: {
        userId_unidadId: {
          userId,
          unidadId: id,
        },
      },
    });

    if (existente) {
      if (!existente.activo) {
        const actualizado = await prisma.usuarioUnidad.update({
          where: { id: existente.id },
          data: {
            activo: true,
            rol: rol || "MIEMBRO",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return NextResponse.json({
          success: true,
          usuario: actualizado,
          message: "Usuario reactivado en la unidad",
        });
      }

      return NextResponse.json(
        { error: "El usuario ya pertenece a esta unidad" },
        { status: 400 }
      );
    }

    const nuevoUsuario = await prisma.usuarioUnidad.create({
      data: {
        userId,
        unidadId: id,
        rol: rol || "MIEMBRO",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Notificar al usuario
    await prisma.notificacion.create({
      data: {
        tipo: "INFO",
        titulo: "Agregado a unidad",
        mensaje: `Has sido agregado a una unidad`,
        userId,
        referenceType: "UNIDAD",
        referenceId: id,
      },
    });

    return NextResponse.json({
      success: true,
      usuario: nuevoUsuario,
      message: "Usuario agregado a la unidad",
    });
  } catch (error) {
    console.error("Error agregando usuario:", error);
    return NextResponse.json(
      { error: "Error al agregar usuario" },
      { status: 500 }
    );
  }
}

// DELETE - Quitar usuario de una unidad
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
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Se requiere el ID del usuario" },
        { status: 400 }
      );
    }

    const unidad = await prisma.unidad.findUnique({
      where: { id },
      select: { departamentoId: true },
    });

    if (!unidad) {
      return NextResponse.json(
        { error: "Unidad no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos
    const esAdmin = session.user.role === "ADMIN";
    const esSupervisor = session.user.role === "SUPERVISOR";

    if (!esAdmin && !esSupervisor) {
      const esUnidadAdmin = await prisma.usuarioUnidad.findFirst({
        where: {
          unidadId: id,
          userId: session.user.id,
          rol: "ADMIN",
          activo: true,
        },
      });

      const esDepartamentoAdmin = await prisma.usuarioDepartamento.findFirst({
        where: {
          departamentoId: unidad.departamentoId,
          userId: session.user.id,
          rol: "ADMIN",
          activo: true,
        },
      });

      if (!esUnidadAdmin && !esDepartamentoAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    await prisma.usuarioUnidad.updateMany({
      where: {
        unidadId: id,
        userId,
      },
      data: {
        activo: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Usuario removido de la unidad",
    });
  } catch (error) {
    console.error("Error removiendo usuario:", error);
    return NextResponse.json(
      { error: "Error al remover usuario" },
      { status: 500 }
    );
  }
}
