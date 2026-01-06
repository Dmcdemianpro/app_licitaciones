BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(255),
    [hashedPassword] NVARCHAR(255) NOT NULL,
    [role] NVARCHAR(50) CONSTRAINT [users_role_df] DEFAULT 'USER',
    [activo] BIT NOT NULL CONSTRAINT [users_activo_df] DEFAULT 1,
    [telefono] NVARCHAR(50),
    [departamento] NVARCHAR(100),
    [cargo] NVARCHAR(100),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[accounts] (
    [id] NVARCHAR(100) NOT NULL,
    [user_id] NVARCHAR(100) NOT NULL,
    [type] NVARCHAR(100) NOT NULL,
    [provider] NVARCHAR(100) NOT NULL,
    [provider_account_id] NVARCHAR(255) NOT NULL,
    [refresh_token] NVARCHAR(max),
    [access_token] NVARCHAR(max),
    [expires_at] INT,
    [token_type] NVARCHAR(100),
    [scope] NVARCHAR(255),
    [id_token] NVARCHAR(max),
    [session_state] NVARCHAR(255),
    CONSTRAINT [accounts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [accounts_provider_provider_account_id_key] UNIQUE NONCLUSTERED ([provider],[provider_account_id])
);

-- CreateTable
CREATE TABLE [dbo].[sessions] (
    [id] NVARCHAR(100) NOT NULL,
    [session_token] NVARCHAR(255) NOT NULL,
    [user_id] NVARCHAR(100) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [sessions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sessions_session_token_key] UNIQUE NONCLUSTERED ([session_token])
);

-- CreateTable
CREATE TABLE [dbo].[verificationtokens] (
    [identifier] NVARCHAR(255) NOT NULL,
    [token] NVARCHAR(255) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [verificationtokens_token_key] UNIQUE NONCLUSTERED ([token]),
    CONSTRAINT [verificationtokens_identifier_token_key] UNIQUE NONCLUSTERED ([identifier],[token])
);

-- CreateTable
CREATE TABLE [dbo].[tickets] (
    [id] NVARCHAR(100) NOT NULL,
    [title] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(max),
    [type] NVARCHAR(100) NOT NULL,
    [priority] NVARCHAR(50) NOT NULL CONSTRAINT [tickets_priority_df] DEFAULT 'MEDIA',
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [tickets_status_df] DEFAULT 'CREADO',
    [assignee] NVARCHAR(255),
    [assignee_id] NVARCHAR(100),
    [owner_id] NVARCHAR(100) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [tickets_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [tickets_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[licitaciones] (
    [id] NVARCHAR(100) NOT NULL,
    [folio] INT NOT NULL IDENTITY(1,1),
    [codigo_externo] NVARCHAR(100),
    [nombre] NVARCHAR(500) NOT NULL,
    [descripcion] NVARCHAR(max),
    [entidad] NVARCHAR(255) NOT NULL,
    [tipo] NVARCHAR(50) NOT NULL CONSTRAINT [licitaciones_tipo_df] DEFAULT 'PUBLICA',
    [estado] NVARCHAR(50) NOT NULL CONSTRAINT [licitaciones_estado_df] DEFAULT 'EN_PREPARACION',
    [montoEstimado] DECIMAL(18,2),
    [moneda] NVARCHAR(10) CONSTRAINT [licitaciones_moneda_df] DEFAULT 'CLP',
    [unidad_responsable] NVARCHAR(255),
    [fecha_publicacion] DATETIME2,
    [fecha_cierre] DATETIME2,
    [fecha_adjudicacion] DATETIME2,
    [url_externa] NVARCHAR(500),
    [responsable_id] NVARCHAR(100),
    [created_by_id] NVARCHAR(100) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [licitaciones_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    [deleted_by_id] NVARCHAR(100),
    [motivo_eliminacion] NVARCHAR(max),
    [codigo_estado] INT,
    [estado_texto] NVARCHAR(100),
    [dias_cierre_licitacion] INT,
    [codigo_tipo] INT,
    [tipo_licitacion] NVARCHAR(10),
    [tipo_convocatoria] NVARCHAR(10),
    [etapas] INT,
    [estado_etapas] NVARCHAR(10),
    [toma_razon] NVARCHAR(10),
    [estado_publicidad_ofertas] INT,
    [contrato] NVARCHAR(10),
    [obras] NVARCHAR(10),
    [cantidad_reclamos] INT,
    [codigo_organismo] NVARCHAR(50),
    [rut_unidad] NVARCHAR(50),
    [codigo_unidad] NVARCHAR(50),
    [nombre_unidad] NVARCHAR(500),
    [direccion_unidad] NVARCHAR(500),
    [comuna_unidad] NVARCHAR(100),
    [region_unidad] NVARCHAR(100),
    [rut_usuario] NVARCHAR(50),
    [codigo_usuario] NVARCHAR(50),
    [nombre_usuario] NVARCHAR(255),
    [cargo_usuario] NVARCHAR(255),
    [fecha_creacion] DATETIME2,
    [fecha_inicio] DATETIME2,
    [fecha_final] DATETIME2,
    [fecha_pub_respuestas] DATETIME2,
    [fecha_acto_apertura_tecnica] DATETIME2,
    [fecha_acto_apertura_economica] DATETIME2,
    [fecha_estimada_adjudicacion] DATETIME2,
    [fecha_soporte_fisico] DATETIME2,
    [fecha_tiempo_evaluacion] DATETIME2,
    [fecha_estimada_firma] DATETIME2,
    [fecha_visita_terreno] DATETIME2,
    [fecha_entrega_antecedentes] DATETIME2,
    [estimacion] INT,
    [fuente_financiamiento] NVARCHAR(255),
    [visibilidad_monto] INT,
    [tiempo] NVARCHAR(50),
    [unidad_tiempo] NVARCHAR(10),
    [modalidad] INT,
    [tipo_pago] NVARCHAR(10),
    [nombre_responsable_pago] NVARCHAR(255),
    [email_responsable_pago] NVARCHAR(255),
    [nombre_responsable_contrato] NVARCHAR(255),
    [email_responsable_contrato] NVARCHAR(255),
    [fono_responsable_contrato] NVARCHAR(50),
    [unidad_tiempo_duracion_contrato] INT,
    [tiempo_duracion_contrato] NVARCHAR(50),
    [tipo_duracion_contrato] NVARCHAR(10),
    [prohibicion_contratacion] NVARCHAR(max),
    [sub_contratacion] NVARCHAR(10),
    [justificacion_monto_estimado] NVARCHAR(max),
    [observacion_contract] NVARCHAR(max),
    [extension_plazo] INT,
    [es_base_tipo] INT,
    [unidad_tiempo_contrato_licitacion] NVARCHAR(10),
    [valor_tiempo_renovacion] NVARCHAR(50),
    [periodo_tiempo_renovacion] NVARCHAR(10),
    [es_renovable] INT,
    [codigo_bip] NVARCHAR(100),
    [direccion_visita] NVARCHAR(500),
    [direccion_entrega] NVARCHAR(500),
    CONSTRAINT [licitaciones_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [licitaciones_folio_key] UNIQUE NONCLUSTERED ([folio]),
    CONSTRAINT [licitaciones_codigo_externo_key] UNIQUE NONCLUSTERED ([codigo_externo])
);

-- CreateTable
CREATE TABLE [dbo].[citas] (
    [id] NVARCHAR(100) NOT NULL,
    [titulo] NVARCHAR(255) NOT NULL,
    [descripcion] NVARCHAR(max),
    [tipo] NVARCHAR(50) NOT NULL CONSTRAINT [citas_tipo_df] DEFAULT 'REUNION',
    [estado] NVARCHAR(50) NOT NULL CONSTRAINT [citas_estado_df] DEFAULT 'PROGRAMADA',
    [fecha_inicio] DATETIME2 NOT NULL,
    [fecha_fin] DATETIME2 NOT NULL,
    [ubicacion] NVARCHAR(255),
    [url_reunion] NVARCHAR(500),
    [licitacion_id] NVARCHAR(100),
    [organizador_id] NVARCHAR(100) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [citas_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [citas_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[cita_participantes] (
    [id] NVARCHAR(100) NOT NULL,
    [cita_id] NVARCHAR(100) NOT NULL,
    [user_id] NVARCHAR(100) NOT NULL,
    [asistio] BIT NOT NULL CONSTRAINT [cita_participantes_asistio_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [cita_participantes_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [cita_participantes_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [cita_participantes_cita_id_user_id_key] UNIQUE NONCLUSTERED ([cita_id],[user_id])
);

-- CreateTable
CREATE TABLE [dbo].[notificaciones] (
    [id] NVARCHAR(100) NOT NULL,
    [tipo] NVARCHAR(50) NOT NULL,
    [titulo] NVARCHAR(255) NOT NULL,
    [mensaje] NVARCHAR(max) NOT NULL,
    [leida] BIT NOT NULL CONSTRAINT [notificaciones_leida_df] DEFAULT 0,
    [user_id] NVARCHAR(100) NOT NULL,
    [reference_type] NVARCHAR(50),
    [reference_id] NVARCHAR(100),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [notificaciones_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [notificaciones_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[documentos] (
    [id] NVARCHAR(100) NOT NULL,
    [nombre] NVARCHAR(255) NOT NULL,
    [descripcion] NVARCHAR(500),
    [tipo_archivo] NVARCHAR(100) NOT NULL,
    [tamano] INT NOT NULL,
    [ruta_archivo] NVARCHAR(500) NOT NULL,
    [licitacion_id] NVARCHAR(100),
    [cita_id] NVARCHAR(100),
    [ticket_id] NVARCHAR(100),
    [uploaded_by_id] NVARCHAR(100) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [documentos_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [documentos_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[notas] (
    [id] NVARCHAR(100) NOT NULL,
    [contenido] NVARCHAR(max) NOT NULL,
    [licitacion_id] NVARCHAR(100),
    [cita_id] NVARCHAR(100),
    [ticket_id] NVARCHAR(100),
    [autor_id] NVARCHAR(100) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [notas_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [notas_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[auditoria_logs] (
    [id] NVARCHAR(100) NOT NULL,
    [accion] NVARCHAR(100) NOT NULL,
    [entidad] NVARCHAR(100) NOT NULL,
    [entidad_id] NVARCHAR(100),
    [cambios] NVARCHAR(max),
    [user_id] NVARCHAR(100),
    [ip_address] NVARCHAR(45),
    [user_agent] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [auditoria_logs_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [auditoria_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[licitaciones_items] (
    [id] NVARCHAR(100) NOT NULL,
    [licitacion_id] NVARCHAR(100) NOT NULL,
    [correlativo] INT NOT NULL,
    [codigo_producto] NVARCHAR(50),
    [codigo_categoria] NVARCHAR(50),
    [categoria] NVARCHAR(max),
    [nombre_producto] NVARCHAR(500),
    [descripcion] NVARCHAR(max),
    [unidad_medida] NVARCHAR(50),
    [cantidad] DECIMAL(18,2),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [licitaciones_items_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [licitaciones_items_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[soporte_tecnico] (
    [id] NVARCHAR(100) NOT NULL,
    [licitacion_id] NVARCHAR(100),
    [ticket_id] NVARCHAR(100),
    [cita_id] NVARCHAR(100),
    [nombre_contacto] NVARCHAR(255) NOT NULL,
    [cargo_contacto] NVARCHAR(255),
    [email_contacto] NVARCHAR(255),
    [telefono_contacto] NVARCHAR(50),
    [empresa_contacto] NVARCHAR(255),
    [tipo_soporte] NVARCHAR(100) NOT NULL,
    [descripcion] NVARCHAR(max),
    [observaciones] NVARCHAR(max),
    [estado] NVARCHAR(50) NOT NULL CONSTRAINT [soporte_tecnico_estado_df] DEFAULT 'ACTIVO',
    [prioridad] NVARCHAR(50) NOT NULL CONSTRAINT [soporte_tecnico_prioridad_df] DEFAULT 'MEDIA',
    [fecha_contacto] DATETIME2,
    [proximo_seguimiento] DATETIME2,
    [created_by_id] NVARCHAR(100) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [soporte_tecnico_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [soporte_tecnico_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_ticket_owner] ON [dbo].[tickets]([owner_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_ticket_assignee] ON [dbo].[tickets]([assignee_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_ticket_status] ON [dbo].[tickets]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_ticket_priority] ON [dbo].[tickets]([priority]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_licitacion_estado] ON [dbo].[licitaciones]([estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_licitacion_fecha_cierre] ON [dbo].[licitaciones]([fecha_cierre]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_licitacion_responsable] ON [dbo].[licitaciones]([responsable_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_licitacion_deleted_at] ON [dbo].[licitaciones]([deleted_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_licitacion_folio] ON [dbo].[licitaciones]([folio]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_licitacion_region] ON [dbo].[licitaciones]([region_unidad]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_licitacion_comuna] ON [dbo].[licitaciones]([comuna_unidad]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_licitacion_organismo] ON [dbo].[licitaciones]([codigo_organismo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_cita_fecha_inicio] ON [dbo].[citas]([fecha_inicio]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_cita_estado] ON [dbo].[citas]([estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_cita_organizador] ON [dbo].[citas]([organizador_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_cita_participante_cita] ON [dbo].[cita_participantes]([cita_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_cita_participante_user] ON [dbo].[cita_participantes]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_notificacion_user_leida] ON [dbo].[notificaciones]([user_id], [leida]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_notificacion_fecha] ON [dbo].[notificaciones]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_documento_licitacion] ON [dbo].[documentos]([licitacion_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_documento_cita] ON [dbo].[documentos]([cita_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_documento_ticket] ON [dbo].[documentos]([ticket_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_nota_licitacion] ON [dbo].[notas]([licitacion_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_nota_cita] ON [dbo].[notas]([cita_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_nota_ticket] ON [dbo].[notas]([ticket_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_auditoria_user] ON [dbo].[auditoria_logs]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_auditoria_entidad] ON [dbo].[auditoria_logs]([entidad], [entidad_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_auditoria_fecha] ON [dbo].[auditoria_logs]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_licitacion_item_licitacion] ON [dbo].[licitaciones_items]([licitacion_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_licitacion_item_producto] ON [dbo].[licitaciones_items]([codigo_producto]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_soporte_licitacion] ON [dbo].[soporte_tecnico]([licitacion_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_soporte_ticket] ON [dbo].[soporte_tecnico]([ticket_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_soporte_cita] ON [dbo].[soporte_tecnico]([cita_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_soporte_estado] ON [dbo].[soporte_tecnico]([estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_soporte_tipo] ON [dbo].[soporte_tecnico]([tipo_soporte]);

-- AddForeignKey
ALTER TABLE [dbo].[accounts] ADD CONSTRAINT [accounts_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[sessions] ADD CONSTRAINT [sessions_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_owner_id_fkey] FOREIGN KEY ([owner_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_assignee_id_fkey] FOREIGN KEY ([assignee_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[licitaciones] ADD CONSTRAINT [licitaciones_responsable_id_fkey] FOREIGN KEY ([responsable_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[licitaciones] ADD CONSTRAINT [licitaciones_created_by_id_fkey] FOREIGN KEY ([created_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[licitaciones] ADD CONSTRAINT [licitaciones_deleted_by_id_fkey] FOREIGN KEY ([deleted_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[citas] ADD CONSTRAINT [citas_organizador_id_fkey] FOREIGN KEY ([organizador_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[cita_participantes] ADD CONSTRAINT [cita_participantes_cita_id_fkey] FOREIGN KEY ([cita_id]) REFERENCES [dbo].[citas]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[cita_participantes] ADD CONSTRAINT [cita_participantes_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[notificaciones] ADD CONSTRAINT [notificaciones_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[documentos] ADD CONSTRAINT [documentos_licitacion_id_fkey] FOREIGN KEY ([licitacion_id]) REFERENCES [dbo].[licitaciones]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[documentos] ADD CONSTRAINT [documentos_cita_id_fkey] FOREIGN KEY ([cita_id]) REFERENCES [dbo].[citas]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[documentos] ADD CONSTRAINT [documentos_ticket_id_fkey] FOREIGN KEY ([ticket_id]) REFERENCES [dbo].[tickets]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[documentos] ADD CONSTRAINT [documentos_uploaded_by_id_fkey] FOREIGN KEY ([uploaded_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[notas] ADD CONSTRAINT [notas_licitacion_id_fkey] FOREIGN KEY ([licitacion_id]) REFERENCES [dbo].[licitaciones]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[notas] ADD CONSTRAINT [notas_cita_id_fkey] FOREIGN KEY ([cita_id]) REFERENCES [dbo].[citas]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[notas] ADD CONSTRAINT [notas_ticket_id_fkey] FOREIGN KEY ([ticket_id]) REFERENCES [dbo].[tickets]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[notas] ADD CONSTRAINT [notas_autor_id_fkey] FOREIGN KEY ([autor_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[auditoria_logs] ADD CONSTRAINT [auditoria_logs_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[licitaciones_items] ADD CONSTRAINT [licitaciones_items_licitacion_id_fkey] FOREIGN KEY ([licitacion_id]) REFERENCES [dbo].[licitaciones]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[soporte_tecnico] ADD CONSTRAINT [soporte_tecnico_licitacion_id_fkey] FOREIGN KEY ([licitacion_id]) REFERENCES [dbo].[licitaciones]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[soporte_tecnico] ADD CONSTRAINT [soporte_tecnico_ticket_id_fkey] FOREIGN KEY ([ticket_id]) REFERENCES [dbo].[tickets]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[soporte_tecnico] ADD CONSTRAINT [soporte_tecnico_cita_id_fkey] FOREIGN KEY ([cita_id]) REFERENCES [dbo].[citas]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

