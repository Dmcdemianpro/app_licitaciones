import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slug";

async function buildUniqueSlug(base: string, currentId: string) {
  let slug = base;
  let counter = 1;
  while (true) {
    const exists = await prisma.knowledgeCategory.findUnique({ where: { slug } });
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
    if (typeof body.nombre === "string") {
      const nombre = body.nombre.trim();
      if (!nombre) {
        return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
      }
      data.nombre = nombre;
      const baseSlug = slugify(nombre);
      if (!baseSlug) {
        return NextResponse.json({ error: "Slug invalido" }, { status: 400 });
      }
      data.slug = await buildUniqueSlug(baseSlug, id);
    }
    if (typeof body.descripcion === "string") {
      data.descripcion = body.descripcion.trim();
    }
    if (typeof body.activo === "boolean") {
      data.activo = body.activo;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }

    const categoria = await prisma.knowledgeCategory.update({
      where: { id },
      data,
    });

    return NextResponse.json({ categoria });
  } catch (error) {
    console.error("Error actualizando categoria:", error);
    return NextResponse.json({ error: "Error al actualizar categoria" }, { status: 500 });
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
    await prisma.knowledgeCategory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando categoria:", error);
    return NextResponse.json({ error: "Error al eliminar categoria" }, { status: 500 });
  }
}
