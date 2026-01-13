-- AlterTable: Add soft delete columns to tickets table
ALTER TABLE [dbo].[tickets] ADD [deleted_at] DATETIME2;
ALTER TABLE [dbo].[tickets] ADD [deleted_by_id] NVARCHAR(100);
ALTER TABLE [dbo].[tickets] ADD [motivo_eliminacion] NVARCHAR(MAX);

-- CreateIndex: Add index on tickets.deleted_at
CREATE INDEX [idx_ticket_deleted_at] ON [dbo].[tickets]([deleted_at]);

-- AddForeignKey: Add foreign key constraint for deleted_by_id
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_deleted_by_id_fkey] FOREIGN KEY ([deleted_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
