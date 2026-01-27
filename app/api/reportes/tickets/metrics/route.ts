import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Counter = Record<string, number>;

const addCount = (bucket: Counter, key: string) => {
  const normalized = key || "SIN_TIPO";
  bucket[normalized] = (bucket[normalized] ?? 0) + 1;
};

const average = (values: number[]) => {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const role = session.user.role ?? "";
    if (!["ADMIN", "SUPERVISOR"].includes(role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const tickets = await prisma.ticket.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        status: true,
        priority: true,
        type: true,
        createdAt: true,
        closedAt: true,
        firstResponseAt: true,
        assigneeId: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        slaResponseBreachedAt: true,
        slaResolutionBreachedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const byStatus: Counter = {};
    const byPriority: Counter = {};
    const byType: Counter = {};
    const resolutionDurations: number[] = [];
    const responseDurations: number[] = [];

    const productivityMap = new Map<
      string,
      {
        id: string;
        name: string | null;
        email: string | null;
        assignedCount: number;
        closedCount: number;
        resolutionMinutes: number[];
      }
    >();

    let responseBreached = 0;
    let resolutionBreached = 0;

    tickets.forEach((ticket) => {
      addCount(byStatus, ticket.status);
      addCount(byPriority, ticket.priority);
      addCount(byType, ticket.type);

      if (ticket.closedAt) {
        const minutes = Math.max(
          0,
          Math.round((ticket.closedAt.getTime() - ticket.createdAt.getTime()) / 60_000)
        );
        resolutionDurations.push(minutes);
      }

      if (ticket.firstResponseAt) {
        const minutes = Math.max(
          0,
          Math.round((ticket.firstResponseAt.getTime() - ticket.createdAt.getTime()) / 60_000)
        );
        responseDurations.push(minutes);
      }

      if (ticket.slaResponseBreachedAt) responseBreached += 1;
      if (ticket.slaResolutionBreachedAt) resolutionBreached += 1;

      if (ticket.assigneeId) {
        const existing =
          productivityMap.get(ticket.assigneeId) ??
          {
            id: ticket.assigneeId,
            name: ticket.assignedTo?.name ?? null,
            email: ticket.assignedTo?.email ?? null,
            assignedCount: 0,
            closedCount: 0,
            resolutionMinutes: [],
          };

        existing.assignedCount += 1;
        if (ticket.closedAt) {
          existing.closedCount += 1;
          existing.resolutionMinutes.push(
            Math.max(
              0,
              Math.round((ticket.closedAt.getTime() - ticket.createdAt.getTime()) / 60_000)
            )
          );
        }

        productivityMap.set(ticket.assigneeId, existing);
      }
    });

    const productivity = Array.from(productivityMap.values())
      .map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        assignedCount: item.assignedCount,
        closedCount: item.closedCount,
        avgResolutionMinutes: average(item.resolutionMinutes),
      }))
      .sort((a, b) => b.closedCount - a.closedCount);

    const csat = await prisma.ticketSurvey.findMany({
      select: { rating: true },
    });
    const ratings = csat.map((item) => item.rating);
    const csatAverage = average(ratings);
    const csatDistribution: Counter = {};
    ratings.forEach((rating) => addCount(csatDistribution, String(rating)));

    const totalTickets = tickets.length;
    const closedTickets = tickets.filter((ticket) => Boolean(ticket.closedAt)).length;
    const openTickets = totalTickets - closedTickets;

    return NextResponse.json({
      metrics: {
        totals: {
          total: totalTickets,
          abiertos: openTickets,
          finalizados: closedTickets,
        },
        byStatus,
        byPriority,
        byType,
        mttrMinutes: average(resolutionDurations),
        responseMinutes: average(responseDurations),
        slaBreaches: {
          response: responseBreached,
          resolution: resolutionBreached,
        },
        productivity,
        csat: {
          average: csatAverage,
          count: ratings.length,
          distribution: csatDistribution,
        },
      },
    });
  } catch (error) {
    console.error("Error obteniendo metricas:", error);
    return NextResponse.json({ error: "Error al obtener metricas" }, { status: 500 });
  }
}
