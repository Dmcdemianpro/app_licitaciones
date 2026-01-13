import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; soporteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id, soporteId } = await params;
    const body = await req.json();

    // Verificar que el contacto existe y pertenece a la licitación
    const soporteExistente = await prisma.soporteTecnico.findUnique({
      where: { id: soporteId },
    });

    if (!soporteExistente || soporteExistente.licitacionId !== id) {
      return NextResponse.json(
        { error: "Contacto de soporte no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el contacto de soporte
    const soporte = await prisma.soporteTecnico.update({
      where: { id: soporteId },
      data: {
        nombreContacto: body.nombreContacto,
        emailContacto: body.emailContacto,
        telefonoContacto: body.telefonoContacto || null,
        tipoSoporte: body.tipoSoporte || "TECNICO",
        horarioInicio: body.horarioInicio || null,
        horarioFin: body.horarioFin || null,
        diasDisponibles: body.diasDisponibles || null,
        observaciones: body.observaciones || null,
      },
    });

    // Registrar cambios en auditoría
    const cambios: Record<string, { anterior: any; nuevo: any }> = {};
    Object.keys(body).forEach((key) => {
      if (soporteExistente[key as keyof typeof soporteExistente] !== body[key]) {
        cambios[key] = {
          anterior: soporteExistente[key as keyof typeof soporteExistente],
          nuevo: body[key],
        };
      }
    });

    if (Object.keys(cambios).length > 0) {
      await prisma.auditoriaLog.create({
        data: {
          accion: "UPDATE",
          entidad: "SOPORTE_TECNICO",
          entidadId: soporteId,
          cambios: JSON.stringify(cambios),
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      soporte,
      message: "Contacto de soporte actualizado correctamente",
    });
  } catch (error) {
    console.error("Error actualizando contacto de soporte:", error);
    return NextResponse.json(
      { error: "Error al actualizar contacto de soporte" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; soporteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id, soporteId } = await params;

    // Verificar que el contacto existe y pertenece a la licitación
    const soporteExistente = await prisma.soporteTecnico.findUnique({
      where: { id: soporteId },
    });

    if (!soporteExistente || soporteExistente.licitacionId !== id) {
      return NextResponse.json(
        { error: "Contacto de soporte no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el contacto de soporte
    await prisma.soporteTecnico.delete({
      where: { id: soporteId },
    });

    // Registrar eliminación en auditoría
    await prisma.auditoriaLog.create({
      data: {
        accion: "DELETE",
        entidad: "SOPORTE_TECNICO",
        entidadId: soporteId,
        cambios: JSON.stringify({ eliminado: soporteExistente }),
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Contacto de soporte eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando contacto de soporte:", error);
    return NextResponse.json(
      { error: "Error al eliminar contacto de soporte" },
      { status: 500 }
    );
  }
}
