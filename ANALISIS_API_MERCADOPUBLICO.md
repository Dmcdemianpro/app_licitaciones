# Análisis Completo de la API de Mercado Público

## 📊 Resumen
La API de Mercado Público proporciona **más de 70 campos** de información por licitación. Actualmente solo se están usando **11 campos básicos**.

---

## ✅ Campos ACTUALMENTE Implementados (11)

| Campo Actual | Campo API | Tipo | Descripción |
|--------------|-----------|------|-------------|
| `codigoExterno` | `CodigoExterno` | String | Código único de la licitación |
| `nombre` | `Nombre` | String | Título de la licitación |
| `descripcion` | `Descripcion` | String | Descripción detallada |
| `entidad` | `Comprador.NombreOrganismo` | String | Nombre del organismo comprador |
| `estado` | `CodigoEstado` / `Estado` | String/Int | Estado de la licitación (mapeado) |
| `montoEstimado` | `MontoEstimado` | Decimal | Monto estimado en CLP |
| `fechaPublicacion` | `Fechas.FechaPublicacion` | DateTime | Fecha de publicación |
| `fechaCierre` | `Fechas.FechaCierre` | DateTime | Fecha de cierre |
| `fechaAdjudicacion` | `Fechas.FechaAdjudicacion` | DateTime | Fecha de adjudicación |
| `urlExterna` | *Generada* | String | Link a Mercado Público |
| `tipo` | *Hardcoded* | String | Siempre "PUBLICA" |

---

## 🆕 Campos DISPONIBLES pero NO Implementados (60+)

### 1️⃣ Información Básica de la Licitación

| Campo API | Tipo | Ejemplo | Utilidad |
|-----------|------|---------|----------|
| `CodigoEstado` | Int | 5, 6, 7, 8, 9, 10 | Estado numérico (5=Publicada, 8=Adjudicada) |
| `Estado` | String | "Publicada" | Estado en texto legible |
| `DiasCierreLicitacion` | String | "13" | Días restantes para cierre |
| `CodigoTipo` | Int | 1 | Tipo de licitación |
| `Tipo` | String | "LE" | Sigla del tipo (LE, LP, LQ, etc) |
| `TipoConvocatoria` | String | "1" | Tipo de convocatoria |
| `Moneda` | String | "CLP" | Moneda (CLP, USD, EUR) |
| `Etapas` | Int | 1 | Número de etapas |
| `EstadoEtapas` | String | "0" | Estado de las etapas |
| `TomaRazon` | String | "0" | Requiere toma de razón |
| `EstadoPublicidadOfertas` | Int | 1 | Publicidad de ofertas |
| `Contrato` | String | "1" | Requiere contrato |
| `Obras` | String | "0" | Es licitación de obras |
| `CantidadReclamos` | Int | 452 | Número de reclamos |

### 2️⃣ Información del Comprador (Organismo)

| Campo API | Tipo | Ejemplo | Utilidad |
|-----------|------|---------|----------|
| `Comprador.CodigoOrganismo` | String | "7412" | ID único del organismo |
| `Comprador.RutUnidad` | String | "61.606.303-0" | RUT de la unidad compradora |
| `Comprador.CodigoUnidad` | String | "2551" | Código de la unidad |
| `Comprador.NombreUnidad` | String | "Adquisiciones Clinicas..." | Nombre de la unidad |
| `Comprador.DireccionUnidad` | String | "Avda. Huasco N°392..." | Dirección física |
| `Comprador.ComunaUnidad` | String | "Vallenar" | Comuna |
| `Comprador.RegionUnidad` | String | "Región de Atacama" | Región |
| `Comprador.RutUsuario` | String | "" | RUT del usuario responsable |
| `Comprador.CodigoUsuario` | String | "2111335" | ID del usuario |
| `Comprador.NombreUsuario` | String | "MARIA ISABEL MUÑOZ" | Nombre del responsable |
| `Comprador.CargoUsuario` | String | "QUIMICO FARMACEUTICO" | Cargo del responsable |

### 3️⃣ Fechas Detalladas

| Campo API | Tipo | Ejemplo | Utilidad |
|-----------|------|---------|----------|
| `Fechas.FechaCreacion` | DateTime | "2026-01-03T11:16:21" | Creación en el sistema |
| `Fechas.FechaInicio` | DateTime | "2026-01-03T13:01:00" | Inicio de publicación |
| `Fechas.FechaFinal` | DateTime | "2026-01-12T15:01:00" | Fecha final de consultas |
| `Fechas.FechaPubRespuestas` | DateTime | "2026-01-14T15:01:00" | Publicación de respuestas |
| `Fechas.FechaActoAperturaTecnica` | DateTime | "2026-01-19T15:31:00" | Acto de apertura técnica |
| `Fechas.FechaActoAperturaEconomica` | DateTime | "2026-01-19T15:31:00" | Acto de apertura económica |
| `Fechas.FechaEstimadaAdjudicacion` | DateTime | "2026-02-17T17:00:00" | Adjudicación estimada |
| `Fechas.FechaSoporteFisico` | DateTime | null | Entrega de soporte físico |
| `Fechas.FechaTiempoEvaluacion` | DateTime | null | Tiempo de evaluación |
| `Fechas.FechaEstimadaFirma` | DateTime | null | Firma estimada del contrato |
| `Fechas.FechaVisitaTerreno` | DateTime | null | Visita a terreno (si aplica) |
| `Fechas.FechaEntregaAntecedentes` | DateTime | null | Entrega de antecedentes |

### 4️⃣ Información Financiera y Contractual

| Campo API | Tipo | Ejemplo | Utilidad |
|-----------|------|---------|----------|
| `Estimacion` | Int | 1 | Tipo de estimación |
| `FuenteFinanciamiento` | String | "PRESUPUESTO DISPONIBLE" | Fuente del dinero |
| `VisibilidadMonto` | Int | 0 | Visibilidad del monto |
| `Tiempo` | String | "36" | Tiempo del contrato |
| `UnidadTiempo` | String | "1" | Unidad (días/meses) |
| `Modalidad` | Int | 1 | Modalidad de pago |
| `TipoPago` | String | "1" | Tipo de pago |
| `NombreResponsablePago` | String | "RAMON CALLEJAS" | Responsable de pago |
| `EmailResponsablePago` | String | "" | Email del responsable |
| `NombreResponsableContrato` | String | "JESSICA PARRA LAGOS" | Responsable del contrato |
| `EmailResponsableContrato` | String | "" | Email del responsable |
| `FonoResponsableContrato` | String | "" | Teléfono del responsable |
| `UnidadTiempoDuracionContrato` | Int | 4 | Unidad de duración |
| `TiempoDuracionContrato` | String | "36" | Duración del contrato |
| `TipoDuracionContrato` | String | " " | Tipo de duración |

### 5️⃣ Condiciones y Requisitos

| Campo API | Tipo | Ejemplo | Utilidad |
|-----------|------|---------|----------|
| `ProhibicionContratacion` | String | "" | Prohibiciones |
| `SubContratacion` | String | "0" | Permite subcontratación |
| `JustificacionMontoEstimado` | String | "" | Justificación del monto |
| `ObservacionContract` | String | null | Observaciones |
| `ExtensionPlazo` | Int | 0 | Permite extensión |
| `EsBaseTipo` | Int | 0 | Es base tipo |
| `UnidadTiempoContratoLicitacion` | String | "2" | Unidad de tiempo |
| `ValorTiempoRenovacion` | String | "0" | Tiempo de renovación |
| `PeriodoTiempoRenovacion` | String | " " | Periodo de renovación |
| `EsRenovable` | Int | 0 | Contrato renovable |
| `CodigoBIP` | String | null | Código BIP (inversión pública) |

### 6️⃣ Direcciones y Ubicaciones

| Campo API | Tipo | Ejemplo | Utilidad |
|-----------|------|---------|----------|
| `DireccionVisita` | String | "" | Dirección para visita a terreno |
| `DireccionEntrega` | String | "" | Dirección de entrega |

### 7️⃣ Items/Productos (Array)

| Campo API | Tipo | Ejemplo | Utilidad |
|-----------|------|---------|----------|
| `Items.Cantidad` | Int | 4 | Cantidad de items |
| `Items.Listado[].Correlativo` | Int | 1 | Número correlativo |
| `Items.Listado[].CodigoProducto` | Int | 42295513 | Código del producto |
| `Items.Listado[].CodigoCategoria` | String | "42295500" | Código de categoría |
| `Items.Listado[].Categoria` | String | "Equipamiento..." | Nombre de categoría |
| `Items.Listado[].NombreProducto` | String | "Productos quirúrgicos..." | Nombre del producto |
| `Items.Listado[].Descripcion` | String | "MALLA P/HERNIOPLASTIA..." | Descripción detallada |
| `Items.Listado[].UnidadMedida` | String | "Unidad" | Unidad de medida |
| `Items.Listado[].Cantidad` | Float | 270.0 | Cantidad solicitada |
| `Items.Listado[].Adjudicacion` | Object | null | Datos de adjudicación |

### 8️⃣ Adjudicación (cuando existe)

| Campo API | Tipo | Ejemplo | Utilidad |
|-----------|------|---------|----------|
| `Adjudicacion` | Object | null | Datos del adjudicado (cuando aplica) |

---

## 🎯 Campos RECOMENDADOS para Implementar

### Alta Prioridad (Muy Útiles)

1. **`Comprador.RegionUnidad`** - Para filtrar por región
2. **`Comprador.ComunaUnidad`** - Para filtrar por comuna
3. **`DiasCierreLicitacion`** - Para alertas de cierre
4. **`Tipo`** - Para clasificar (LE, LP, LQ, etc)
5. **`FuenteFinanciamiento`** - Saber origen del dinero
6. **`Items.Listado`** - Lista de productos/servicios (tabla relacionada)
7. **`NombreResponsableContrato`** - Contacto del responsable
8. **`EmailResponsableContrato`** - Email de contacto
9. **`FonoResponsableContrato`** - Teléfono de contacto
10. **`CantidadReclamos`** - Indicador de problemas
11. **`Fechas.FechaEstimadaAdjudicacion`** - Fecha probable
12. **`TiempoDuracionContrato`** - Duración del contrato
13. **`CodigoBIP`** - Para proyectos de inversión pública

### Prioridad Media

1. **`Comprador.CodigoOrganismo`** - ID del organismo
2. **`Comprador.RutUnidad`** - RUT de la unidad
3. **`SubContratacion`** - Permite subcontratación
4. **`EsRenovable`** - Si es renovable
5. **`Modalidad`** - Modalidad de pago
6. **`Fechas.FechaActoAperturaTecnica`** - Acto de apertura
7. **`Fechas.FechaActoAperturaEconomica`** - Acto económico

---

## 📋 Propuesta de Nuevos Campos en la Base de Datos

### Tabla `Licitacion` - Campos a Agregar

```prisma
model Licitacion {
  // ... campos existentes ...

  // Información del comprador
  regionUnidad         String?
  comunaUnidad         String?
  codigoOrganismo      String?
  rutUnidad            String?
  direccionUnidad      String?

  // Tipo y clasificación
  tipoLicitacion       String?  // LE, LP, LQ, etc
  tipoConvocatoria     String?

  // Fechas adicionales
  fechaEstimadaAdjudicacion  DateTime?
  fechaActoApertura          DateTime?
  fechaInicioPublicacion     DateTime?

  // Financiamiento
  fuenteFinanciamiento String?
  codigoBIP            String?

  // Contrato
  duracionContrato     String?
  unidadDuracion       String?
  esRenovable          Boolean   @default(false)
  permiteSubcontratacion Boolean @default(false)

  // Responsables
  nombreResponsableContrato String?
  emailResponsableContrato  String?
  fonoResponsableContrato   String?
  nombreResponsablePago     String?

  // Indicadores
  cantidadReclamos     Int?
  diasCierre           Int?

  // Relación a items
  items                LicitacionItem[]
}

// Nueva tabla para items/productos
model LicitacionItem {
  id                String   @id @default(cuid())
  licitacionId      String
  licitacion        Licitacion @relation(fields: [licitacionId], references: [id], onDelete: Cascade)

  correlativo       Int
  codigoProducto    String?
  codigoCategoria   String?
  categoria         String?
  nombreProducto    String?
  descripcion       String?
  unidadMedida      String?
  cantidad          Float?

  createdAt         DateTime @default(now())

  @@map("licitaciones_items")
}
```

---

## 🔄 Mapeo de Estados

```typescript
Estados de Mercado Público (CodigoEstado):
- 5: Publicada / Activa
- 6: Publicada / Activa
- 7: Publicada / Activa
- 8: Adjudicada
- 9: Desierta
- 10: Cancelada
```

---

## 💡 Casos de Uso

### Con los nuevos campos podrías:

1. **Filtrar por región/comuna** - Buscar solo licitaciones de tu zona
2. **Alertas inteligentes** - Avisar cuando quedan pocos días para cierre
3. **Análisis de reclamos** - Ver cuáles tienen problemas
4. **Contacto directo** - Email/teléfono del responsable
5. **Ver productos** - Lista detallada de lo que se licita
6. **Clasificación por tipo** - Filtrar por LE, LP, LQ, etc
7. **Proyectos BIP** - Identificar inversiones públicas grandes
8. **Seguimiento de contratos** - Duración y renovaciones

---

## 📊 Estadísticas de Uso Actual

- **Campos disponibles**: ~70
- **Campos implementados**: 11 (15.7%)
- **Campos recomendados**: 13 adicionales
- **Mejora potencial**: +118% de información

---

## 🚀 Próximos Pasos Sugeridos

1. Agregar campos prioritarios a la tabla `Licitacion`
2. Crear tabla `LicitacionItem` para productos
3. Actualizar endpoint de importación
4. Agregar filtros en frontend por región/comuna
5. Implementar sistema de alertas por días de cierre
6. Mostrar información de contacto del responsable
