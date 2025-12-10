/**
 * Sistema de permisos basado en roles (RBAC - Role-Based Access Control)
 */

import { ROLES } from './constants'
import type { UserRole } from './constants'

// Definir acciones disponibles en el sistema
export enum Action {
  // Tickets
  CREATE_TICKET = 'create_ticket',
  READ_TICKET = 'read_ticket',
  UPDATE_TICKET = 'update_ticket',
  DELETE_TICKET = 'delete_ticket',
  ASSIGN_TICKET = 'assign_ticket',

  // Licitaciones
  CREATE_LICITACION = 'create_licitacion',
  READ_LICITACION = 'read_licitacion',
  UPDATE_LICITACION = 'update_licitacion',
  DELETE_LICITACION = 'delete_licitacion',
  ASSIGN_LICITACION = 'assign_licitacion',

  // Citas
  CREATE_CITA = 'create_cita',
  READ_CITA = 'read_cita',
  UPDATE_CITA = 'update_cita',
  DELETE_CITA = 'delete_cita',

  // Usuarios
  CREATE_USER = 'create_user',
  READ_USER = 'read_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  CHANGE_USER_ROLE = 'change_user_role',

  // Documentos
  UPLOAD_DOCUMENT = 'upload_document',
  READ_DOCUMENT = 'read_document',
  DELETE_DOCUMENT = 'delete_document',

  // Notificaciones
  READ_NOTIFICATION = 'read_notification',
  SEND_NOTIFICATION = 'send_notification',

  // Reportes
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',

  // Auditoría
  VIEW_AUDIT_LOGS = 'view_audit_logs',

  // Configuración
  UPDATE_CONFIG = 'update_config',
}

// Definir permisos por rol
type RolePermissions = {
  [key in UserRole]: Action[]
}

export const rolePermissions: RolePermissions = {
  // Usuario básico - permisos limitados
  [ROLES.USER]: [
    Action.CREATE_TICKET,
    Action.READ_TICKET,
    Action.UPDATE_TICKET, // Solo sus propios tickets
    Action.READ_LICITACION,
    Action.CREATE_CITA,
    Action.READ_CITA,
    Action.UPDATE_CITA, // Solo sus propias citas
    Action.READ_USER,
    Action.UPLOAD_DOCUMENT,
    Action.READ_DOCUMENT,
    Action.READ_NOTIFICATION,
  ],

  // Supervisor - puede gestionar tickets y licitaciones
  [ROLES.SUPERVISOR]: [
    Action.CREATE_TICKET,
    Action.READ_TICKET,
    Action.UPDATE_TICKET,
    Action.DELETE_TICKET,
    Action.ASSIGN_TICKET,
    Action.CREATE_LICITACION,
    Action.READ_LICITACION,
    Action.UPDATE_LICITACION,
    Action.ASSIGN_LICITACION,
    Action.CREATE_CITA,
    Action.READ_CITA,
    Action.UPDATE_CITA,
    Action.DELETE_CITA,
    Action.READ_USER,
    Action.UPLOAD_DOCUMENT,
    Action.READ_DOCUMENT,
    Action.DELETE_DOCUMENT,
    Action.READ_NOTIFICATION,
    Action.SEND_NOTIFICATION,
    Action.VIEW_REPORTS,
  ],

  // Manager - gestión completa excepto administración de sistema
  [ROLES.MANAGER]: [
    Action.CREATE_TICKET,
    Action.READ_TICKET,
    Action.UPDATE_TICKET,
    Action.DELETE_TICKET,
    Action.ASSIGN_TICKET,
    Action.CREATE_LICITACION,
    Action.READ_LICITACION,
    Action.UPDATE_LICITACION,
    Action.DELETE_LICITACION,
    Action.ASSIGN_LICITACION,
    Action.CREATE_CITA,
    Action.READ_CITA,
    Action.UPDATE_CITA,
    Action.DELETE_CITA,
    Action.CREATE_USER,
    Action.READ_USER,
    Action.UPDATE_USER,
    Action.UPLOAD_DOCUMENT,
    Action.READ_DOCUMENT,
    Action.DELETE_DOCUMENT,
    Action.READ_NOTIFICATION,
    Action.SEND_NOTIFICATION,
    Action.VIEW_REPORTS,
    Action.EXPORT_REPORTS,
    Action.VIEW_AUDIT_LOGS,
  ],

  // Admin - acceso completo
  [ROLES.ADMIN]: [
    Action.CREATE_TICKET,
    Action.READ_TICKET,
    Action.UPDATE_TICKET,
    Action.DELETE_TICKET,
    Action.ASSIGN_TICKET,
    Action.CREATE_LICITACION,
    Action.READ_LICITACION,
    Action.UPDATE_LICITACION,
    Action.DELETE_LICITACION,
    Action.ASSIGN_LICITACION,
    Action.CREATE_CITA,
    Action.READ_CITA,
    Action.UPDATE_CITA,
    Action.DELETE_CITA,
    Action.CREATE_USER,
    Action.READ_USER,
    Action.UPDATE_USER,
    Action.DELETE_USER,
    Action.CHANGE_USER_ROLE,
    Action.UPLOAD_DOCUMENT,
    Action.READ_DOCUMENT,
    Action.DELETE_DOCUMENT,
    Action.READ_NOTIFICATION,
    Action.SEND_NOTIFICATION,
    Action.VIEW_REPORTS,
    Action.EXPORT_REPORTS,
    Action.VIEW_AUDIT_LOGS,
    Action.UPDATE_CONFIG,
  ],
}

/**
 * Verifica si un rol tiene permiso para realizar una acción
 */
export function hasPermission(role: UserRole | undefined | null, action: Action): boolean {
  if (!role) return false
  return rolePermissions[role]?.includes(action) ?? false
}

/**
 * Verifica múltiples permisos (requiere que tenga al menos uno)
 */
export function hasAnyPermission(role: UserRole | undefined | null, actions: Action[]): boolean {
  if (!role) return false
  return actions.some((action) => hasPermission(role, action))
}

/**
 * Verifica múltiples permisos (requiere que tenga todos)
 */
export function hasAllPermissions(role: UserRole | undefined | null, actions: Action[]): boolean {
  if (!role) return false
  return actions.every((action) => hasPermission(role, action))
}

/**
 * Verifica si un usuario puede acceder a un recurso específico
 * @param userId - ID del usuario que intenta acceder
 * @param role - Rol del usuario
 * @param action - Acción que intenta realizar
 * @param resourceOwnerId - ID del propietario del recurso (opcional)
 */
export function canAccessResource(
  userId: string,
  role: UserRole | undefined | null,
  action: Action,
  resourceOwnerId?: string
): boolean {
  // Los administradores tienen acceso a todo
  if (role === ROLES.ADMIN) return true

  // Verificar si tiene el permiso general
  if (!hasPermission(role, action)) return false

  // Para acciones de actualización/eliminación, verificar ownership
  const ownershipActions = [
    Action.UPDATE_TICKET,
    Action.DELETE_TICKET,
    Action.UPDATE_CITA,
    Action.DELETE_CITA,
  ]

  if (ownershipActions.includes(action) && resourceOwnerId) {
    // Los managers y supervisores pueden modificar cualquier recurso
    if (role === ROLES.MANAGER || role === ROLES.SUPERVISOR) return true

    // Los usuarios solo pueden modificar sus propios recursos
    return userId === resourceOwnerId
  }

  return true
}

/**
 * Obtiene todos los permisos de un rol
 */
export function getRolePermissions(role: UserRole): Action[] {
  return rolePermissions[role] || []
}

/**
 * Verifica si un rol es superior a otro (para jerarquía)
 */
export function isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
  const hierarchy = [ROLES.USER, ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.ADMIN]
  return hierarchy.indexOf(role1) > hierarchy.indexOf(role2)
}
