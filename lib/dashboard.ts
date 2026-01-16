import type { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

export type DashboardSummary = {
  totals: {
    total: number;
    open: number;
    inProgress: number;
    pendingValidation: number;
    finished: number;
  };
  recentTickets: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    updatedAt: string;
  }>;
  serverTime: string;
};

type SummaryInput = {
  userId: string | null;
  role?: string | null;
};

const OPEN_STATUSES = ["CREADO", "REABIERTO", "ABIERTO"];
const IN_PROGRESS_STATUSES = ["ASIGNADO", "EN_PROGRESO", "INICIADO"];
const PENDING_VALIDATION_STATUSES = ["PENDIENTE_VALIDACION"];
const FINISHED_STATUSES = ["FINALIZADO", "RESUELTO", "CERRADO"];

export async function getDashboardSummary({
  userId,
  role,
}: SummaryInput): Promise<DashboardSummary> {
  const serverTime = new Date().toISOString();

  if (!userId) {
    return {
      totals: { total: 0, open: 0, inProgress: 0, pendingValidation: 0, finished: 0 },
      recentTickets: [],
      serverTime,
    };
  }

  const baseWhere: Prisma.TicketWhereInput = { deletedAt: null };
  if (role === "USER") {
    baseWhere.assigneeId = userId;
  }

  const [total, open, inProgress, pendingValidation, finished, recentTickets] = await Promise.all([
    prisma.ticket.count({ where: baseWhere }),
    prisma.ticket.count({ where: { ...baseWhere, status: { in: OPEN_STATUSES } } }),
    prisma.ticket.count({ where: { ...baseWhere, status: { in: IN_PROGRESS_STATUSES } } }),
    prisma.ticket.count({ where: { ...baseWhere, status: { in: PENDING_VALIDATION_STATUSES } } }),
    prisma.ticket.count({ where: { ...baseWhere, status: { in: FINISHED_STATUSES } } }),
    prisma.ticket.findMany({
      where: baseWhere,
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    totals: { total, open, inProgress, pendingValidation, finished },
    recentTickets: recentTickets.map((ticket) => ({
      ...ticket,
      updatedAt: ticket.updatedAt.toISOString(),
    })),
    serverTime,
  };
}
