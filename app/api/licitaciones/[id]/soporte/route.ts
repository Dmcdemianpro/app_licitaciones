import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessLicitacion } from "@/lib/licitacion-access";

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
    const body = await req.json();
    const {
      nombreContacto,
      emailContacto,
      telefonoContacto,
      tipoSoporte,
      horarioInicio,
      horarioFin,
      diasDisponibles,
      observaciones,
    } = body;

    const hasAccess = await canAccessLicitacion(session.user.id, session.user.role, id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Licitacion no encontrada" },
        { status: 404 }
      );
    }

    // Validar campos obligatorios
    if (!nombreContacto || !emailContacto) {
      return NextResponse.json(
        { error: "Nombre y email son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar que la licitación existe
    const licitacion = await prisma.licitacion.findUnique({
      where: { id },
    });

    if (!licitacion) {
      return NextResponse.json(
        { error: "Licitación no encontrada" },
        { status: 404 }
      );
    }

    // Crear el contacto de soporte
    const soporte = await prisma.soporteTecnico.create({
      data: {
        licitacionId: id,
        nombreContacto,
        emailContacto,
        telefonoContacto: telefonoContacto || null,
        tipoSoporte: tipoSoporte || "TECNICO",
        horarioInicio: horarioInicio || null,
        horarioFin: horarioFin || null,
        diasDisponibles: diasDisponibles || null,
        observaciones: observaciones || null,
        createdById: session.user.id,
      },
    });

    // Crear notificación para el usuario actual
    await prisma.notificacion.create({
      data: {
        tipo: "EXITO",
        titulo: "Contacto de soporte agregado",
        mensaje: `Se ha agregado un nuevo contacto de soporte: ${nombreContacto} (${tipoSoporte})`,
        userId: session.user.id,
        referenceType: "LICITACION",
        referenceId: id,
      },
    });

    // Registrar en auditoría
    await prisma.auditoriaLog.create({
      data: {
        accion: "CREATE",
        entidad: "SOPORTE_TECNICO",
        entidadId: soporte.id,
        cambios: JSON.stringify({ nuevo: soporte }),
        userId: session.user.id,
      },
    });

    // TODO: Enviar email de notificación
    // Aquí se podría integrar con un servicio de email como nodemailer
    // para enviar un correo al usuario notificando del nuevo contacto

    return NextResponse.json({
      success: true,
      soporte,
      message: "Contacto de soporte agregado correctamente",
    });
  } catch (error) {
    console.error("Error creando contacto de soporte:", error);
    return NextResponse.json(
      { error: "Error al crear contacto de soporte" },
      { status: 500 }
    );
  }
}
