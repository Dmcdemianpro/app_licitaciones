# ⚡ Inicio Rápido - Sistema de Licitaciones

Guía rápida para poner en marcha el sistema en 5 minutos.

---

## 📋 Pre-requisitos

Asegúrate de tener instalado:
- ✅ Node.js 18.17+ ([Descargar](https://nodejs.org/))
- ✅ SQL Server 2019+ en ejecución
- ✅ pnpm (o npm)

---

## 🚀 Pasos de Instalación

### 1️⃣ Instalar dependencias

```bash
cd C:\app_licitaciones
pnpm install
```

### 2️⃣ Configurar base de datos

Copia el archivo de ejemplo y edítalo:

```bash
cp .env.example .env
```

Edita `.env` con tus valores reales:

```env
DATABASE_URL="sqlserver://YOUR_SERVER:1433;database=YOUR_DATABASE_NAME;user=YOUR_USER;password=YOUR_PASSWORD;encrypt=true;trustServerCertificate=true"
NEXTAUTH_SECRET="your-secret-key-min-32-characters-here"
NEXTAUTH_URL="http://localhost:3001"
AUTH_TRUST_HOST="true"
NODE_ENV="development"
```

**⚠️ IMPORTANTE:**
- Reemplaza `YOUR_SERVER`, `YOUR_DATABASE_NAME`, `YOUR_USER`, `YOUR_PASSWORD` con tus credenciales de SQL Server
- Para generar `NEXTAUTH_SECRET`, ejecuta en terminal:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

### 3️⃣ Crear base de datos y tablas

```bash
# Generar cliente de Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate dev --name init

# Poblar con datos de ejemplo
npm run seed
```

Verás este output si todo está bien:
```
🌱 Iniciando seed de base de datos...
👥 Creando usuarios...
  ✓ Admin creado
  ✓ Manager creado
  ...
✅ Seed completado exitosamente!
```

### 4️⃣ Iniciar aplicación

```bash
npm run dev
```

Abre tu navegador en: **http://localhost:3001**

---

## 👤 Iniciar Sesión

Usa cualquiera de estas credenciales (contraseña para todos: `admin123`):

| Rol | Email | Permisos |
|-----|-------|----------|
| **Admin** | admin@example.com | Acceso completo |
| **Manager** | manager@example.com | Gestión + usuarios + reportes |
| **Supervisor** | supervisor@example.com | Gestión de tickets y licitaciones |
| **Usuario** | user1@example.com | Crear tickets, ver licitaciones |
| **Usuario** | user2@example.com | Crear tickets, ver licitaciones |

---

## ✅ Verificación

Después de iniciar sesión, deberías ver:
- ✅ Dashboard con métricas de tickets
- ✅ Menú lateral con: Tickets, Licitaciones, Citas, etc.
- ✅ 3 tickets de ejemplo
- ✅ 2 licitaciones de ejemplo

---

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor (puerto 3001)

# Base de datos
npx prisma studio        # Ver datos en navegador
npx prisma migrate dev   # Crear nueva migración
npm run seed             # Repoblar datos de ejemplo

# Producción
npm run build            # Build de producción
npm start                # Iniciar en producción

# Utilidades
npm run lint             # Verificar código
```

---

## 🐛 Solución de Problemas

### Error: "Variables de entorno inválidas"
- ✅ Verifica que `.env` existe en la raíz del proyecto
- ✅ Asegúrate que `NEXTAUTH_SECRET` tiene al menos 32 caracteres
- ✅ Confirma que `DATABASE_URL` es válida

### Error: Prisma no puede conectarse
- ✅ Verifica que SQL Server está en ejecución
- ✅ Confirma credenciales de base de datos
- ✅ Verifica que el firewall permite conexión al puerto 1433
- ✅ Prueba la conexión: `npx prisma db pull`

### Error: Puerto 3001 en uso
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Cambiar puerto en package.json:
"dev": "cross-env PORT=3002 next dev"
```

### Base de datos vacía después de seed
- ✅ Revisa que las migraciones se aplicaron: `npx prisma migrate status`
- ✅ Ejecuta: `npx prisma migrate reset` (⚠️ borra todos los datos)
- ✅ Vuelve a ejecutar: `npm run seed`

### Errores de TypeScript al iniciar
```bash
# Regenerar tipos de Prisma
npx prisma generate

# Limpiar caché de Next.js
rm -rf .next
npm run dev
```

---

## 📚 Próximos Pasos

1. **Explora el sistema:**
   - Crea tickets
   - Agrega licitaciones
   - Programa citas

2. **Revisa la documentación:**
   - [README.md](README.md) - Documentación completa
   - [MEJORAS_IMPLEMENTADAS.md](MEJORAS_IMPLEMENTADAS.md) - Mejoras recientes

3. **Personaliza:**
   - Modifica [prisma/schema.prisma](prisma/schema.prisma) según tus necesidades
   - Ajusta permisos en [lib/permissions.ts](lib/permissions.ts)
   - Personaliza UI en `components/` y `app/`

---

## 💡 Tips Rápidos

- **Ver base de datos visualmente:** `npx prisma studio`
- **Cambiar contraseña de admin:** Edita `prisma/seed.ts` y ejecuta `npm run seed`
- **Agregar nuevo rol:** Edita `lib/constants.ts` y `lib/permissions.ts`
- **Debug de sesión:** Usa las DevTools de React, la sesión aparece en console

---

## 📞 Necesitas Ayuda?

- 📖 [Documentación Completa](README.md)
- 🔍 [Guía de Mejoras](MEJORAS_IMPLEMENTADAS.md)
- 🐛 Reporta issues en el repositorio

---

**¡Listo!** Ya puedes empezar a usar el sistema. 🎉

Si tienes problemas, revisa la sección de **Solución de Problemas** arriba o consulta la documentación completa.
