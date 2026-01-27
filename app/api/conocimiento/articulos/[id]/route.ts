import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slug";

async function buildUniqueSlug(base: string, currentId: string) {
  let slug = base;
  let counter = 1;
  while (true) {
    const exists = await prisma.knowledgeArticle.findUnique({ where: { slug } });
    if (!exists || exists.id === currentId) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
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

    const role = session.user.role ?? "";
    if (!["ADMIN", "SUPERVISOR"].includes(role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.titulo === "string") {
      const titulo = body.titulo.trim();
      if (!titulo) {
        return NextResponse.json({ error: "Titulo requerido" }, { status: 400 });
      }
      data.titulo = titulo;
      const baseSlug = slugify(titulo);
      if (!baseSlug) {
        return NextResponse.json({ error: "Slug invalido" }, { status: 400 });
      }
      data.slug = await buildUniqueSlug(baseSlug, id);
    }
    if (typeof body.resumen === "string") {
      data.resumen = body.resumen.trim();
    }
    if (typeof body.contenido === "string") {
      data.contenido = body.contenido.trim();
    }
    if (Object.prototype.hasOwnProperty.call(body, "publicado")) {
      data.publicado = Boolean(body.publicado);
    }
    if (Object.prototype.hasOwnProperty.call(body, "categoriaId")) {
      data.categoriaId = body.categoriaId || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }

    const articulo = await prisma.knowledgeArticle.update({
      where: { id },
      data,
    });

    return NextResponse.json({ articulo });
  } catch (error) {
    console.error("Error actualizando articulo:", error);
    return NextResponse.json({ error: "Error al actualizar articulo" }, { status: 500 });
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

    const role = session.user.role ?? "";
    if (!["ADMIN", "SUPERVISOR"].includes(role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.knowledgeArticle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando articulo:", error);
    return NextResponse.json({ error: "Error al eliminar articulo" }, { status: 500 });
  }
}
