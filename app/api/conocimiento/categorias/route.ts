import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slug";

async function buildUniqueSlug(base: string) {
  let slug = base;
  let counter = 1;
  while (true) {
    const exists = await prisma.knowledgeCategory.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const soloActivos = searchParams.get("soloActivos") === "true";

    const categorias = await prisma.knowledgeCategory.findMany({
      where: {
        ...(soloActivos ? { activo: true } : {}),
      },
      orderBy: { nombre: "asc" },
      include: {
        _count: { select: { articulos: true } },
      },
    });

    return NextResponse.json({ categorias });
  } catch (error) {
    console.error("Error obteniendo categorias:", error);
    return NextResponse.json({ error: "Error al obtener categorias" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const role = session.user.role ?? "";
    if (!["ADMIN", "SUPERVISOR"].includes(role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json();
    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
    const descripcion =
      typeof body.descripcion === "string" ? body.descripcion.trim() : null;
    const activo = typeof body.activo === "boolean" ? body.activo : true;

    if (!nombre) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const baseSlug = slugify(nombre);
    if (!baseSlug) {
      return NextResponse.json({ error: "Slug invalido" }, { status: 400 });
    }
    const slug = await buildUniqueSlug(baseSlug);

    const categoria = await prisma.knowledgeCategory.create({
      data: {
        nombre,
        descripcion,
        slug,
        activo,
      },
    });

    return NextResponse.json({ categoria }, { status: 201 });
  } catch (error) {
    console.error("Error creando categoria:", error);
    return NextResponse.json({ error: "Error al crear categoria" }, { status: 500 });
  }
}
