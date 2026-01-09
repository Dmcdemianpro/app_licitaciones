# Deployment: Captura de Adjudicación - 2026-01-09

## 🎯 Resumen de Cambios

Se agregó la capacidad de capturar información de **Adjudicación** desde la API de Mercado Público:

### Nuevos Datos Capturados:
- ✅ Proveedor ganador (Nombre y RUT)
- ✅ Monto adjudicado
- ✅ Fecha de adjudicación
- ✅ Cantidad de oferentes
- ✅ Número de adjudicación
- ✅ Tipo de adjudicación
- ✅ Estado de adjudicación

### Archivos Modificados:
1. **prisma/schema.prisma** - Nueva tabla `Adjudicacion`
2. **app/api/licitaciones/importar/route.ts** - Captura datos de adjudicación
3. **app/api/licitaciones/[id]/route.ts** - Incluye adjudicación en detalle
4. **app/licitaciones/[id]/page.tsx** - Nueva sección visual para adjudicación

---

## 📋 Pasos para Aplicar en Producción

### 1. Conectar al Servidor

```bash
ssh root@10.7.71.31
cd /Proyecto/app_licitaciones
```

### 2. Detener el Servicio

```bash
systemctl stop licitaciones
```

### 3. Actualizar Código desde GitHub

```bash
git pull origin main
```

Deberías ver algo como:
```
remote: Enumerating objects: X, done.
remote: Counting objects: 100% (X/X), done.
remote: Compressing objects: 100% (X/X), done.
remote: Total X (delta X), reused X (delta X), pack-reused 0
Unpacking objects: 100% (X/X), done.
From https://github.com/Dmcdemianpro/app_licitaciones
   5084916..085327b  main       -> origin/main
Updating 5084916..085327b
Fast-forward
 app/api/licitaciones/[id]/route.ts      |  1 +
 app/api/licitaciones/importar/route.ts  | 29 +++++++++++++++++++++++++++++
 app/licitaciones/[id]/page.tsx          | 86 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 prisma/schema.prisma                    | 43 +++++++++++++++++++++++++++++++++++++++++++
 4 files changed, 159 insertions(+)
```

### 4. Generar Cliente de Prisma

```bash
npx prisma generate
```

### 5. Aplicar Cambios al Schema (⚠️ IMPORTANTE: Usar db push, NO migrate deploy)

```bash
npx prisma db push
```

**Salida esperada:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": SQL Server database "DB_licitaciones" at "10.7.71.31:1433"

🚀  Your database is now in sync with your Prisma schema. Done in XXXms

✔ Generated Prisma Client (6.8.2 | library) to .\node_modules\@prisma\client in XXXms
```

### 6. Build de la Aplicación

```bash
npm run build
```

**Tiempo:** ~2-3 minutos

### 7. Iniciar Servicio

```bash
systemctl start licitaciones
```

### 8. Verificar Estado

```bash
systemctl status licitaciones
```

Debe mostrar: `Active: active (running)`

### 9. Ver Logs

```bash
journalctl -u licitaciones -f
```

Debes ver: `✓ Ready in XXXms`

---

## ✅ Verificación Post-Deployment

### 1. Verificar Tabla en SQL Server

Abre **SSMS** o **Azure Data Studio** y ejecuta:

```sql
USE [DB_licitaciones];
GO

-- Verificar que existe la tabla
SELECT * FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'adjudicaciones';

-- Ver estructura
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'adjudicaciones'
ORDER BY ORDINAL_POSITION;
```

**Deberías ver:**
| COLUMN_NAME | DATA_TYPE | IS_NULLABLE |
|-------------|-----------|-------------|
| id | nvarchar | NO |
| licitacion_id | nvarchar | NO |
| numero_adjudicacion | nvarchar | YES |
| tipo_adjudicacion | int | YES |
| cantidad_oferentes | int | YES |
| fecha_adjudicacion | datetime2 | YES |
| proveedor_rut | nvarchar | YES |
| proveedor_nombre | nvarchar | YES |
| monto_adjudicado | decimal | YES |
| observaciones | nvarchar | YES |
| estado_adjudicacion | nvarchar | YES |
| createdAt | datetime2 | NO |
| updatedAt | datetime2 | NO |

### 2. Verificar la Aplicación

Abre tu navegador y ve a:
```
http://10.7.50.130:3001
```

### 3. Probar la Importación

1. Ve a **Licitaciones > Nueva Licitación**
2. Busca una licitación que esté **ADJUDICADA** en Mercado Público
3. Ejemplo: Código `1057472-106-LR24` (esta está adjudicada)
4. Importa la licitación
5. Entra al detalle de la licitación
6. Deberías ver una nueva sección: **"Información de Adjudicación"**
7. Verifica que muestre:
   - Proveedor adjudicado
   - RUT del proveedor
   - Monto adjudicado
   - Fecha de adjudicación
   - Cantidad de oferentes

---

## 🔧 Troubleshooting

### Error: "Type Adjudicacion does not exist"

**Causa:** El cliente de Prisma no se regeneró correctamente.

**Solución:**
```bash
rm -rf node_modules/@prisma/client
rm -rf node_modules/.prisma
npx prisma generate
npm run build
systemctl restart licitaciones
```

### Error: "Table 'adjudicaciones' doesn't exist"

**Causa:** No se aplicaron los cambios al schema con `prisma db push`.

**Solución:**
```bash
npx prisma db push
systemctl restart licitaciones
```

### La sección de adjudicación no aparece

**Posible causa 1:** La licitación que importaste no tiene datos de adjudicación en Mercado Público.
- **Solución:** Prueba con una licitación que esté en estado "ADJUDICADA"

**Posible causa 2:** El build no incluyó los cambios del frontend.
- **Solución:**
```bash
rm -rf .next
npm run build
systemctl restart licitaciones
```

---

## 🆘 Rollback (Si algo sale mal)

Si necesitas revertir los cambios:

```bash
cd /Proyecto/app_licitaciones

# Detener servicio
systemctl stop licitaciones

# Volver al commit anterior
git reset --hard 5084916

# Eliminar la tabla de adjudicaciones (SSMS)
# DROP TABLE [dbo].[adjudicaciones];

# Regenerar cliente
npx prisma generate

# Build
npm run build

# Iniciar servicio
systemctl start licitaciones
```

---

## 📊 Próximos Pasos

Después de este deployment, puedes:

1. **Importar licitaciones adjudicadas** para probar la nueva funcionalidad
2. **Verificar** que los datos se capturen correctamente
3. **Comparar** montos estimados vs montos adjudicados
4. **Analizar** proveedores recurrentes
5. **Generar reportes** de competitividad (cantidad de oferentes)

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa logs: `journalctl -u licitaciones -n 100`
2. Verifica permisos de BD: Usuario debe ser `db_owner`
3. Confirma que el schema se aplicó: Verifica tabla en SSMS
4. Consulta: `DEPLOYMENT_EXITOSO_2026-01-09.md` para referencia del deployment anterior

---

**Deployment preparado por:** Claude Sonnet 4.5
**Fecha:** 2026-01-09
**Commits incluidos:**
- `085327b` - Capturar información de Adjudicación desde API de Mercado Público
- `5084916` - Agregar tabla Adjudicacion y campos de horarios en SoporteTecnico

**Estado:** ✅ LISTO PARA DEPLOYMENT
