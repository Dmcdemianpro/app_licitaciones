import { z } from 'zod'
import { ROLES } from '@/lib/constants'

// Schema para crear usuario
export const usuarioCreateSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(255),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  role: z.enum([ROLES.USER, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]).default(ROLES.USER),
  telefono: z.string().max(50).optional(),
  departamento: z.string().max(100).optional(),
  cargo: z.string().max(100).optional(),
  activo: z.boolean().default(true),
})

// Schema para actualizar usuario (sin password requerido)
export const usuarioUpdateSchema = z.object({
  email: z.string().email('Email inválido').max(255).optional(),
  name: z.string().min(2).max(255).optional(),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .optional(),
  role: z.enum([ROLES.USER, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]).optional(),
  telefono: z.string().max(50).optional(),
  departamento: z.string().max(100).optional(),
  cargo: z.string().max(100).optional(),
  activo: z.boolean().optional(),
})

// Schema para cambiar contraseña
export const cambiarPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})
