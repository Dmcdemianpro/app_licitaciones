import { NextResponse } from "next/server";
import { env } from "@/lib/env";

const BASE_URL = "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json";

function formatToday(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const estado = searchParams.get("estado") || "todos";
  const ticket = env.MERCADOPUBLICO_APIKEY;
  const fecha = searchParams.get("fecha"); // opcional ddmmaaaa
  const codigoOrganismo = searchParams.get("organismo");
  const codigoProveedor = searchParams.get("proveedor");

  const params = new URLSearchParams({ ticket });

  // Si viene código en q, usamos búsqueda por código; si no, por fecha + estado/organismo/proveedor.
  if (q) {
    params.set("codigo", q);
  } else {
    params.set("fecha", fecha || formatToday());
    params.set("estado", estado || "todos");
    if (codigoOrganismo) params.set("CodigoOrganismo", codigoOrganismo);
    if (codigoProveedor) params.set("CodigoProveedor", codigoProveedor);
  }

  const url = `${BASE_URL}?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Error externo ${res.status}`);
    }
    const data = await res.json();

    const listado = Array.isArray(data?.Listado) ? data.Listado : [];
    const items = listado.map((item: any) => {
      // Calcular monto desde los items adjudicados si no está en el nivel superior
      const montoEstimado = item.MontoEstimado ||
        item.Items?.Listado?.[0]?.Adjudicacion?.MontoUnitario ||
        null;

      // Formatear fechas
      const fechaPublicacion = item.Fechas?.FechaPublicacion || item.FechaPublicacion || "-";
      const fechaCierre = item.Fechas?.FechaCierre || item.FechaCierre || "-";

      // Calcular días restantes si hay fecha de cierre
      let diasRestantes = undefined;
      if (fechaCierre && fechaCierre !== "-") {
        const cierre = new Date(fechaCierre);
        const hoy = new Date();
        const diff = cierre.getTime() - hoy.getTime();
        diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      return {
        id: item.Codigo || item.CodigoExterno || crypto.randomUUID(),
        codigo: item.Codigo || item.CodigoExterno || "N/A",
        nombre: item.Nombre || "Sin nombre",
        descripcion: item.Descripcion || "",
        institucion: item.Comprador?.NombreOrganismo || item.NombreOrganismo || "N/D",
        fechaPublicacion: fechaPublicacion !== "-" ? new Date(fechaPublicacion).toLocaleDateString('es-CL') : "-",
        fechaCierre: fechaCierre !== "-" ? new Date(fechaCierre).toLocaleDateString('es-CL') : "-",
        montoEstimado: montoEstimado ? `$${(montoEstimado / 1000000).toFixed(1)}M` : "-",
        estado: item.Estado || "Desconocido",
        diasRestantes,
        // Datos adicionales para guardar en BD
        rawData: item, // Guardamos el objeto completo por si se quiere guardar
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error consultando MercadoPublico", error);
    return NextResponse.json(
      { error: "No se pudo obtener licitaciones" },
      { status: 500 }
    );
  }
}
