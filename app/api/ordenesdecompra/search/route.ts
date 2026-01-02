import { NextResponse } from "next/server";
import { env } from "@/lib/env";

const BASE_URL = "https://api.mercadopublico.cl/servicios/v1/publico/ordenesdecompra.json";

function formatToday(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const codigo = searchParams.get("codigo")?.trim() || "";
  const ticket = env.MERCADOPUBLICO_APIKEY;
  const fecha = searchParams.get("fecha"); // opcional ddmmaaaa
  const codigoOrganismo = searchParams.get("organismo");
  const codigoProveedor = searchParams.get("proveedor");
  const estado = searchParams.get("estado");

  const params = new URLSearchParams({ ticket });

  // Si viene código, usamos búsqueda por código; si no, por fecha + filtros opcionales.
  if (codigo) {
    params.set("codigo", codigo);
  } else {
    params.set("fecha", fecha || formatToday());
    if (codigoOrganismo) params.set("CodigoOrganismo", codigoOrganismo);
    if (codigoProveedor) params.set("CodigoProveedor", codigoProveedor);
    if (estado) params.set("estado", estado);
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
      const fechaEnvio = item.Fechas?.FechaEnvio || item.FechaEnvio || "-";
      const fechaAceptacion = item.Fechas?.FechaAceptacion || item.FechaAceptacion || "-";
      const monto = item.Total || item.Monto || 0;

      return {
        id: item.Codigo || crypto.randomUUID(),
        codigo: item.Codigo || "N/A",
        nombre: item.Nombre || "Sin nombre",
        codigoLicitacion: item.CodigoLicitacion || "N/A",
        institucion: item.Comprador?.NombreOrganismo || item.NombreOrganismo || "N/D",
        razonSocialProveedor: item.Proveedor?.RazonSocial || item.RazonSocial || item.RazonSocialProveedor || "N/D",
        rutProveedor: item.Proveedor?.RutProveedor || item.RutProveedor || "N/D",
        fechaEnvio: fechaEnvio !== "-" ? new Date(fechaEnvio).toLocaleDateString('es-CL') : "-",
        fechaAceptacion: fechaAceptacion !== "-" ? new Date(fechaAceptacion).toLocaleDateString('es-CL') : "-",
        monto: monto ? `$${(monto / 1000000).toFixed(1)}M` : "$0",
        moneda: item.Moneda || "CLP",
        estado: item.Estado || "Desconocido",
        rawData: item,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error consultando Órdenes de Compra de MercadoPublico", error);
    return NextResponse.json(
      { error: "No se pudo obtener órdenes de compra" },
      { status: 500 }
    );
  }
}
