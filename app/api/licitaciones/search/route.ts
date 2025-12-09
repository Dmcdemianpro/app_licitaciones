import { NextResponse } from "next/server";

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
  const ticket = process.env.MERCADOPUBLICO_APIKEY || searchParams.get("ticket");
  const fecha = searchParams.get("fecha"); // opcional ddmmaaaa
  const codigoOrganismo = searchParams.get("organismo");
  const codigoProveedor = searchParams.get("proveedor");

  if (!ticket) {
    return NextResponse.json(
      { error: "Falta MERCADOPUBLICO_APIKEY en el entorno" },
      { status: 500 }
    );
  }

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
    const items = listado.map((item: any) => ({
      id: item.Codigo || item.CodigoExterno || crypto.randomUUID(),
      codigo: item.Codigo || item.CodigoExterno || "N/A",
      nombre: item.Nombre || item.NombreLicitacion || "Sin nombre",
      institucion: item.NombreOrganismo || item.NombreInstitucion || "N/D",
      fechaPublicacion: item.FechaPublicacion || item.Fecha || "-",
      fechaCierre: item.FechaCierre || "-",
      montoEstimado: item.MontoEstimado || item.Monto || "-",
      estado: item.Estado || item.CodigoEstadoDescripcion || item.CodigoEstado || "Desconocido",
      diasRestantes: undefined,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error consultando MercadoPublico", error);
    return NextResponse.json(
      { error: "No se pudo obtener licitaciones" },
      { status: 500 }
    );
  }
}
