/**
 * Helpers para manejo de sesión y autenticación
 */

import { auth } from './auth'
import { AuthenticationError, AuthorizationError } from './errors'
import { hasPermission, Action, canAccessResource } from './permissions'
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
export async function requirePermission(action: Action) {
  const user = await requireSession()

  if (!hasPermission(user.role, action)) {
    throw new AuthorizationError('No tienes permisos para realizar esta acción')
  }

  return user
}

/**
 * Verifica que el usuario tenga permiso para acceder a un recurso específico
 */
export async function requireResourceAccess(
  action: Action,
  resourceOwnerId?: string
): Promise<SessionUser> {
  const user = await requireSession()

  if (!canAccessResource(user.id, user.role, action, resourceOwnerId)) {
    throw new AuthorizationError('No tienes permisos para acceder a este recurso')
  }

  return user
}

/**
 * Verifica si el usuario actual tiene un permiso (sin lanzar error)
 */
export async function checkPermission(action: Action): Promise<boolean> {
  try {
    const user = await requireSession()
    return hasPermission(user.role, action)
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
