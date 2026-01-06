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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        activo: true,
        telefono: true,
        departamento: true,
        cargo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener usuario" },
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

    // PERMISOS: Solo SUPERVISOR y ADMIN pueden editar usuarios
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
      return NextResponse.json(
        { error: "No tienes permisos para editar usuarios. Se requiere rol SUPERVISOR o ADMIN." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    // Validar que el email sea único si se está cambiando
    if (body.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: body.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "El email ya está en uso" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        activo: body.activo,
        telefono: body.telefono,
        departamento: body.departamento,
        cargo: body.cargo,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        activo: true,
        telefono: true,
        departamento: true,
        cargo: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
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

    // Verificar que el usuario sea administrador
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Solo los administradores pueden eliminar usuarios" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que el usuario no se esté eliminando a sí mismo
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const userToDelete = await prisma.user.findUnique({
      where: { id },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el usuario (las relaciones en cascada se manejan en el schema)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
