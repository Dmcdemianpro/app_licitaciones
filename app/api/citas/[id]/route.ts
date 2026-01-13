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

    const cita = await prisma.cita.findUnique({
      where: { id },
      include: {
        organizador: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participantes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!cita) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    // Agregar folioFormateado
    const citaConFolio = {
      ...cita,
      folioFormateado: `HEC-C${String(cita.folio).padStart(2, "0")}`,
    };

    return NextResponse.json({ cita: citaConFolio });
  } catch (error) {
    console.error("Error obteniendo cita:", error);
    return NextResponse.json(
      { error: "Error al obtener cita" },
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

    const { id } = await params;
    const body = await req.json();

    const cita = await prisma.cita.update({
      where: { id },
      data: body,
      include: {
        organizador: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participantes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Agregar folioFormateado
    const citaConFolio = {
      ...cita,
      folioFormateado: `HEC-C${String(cita.folio).padStart(2, "0")}`,
    };

    return NextResponse.json({ cita: citaConFolio });
  } catch (error) {
    console.error("Error actualizando cita:", error);
    return NextResponse.json(
      { error: "Error al actualizar cita" },
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

    // PERMISOS: Solo ADMIN puede eliminar citas
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar citas. Solo el rol ADMIN puede hacerlo." },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Primero eliminar los participantes asociados
    await prisma.citaParticipante.deleteMany({
      where: { citaId: id },
    });

    // Luego eliminar la cita
    await prisma.cita.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando cita:", error);
    return NextResponse.json(
      { error: "Error al eliminar cita" },
      { status: 500 }
    );
  }
}
