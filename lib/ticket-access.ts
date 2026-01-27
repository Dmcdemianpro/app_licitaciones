import prisma from "@/lib/prisma";

export interface TicketScope {
  departamentoIds: string[];
  unidadIds: string[];
  hasAccess: boolean;
}

export async function getUserTicketScope(userId: string): Promise<TicketScope> {
  const departamentos = await prisma.usuarioDepartamento.findMany({
    where: { userId, activo: true },
    select: { departamentoId: true },
  });

  const unidades = await prisma.usuarioUnidad.findMany({
    where: { userId, activo: true },
    select: {
      unidadId: true,
      unidad: { select: { departamentoId: true } },
    },
  });

  const departamentoIds = departamentos.map((d) => d.departamentoId);
  const unidadIds = unidades.map((u) => u.unidadId);

  unidades.forEach((u) => {
    if (!departamentoIds.includes(u.unidad.departamentoId)) {
      departamentoIds.push(u.unidad.departamentoId);
    }
  });

  return {
    departamentoIds,
    unidadIds,
    hasAccess: departamentoIds.length > 0 || unidadIds.length > 0,
  };
}

export function buildTicketAccessWhere(
  scope: TicketScope,
  userId?: string
): Record<string, unknown> | null {
  if (!scope.hasAccess && !userId) {
    return {
      departamentoId: null,
      unidadId: null,
    };
  }

  const conditions: any[] = [];

  if (scope.departamentoIds.length > 0) {
    conditions.push({ departamentoId: { in: scope.departamentoIds } });
  }

  if (scope.unidadIds.length > 0) {
    conditions.push({ unidadId: { in: scope.unidadIds } });
  }

  if (userId) {
    conditions.push({ ownerId: userId });
    conditions.push({ assigneeId: userId });
  }

  conditions.push({
    AND: [{ departamentoId: null }, { unidadId: null }],
  });

  return {
    OR: conditions,
  };
}

export async function canAccessTicket(
  userId: string,
  userRole: string | undefined | null,
  ticketId: string
): Promise<boolean> {
  if (userRole === "ADMIN") {
    return true;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      ownerId: true,
      assigneeId: true,
      departamentoId: true,
      unidadId: true,
    },
  });

  if (!ticket) {
    return false;
  }

  if (ticket.ownerId === userId || ticket.assigneeId === userId) {
    return true;
  }

  if (!ticket.departamentoId && !ticket.unidadId) {
    return true;
  }

  const scope = await getUserTicketScope(userId);

  if (ticket.departamentoId && scope.departamentoIds.includes(ticket.departamentoId)) {
    return true;
  }

  if (ticket.unidadId && scope.unidadIds.includes(ticket.unidadId)) {
    return true;
  }

  return false;
}

export async function getDefaultTicketGrupo(
  userId: string
): Promise<{ departamentoId: string | null; unidadId: string | null }> {
  const departamento = await prisma.usuarioDepartamento.findFirst({
    where: { userId, activo: true },
    select: { departamentoId: true },
    orderBy: { createdAt: "asc" },
  });

  const unidad = await prisma.usuarioUnidad.findFirst({
    where: { userId, activo: true },
    select: {
      unidadId: true,
      unidad: { select: { departamentoId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const departamentoId =
    departamento?.departamentoId || unidad?.unidad?.departamentoId || null;
  const unidadId = unidad?.unidadId || null;

  return {
    departamentoId,
    unidadId,
  };
}
