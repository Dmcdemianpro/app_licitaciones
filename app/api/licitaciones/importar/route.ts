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

    // Extraer datos básicos del objeto de Mercado Público
    const codigoExterno = rawData.Codigo || rawData.CodigoExterno;
    const nombre = rawData.Nombre || "Sin nombre";
    const descripcion = rawData.Descripcion || "";
    const entidad = rawData.Comprador?.NombreOrganismo || rawData.NombreOrganismo || "N/D";
    const estado = mapearEstado(rawData.Estado || rawData.CodigoEstado);

    // Información básica adicional
    const codigoEstado = rawData.CodigoEstado || null;
    const estadoTexto = rawData.Estado || null;
    const diasCierreLicitacion = rawData.DiasCierreLicitacion ? parseInt(rawData.DiasCierreLicitacion) : null;
    const codigoTipo = rawData.CodigoTipo || null;
    const tipoLicitacion = rawData.Tipo || null;
    const tipoConvocatoria = rawData.TipoConvocatoria || null;
    const etapas = rawData.Etapas || null;
    const estadoEtapas = rawData.EstadoEtapas || null;
    const tomaRazon = rawData.TomaRazon || null;
    const estadoPublicidadOfertas = rawData.EstadoPublicidadOfertas || null;
    const contrato = rawData.Contrato || null;
    const obras = rawData.Obras || null;
    const cantidadReclamos = rawData.CantidadReclamos || null;

    // Información del comprador
    const codigoOrganismo = rawData.Comprador?.CodigoOrganismo || null;
    const rutUnidad = rawData.Comprador?.RutUnidad || null;
    const codigoUnidad = rawData.Comprador?.CodigoUnidad || null;
    const nombreUnidad = rawData.Comprador?.NombreUnidad || null;
    const direccionUnidad = rawData.Comprador?.DireccionUnidad || null;
    const comunaUnidad = rawData.Comprador?.ComunaUnidad || null;
    const regionUnidad = rawData.Comprador?.RegionUnidad || null;
    const rutUsuario = rawData.Comprador?.RutUsuario || null;
    const codigoUsuario = rawData.Comprador?.CodigoUsuario || null;
    const nombreUsuario = rawData.Comprador?.NombreUsuario || null;
    const cargoUsuario = rawData.Comprador?.CargoUsuario || null;

    // Obtener monto
    const montoEstimado = rawData.MontoEstimado ||
      rawData.Items?.Listado?.[0]?.Adjudicacion?.MontoUnitario ||
      null;

    // Obtener fechas principales
    const fechaPublicacion = rawData.Fechas?.FechaPublicacion || rawData.FechaPublicacion || null;
    const fechaCierre = rawData.Fechas?.FechaCierre || rawData.FechaCierre || null;
    const fechaAdjudicacion = rawData.Fechas?.FechaAdjudicacion || rawData.FechaAdjudicacion || null;

    // Fechas adicionales
    const fechaCreacion = rawData.Fechas?.FechaCreacion || null;
    const fechaInicio = rawData.Fechas?.FechaInicio || null;
    const fechaFinal = rawData.Fechas?.FechaFinal || null;
    const fechaPubRespuestas = rawData.Fechas?.FechaPubRespuestas || null;
    const fechaActoAperturaTecnica = rawData.Fechas?.FechaActoAperturaTecnica || null;
    const fechaActoAperturaEconomica = rawData.Fechas?.FechaActoAperturaEconomica || null;
    const fechaEstimadaAdjudicacion = rawData.Fechas?.FechaEstimadaAdjudicacion || null;
    const fechaSoporteFisico = rawData.Fechas?.FechaSoporteFisico || null;
    const fechaTiempoEvaluacion = rawData.Fechas?.FechaTiempoEvaluacion || null;
    const fechaEstimadaFirma = rawData.Fechas?.FechaEstimadaFirma || null;
    const fechaVisitaTerreno = rawData.Fechas?.FechaVisitaTerreno || null;
    const fechaEntregaAntecedentes = rawData.Fechas?.FechaEntregaAntecedentes || null;

    // Información financiera y contractual
    const estimacion = rawData.Estimacion || null;
    const fuenteFinanciamiento = rawData.FuenteFinanciamiento || null;
    const visibilidadMonto = rawData.VisibilidadMonto || null;
    const tiempo = rawData.Tiempo || null;
    const unidadTiempo = rawData.UnidadTiempo || null;
    const modalidad = rawData.Modalidad || null;
    const tipoPago = rawData.TipoPago || null;
    const nombreResponsablePago = rawData.NombreResponsablePago || null;
    const emailResponsablePago = rawData.EmailResponsablePago || null;
    const nombreResponsableContrato = rawData.NombreResponsableContrato || null;
    const emailResponsableContrato = rawData.EmailResponsableContrato || null;
    const fonoResponsableContrato = rawData.FonoResponsableContrato || null;
    const unidadTiempoDuracionContrato = rawData.UnidadTiempoDuracionContrato || null;
    const tiempoDuracionContrato = rawData.TiempoDuracionContrato || null;
    const tipoDuracionContrato = rawData.TipoDuracionContrato || null;

    // Condiciones y requisitos
    const prohibicionContratacion = rawData.ProhibicionContratacion || null;
    const subContratacion = rawData.SubContratacion || null;
    const justificacionMontoEstimado = rawData.JustificacionMontoEstimado || null;
    const observacionContract = rawData.ObservacionContract || null;
    const extensionPlazo = rawData.ExtensionPlazo || null;
    const esBaseTipo = rawData.EsBaseTipo || null;
    const unidadTiempoContratoLicitacion = rawData.UnidadTiempoContratoLicitacion || null;
    const valorTiempoRenovacion = rawData.ValorTiempoRenovacion || null;
    const periodoTiempoRenovacion = rawData.PeriodoTiempoRenovacion || null;
    const esRenovable = rawData.EsRenovable || null;
    const codigoBIP = rawData.CodigoBIP || null;

    // Direcciones
    const direccionVisita = rawData.DireccionVisita || null;
    const direccionEntrega = rawData.DireccionEntrega || null;

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

    // Crear licitación con todos los campos de la API
    const licitacion = await prisma.licitacion.create({
      data: {
        // Campos básicos originales
        codigoExterno,
        nombre,
        descripcion,
        entidad,
        tipo: "PUBLICA",
        estado,
        montoEstimado: montoEstimado ? parseFloat(montoEstimado.toString()) : null,
        moneda: rawData.Moneda || "CLP",
        fechaPublicacion: fechaPublicacion ? new Date(fechaPublicacion) : null,
        fechaCierre: fechaCierre ? new Date(fechaCierre) : null,
        fechaAdjudicacion: fechaAdjudicacion ? new Date(fechaAdjudicacion) : null,
        urlExterna,
        createdById: session.user.id,

        // Información básica adicional
        codigoEstado,
        estadoTexto,
        diasCierreLicitacion,
        codigoTipo,
        tipoLicitacion,
        tipoConvocatoria,
        etapas,
        estadoEtapas,
        tomaRazon,
        estadoPublicidadOfertas,
        contrato,
        obras,
        cantidadReclamos,

        // Información del comprador
        codigoOrganismo,
        rutUnidad,
        codigoUnidad,
        nombreUnidad,
        direccionUnidad,
        comunaUnidad,
        regionUnidad,
        rutUsuario,
        codigoUsuario,
        nombreUsuario,
        cargoUsuario,

        // Fechas adicionales
        fechaCreacion: fechaCreacion ? new Date(fechaCreacion) : null,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaFinal: fechaFinal ? new Date(fechaFinal) : null,
        fechaPubRespuestas: fechaPubRespuestas ? new Date(fechaPubRespuestas) : null,
        fechaActoAperturaTecnica: fechaActoAperturaTecnica ? new Date(fechaActoAperturaTecnica) : null,
        fechaActoAperturaEconomica: fechaActoAperturaEconomica ? new Date(fechaActoAperturaEconomica) : null,
        fechaEstimadaAdjudicacion: fechaEstimadaAdjudicacion ? new Date(fechaEstimadaAdjudicacion) : null,
        fechaSoporteFisico: fechaSoporteFisico ? new Date(fechaSoporteFisico) : null,
        fechaTiempoEvaluacion: fechaTiempoEvaluacion ? new Date(fechaTiempoEvaluacion) : null,
        fechaEstimadaFirma: fechaEstimadaFirma ? new Date(fechaEstimadaFirma) : null,
        fechaVisitaTerreno: fechaVisitaTerreno ? new Date(fechaVisitaTerreno) : null,
        fechaEntregaAntecedentes: fechaEntregaAntecedentes ? new Date(fechaEntregaAntecedentes) : null,

        // Información financiera y contractual
        estimacion,
        fuenteFinanciamiento,
        visibilidadMonto,
        tiempo,
        unidadTiempo,
        modalidad,
        tipoPago,
        nombreResponsablePago,
        emailResponsablePago,
        nombreResponsableContrato,
        emailResponsableContrato,
        fonoResponsableContrato,
        unidadTiempoDuracionContrato,
        tiempoDuracionContrato,
        tipoDuracionContrato,

        // Condiciones y requisitos
        prohibicionContratacion,
        subContratacion,
        justificacionMontoEstimado,
        observacionContract,
        extensionPlazo,
        esBaseTipo,
        unidadTiempoContratoLicitacion,
        valorTiempoRenovacion,
        periodoTiempoRenovacion,
        esRenovable,
        codigoBIP,

        // Direcciones
        direccionVisita,
        direccionEntrega,

        // Crear items de la licitación si existen
        items: {
          create: (rawData.Items?.Listado || []).map((item: any, index: number) => ({
            correlativo: item.Correlativo || index + 1,
            codigoProducto: item.CodigoProducto?.toString() || null,
            codigoCategoria: item.CodigoCategoria || null,
            categoria: item.Categoria || null,
            nombreProducto: item.NombreProducto || null,
            descripcion: item.Descripcion || null,
            unidadMedida: item.UnidadMedida || null,
            cantidad: item.Cantidad ? parseFloat(item.Cantidad.toString()) : null,
          }))
        }
      },
      include: {
        items: true,
      }
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
