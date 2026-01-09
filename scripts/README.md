# Scripts de Despliegue y Migración

## 🔴 Error P3019 - Provider Mismatch

Si obtienes el error `P3019` sobre provider mismatch entre `mssql` y `sqlserver`, **lee primero** [SOLUCION_ERROR_P3019.md](./SOLUCION_ERROR_P3019.md) para entender el problema y la solución completa.

**Solución rápida:** Usa `fresh-start-deploy.sh` para empezar desde cero.

---

## 📋 Scripts Disponibles

### 0. `fresh-start-deploy.sh` 🔥 (Para Error P3019)
Script para eliminar toda la BD y empezar desde cero. **Solución definitiva al error P3019**.

**Uso:**
```bash
cd /Proyecto/app_licitaciones
bash scripts/fresh-start-deploy.sh
```

**Cuándo usarlo:**
- Cuando obtienes error P3019 sobre provider mismatch
- Cuando los metadatos de migraciones están corruptos
- Cuando quieres empezar con BD limpia

**Qué hace:**
1. Pide confirmación (escribe 'SI' para continuar)
2. Elimina TODAS las tablas de SQL Server (incluyendo `_prisma_migrations`)
3. Limpia cliente de Prisma y cachés
4. Reinstala dependencias
5. Genera cliente nuevo
6. Aplica migraciones desde cero
7. Construye la aplicación

**⚠️ ADVERTENCIA:** Elimina TODOS los datos. Haz backup si es necesario.

---

### 1. `migrate-production.sh` ⭐ (Recomendado para updates normales)
Script principal para ejecutar migraciones en producción.

**Uso:**
```bash
cd /Proyecto/app_licitaciones
bash scripts/migrate-production.sh
```

**Qué hace:**
1. Descarga los últimos cambios del repositorio
2. Instala dependencias actualizadas
3. Verifica la configuración del schema
4. Ejecuta las migraciones pendientes
5. Genera el cliente de Prisma
6. Muestra el estado final

---

### 2. `fix-provider-and-migrate.sh` 🔧 (Plan B)
Script de respaldo para corregir problemas de provider.

**Uso:**
```bash
cd /Proyecto/app_licitaciones
bash scripts/fix-provider-and-migrate.sh
```

**Cuándo usarlo:**
- Si `migrate-production.sh` falla con error de provider
- Si hay inconsistencias entre schema.prisma y migration_lock.toml
- Si necesitas forzar la sincronización con el repositorio

**Qué hace:**
1. Hace pull forzado (descarta cambios locales)
2. Corrige automáticamente el provider a "sqlserver"
3. Verifica/crea migration_lock.toml
4. Ejecuta las migraciones
5. Genera el cliente de Prisma

---

## ⚠️ Importante

### Antes de ejecutar cualquier script:

1. **Hacer backup de la base de datos:**
   ```bash
   # Desde SQL Server Management Studio o con script
   ```

2. **Detener el servidor de la aplicación:**
   ```bash
   pm2 stop app_licitaciones
   # o
   systemctl stop app_licitaciones
   ```

### Después de ejecutar el script:

1. **Reiniciar el servidor:**
   ```bash
   pm2 restart app_licitaciones
   # o
   systemctl restart app_licitaciones
   ```

2. **Verificar logs:**
   ```bash
   pm2 logs app_licitaciones
   # o
   journalctl -u app_licitaciones -f
   ```

---

## 🆘 Solución de Problemas

### Error: "Provider mismatch"
```bash
# Usar el script de corrección
bash scripts/fix-provider-and-migrate.sh
```

### Error: "Database connection failed"
```bash
# Verificar la conexión a la base de datos
cat .env | grep DATABASE_URL
ping 10.7.71.31
```

### Error: "Migration already applied"
```bash
# Ver estado de las migraciones
npx prisma migrate status

# Si es necesario, marcar como aplicada
npx prisma migrate resolve --applied "NOMBRE_MIGRACION"
```

---

## 📝 Notas

- Estos scripts usan `npx prisma migrate deploy` en lugar de `migrate dev`
- `migrate deploy` es para producción y NO requiere interacción
- `migrate dev` es para desarrollo y puede crear nuevas migraciones
- Siempre revisa los logs después de ejecutar las migraciones
