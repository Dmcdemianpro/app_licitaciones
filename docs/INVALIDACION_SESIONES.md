# Invalidación de Sesiones al Desplegar

## Descripción

Este sistema invalida automáticamente todas las sesiones activas cuando se despliega una nueva versión de la aplicación, forzando a los usuarios a volver a iniciar sesión. Esto mejora la seguridad al asegurar que los usuarios estén usando la versión más reciente del código.

## Cómo Funciona

El sistema utiliza una variable de entorno `APP_VERSION` que se almacena en el token JWT de cada usuario. Cuando un usuario intenta usar su sesión:

1. El sistema compara la versión almacenada en su token con la versión actual de la aplicación
2. Si las versiones NO coinciden, la sesión se invalida automáticamente
3. El usuario es redirigido a la página de login para volver a autenticarse

## Configuración

### 1. Variable de Entorno

Agrega la siguiente variable a tu archivo `.env`:

```env
# Versión de la aplicación (incrementar al desplegar)
# Formato: YYYYMMDD-HHMM o cualquier identificador único
APP_VERSION="1.0.0"
```

### 2. Al Desplegar una Nueva Versión

Cada vez que hagas un despliegue y quieras invalidar las sesiones existentes:

**Opción A: Usar fecha y hora (recomendado)**
```bash
# En el servidor de producción, actualiza la versión en .env
echo 'APP_VERSION="20260113-1530"' >> .env

# Luego reinicia la aplicación
pm2 restart app_licitaciones
# o
npm run build && [comando para reiniciar tu servidor]
```

**Opción B: Usar número de versión semántico**
```bash
# Incrementa el número de versión
echo 'APP_VERSION="1.0.1"' >> .env

# Reinicia la aplicación
pm2 restart app_licitaciones
```

**Opción C: Automatizar con script de despliegue**

Crea un script `deploy.sh`:
```bash
#!/bin/bash

# Obtener timestamp actual
VERSION=$(date +"%Y%m%d-%H%M")

# Actualizar .env con nueva versión
sed -i "s/APP_VERSION=.*/APP_VERSION=\"$VERSION\"/" .env

# Pull del código
git pull origin main

# Instalar dependencias
npm install

# Generar Prisma Client
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# Build de la aplicación
npm run build

# Reiniciar aplicación
pm2 restart app_licitaciones

echo "Despliegue completado con versión: $VERSION"
echo "Todas las sesiones activas han sido invalidadas"
```

Luego ejecuta:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Ejemplos de Uso

### Desarrollo Local
```env
APP_VERSION="dev-1.0.0"
```

### Producción
```env
APP_VERSION="20260113-1530"
```

### Staging
```env
APP_VERSION="staging-1.0.0"
```

## Beneficios de Seguridad

1. **Código actualizado**: Los usuarios siempre usan la versión más reciente
2. **Parches de seguridad**: Los fixes de seguridad se aplican inmediatamente a todos
3. **Consistencia**: Evita problemas de compatibilidad entre versiones
4. **Auditoría**: Los logs registran cuándo se invalidan sesiones

## Logs

El sistema registra en la consola cuando se invalida una sesión:

```
Session invalidated: version mismatch (token: 1.0.0, current: 1.0.1)
```

## Notas Importantes

- ⚠️ **IMPORTANTE**: Cambiar la versión cerrará la sesión de TODOS los usuarios activos
- 💡 **Recomendación**: Programa los despliegues en horarios de bajo tráfico
- 📝 **Documentación**: Mantén un registro de cambios de versión en tu changelog
- 🔒 **Seguridad**: Nunca expongas `NEXTAUTH_SECRET` ni `APP_VERSION` en el código fuente

## Troubleshooting

### Problema: Los usuarios no son deslogueados

**Solución**: Verifica que:
1. La variable `APP_VERSION` existe en el archivo `.env`
2. El servidor se reinició después de cambiar `.env`
3. El nuevo valor es diferente al anterior

### Problema: Error al iniciar sesión después de desplegar

**Solución**: Verifica que `APP_VERSION` esté configurada correctamente y que el servidor pueda leer el archivo `.env`
