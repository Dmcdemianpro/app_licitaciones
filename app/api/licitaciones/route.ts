import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const responsableId = searchParams.get("responsableId");
    const incluirEliminadas = searchParams.get("incluirEliminadas") === "true";

    // Construir filtros
    const where: any = {};

    if (estado && estado !== "all") {
      where.estado = estado;
    }

    if (responsableId) {
      where.responsableId = responsableId;
    }

    // SOFT DELETE: Solo admins pueden ver eliminadas
    if (!incluirEliminadas || session.user.role !== "ADMIN") {
      where.deletedAt = null;
    }

    const licitaciones = await prisma.licitacion.findMany({
      where,
      include: {
        responsable: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deletedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        notas: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        documentos: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
      },
      orderBy: {
        folio: "desc",
      },
    });

    // Calcular días restantes para cada licitación
    const licitacionesConDias = licitaciones.map((licitacion) => {
      let diasRestantes = undefined;
      if (licitacion.fechaCierre) {
        const hoy = new Date();
        const diff = licitacion.fechaCierre.getTime() - hoy.getTime();
        diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      return {
        ...licitacion,
        diasRestantes,
        montoEstimado: licitacion.montoEstimado ? licitacion.montoEstimado.toString() : null,
        folioFormateado: `HEC-L${String(licitacion.folio).padStart(2, "0")}`,
      };
    });

    return NextResponse.json({ licitaciones: licitacionesConDias });
  } catch (error) {
    console.error("Error obteniendo licitaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener licitaciones" },
      { status: 500 }
    );
  }
}
