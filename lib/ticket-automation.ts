import type { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getSlaStatus } from "@/lib/sla";

type AutoAssigneeResult = {
  assigneeId: string;
  assigneeName: string | null;
  assigneeEmail: string;
  ruleId: string;
};

type AutoAssignInput = {
  type: string;
  priority: string;
};

type CandidateUser = {
  id: string;
  name: string | null;
  email: string;
};

const DEFAULT_ROLE = "USER";

const ALERT_DEFINITIONS: Record<
  string,
  { titulo: string; mensaje: (title: string) => string; tipo: string; notifyAssignee: boolean }
> = {
  SLA_RESPONSE_WARNING: {
    titulo: "SLA respuesta por vencer",
    mensaje: (title) => `El ticket ${title} esta por vencer el SLA de respuesta.`,
    tipo: "ADVERTENCIA",
    notifyAssignee: true,
  },
  SLA_RESPONSE_BREACHED: {
    titulo: "SLA respuesta vencido",
    mensaje: (title) => `El ticket ${title} ya vencio el SLA de respuesta.`,
    tipo: "ERROR",
    notifyAssignee: true,
  },
  SLA_RESOLUTION_WARNING: {
    titulo: "SLA resolucion por vencer",
    mensaje: (title) => `El ticket ${title} esta por vencer el SLA de resolucion.`,
    tipo: "ADVERTENCIA",
    notifyAssignee: true,
  },
  SLA_RESOLUTION_BREACHED: {
    titulo: "SLA resolucion vencido",
    mensaje: (title) => `El ticket ${title} ya vencio el SLA de resolucion.`,
    tipo: "ERROR",
    notifyAssignee: true,
  },
};

async function pickLeastLoaded(
  users: CandidateUser[],
  maxActive?: number | null
) {
  if (!users.length) return null;
  const userIds = users.map((user) => user.id);
  const counts = await prisma.ticket.groupBy({
    by: ["assigneeId"],
    where: {
      assigneeId: { in: userIds },
      deletedAt: null,
      status: { not: "FINALIZADO" },
    },
    _count: { _all: true },
  });

  const loadMap = new Map<string, number>();
  counts.forEach((row) => {
    if (row.assigneeId) {
      loadMap.set(row.assigneeId, row._count._all);
    }
  });

  const ranked = users
    .map((user) => ({
      user,
      load: loadMap.get(user.id) ?? 0,
    }))
    .filter((entry) => (maxActive == null ? true : entry.load < maxActive))
    .sort((a, b) => a.load - b.load);

  return ranked.length ? ranked[0].user : null;
}

export async function resolveAutoAssignee(
  input: AutoAssignInput
): Promise<AutoAssigneeResult | null> {
  const rules = await prisma.ticketAssignmentRule.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  for (const rule of rules) {
    if (rule.ticketType && rule.ticketType !== input.type) {
      continue;
    }
    if (rule.priority && rule.priority !== input.priority) {
      continue;
    }

    if (rule.targetUserId) {
      const user = await prisma.user.findFirst({
        where: { id: rule.targetUserId, activo: true },
        select: { id: true, name: true, email: true },
      });
      if (!user) continue;
      return {
        assigneeId: user.id,
        assigneeName: user.name,
        assigneeEmail: user.email,
        ruleId: rule.id,
      };
    }

    const role = rule.targetRole || DEFAULT_ROLE;
    const candidates = await prisma.user.findMany({
      where: { role, activo: true },
      select: { id: true, name: true, email: true },
    });
    const selected = await pickLeastLoaded(candidates, rule.maxActive);
    if (!selected) continue;

    return {
      assigneeId: selected.id,
      assigneeName: selected.name,
      assigneeEmail: selected.email,
      ruleId: rule.id,
    };
  }

  return null;
}

type TicketAlertCandidate = {
  id: string;
  title: string;
  assigneeId: string | null;
  createdAt: Date;
  priority: string;
  firstResponseAt: Date | null;
  closedAt: Date | null;
  slaResponseMinutes: number | null;
  slaResolutionMinutes: number | null;
  slaResponseDueAt: Date | null;
  slaResolutionDueAt: Date | null;
};

export async function runSlaAlerts() {
  const tickets = await prisma.ticket.findMany({
    where: {
      deletedAt: null,
      status: { not: "FINALIZADO" },
    },
    select: {
      id: true,
      title: true,
      assigneeId: true,
      createdAt: true,
      priority: true,
      firstResponseAt: true,
      closedAt: true,
      slaResponseMinutes: true,
      slaResolutionMinutes: true,
      slaResponseDueAt: true,
      slaResolutionDueAt: true,
    },
  });

  if (!tickets.length) {
    return { scanned: 0, alerts: 0 };
  }

  const ticketIds = tickets.map((ticket) => ticket.id);
  const existingAlerts = await prisma.ticketAlert.findMany({
    where: { ticketId: { in: ticketIds } },
    select: { ticketId: true, tipo: true },
  });
  const alertSet = new Set(existingAlerts.map((row) => `${row.ticketId}:${row.tipo}`));

  const supervisors = await prisma.user.findMany({
    where: { role: { in: ["SUPERVISOR", "ADMIN"] }, activo: true },
    select: { id: true },
  });
  const supervisorIds = supervisors.map((user) => user.id);

  const alertsToCreate: Prisma.TicketAlertCreateManyInput[] = [];
  const notificationsToCreate: Prisma.NotificacionCreateManyInput[] = [];

  const enqueueAlert = (ticket: TicketAlertCandidate, tipo: string) => {
    if (alertSet.has(`${ticket.id}:${tipo}`)) return;
    const definition = ALERT_DEFINITIONS[tipo];
    if (!definition) return;

    alertsToCreate.push({
      ticketId: ticket.id,
      tipo,
      sentAt: new Date(),
    });

    const recipients = new Set<string>();
    supervisorIds.forEach((id) => recipients.add(id));
    if (definition.notifyAssignee && ticket.assigneeId) {
      recipients.add(ticket.assigneeId);
    }

    recipients.forEach((userId) => {
      notificationsToCreate.push({
        tipo: definition.tipo,
        titulo: definition.titulo,
        mensaje: definition.mensaje(ticket.title),
        userId,
        referenceType: "TICKET",
        referenceId: ticket.id,
      });
    });
  };

  tickets.forEach((ticket) => {
    const sla = getSlaStatus(ticket);
    if (!ticket.firstResponseAt) {
      if (sla.responseStatus === "breached") {
        enqueueAlert(ticket, "SLA_RESPONSE_BREACHED");
      } else if (sla.responseStatus === "warning") {
        enqueueAlert(ticket, "SLA_RESPONSE_WARNING");
      }
    }

    if (!ticket.closedAt) {
      if (sla.resolutionStatus === "breached") {
        enqueueAlert(ticket, "SLA_RESOLUTION_BREACHED");
      } else if (sla.resolutionStatus === "warning") {
        enqueueAlert(ticket, "SLA_RESOLUTION_WARNING");
      }
    }
  });

  if (alertsToCreate.length) {
    await prisma.ticketAlert.createMany({
      data: alertsToCreate,
    });
  }
  if (notificationsToCreate.length) {
    await prisma.notificacion.createMany({ data: notificationsToCreate });
  }

  return { scanned: tickets.length, alerts: alertsToCreate.length };
}
