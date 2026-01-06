/**
 * Sistema de Roles y Permisos
 *
 * USER: Solo lectura y creación de contenido
 * SUPERVISOR: Gestión de usuarios (crear, editar, desactivar)
 * ADMIN: Control total del sistema (único que puede BORRAR)
 */

export type UserRole = "USER" | "SUPERVISOR" | "ADMIN";

export const PERMISSIONS = {
  // Permisos de lectura (todos los roles)
  VIEW_DASHBOARD: ["USER", "SUPERVISOR", "ADMIN"],
  VIEW_TICKETS: ["USER", "SUPERVISOR", "ADMIN"],
  VIEW_LICITACIONES: ["USER", "SUPERVISOR", "ADMIN"],
  VIEW_CITAS: ["USER", "SUPERVISOR", "ADMIN"],
  VIEW_USUARIOS: ["USER", "SUPERVISOR", "ADMIN"],

  // Permisos de creación (todos los roles)
  CREATE_TICKET: ["USER", "SUPERVISOR", "ADMIN"],
  CREATE_LICITACION: ["USER", "SUPERVISOR", "ADMIN"],
  CREATE_CITA: ["USER", "SUPERVISOR", "ADMIN"],
  CREATE_DOCUMENTO: ["USER", "SUPERVISOR", "ADMIN"],
  CREATE_NOTA: ["USER", "SUPERVISOR", "ADMIN"],
  IMPORT_LICITACION: ["USER", "SUPERVISOR", "ADMIN"],

  // Permisos de edición (todos los roles pueden editar su propio contenido)
  EDIT_TICKET: ["USER", "SUPERVISOR", "ADMIN"],
  EDIT_LICITACION: ["USER", "SUPERVISOR", "ADMIN"],
  EDIT_CITA: ["USER", "SUPERVISOR", "ADMIN"],
  FINALIZE_TICKET: ["USER", "SUPERVISOR", "ADMIN"],

  // Permisos de gestión de usuarios (SUPERVISOR y ADMIN)
  CREATE_USER: ["SUPERVISOR", "ADMIN"],
  EDIT_USER: ["SUPERVISOR", "ADMIN"],
  DEACTIVATE_USER: ["SUPERVISOR", "ADMIN"],
  VIEW_USER_DETAILS: ["SUPERVISOR", "ADMIN"],

  // Permisos de eliminación (SOLO ADMIN)
  DELETE_USER: ["ADMIN"],
  DELETE_TICKET: ["ADMIN"],
  DELETE_LICITACION: ["ADMIN"],
  DELETE_CITA: ["ADMIN"],
  DELETE_DOCUMENTO: ["ADMIN"],
  DELETE_NOTA: ["ADMIN"],
  RESTORE_LICITACION: ["ADMIN"],

  // Permisos administrativos (SOLO ADMIN)
  VIEW_DELETED_ITEMS: ["ADMIN"],
  MANAGE_SYSTEM: ["ADMIN"],
  VIEW_AUDIT_LOG: ["ADMIN"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(userRole: UserRole | null | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  return PERMISSIONS[permission].includes(userRole);
}

/**
 * Hook para verificar permisos en componentes cliente
 */
export function usePermissions(userRole: UserRole | null | undefined) {
  return {
    can: (permission: Permission) => hasPermission(userRole, permission),
    isUser: userRole === "USER",
    isSupervisor: userRole === "SUPERVISOR",
    isAdmin: userRole === "ADMIN",
    canManageUsers: hasPermission(userRole, "CREATE_USER"),
    canDelete: userRole === "ADMIN",
  };
}
