import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Obtener unidades de un departamento
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
    const { searchParams } = new URL(req.url);
    const soloActivos = searchParams.get("soloActivos") !== "false";

    const where: any = { departamentoId: id };
    if (soloActivos) {
      where.activo = true;
    }

    const unidades = await prisma.unidad.findMany({
      where,
      include: {
        _count: {
          select: {
            usuarios: true,
            licitaciones: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({
      success: true,
      unidades,
    });
  } catch (error) {
    console.error("Error obteniendo unidades:", error);
    return NextResponse.json(
      { error: "Error al obtener unidades" },
      { status: 500 }
    );
  }
}

// POST - Crear unidad en un departamento
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

    // Verificar permisos (ADMIN o ADMIN del departamento)
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
    const { nombre, descripcion, codigo } = body;

    if (!nombre?.trim()) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    // Verificar que el departamento existe
    const departamento = await prisma.departamento.findUnique({
      where: { id },
    });

    if (!departamento) {
      return NextResponse.json(
        { error: "Departamento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que no exista otra unidad con el mismo nombre en el departamento
    const existente = await prisma.unidad.findFirst({
      where: {
        departamentoId: id,
        nombre: nombre.trim(),
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe una unidad con ese nombre en este departamento" },
        { status: 400 }
      );
    }

    const unidad = await prisma.unidad.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        codigo: codigo?.trim() || null,
        departamentoId: id,
      },
    });

    // Registrar en auditoría
    await prisma.auditoriaLog.create({
      data: {
        accion: "CREATE",
        entidad: "UNIDAD",
        entidadId: unidad.id,
        cambios: JSON.stringify({ nuevo: unidad }),
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      unidad,
      message: "Unidad creada correctamente",
    });
  } catch (error) {
    console.error("Error creando unidad:", error);
    return NextResponse.json(
      { error: "Error al crear unidad" },
      { status: 500 }
    );
  }
}
