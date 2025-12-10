# 🏢 Sistema de Gestión de Licitaciones

Sistema fullstack para la gestión integral de licitaciones, tickets de soporte, citas y procesos operativos empresariales.

![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.8-2D3748?style=flat-square&logo=prisma)
![SQL Server](https://img.shields.io/badge/SQL%20Server-2019+-CC2927?style=flat-square&logo=microsoft-sql-server)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Documentation](#-api-documentation)
- [Seguridad](#-seguridad)
- [Testing](#-testing)
- [Contribución](#-contribución)

---

## ✨ Características

### Gestión de Licitaciones
- ✅ Crear, editar y eliminar licitaciones
- ✅ Estados: En Preparación, Activa, Adjudicada, Desierta, Cancelada
- ✅ Tipos: Pública, Privada, Internacional
- ✅ Seguimiento de fechas y montos
- ✅ Asignación de responsables
- ✅ Documentos adjuntos
- ✅ Sistema de notas y comentarios

### Sistema de Tickets
- ✅ Gestión completa de tickets de soporte
- ✅ Prioridades: Alta, Media, Baja
- ✅ Estados: Abierto, En Progreso, Resuelto, Cerrado
- ✅ Asignación a responsables
- ✅ Filtros avanzados

### Gestión de Citas
- ✅ Programación de reuniones y eventos
- ✅ Tipos: Reunión, Presentación, Visita, Entrega
- ✅ Participantes múltiples
- ✅ Control de asistencia
- ✅ Integración con licitaciones

### Sistema de Usuarios
- ✅ Roles: Admin, Manager, Supervisor, User
- ✅ Sistema de permisos granular (RBAC)
- ✅ Autenticación segura con NextAuth
- ✅ Gestión de perfiles

### Notificaciones
- ✅ Notificaciones por tipo (Info, Advertencia, Error, Éxito)
- ✅ Referencias a tickets, licitaciones y citas
- ✅ Control de lectura

### Auditoría
- ✅ Log completo de acciones
- ✅ Tracking de cambios
- ✅ Información de IP y User Agent

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15.3** - Framework React con App Router
- **React 18** - Librería de interfaz de usuario
- **TypeScript 5** - Tipado estático
- **TailwindCSS 3.4** - Framework CSS utilitario
- **Shadcn/ui** - Componentes UI accesibles
- **Radix UI** - Componentes primitivos
- **React Hook Form** - Gestión de formularios
- **Zod** - Validación de esquemas
- **SWR** - Fetching y caching de datos

### Backend
- **Next.js API Routes** - Endpoints serverless
- **Prisma 6.8** - ORM para SQL Server
- **NextAuth 5** - Autenticación
- **bcrypt** - Hashing de contraseñas

### Base de Datos
- **SQL Server 2019+** - Base de datos relacional

### Herramientas de Desarrollo
- **pnpm** - Gestor de paquetes
- **ESLint** - Linting
- **Prettier** - Formateo de código

---

## 📦 Requisitos

- **Node.js** 18.17 o superior
- **pnpm** 8.0 o superior (o npm/yarn)
- **SQL Server** 2019 o superior
- **Git**

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd app_licitaciones
```

### 2. Instalar dependencias

```bash
pnpm install
# o
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
DATABASE_URL="sqlserver://YOUR_SERVER:1433;database=YOUR_DATABASE_NAME;user=YOUR_USER;password=YOUR_PASSWORD;encrypt=true;trustServerCertificate=true"
NEXTAUTH_SECRET="your-secret-key-min-32-characters-here"
NEXTAUTH_URL="http://localhost:3001"
AUTH_TRUST_HOST="true"
NODE_ENV="development"
```

**Nota:**
- Reemplaza `YOUR_SERVER`, `YOUR_DATABASE_NAME`, `YOUR_USER`, `YOUR_PASSWORD` con tus credenciales reales
- El sistema valida automáticamente estas variables al inicio. Si falta alguna, recibirás un error claro.
- Para generar `NEXTAUTH_SECRET` ejecuta: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### 4. Ejecutar migraciones de base de datos

```bash
npx prisma migrate dev
```

### 5. Poblar base de datos con datos de ejemplo

```bash
npm run seed
```

Esto creará:
- 5 usuarios con diferentes roles
- 3 tickets de ejemplo
- 2 licitaciones
- 1 cita con participantes
- Notificaciones de ejemplo

**Credenciales de acceso (contraseña: `admin123`):**
- Admin: `admin@example.com`
- Manager: `manager@example.com`
- Supervisor: `supervisor@example.com`
- Usuario 1: `user1@example.com`
- Usuario 2: `user2@example.com`

### 6. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3001](http://localhost:3001)

---

## ⚙️ Configuración

### Variables de Entorno

Todas las variables son validadas automáticamente por [lib/env.ts](lib/env.ts):

| Variable | Descripción | Requerida | Valor por Defecto |
|----------|-------------|-----------|-------------------|
| `DATABASE_URL` | Conexión SQL Server (formato completo requerido) | ✅ | - |
| `NEXTAUTH_SECRET` | Clave secreta (mínimo 32 caracteres) | ✅ | - |
| `NEXTAUTH_URL` | URL de la aplicación | ❌ | `http://localhost:3001` |
| `AUTH_TRUST_HOST` | Confianza en headers de host | ❌ | `true` |
| `NODE_ENV` | Entorno de ejecución | ❌ | `development` |

**Ejemplo de DATABASE_URL:**
```
sqlserver://YOUR_SERVER:1433;database=YOUR_DB;user=YOUR_USER;password=YOUR_PASS;encrypt=true;trustServerCertificate=true
```

### Prisma

Generar cliente de Prisma después de cambios en schema:

```bash
npx prisma generate
```

Ver base de datos con Prisma Studio:

```bash
npx prisma studio
```

---

## 📖 Uso

### Iniciar sesión

1. Navega a [http://localhost:3001/login](http://localhost:3001/login)
2. Usa cualquiera de las credenciales del seed
3. Contraseña: `admin123`

### Gestionar Tickets

1. Ve a **Tickets** en el menú lateral
2. Haz clic en **Nuevo Ticket**
3. Completa el formulario
4. Asigna responsable y prioridad

### Gestionar Licitaciones

1. Ve a **Licitaciones**
2. Crea nueva licitación con todos los detalles
3. Asigna responsable
4. Sube documentos
5. Agrega notas

### Sistema de Permisos

Cada rol tiene permisos específicos:

- **USER**: Crear tickets, ver licitaciones, crear citas propias
- **SUPERVISOR**: Gestionar tickets y licitaciones, reportes básicos
- **MANAGER**: Gestión completa + crear usuarios + reportes + auditoría
- **ADMIN**: Acceso total al sistema

Ver más detalles en [lib/permissions.ts](lib/permissions.ts)

---

## 📁 Estructura del Proyecto

```
app_licitaciones/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Rutas de autenticación
│   ├── api/                 # API routes
│   ├── tickets/             # Gestión de tickets
│   ├── licitaciones/        # Gestión de licitaciones
│   ├── citas/               # Gestión de citas
│   ├── usuarios/            # Gestión de usuarios
│   └── ...
├── components/              # Componentes React
│   ├── ui/                 # Componentes primitivos (Shadcn)
│   └── ...
├── lib/                     # Lógica de negocio
│   ├── auth.ts             # Configuración NextAuth
│   ├── prisma.ts           # Cliente Prisma
│   ├── env.ts              # Validación de variables
│   ├── errors.ts           # Manejo de errores
│   ├── permissions.ts      # Sistema RBAC
│   ├── session.ts          # Helpers de sesión
│   ├── constants.ts        # Constantes del sistema
│   └── validations/        # Schemas Zod
├── prisma/                  # Configuración Prisma
│   ├── schema.prisma       # Modelos de base de datos
│   ├── seed.ts             # Datos de ejemplo
│   └── migrations/         # Migraciones
├── public/                  # Archivos estáticos
└── ...
```

---

## 🔌 API Documentation

### Endpoints Principales

#### Tickets
```
GET    /api/tickets          # Listar tickets
POST   /api/tickets          # Crear ticket
GET    /api/tickets/[id]     # Obtener ticket
PATCH  /api/tickets/[id]     # Actualizar ticket
DELETE /api/tickets/[id]     # Eliminar ticket
```

#### Licitaciones
```
GET    /api/licitaciones         # Listar licitaciones
POST   /api/licitaciones         # Crear licitación
GET    /api/licitaciones/[id]    # Obtener licitación
PATCH  /api/licitaciones/[id]    # Actualizar licitación
DELETE /api/licitaciones/[id]    # Eliminar licitación
```

#### Autenticación
```
POST   /api/auth/signin          # Iniciar sesión
POST   /api/auth/signout         # Cerrar sesión
GET    /api/auth/session         # Obtener sesión actual
```

### Manejo de Errores

Todas las APIs retornan errores en formato consistente:

```json
{
  "error": {
    "message": "Descripción del error",
    "code": "ERROR_CODE",
    "details": []
  }
}
```

Códigos HTTP:
- `400` - Validación fallida
- `401` - No autenticado
- `403` - No autorizado
- `404` - Recurso no encontrado
- `409` - Conflicto (ej: email duplicado)
- `500` - Error interno

Ver más en [lib/errors.ts](lib/errors.ts)

---

## 🔒 Seguridad

### Implementado ✅

- ✅ Autenticación con NextAuth
- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ Sistema de permisos por rol (RBAC)
- ✅ Validación de variables de entorno
- ✅ Sanitización de inputs
- ✅ React Strict Mode
- ✅ Header X-Powered-By deshabilitado
- ✅ Validación TypeScript estricta

### Recomendado para Producción 🔄

- [ ] Rate limiting
- [ ] CSRF protection adicional
- [ ] Content Security Policy (CSP)
- [ ] HTTPS forzado
- [ ] Helmet.js
- [ ] Logs de seguridad
- [ ] 2FA (autenticación de dos factores)

---

## 🧪 Testing

```bash
# Ejecutar tests (pendiente implementar)
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

---

## 📝 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo (puerto 3001)
npm run build        # Build de producción
npm start            # Servidor de producción
npm run lint         # Ejecutar ESLint
npm run seed         # Poblar base de datos
npx prisma studio    # Interfaz de base de datos
npx prisma migrate   # Gestionar migraciones
```

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Estilo

- Usar TypeScript estricto
- Seguir convenciones de Next.js
- Validar datos con Zod
- Documentar funciones complejas
- Escribir tests para nuevas features

---

## 📚 Documentación Adicional

- [Mejoras Implementadas](MEJORAS_IMPLEMENTADAS.md) - Detalle completo de mejoras recientes
- [Prisma Schema](prisma/schema.prisma) - Modelos de base de datos
- [Constantes](lib/constants.ts) - Estados y tipos del sistema
- [Permisos](lib/permissions.ts) - Matriz de permisos por rol

---

## 🐛 Reporte de Bugs

Si encuentras un bug, por favor abre un issue con:

1. Descripción del problema
2. Pasos para reproducir
3. Comportamiento esperado vs actual
4. Screenshots si aplica
5. Versión de Node.js y navegador

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

## 👥 Equipo

- **Desarrollo:** [Tu Nombre/Empresa]
- **Contacto:** [Email de contacto]

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)

---

**Última actualización:** Diciembre 2024
**Versión:** 1.0.0
