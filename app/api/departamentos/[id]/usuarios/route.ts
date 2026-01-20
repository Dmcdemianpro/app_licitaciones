import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Obtener usuarios de un departamento
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

    const usuarios = await prisma.usuarioDepartamento.findMany({
      where: { departamentoId: id },
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

// POST - Agregar usuario a un departamento
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar permisos (ADMIN o ADMIN del departamento)
    const { id } = await params;
    const esAdmin = session.user.role === "ADMIN";

    if (!esAdmin) {
      const esDepartamentoAdmin = await prisma.usuarioDepartamento.findFirst({
        where: {
          departamentoId: id,
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

    // Verificar que no esté ya en el departamento
    const existente = await prisma.usuarioDepartamento.findUnique({
      where: {
        userId_departamentoId: {
          userId,
          departamentoId: id,
        },
      },
    });

    if (existente) {
      // Si existe pero está inactivo, reactivar
      if (!existente.activo) {
        const actualizado = await prisma.usuarioDepartamento.update({
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
          message: "Usuario reactivado en el departamento",
        });
      }

      return NextResponse.json(
        { error: "El usuario ya pertenece a este departamento" },
        { status: 400 }
      );
    }

    const nuevoUsuario = await prisma.usuarioDepartamento.create({
      data: {
        userId,
        departamentoId: id,
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
        titulo: "Agregado a departamento",
        mensaje: `Has sido agregado al departamento`,
        userId,
        referenceType: "DEPARTAMENTO",
        referenceId: id,
      },
    });

    return NextResponse.json({
      success: true,
      usuario: nuevoUsuario,
      message: "Usuario agregado al departamento",
    });
  } catch (error) {
    console.error("Error agregando usuario:", error);
    return NextResponse.json(
      { error: "Error al agregar usuario" },
      { status: 500 }
    );
  }
}

// DELETE - Quitar usuario de un departamento
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

    // Verificar permisos
    const esAdmin = session.user.role === "ADMIN";

    if (!esAdmin) {
      const esDepartamentoAdmin = await prisma.usuarioDepartamento.findFirst({
        where: {
          departamentoId: id,
          userId: session.user.id,
          rol: "ADMIN",
          activo: true,
        },
      });

      if (!esDepartamentoAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    // Desactivar membresía (no eliminar para mantener historial)
    await prisma.usuarioDepartamento.updateMany({
      where: {
        departamentoId: id,
        userId,
      },
      data: {
        activo: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Usuario removido del departamento",
    });
  } catch (error) {
    console.error("Error removiendo usuario:", error);
    return NextResponse.json(
      { error: "Error al remover usuario" },
      { status: 500 }
    );
  }
}
