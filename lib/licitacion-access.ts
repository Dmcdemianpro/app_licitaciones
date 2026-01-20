import prisma from "@/lib/prisma";

/**
 * Tipo para el scope de acceso a licitaciones de un usuario
 */
export interface LicitacionScope {
  departamentoIds: string[];
  unidadIds: string[];
  hasAccess: boolean;
}

/**
 * Obtiene los departamentos y unidades a los que tiene acceso un usuario
 */
export async function getUserLicitacionScope(userId: string): Promise<LicitacionScope> {
  // Obtener membresías de departamentos activas
  const departamentos = await prisma.usuarioDepartamento.findMany({
    where: {
      userId,
      activo: true,
    },
    select: {
      departamentoId: true,
    },
  });

  // Obtener membresías de unidades activas
  const unidades = await prisma.usuarioUnidad.findMany({
    where: {
      userId,
      activo: true,
    },
    select: {
      unidadId: true,
      unidad: {
        select: {
          departamentoId: true,
        },
      },
    },
  });

  const departamentoIds = departamentos.map((d) => d.departamentoId);
  const unidadIds = unidades.map((u) => u.unidadId);

  // Agregar departamentos de las unidades si no están ya incluidos
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

/**
 * Construye la cláusula WHERE para filtrar licitaciones según el scope del usuario
 * Retorna null si el usuario no tiene acceso a ningún grupo (verá licitaciones sin grupo asignado)
 */
export function buildLicitacionAccessWhere(
  scope: LicitacionScope
): Record<string, unknown> | null {
  // Si no tiene membresías, solo ve licitaciones sin grupo
  if (!scope.hasAccess) {
    return {
      departamentoId: null,
      unidadId: null,
    };
  }

  // Construir condiciones OR
  const conditions: any[] = [];

  // Acceso por departamento (ve todas las licitaciones del departamento)
  if (scope.departamentoIds.length > 0) {
    conditions.push({
      departamentoId: { in: scope.departamentoIds },
    });
  }

  // Acceso por unidad específica
  if (scope.unidadIds.length > 0) {
    conditions.push({
      unidadId: { in: scope.unidadIds },
    });
  }

  // También incluir licitaciones sin grupo asignado (públicas dentro de la org)
  conditions.push({
    AND: [{ departamentoId: null }, { unidadId: null }],
  });

  return {
    OR: conditions,
  };
}

/**
 * Verifica si un usuario puede acceder a una licitación específica
 */
export async function canAccessLicitacion(
  userId: string,
  userRole: string | undefined | null,
  licitacionId: string
): Promise<boolean> {
  // ADMIN siempre tiene acceso
  if (userRole === "ADMIN") {
    return true;
  }

  // Obtener la licitación
  const licitacion = await prisma.licitacion.findUnique({
    where: { id: licitacionId },
    select: {
      id: true,
      departamentoId: true,
      unidadId: true,
      createdById: true,
      responsableId: true,
    },
  });

  if (!licitacion) {
    return false;
  }

  // Si el usuario es el creador o responsable, tiene acceso
  if (licitacion.createdById === userId || licitacion.responsableId === userId) {
    return true;
  }

  // Si la licitación no tiene grupo, es accesible por todos
  if (!licitacion.departamentoId && !licitacion.unidadId) {
    return true;
  }

  // Verificar acceso por grupo
  const scope = await getUserLicitacionScope(userId);

  // Verificar acceso por departamento
  if (
    licitacion.departamentoId &&
    scope.departamentoIds.includes(licitacion.departamentoId)
  ) {
    return true;
  }

  // Verificar acceso por unidad
  if (licitacion.unidadId && scope.unidadIds.includes(licitacion.unidadId)) {
    return true;
  }

  return false;
}

/**
 * Obtiene el rol de un usuario dentro de un departamento
 */
export async function getUserDepartmentRole(
  userId: string,
  departamentoId: string
): Promise<string | null> {
  const membresia = await prisma.usuarioDepartamento.findUnique({
    where: {
      userId_departamentoId: {
        userId,
        departamentoId,
      },
    },
    select: {
      rol: true,
      activo: true,
    },
  });

  if (!membresia || !membresia.activo) {
    return null;
  }

  return membresia.rol;
}

/**
 * Obtiene el rol de un usuario dentro de una unidad
 */
export async function getUserUnitRole(
  userId: string,
  unidadId: string
): Promise<string | null> {
  const membresia = await prisma.usuarioUnidad.findUnique({
    where: {
      userId_unidadId: {
        userId,
        unidadId,
      },
    },
    select: {
      rol: true,
      activo: true,
    },
  });

  if (!membresia || !membresia.activo) {
    return null;
  }

  return membresia.rol;
}
