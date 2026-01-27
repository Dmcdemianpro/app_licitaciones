import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slug";

async function buildUniqueSlug(base: string) {
  let slug = base;
  let counter = 1;
  while (true) {
    const exists = await prisma.knowledgeArticle.findUnique({ where: { slug } });
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

    const role = session.user.role ?? "";
    const isAdmin = ["ADMIN", "SUPERVISOR"].includes(role);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const categoriaId = searchParams.get("categoriaId");
    const slug = searchParams.get("slug");
    const soloPublicados = searchParams.get("soloPublicados") === "true";
    const incrementar = searchParams.get("incrementar") === "true";

    if (slug) {
      const articulo = await prisma.knowledgeArticle.findFirst({
        where: {
          slug,
          ...(soloPublicados || !isAdmin ? { publicado: true } : {}),
        },
        include: { categoria: true, createdBy: { select: { id: true, name: true, email: true } } },
      });

      if (!articulo) {
        return NextResponse.json({ error: "Articulo no encontrado" }, { status: 404 });
      }

      if (incrementar) {
        await prisma.knowledgeArticle.update({
          where: { id: articulo.id },
          data: { vistas: { increment: 1 } },
        });
      }

      return NextResponse.json({ articulo });
    }

    const articulos = await prisma.knowledgeArticle.findMany({
      where: {
        ...(soloPublicados || !isAdmin ? { publicado: true } : {}),
        ...(categoriaId ? { categoriaId } : {}),
        ...(q
          ? {
              OR: [
                { titulo: { contains: q } },
                { resumen: { contains: q } },
                { contenido: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { categoria: true },
    });

    return NextResponse.json({ articulos });
  } catch (error) {
    console.error("Error obteniendo articulos:", error);
    return NextResponse.json({ error: "Error al obtener articulos" }, { status: 500 });
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
    const titulo = typeof body.titulo === "string" ? body.titulo.trim() : "";
    const resumen = typeof body.resumen === "string" ? body.resumen.trim() : null;
    const contenido = typeof body.contenido === "string" ? body.contenido.trim() : "";
    const categoriaId =
      typeof body.categoriaId === "string" && body.categoriaId.trim()
        ? body.categoriaId
        : null;
    const publicado = typeof body.publicado === "boolean" ? body.publicado : false;

    if (!titulo || !contenido) {
      return NextResponse.json(
        { error: "Titulo y contenido requeridos" },
        { status: 400 }
      );
    }

    const baseSlug = slugify(titulo);
    if (!baseSlug) {
      return NextResponse.json({ error: "Slug invalido" }, { status: 400 });
    }
    const slug = await buildUniqueSlug(baseSlug);

    const articulo = await prisma.knowledgeArticle.create({
      data: {
        titulo,
        slug,
        resumen,
        contenido,
        publicado,
        categoriaId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ articulo }, { status: 201 });
  } catch (error) {
    console.error("Error creando articulo:", error);
    return NextResponse.json({ error: "Error al crear articulo" }, { status: 500 });
  }
}
