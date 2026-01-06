/**
 * Sistema de Roles y Permisos
 *
 * USER: Solo lectura y creación de contenido
 * SUPERVISOR: Gestión de usuarios (crear, editar, desactivar)
 * ADMIN: Control total del sistema (único que puede BORRAR)
 */

import type { UserRole } from './constants';
export type { UserRole };

export const PERMISSIONS = {
  // Permisos de lectura (todos los roles)
  VIEW_DASHBOARD: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],
  VIEW_TICKETS: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],
  VIEW_LICITACIONES: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],
  VIEW_CITAS: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],
  VIEW_USUARIOS: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],

  // Permisos de creación (todos los roles)
  CREATE_TICKET: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],
  CREATE_LICITACION: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],
  CREATE_CITA: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],
  CREATE_DOCUMENTO: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],
  CREATE_NOTA: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],
  IMPORT_LICITACION: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],

  // Permisos de edición (todos los roles pueden editar su propio contenido)
  EDIT_TICKET: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],
  EDIT_LICITACION: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],
  EDIT_CITA: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],
  FINALIZE_TICKET: ["USER", "MANAGER", "SUPERVISOR", "ADMIN"],

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
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(userRole);
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
