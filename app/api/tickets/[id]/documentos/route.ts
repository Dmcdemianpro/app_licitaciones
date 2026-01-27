import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { canAccessTicket } from "@/lib/ticket-access";

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

    const ticket = await prisma.ticket.findFirst({
      where: { id, deletedAt: null },
      select: { assigneeId: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }

    const role = session.user.role ?? "";
    if (role === "USER" && ticket.assigneeId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para ver documentos de este ticket" },
        { status: 403 }
      );
    }
    if (role !== "USER") {
      const canAccess = await canAccessTicket(session.user.id, role, id);
      if (!canAccess) {
        return NextResponse.json(
          { error: "No tienes permisos para ver documentos de este ticket" },
          { status: 403 }
        );
      }
    }

    const documentos = await prisma.documento.findMany({
      where: { ticketId: id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ documentos });
  } catch (error) {
    console.error("Error obteniendo documentos:", error);
    return NextResponse.json(
      { error: "Error al obtener documentos" },
      { status: 500 }
    );
  }
}

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

    const ticket = await prisma.ticket.findFirst({
      where: { id, deletedAt: null },
      select: { assigneeId: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }

    const role = session.user.role ?? "";
    if (role === "USER" && ticket.assigneeId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para subir documentos a este ticket" },
        { status: 403 }
      );
    }
    if (role !== "USER") {
      const canAccess = await canAccessTicket(session.user.id, role, id);
      if (!canAccess) {
        return NextResponse.json(
          { error: "No tienes permisos para subir documentos a este ticket" },
          { status: 403 }
        );
      }
    }

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const descripcion = formData.get("descripcion") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó un archivo" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads", "tickets", id);

    try {
      const fs = await import("fs/promises");
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const relativePath = `/uploads/tickets/${id}/${filename}`;

    const documento = await prisma.documento.create({
      data: {
        nombre: file.name,
        descripcion: descripcion || null,
        tipoArchivo: file.type,
        tamano: file.size,
        rutaArchivo: relativePath,
        ticketId: id,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ documento });
  } catch (error) {
    console.error("Error subiendo documento:", error);
    return NextResponse.json(
      { error: "Error al subir documento" },
      { status: 500 }
    );
  }
}
