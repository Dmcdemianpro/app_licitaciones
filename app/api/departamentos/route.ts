import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Obtener todos los departamentos
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const incluirUnidades = searchParams.get("incluirUnidades") === "true";
    const incluirUsuarios = searchParams.get("incluirUsuarios") !== "false";
    const soloActivos = searchParams.get("soloActivos") !== "false";
    const soloMisDepartamentos = searchParams.get("soloMios") === "true";

    // Construir filtros
    const where: any = {};
    if (soloActivos) {
      where.activo = true;
    }

    // Si solo quiere ver sus departamentos
    if (soloMisDepartamentos && session.user.role !== "ADMIN") {
      where.usuarios = {
        some: {
          userId: session.user.id,
          activo: true,
        },
      };
    }

    const departamentos = await prisma.departamento.findMany({
      where,
      include: {
        unidades: incluirUnidades
          ? {
              where: soloActivos ? { activo: true } : undefined,
              include: {
                _count: {
                  select: {
                    usuarios: true,
                    licitaciones: true,
                  },
                },
              },
              orderBy: { nombre: "asc" },
            }
          : false,
        usuarios: incluirUsuarios
          ? {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            }
          : false,
        _count: {
          select: {
            usuarios: true,
            unidades: true,
            licitaciones: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({
      success: true,
      departamentos,
    });
  } catch (error) {
    console.error("Error obteniendo departamentos:", error);
    return NextResponse.json(
      { error: "Error al obtener departamentos" },
      { status: 500 }
    );
  }
}

// POST - Crear un departamento (solo ADMIN)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Solo ADMIN puede crear departamentos
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { nombre, descripcion, codigo, color } = body;

    if (!nombre?.trim()) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    // Verificar que no exista otro con el mismo nombre
    const existente = await prisma.departamento.findFirst({
      where: {
        OR: [
          { nombre: nombre.trim() },
          codigo ? { codigo: codigo.trim() } : {},
        ],
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe un departamento con ese nombre o código" },
        { status: 400 }
      );
    }

    const departamento = await prisma.departamento.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        codigo: codigo?.trim() || null,
        color: color || null,
      },
    });

    // Registrar en auditoría
    await prisma.auditoriaLog.create({
      data: {
        accion: "CREATE",
        entidad: "DEPARTAMENTO",
        entidadId: departamento.id,
        cambios: JSON.stringify({ nuevo: departamento }),
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      departamento,
      message: "Departamento creado correctamente",
    });
  } catch (error) {
    console.error("Error creando departamento:", error);
    return NextResponse.json(
      { error: "Error al crear departamento" },
      { status: 500 }
    );
  }
}
