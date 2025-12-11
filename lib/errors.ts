/**
 * Sistema de manejo centralizado de errores para la aplicación
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library'

// Tipos de errores personalizados
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autenticado') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR')
    this.name = 'ConflictError'
  }
}

// Formato de respuesta de error
interface ErrorResponse {
  error: {
    message: string
    code?: string
    details?: any
  }
}

/**
 * Maneja errores y retorna una respuesta NextResponse apropiada
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  console.error('API Error:', error)

  // Error de validación con Zod
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }))

    return NextResponse.json(
      {
        error: {
          message: 'Error de validación',
          code: 'VALIDATION_ERROR',
          details: formattedErrors,
        },
      },
      { status: 400 }
    )
  }

  // Errores de Prisma
  if (error instanceof PrismaClientKnownRequestError) {
    // Registro duplicado (unique constraint)
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.join(', ') || 'campo'
      return NextResponse.json(
        {
          error: {
            message: `Ya existe un registro con ese ${field}`,
            code: 'DUPLICATE_ENTRY',
          },
        },
        { status: 409 }
      )
    }

    // Registro no encontrado
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          error: {
            message: 'Registro no encontrado',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      )
    }

    // Violación de foreign key
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          error: {
            message: 'Referencia inválida',
            code: 'INVALID_REFERENCE',
          },
        },
        { status: 400 }
      )
    }
  }

  // Errores de Prisma - validación
  if (error instanceof PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: {
          message: 'Error de validación en base de datos',
          code: 'DATABASE_VALIDATION_ERROR',
        },
      },
      { status: 400 }
    )
  }

  // Errores personalizados de la aplicación
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
        },
      },
      { status: error.statusCode }
    )
  }

  // Error genérico
  const message = error instanceof Error ? error.message : 'Error interno del servidor'

  return NextResponse.json(
    {
      error: {
        message,
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
    { status: 500 }
  )
}

/**
 * Wrapper para rutas API que maneja errores automáticamente
 */
export function withErrorHandler<T>(
  handler: (req: Request, context?: any) => Promise<NextResponse<T>>
) {
  return async (req: Request, context?: any): Promise<NextResponse<T | ErrorResponse>> => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

/**
 * Sanitiza datos para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remueve < y >
    .trim()
}

/**
 * Sanitiza objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj }

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]) as any
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key])
    }
  }

  return sanitized
}

/**
 * Valida que el usuario esté autenticado
 */
export function requireAuth(userId: string | undefined): asserts userId is string {
  if (!userId) {
    throw new AuthenticationError()
  }
}

/**
 * Valida que el usuario tenga el rol requerido
 */
export function requireRole(userRole: string | undefined, allowedRoles: string[]) {
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new AuthorizationError('No tienes permisos para realizar esta acción')
  }
}
