/**
 * Helpers para manejo de sesión y autenticación
 */

import { auth } from './auth'
import { AuthenticationError, AuthorizationError } from './errors'
import { hasPermission, type Permission } from './permissions'
import type { UserRole } from './constants'

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: UserRole
}

/**
 * Obtiene la sesión del usuario actual
 * En NextAuth v5, se usa directamente auth() en lugar de getServerSession
 */
export async function getCurrentSession() {
  const session = await auth()
  return session
}

/**
 * Obtiene el usuario de la sesión actual o lanza error si no está autenticado
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getCurrentSession()

  if (!session || !session.user) {
    throw new AuthenticationError('Debes iniciar sesión para acceder a este recurso')
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name || null,
    role: session.user.role as UserRole,
  }
}

/**
 * Verifica que el usuario tenga permiso para realizar una acción
 */
export async function requirePermission(permission: Permission) {
  const user = await requireSession()

  if (!hasPermission(user.role, permission)) {
    throw new AuthorizationError('No tienes permisos para realizar esta acción')
  }

  return user
}

/**
 * Verifica que el usuario tenga permiso para acceder a un recurso específico
 */
export async function requireResourceAccess(
  permission: Permission,
  resourceOwnerId?: string
): Promise<SessionUser> {
  const user = await requireSession()

  // Verificar permiso básico
  if (!hasPermission(user.role, permission)) {
    throw new AuthorizationError('No tienes permisos para acceder a este recurso')
  }

  // Si se proporciona resourceOwnerId, verificar que sea el dueño o admin
  if (resourceOwnerId && user.id !== resourceOwnerId && user.role !== 'ADMIN') {
    throw new AuthorizationError('No tienes permisos para acceder a este recurso')
  }

  return user
}

/**
 * Verifica si el usuario actual tiene un permiso (sin lanzar error)
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  try {
    const user = await requireSession()
    return hasPermission(user.role, permission)
  } catch {
    return false
  }
}

/**
 * Obtiene el ID del usuario actual o null si no está autenticado
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const user = await requireSession()
    return user.id
  } catch {
    return null
  }
}
