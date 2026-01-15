import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const summary = await getDashboardSummary({
      userId: session.user.id,
      role: session.user.role,
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error obteniendo resumen del dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener resumen del dashboard" },
      { status: 500 }
    );
  }
}
