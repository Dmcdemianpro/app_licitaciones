import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que el usuario existe en la base de datos
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!userExists) {
      console.error("User not found in database:", session.user.id);
      return NextResponse.json(
        { error: "Usuario de sesión no encontrado en base de datos. Por favor, cierre sesión y vuelva a iniciar." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { rawData } = body;

    if (!rawData) {
      return NextResponse.json({ error: "Faltan datos de la licitación" }, { status: 400 });
    }

    // Extraer datos del objeto de Mercado Público
    const codigoExterno = rawData.Codigo || rawData.CodigoExterno;
    const nombre = rawData.Nombre || "Sin nombre";
    const descripcion = rawData.Descripcion || "";
    const entidad = rawData.Comprador?.NombreOrganismo || rawData.NombreOrganismo || "N/D";
    const estado = mapearEstado(rawData.Estado || rawData.CodigoEstado);

    // Obtener monto
    const montoEstimado = rawData.MontoEstimado ||
      rawData.Items?.Listado?.[0]?.Adjudicacion?.MontoUnitario ||
      null;

    // Obtener fechas
    const fechaPublicacion = rawData.Fechas?.FechaPublicacion || rawData.FechaPublicacion || null;
    const fechaCierre = rawData.Fechas?.FechaCierre || rawData.FechaCierre || null;
    const fechaAdjudicacion = rawData.Fechas?.FechaAdjudicacion || rawData.FechaAdjudicacion || null;

    // Crear URL externa a Mercado Público
    const urlExterna = codigoExterno
      ? `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${codigoExterno}`
      : null;

    // Verificar si ya existe
    const existe = await prisma.licitacion.findUnique({
      where: { codigoExterno }
    });

    if (existe) {
      return NextResponse.json(
        { error: "Esta licitación ya fue importada previamente", licitacion: existe },
        { status: 409 }
      );
    }

    // Crear licitación
    const licitacion = await prisma.licitacion.create({
      data: {
        codigoExterno,
        nombre,
        descripcion,
        entidad,
        tipo: "PUBLICA",
        estado,
        montoEstimado: montoEstimado ? parseFloat(montoEstimado.toString()) : null,
        moneda: "CLP",
        fechaPublicacion: fechaPublicacion ? new Date(fechaPublicacion) : null,
        fechaCierre: fechaCierre ? new Date(fechaCierre) : null,
        fechaAdjudicacion: fechaAdjudicacion ? new Date(fechaAdjudicacion) : null,
        urlExterna,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      licitacion,
      message: "Licitación importada correctamente"
    });
  } catch (error) {
    console.error("Error importando licitación:", error);
    return NextResponse.json(
      { error: "Error al importar la licitación" },
      { status: 500 }
    );
  }
}

// Mapear estados de Mercado Público a estados internos
function mapearEstado(estadoMP: string | number): string {
  if (typeof estadoMP === 'number') {
    // Códigos de estado de Mercado Público
    switch (estadoMP) {
      case 5: return "ACTIVA";
      case 6: return "ACTIVA";
      case 7: return "ACTIVA";
      case 8: return "ADJUDICADA";
      case 9: return "DESIERTA";
      case 10: return "CANCELADA";
      default: return "EN_PREPARACION";
    }
  }

  const estadoStr = estadoMP.toString().toUpperCase();
  if (estadoStr.includes("ACTIV")) return "ACTIVA";
  if (estadoStr.includes("ADJU")) return "ADJUDICADA";
  if (estadoStr.includes("DESERT")) return "DESIERTA";
  if (estadoStr.includes("CANCEL")) return "CANCELADA";
  if (estadoStr.includes("CERRAD")) return "ACTIVA";

  return "EN_PREPARACION";
}
