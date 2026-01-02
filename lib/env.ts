import { z } from 'zod'

// Esquema de validación para variables de entorno
const envSchema = z.object({
  // Base de datos
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL es requerida')
    .startsWith('sqlserver://', 'DATABASE_URL debe ser una conexión SQL Server válida'),

  // NextAuth
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET debe tener al menos 32 caracteres para seguridad'),
  NEXTAUTH_URL: z
    .string()
    .url('NEXTAUTH_URL debe ser una URL válida')
    .default('http://localhost:3001'),
  AUTH_TRUST_HOST: z
    .string()
    .default('true'),

  // Node
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // API de Mercado Público
  MERCADOPUBLICO_APIKEY: z
    .string()
    .uuid('MERCADOPUBLICO_APIKEY debe ser un UUID válido')
    .min(1, 'MERCADOPUBLICO_APIKEY es requerida para integración con Mercado Público'),
})

// Tipo inferido del schema
export type Env = z.infer<typeof envSchema>

// Validar variables de entorno
function validateEnv(): Env {
  try {
    const env = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
      NODE_ENV: process.env.NODE_ENV,
      MERCADOPUBLICO_APIKEY: process.env.MERCADOPUBLICO_APIKEY,
    })

    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `  - ${err.path.join('.')}: ${err.message}`)

      console.error('\n❌ Error: Variables de entorno inválidas o faltantes:\n')
      console.error(missingVars.join('\n'))
      console.error('\n📝 Verifica tu archivo .env\n')

      throw new Error('Configuración de entorno inválida')
    }
    throw error
  }
}

// Exportar variables validadas
export const env = validateEnv()

// Helper para verificar si estamos en producción
export const isProd = env.NODE_ENV === 'production'
export const isDev = env.NODE_ENV === 'development'
export const isTest = env.NODE_ENV === 'test'
